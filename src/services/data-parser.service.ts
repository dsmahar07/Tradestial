import { Trade } from './trade-data.service'

/**
 * Comprehensive data parsing and validation service
 * Handles multiple import formats and ensures data consistency
 */
export interface ParsedTradeData {
  trades: Trade[]
  errors: ParseError[]
  warnings: ParseWarning[]
  metadata: ParseMetadata
}

export interface ParseError {
  row: number
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ParseWarning {
  row: number
  field: string
  message: string
  suggestion?: string
}

export interface ParseMetadata {
  totalRows: number
  validTrades: number
  skippedRows: number
  source: 'csv' | 'json' | 'api'
  columns: string[]
  parseTime: number
}

export interface DataValidationRules {
  required: string[]
  optional: string[]
  dateFormats: string[]
  numberFields: string[]
  enumFields: Record<string, string[]>
  customValidators: Record<string, (value: any) => boolean | string>
}

export class DataParserService {
  private static readonly DEFAULT_VALIDATION_RULES: DataValidationRules = {
    required: ['symbol', 'openDate', 'netPnl'],
    optional: [
      'id', 'closeDate', 'entryPrice', 'exitPrice', 'status', 'netRoi',
      'entryTime', 'exitTime', 'contractsTraded', 'side', 'tags', 'model',
      'commissions', 'grossPnl', 'volume', 'duration'
    ],
    dateFormats: [
      'MM/DD/YYYY',
      'YYYY-MM-DD',
      'MM-DD-YYYY', 
      'DD/MM/YYYY',
      'YYYY/MM/DD',
      'MMM DD, YYYY',
      'MMMM DD, YYYY'
    ],
    numberFields: [
      'netPnl', 'grossPnl', 'entryPrice', 'exitPrice', 'netRoi',
      'contractsTraded', 'commissions', 'volume', 'points', 'ticks'
    ],
    enumFields: {
      status: ['WIN', 'LOSS', 'BREAKEVEN'],
      side: ['LONG', 'SHORT']
    },
    customValidators: {
      symbol: (value: any) => typeof value === 'string' && value.length <= 20,
      netPnl: (value: any) => !isNaN(parseFloat(value)),
      openDate: (value: any) => this.isValidDate(value)
    }
  }

  /**
   * Parse CSV data with comprehensive validation
   */
  static async parseCSVData(
    csvContent: string,
    customRules?: Partial<DataValidationRules>,
    parseOptions?: { preferredDateFormat?: string; timezoneOffsetMinutes?: number }
  ): Promise<ParsedTradeData> {
    const startTime = performance.now()
    const rules = { ...this.DEFAULT_VALIDATION_RULES, ...customRules }
    
    const lines = csvContent.trim().split('\n')
    if (lines.length < 2) {
      throw new Error('CSV must contain at least a header row and one data row')
    }

    const headers = this.parseCSVRow(lines[0])
    const trades: Trade[] = []
    const errors: ParseError[] = []
    const warnings: ParseWarning[] = []
    let validTrades = 0
    let skippedRows = 0

    // Validate headers
    const headerValidation = this.validateHeaders(headers, rules)
    errors.push(...headerValidation.errors)
    warnings.push(...headerValidation.warnings)

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const row = this.parseCSVRow(lines[i])
        if (row.length === 0 || row.every(cell => !cell.trim())) {
          skippedRows++
          continue
        }

        const tradeData = this.mapRowToTrade(headers, row, i + 1, parseOptions)
        const validation = this.validateTrade(tradeData, rules, i + 1)
        
        errors.push(...validation.errors)
        warnings.push(...validation.warnings)

        if (validation.isValid) {
          // IMPORTANT: return raw row object keyed by original CSV headers.
          // Broker-specific mapping/transformations are applied later in CSVImportService.
          // Pushing normalized Trade here caused loss of original CSV fields
          // (e.g., 'P/L', 'Trade Date', 'Contract'), breaking broker transforms.
          trades.push(tradeData as unknown as Trade)
          validTrades++
        } else {
          skippedRows++
        }
      } catch (error) {
        errors.push({
          row: i + 1,
          field: 'general',
          message: `Failed to parse row: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        })
        skippedRows++
      }
    }

    const parseTime = performance.now() - startTime

    return {
      trades,
      errors,
      warnings,
      metadata: {
        totalRows: lines.length - 1,
        validTrades,
        skippedRows,
        source: 'csv',
        columns: headers,
        parseTime: Math.round(parseTime)
      }
    }
  }

  /**
   * Parse JSON data with validation
   */
  static async parseJSONData(
    jsonContent: string,
    customRules?: Partial<DataValidationRules>
  ): Promise<ParsedTradeData> {
    const startTime = performance.now()
    const rules = { ...this.DEFAULT_VALIDATION_RULES, ...customRules }
    
    let rawData: any[]
    try {
      const parsed = JSON.parse(jsonContent)
      rawData = Array.isArray(parsed) ? parsed : [parsed]
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    const trades: Trade[] = []
    const errors: ParseError[] = []
    const warnings: ParseWarning[] = []
    let validTrades = 0
    let skippedRows = 0

    for (let i = 0; i < rawData.length; i++) {
      try {
        const tradeData = rawData[i]
        const validation = this.validateTrade(tradeData, rules, i + 1)
        
        errors.push(...validation.errors)
        warnings.push(...validation.warnings)

        if (validation.isValid) {
          const normalizedTrade = this.normalizeTradeData(tradeData)
          trades.push(normalizedTrade)
          validTrades++
        } else {
          skippedRows++
        }
      } catch (error) {
        errors.push({
          row: i + 1,
          field: 'general',
          message: `Failed to parse object: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        })
        skippedRows++
      }
    }

    const parseTime = performance.now() - startTime
    const columns = rawData.length > 0 ? Object.keys(rawData[0]) : []

    return {
      trades,
      errors,
      warnings,
      metadata: {
        totalRows: rawData.length,
        validTrades,
        skippedRows,
        source: 'json',
        columns,
        parseTime: Math.round(parseTime)
      }
    }
  }

  /**
   * Validate trade data against rules
   */
  private static validateTrade(
    tradeData: any,
    rules: DataValidationRules,
    rowNumber: number
  ): { isValid: boolean; errors: ParseError[]; warnings: ParseWarning[] } {
    const errors: ParseError[] = []
    const warnings: ParseWarning[] = []

    // Check required fields
    for (const field of rules.required) {
      if (!tradeData[field] && tradeData[field] !== 0) {
        errors.push({
          row: rowNumber,
          field,
          message: `Required field '${field}' is missing or empty`,
          severity: 'error'
        })
      }
    }

    // Validate field types and formats
    for (const [field, value] of Object.entries(tradeData)) {
      if (value === null || value === undefined || value === '') continue

      // Number fields validation
      if (rules.numberFields.includes(field)) {
        const numValue = parseFloat(String(value))
        if (isNaN(numValue)) {
          errors.push({
            row: rowNumber,
            field,
            message: `Field '${field}' must be a valid number, got '${value}'`,
            severity: 'error'
          })
        }
      }

      // Enum fields validation
      if (rules.enumFields[field]) {
        const stringValue = String(value).toUpperCase()
        if (!rules.enumFields[field].includes(stringValue)) {
          errors.push({
            row: rowNumber,
            field,
            message: `Field '${field}' must be one of: ${rules.enumFields[field].join(', ')}, got '${value}'`,
            severity: 'error'
          })
        }
      }

      // Custom validators
      if (rules.customValidators[field]) {
        const result = rules.customValidators[field](value)
        if (result !== true) {
          errors.push({
            row: rowNumber,
            field,
            message: typeof result === 'string' ? result : `Field '${field}' failed validation`,
            severity: 'error'
          })
        }
      }

      // Date validation for date fields
      if (field.toLowerCase().includes('date') || field.toLowerCase().includes('time')) {
        if (!this.isValidDate(value)) {
          warnings.push({
            row: rowNumber,
            field,
            message: `Date field '${field}' may have unexpected format: '${value}'`,
            suggestion: `Use one of: ${rules.dateFormats.join(', ')}`
          })
        }
      }
    }

    // Business logic validations
    if (tradeData.entryPrice && tradeData.exitPrice && tradeData.netPnl) {
      const calculatedPnl = (parseFloat(tradeData.exitPrice) - parseFloat(tradeData.entryPrice)) * (parseFloat(tradeData.contractsTraded) || 1)
      const actualPnl = parseFloat(tradeData.netPnl)
      
      if (Math.abs(calculatedPnl - actualPnl) > Math.abs(actualPnl * 0.1)) { // 10% tolerance
        warnings.push({
          row: rowNumber,
          field: 'netPnl',
          message: `Calculated P&L (${calculatedPnl.toFixed(2)}) differs significantly from provided P&L (${actualPnl})`,
          suggestion: 'Verify price and quantity calculations'
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate CSV headers
   */
  private static validateHeaders(
    headers: string[],
    rules: DataValidationRules
  ): { errors: ParseError[]; warnings: ParseWarning[] } {
    const errors: ParseError[] = []
    const warnings: ParseWarning[] = []

    // Check for required columns
    const missingRequired = rules.required.filter(req => 
      !headers.some(header => header.toLowerCase() === req.toLowerCase())
    )

    for (const missing of missingRequired) {
      errors.push({
        row: 1,
        field: missing,
        message: `Required column '${missing}' not found in headers`,
        severity: 'error'
      })
    }

    // Check for duplicate headers
    const headerCounts = headers.reduce((acc, header) => {
      acc[header.toLowerCase()] = (acc[header.toLowerCase()] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    for (const [header, count] of Object.entries(headerCounts)) {
      if (count > 1) {
        warnings.push({
          row: 1,
          field: header,
          message: `Duplicate column '${header}' found ${count} times`,
          suggestion: 'Remove or rename duplicate columns'
        })
      }
    }

    return { errors, warnings }
  }

  /**
   * Map CSV row to trade object
   */
  private static mapRowToTrade(
    headers: string[],
    row: string[],
    rowNumber: number,
    parseOptions?: { preferredDateFormat?: string; timezoneOffsetMinutes?: number }
  ): Partial<Trade> {
    const trade: any = {}
    
    for (let i = 0; i < Math.min(headers.length, row.length); i++) {
      const header = headers[i].trim()
      const value = row[i]?.trim() || ''
      
      if (value) {
        trade[header] = this.parseValue(value, header, parseOptions)
      }
    }

    return trade
  }

  /**
   * Parse CSV row handling quoted values and commas
   */
  private static parseCSVRow(row: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < row.length) {
      const char = row[i]
      
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i += 2
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
          i++
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }

    result.push(current)
    return result
  }

  /**
   * Parse individual cell value with type detection
   */
  private static parseValue(
    value: string,
    fieldName: string,
    parseOptions?: { preferredDateFormat?: string; timezoneOffsetMinutes?: number }
  ): any {
    if (!value || value.trim() === '') return null

    const trimmed = value.trim()
    const field = fieldName.toLowerCase()

    // Boolean values
    if (trimmed.toLowerCase() === 'true') return true
    if (trimmed.toLowerCase() === 'false') return false

    // Number fields
    if (this.DEFAULT_VALIDATION_RULES.numberFields.some(nf => field.includes(nf.toLowerCase()))) {
      // Remove common currency symbols and formatting
      const cleanedValue = trimmed.replace(/[$,%]/g, '').replace(/[()]/g, '-')
      const num = parseFloat(cleanedValue)
      return isNaN(num) ? trimmed : num
    }

    // Date fields
    if (field.includes('date') || field.includes('time')) {
      const ymd = this.parseDateToLocalYMD(trimmed, parseOptions)
      return ymd || trimmed
    }

    // Array fields (tags, etc.)
    if (field === 'tags' || field === 'customtags') {
      return trimmed.split(';').map(tag => tag.trim()).filter(tag => tag)
    }

    // Status normalization
    if (field === 'status') {
      const upper = trimmed.toUpperCase()
      if (['WIN', 'WINNER', 'PROFIT', 'POSITIVE'].includes(upper)) return 'WIN'
      if (['LOSS', 'LOSE', 'LOSER', 'NEGATIVE'].includes(upper)) return 'LOSS'
      return upper
    }

    // Side normalization
    if (field === 'side') {
      const upper = trimmed.toUpperCase()
      if (['LONG', 'BUY', 'CALL'].includes(upper)) return 'LONG'
      if (['SHORT', 'SELL', 'PUT'].includes(upper)) return 'SHORT'
      return upper
    }

    return trimmed
  }

  /**
   * Normalize trade data with defaults and conversions
   */
  private static normalizeTradeData(tradeData: any): Trade {
    const toNum = (v: any) => {
      if (v === null || v === undefined || v === '') return 0
      const n = parseFloat(v)
      return isNaN(n) ? 0 : n
    }

    const toInt = (v: any) => {
      const n = parseInt(v)
      return isNaN(n) ? 0 : n
    }

    const toYMD = (v: any): string => {
      if (!v) return new Date().toISOString().split('T')[0]
      // If already YYYY-MM-DD
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v
      // Fallback to Date -> local components
      const d = new Date(v)
      const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    const trade: Trade = {
      id: tradeData.id || `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: String(tradeData.symbol || '').toUpperCase(),
      openDate: toYMD(tradeData.openDate),
      closeDate: toYMD(tradeData.closeDate || tradeData.openDate),
      entryPrice: toNum(tradeData.entryPrice),
      exitPrice: toNum(tradeData.exitPrice),
      netPnl: toNum(tradeData.netPnl),
      netRoi: toNum(tradeData.netRoi),
      status: tradeData.status || (toNum(tradeData.netPnl) >= 0 ? 'WIN' : 'LOSS'),

      // Optional fields with defaults
      contractsTraded: toInt(tradeData.contractsTraded) || 1,
      side: tradeData.side || 'LONG',
      commissions: toNum(tradeData.commissions),
      grossPnl: isNaN(parseFloat(tradeData.grossPnl)) ? toNum(tradeData.netPnl) : toNum(tradeData.grossPnl),

      // Time fields remain as-is if provided
      entryTime: tradeData.entryTime || undefined,
      exitTime: tradeData.exitTime || undefined,

      // Additional fields
      tags: Array.isArray(tradeData.tags) ? tradeData.tags : (tradeData.tags ? [tradeData.tags] : undefined),
      model: tradeData.model || undefined,
      volume: isNaN(parseFloat(tradeData.volume)) ? undefined : toNum(tradeData.volume),
      duration: tradeData.duration || undefined,
      points: isNaN(parseFloat(tradeData.points)) ? undefined : toNum(tradeData.points),
      ticks: isNaN(parseFloat(tradeData.ticks)) ? undefined : toNum(tradeData.ticks),

      // MAE/MFE
      mae: isNaN(parseFloat(tradeData.mae)) ? undefined : toNum(tradeData.mae),
      mfe: isNaN(parseFloat(tradeData.mfe)) ? undefined : toNum(tradeData.mfe),

      // Risk management
      profitTarget: isNaN(parseFloat(tradeData.profitTarget)) ? undefined : toNum(tradeData.profitTarget),
      stopLoss: isNaN(parseFloat(tradeData.stopLoss)) ? undefined : toNum(tradeData.stopLoss),

      // Additional metadata
      expirationDate: tradeData.expirationDate || undefined,
      zellaScale: isNaN(parseFloat(tradeData.zellaScale)) ? undefined : toNum(tradeData.zellaScale),
      tradeRating: isNaN(parseFloat(tradeData.tradeRating)) ? undefined : toNum(tradeData.tradeRating)
    }

    return trade
  }

  /**
   * Parse date with multiple format support and timezone handling
   */
  private static parseDateToLocalYMD(
    dateString: string,
    parseOptions?: { preferredDateFormat?: string; timezoneOffsetMinutes?: number }
  ): string | null {
    if (!dateString) return null

    // Helper to build YYYY-MM-DD string
    const toYMD = (y: number, m: number, d: number) => {
      const mm = String(m).padStart(2, '0')
      const dd = String(d).padStart(2, '0')
      return `${y}-${mm}-${dd}`
    }

    const prefer = (parseOptions?.preferredDateFormat || '').toUpperCase()

    // Direct YYYY-MM-DD
    let m = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (m) return toYMD(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]))

    // Slash separated
    m = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (m) {
      const a = parseInt(m[1]); const b = parseInt(m[2]); const y = parseInt(m[3])
      if (prefer === 'DD/MM/YYYY') return toYMD(y, b, a)
      // default MM/DD/YYYY
      return toYMD(y, a, b)
    }

    // Dash separated day-first or month-first
    m = dateString.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
    if (m) {
      const a = parseInt(m[1]); const b = parseInt(m[2]); const y = parseInt(m[3])
      if (prefer === 'DD-MM-YYYY') return toYMD(y, b, a)
      if (prefer === 'MM-DD-YYYY') return toYMD(y, a, b)
      // Ambiguous: favor DD-MM-YYYY if day > 12
      if (a > 12) return toYMD(y, b, a)
      return toYMD(y, a, b)
    }

    // Try generic Date parsing as last resort, handling timezone issues
    // For YYYY-MM-DD format, avoid timezone shift by parsing components directly
    const isoMatch = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (isoMatch) {
      const year = parseInt(isoMatch[1])
      const month = parseInt(isoMatch[2])
      const day = parseInt(isoMatch[3])
      
      // If timezone offset is provided, apply it to get correct local date
      if (parseOptions?.timezoneOffsetMinutes !== undefined) {
        const date = new Date(year, month - 1, day)
        const currentOffsetMinutes = -new Date().getTimezoneOffset()
        const targetOffsetMinutes = parseOptions.timezoneOffsetMinutes
        const offsetDifference = targetOffsetMinutes - currentOffsetMinutes
        
        // Adjust the date by the timezone difference
        date.setMinutes(date.getMinutes() + offsetDifference)
        return toYMD(date.getFullYear(), date.getMonth() + 1, date.getDate())
      }
      
      return toYMD(year, month, day)
    }
    
    // For other formats, try Date parsing but be careful about timezone
    const d = new Date(dateString + ' 12:00:00') // Add noon time to avoid timezone issues
    if (!isNaN(d.getTime())) {
      // Apply timezone offset if provided
      if (parseOptions?.timezoneOffsetMinutes !== undefined) {
        const currentOffsetMinutes = -new Date().getTimezoneOffset()
        const targetOffsetMinutes = parseOptions.timezoneOffsetMinutes
        const offsetDifference = targetOffsetMinutes - currentOffsetMinutes
        d.setMinutes(d.getMinutes() + offsetDifference)
      }
      return toYMD(d.getFullYear(), d.getMonth() + 1, d.getDate())
    }

    return null
  }

  /**
   * Check if a value can be parsed as a valid date
   */
  private static isValidDate(value: any): boolean {
    if (!value) return false
    const ymd = this.parseDateToLocalYMD(String(value))
    return !!ymd
  }
}