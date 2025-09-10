import { logger } from '@/lib/logger'

/**
 * Enhanced CSV Import Service with Dynamic Analytics Integration
 * Supports broker-specific parsing and real-time analytics updates
 */

import { Trade } from './trade-data.service'
import { DataParserService } from './data-parser.service'
import { DataStore } from './data-store.service'
import { TradovateCsvParser } from './tradovate-csv-parser'
import { TradingViewCsvParser } from './tradingview-csv-parser'
import { inferInstrumentType } from '../config/instruments'
import { parseOptionSymbol, calculateDTE } from '../utils/options'
import { normalizeForexPair, isForexPair, calculatePips } from '../utils/forex'
import { getBrokerTimezoneDefault } from '@/utils/timezones'

export interface BrokerConfig {
  id: string
  name: string
  fieldMappings: Record<string, string>
  dateFormat: string
  transformations: Record<string, (value: any) => any>
  validation: {
    required: string[]
    optional: string[]
  }
}

export interface ImportResult {
  success: boolean
  trades: Trade[]
  errors: string[]
  warnings: string[]
  metadata: {
    broker: string
    originalRowCount: number
    processedRowCount: number
    skippedRowCount: number
    parseTime: number
  }
}

export class CSVImportService {
  private static brokerConfigs: Map<string, BrokerConfig> = new Map()
  private static readonly ALLOWED_MIME_TYPES = new Set([
    'text/csv',
    'application/csv',
    'text/plain', // some browsers set CSV as plain text
    'application/vnd.ms-excel', // legacy CSV MIME used by some systems
  ])
  private static readonly MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024 // 15MB limit to avoid OOM

  static {
    // Initialize broker configurations
    this.initializeBrokerConfigs()
  }

  /**
   * Import CSV with intelligent broker detection and dynamic analytics
   */
  static async importCSV(
    file: File,
    brokerId?: string,
    customMapping?: Record<string, string>,
    parseOptions?: { preferredDateFormat?: string; timezoneOffsetMinutes?: number }
  ): Promise<ImportResult> {
    const startTime = performance.now()

    try {
      // Validate file type and size strictly
      const mime = (file.type || '').toLowerCase()
      const name = (file.name || '').toLowerCase()
      const hasCsvExt = name.endsWith('.csv')
      const isAllowedMime = this.ALLOWED_MIME_TYPES.has(mime) || mime === '' // some environments omit type
      if (!hasCsvExt || !isAllowedMime) {
        return {
          success: false,
          trades: [],
          errors: [
            `Invalid file type. Only CSV files are allowed. Received: name="${file.name}" type="${file.type || 'unknown'}"`
          ],
          warnings: [],
          metadata: { broker: brokerId || 'unknown', originalRowCount: 0, processedRowCount: 0, skippedRowCount: 0, parseTime: 0 }
        }
      }
      if (file.size > this.MAX_FILE_SIZE_BYTES) {
        return {
          success: false,
          trades: [],
          errors: [
            `CSV too large (${Math.round(file.size/1024/1024)}MB). Max allowed is ${Math.round(this.MAX_FILE_SIZE_BYTES/1024/1024)}MB.`
          ],
          warnings: [],
          metadata: { broker: brokerId || 'unknown', originalRowCount: 0, processedRowCount: 0, skippedRowCount: 0, parseTime: 0 }
        }
      }

      // Read file content
      const csvContent = await file.text()

      // Quick structural validation to ensure it looks like CSV
      const firstLine = csvContent.split('\n', 1)[0]
      if (!firstLine || !firstLine.includes(',')) {
        return {
          success: false,
          trades: [],
          errors: ['Invalid CSV: header row not detected or missing comma-separated fields.'],
          warnings: [],
          metadata: { broker: brokerId || 'unknown', originalRowCount: 0, processedRowCount: 0, skippedRowCount: 0, parseTime: 0 }
        }
      }
      
      // Detect broker from headers, and auto-fallback if user preselected mismatched broker
      const detectedFromHeaders = this.detectBroker(csvContent)
      let effectiveBroker = brokerId || detectedFromHeaders
      const extraWarnings: string[] = []

      // If user selected a broker but headers strongly indicate another known broker, auto-switch
      if (brokerId && detectedFromHeaders !== 'generic' && detectedFromHeaders !== brokerId) {
        // Suppress warning for the intended Tradovate form flow where Performance.csv is expected
        const suppressWarning = false // No longer needed since we use single tradovate config
        if (!suppressWarning) {
          extraWarnings.push(
            `Uploaded CSV appears to be "${detectedFromHeaders}" format based on headers. ` +
            `Automatically switching from "${brokerId}" to ensure correct parsing.`
          )
        }
        effectiveBroker = detectedFromHeaders
      }

      const brokerConfig = this.brokerConfigs.get(effectiveBroker)

      // TradingView doesn't need broker config as it uses specialized parser
      if (!brokerConfig && effectiveBroker !== 'tradingview') {
        return {
          success: false,
          trades: [],
          errors: [`Unsupported broker: ${effectiveBroker}. Please use manual field mapping.`],
          warnings: [],
          metadata: {
            broker: effectiveBroker,
            originalRowCount: 0,
            processedRowCount: 0,
            skippedRowCount: 0,
            parseTime: 0
          }
        }
      }

      // Apply broker-specific timezone default if not provided
      const finalParseOptions = {
        ...parseOptions,
        timezoneOffsetMinutes: parseOptions?.timezoneOffsetMinutes ?? getBrokerTimezoneDefault(effectiveBroker)
      }

      let trades: Trade[] = []
      let parseResult: any

      // Handle TradingView CSV with specialized parser
      if (effectiveBroker === 'tradingview') {
        const tradingViewResult = await TradingViewCsvParser.parseCSV(csvContent, finalParseOptions)
        trades = tradingViewResult.trades
        parseResult = {
          errors: tradingViewResult.errors.map((e: string) => ({ message: e })),
          warnings: tradingViewResult.warnings.map((w: string) => ({ message: w })),
          metadata: tradingViewResult.metadata
        }
      } else {
        // Parse CSV with broker-specific configuration
        if (!brokerConfig) {
          throw new Error(`Broker configuration not found for: ${effectiveBroker}`)
        }
        
        parseResult = await DataParserService.parseCSVData(
          csvContent,
          {
            required: brokerConfig.validation.required,
            optional: brokerConfig.validation.optional
          },
          finalParseOptions
        )

        // Transform parsed data to Trade format
        trades = this.transformToTrades(parseResult.trades, brokerConfig, customMapping)
      }

      // Lightweight post-import verification (sanity checks)
      const verificationWarnings = this.verifyCalculations(trades, effectiveBroker)

      // Update reactive analytics system
      await this.updateAnalytics(trades)

      const parseTime = performance.now() - startTime
      

      return {
        success: parseResult.errors.length === 0,
        trades,
        errors: parseResult.errors.map((e: any) => e.message),
        warnings: [...extraWarnings, ...parseResult.warnings.map((w: any) => w.message), ...verificationWarnings],
        metadata: {
          broker: effectiveBroker === 'tradingview' ? 'TradingView' : brokerConfig?.name || effectiveBroker,
          originalRowCount: parseResult.metadata.totalRows,
          processedRowCount: trades.length,
          skippedRowCount: parseResult.metadata.skippedRows,
          parseTime: Math.round(parseTime)
        }
      }

    } catch (error) {
      return {
        success: false,
        trades: [],
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        metadata: {
          broker: brokerId || 'unknown',
          originalRowCount: 0,
          processedRowCount: 0,
          skippedRowCount: 0,
          parseTime: 0
        }
      }
    }
  }

  /**
   * Get supported brokers list
   */
  static getSupportedBrokers(): Array<{ id: string; name: string }> {
    const brokers = Array.from(this.brokerConfigs.values()).map(config => ({
      id: config.id,
      name: config.name
    }))
    
    // Add TradingView which uses specialized parser
    brokers.push({ id: 'tradingview', name: 'TradingView' })
    
    return brokers
  }

  /**
   * Preview CSV structure for manual mapping
   */
  static async previewCSV(file: File, maxRows: number = 10): Promise<{
    headers: string[]
    sampleRows: string[][]
    detectedBroker?: string
  }> {
    // Validate before preview
    const mime = (file.type || '').toLowerCase()
    const name = (file.name || '').toLowerCase()
    if (!name.endsWith('.csv') || !(this.ALLOWED_MIME_TYPES.has(mime) || mime === '')) {
      throw new Error('Only CSV files are supported for preview')
    }
    if (file.size > this.MAX_FILE_SIZE_BYTES) {
      throw new Error(`CSV too large. Max allowed is ${Math.round(this.MAX_FILE_SIZE_BYTES/1024/1024)}MB`)
    }
    const csvContent = await file.text()
    const lines = csvContent.trim().split('\n')
    
    if (lines.length < 2) {
      throw new Error('CSV must contain at least a header row and one data row')
    }

    const headers = this.parseCSVRow(lines[0])
    const sampleRows = lines.slice(1, maxRows + 1).map(line => this.parseCSVRow(line))
    const detectedBroker = this.detectBroker(csvContent)

    return {
      headers,
      sampleRows,
      detectedBroker
    }
  }

  // Private methods

  private static initializeBrokerConfigs(): void {
    // Tradovate Configuration (Performance.csv format)
    this.brokerConfigs.set('tradovate', {
      id: 'tradovate',
      name: 'Tradovate',
      fieldMappings: {
        'symbol': 'symbol',
        'qty': 'contractsTraded',
        'buyPrice': 'entryPrice',
        'sellPrice': 'exitPrice',
        'pnl': 'netPnl',
        'duration': 'duration',
        'boughtTimestamp': 'openDate',
        'soldTimestamp': 'closeDate'
      },
      dateFormat: 'YYYY-MM-DD',
      transformations: {
        'symbol': (value: string) => String(value || '').toUpperCase(),
        'qty': (value: string) => {
          const n = parseInt(String(value).replace(/[^0-9-]/g, ''), 10)
          return isNaN(n) ? 1 : n
        },
        'buyPrice': (value: string) => {
          const n = parseFloat(String(value).replace(/[$,]/g, ''))
          return isNaN(n) ? undefined : n
        },
        'sellPrice': (value: string) => {
          const n = parseFloat(String(value).replace(/[$,]/g, ''))
          return isNaN(n) ? undefined : n
        },
        'pnl': (value: string) => {
          const cleaned = String(value).replace(/[$,]/g, '').replace(/[()]/g, '-')
          const n = parseFloat(cleaned)
          return isNaN(n) ? 0 : n
        },
        'boughtTimestamp': (value: string) => {
          const v = String(value).trim()
          const datePart = v.split(/[T\s]/)[0]
          if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart
          const mdy = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
          if (mdy) {
            const m = mdy[1].padStart(2, '0'); const d = mdy[2].padStart(2, '0'); const y = mdy[3]
            return `${y}-${m}-${d}`
          }
          return v
        },
        'soldTimestamp': (value: string) => {
          const v = String(value).trim()
          const datePart = v.split(/[T\s]/)[0]
          if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart
          const mdy = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
          if (mdy) {
            const m = mdy[1].padStart(2, '0'); const d = mdy[2].padStart(2, '0'); const y = mdy[3]
            return `${y}-${m}-${d}`
          }
          return v
        }
      },
      validation: {
        required: ['symbol', 'pnl', 'boughtTimestamp'],
        optional: ['qty', 'buyPrice', 'sellPrice', 'soldTimestamp', 'duration']
      }
    })


    // NinjaTrader Configuration
    this.brokerConfigs.set('ninjatrader', {
      id: 'ninjatrader',
      name: 'NinjaTrader',
      fieldMappings: {
        'Trade #': 'id',
        'Entry time': 'openDate',
        'Exit time': 'closeDate',
        'Instrument': 'symbol',
        'Profit/Loss': 'netPnl',
        'Quantity': 'contractsTraded',
        'Entry price': 'entryPrice',
        'Exit price': 'exitPrice',
        'Commission': 'commissions'
      },
      dateFormat: 'MM/DD/YYYY HH:mm:ss',
      transformations: {
        'Profit/Loss': (value: string) => parseFloat(value.replace(/[$,]/g, '')) || 0,
        'Commission': (value: string) => parseFloat(value.replace(/[$,]/g, '')) || 0
      },
      validation: {
        required: ['Trade #', 'Entry time', 'Instrument', 'Profit/Loss'],
        optional: ['Exit time', 'Quantity', 'Entry price', 'Exit price', 'Commission']
      }
    })

    // Interactive Brokers Configuration
    this.brokerConfigs.set('interactivebrokers', {
      id: 'interactivebrokers',
      name: 'Interactive Brokers',
      fieldMappings: {
        'TradeID': 'id',
        'DateTime': 'openDate',
        'Symbol': 'symbol',
        'Proceeds': 'netPnl',
        'Quantity': 'contractsTraded',
        'T. Price': 'entryPrice',
        'C. Price': 'exitPrice',
        'Comm/Fee': 'commissions'
      },
      dateFormat: 'YYYY-MM-DD',
      transformations: {
        'Proceeds': (value: string) => parseFloat(value.replace(/,/g, '')) || 0,
        'Comm/Fee': (value: string) => parseFloat(value.replace(/,/g, '')) || 0
      },
      validation: {
        required: ['TradeID', 'DateTime', 'Symbol', 'Proceeds'],
        optional: ['Quantity', 'T. Price', 'C. Price', 'Comm/Fee']
      }
    })

    // TradingView uses specialized parser - no broker config needed

    // Add more broker configurations as needed...
  }

  private static detectBroker(csvContent: string): string {
    const firstLine = csvContent.split('\n')[0].toLowerCase()

    // TradingView detection - look for specific TradingView headers
    if (
      firstLine.includes('time') &&
      firstLine.includes('balance before') &&
      firstLine.includes('balance after') &&
      firstLine.includes('realized p&l (value)') &&
      firstLine.includes('action')
    ) {
      return 'tradingview'
    }

    // Tradovate detection - Performance.csv format (new standard)
    if (
      firstLine.includes('symbol') &&
      firstLine.includes('pnl') &&
      (firstLine.includes('boughttimestamp') || firstLine.includes('bought timestamp'))
    ) {
      return 'tradovate'
    }

    // Legacy Tradovate detection - old format (keep for backward compatibility)
    if (firstLine.includes('position id') && firstLine.includes('pair id') && firstLine.includes('bought timestamp')) {
      return 'tradovate_legacy'
    }

    // NinjaTrader detection
    if (firstLine.includes('trade #') && firstLine.includes('entry time') && firstLine.includes('exit time')) {
      return 'ninjatrader'
    }

    // Interactive Brokers detection
    if (firstLine.includes('tradeid') && firstLine.includes('proceeds') && firstLine.includes('comm/fee')) {
      return 'interactivebrokers'
    }

    // Thinkorswim detection
    if (firstLine.includes('exec time') && firstLine.includes('spread') && firstLine.includes('net price')) {
      return 'thinkorswim'
    }

    // Default fallback
    return 'generic'
  }

  private static transformToTrades(
    parsedData: any[],
    brokerConfig: BrokerConfig,
    customMapping?: Record<string, string>
  ): Trade[] {
    const trades: Trade[] = []
    const usedIds = new Set<string>()
    const fieldMapping = { ...brokerConfig.fieldMappings, ...customMapping }

    for (const row of parsedData) {
      try {
        const trade: Partial<Trade> = {}

        // Apply field mappings
        for (const [csvField, tradeField] of Object.entries(fieldMapping)) {
          let value = row[csvField]
          
          // Apply transformations
          if (brokerConfig.transformations[csvField]) {
            value = brokerConfig.transformations[csvField](value)
          }

          trade[tradeField as keyof Trade] = value as any
        }

        // Coerce numeric fields to numbers to satisfy DataStore validation
        const toNum = (v: any): number | undefined => {
          if (v === undefined || v === null || v === '') return undefined
          if (typeof v === 'number') return v
          const cleaned = String(v).replace(/[$,%]/g, '').replace(/[()]/g, '-')
          const n = parseFloat(cleaned)
          // Log precision-critical netPnl values
          if (Math.abs(n) > 100 && String(v).includes('netPnl')) {
            logger.debug(`CSV Import: netPnl parsed: ${v} -> cleaned: ${cleaned} -> parsed: ${n}`)
          }
          return isNaN(n) ? undefined : n
        }

        const toInt = (v: any): number | undefined => {
          if (v === undefined || v === null || v === '') return undefined
          if (typeof v === 'number') return Math.trunc(v)
          const cleaned = String(v).replace(/[^0-9-]/g, '')
          const n = parseInt(cleaned, 10)
          return isNaN(n) ? undefined : n
        }

        trade.contractsTraded = toInt(trade.contractsTraded) ?? 1
        trade.entryPrice = toNum(trade.entryPrice)
        trade.exitPrice = toNum(trade.exitPrice)
        trade.commissions = toNum(trade.commissions)
        trade.grossPnl = toNum(trade.grossPnl)
        trade.netPnl = toNum(trade.netPnl) ?? 0

        // Ensure unique ID to avoid duplicate React keys (e.g., Tradovate Position ID repeats)
        if (trade.id) {
          let baseId = String(trade.id)
          let uniqueId = baseId
          if (usedIds.has(uniqueId)) {
            const suffix = row['Pair ID'] || row['Buy Fill ID'] || row['Sell Fill ID'] || row['Bought Timestamp'] || row['Sold Timestamp'] || `${Math.random().toString(36).slice(2, 6)}`
            uniqueId = `${baseId}_${suffix}`
          }
          trade.id = uniqueId
          usedIds.add(uniqueId)
        }

        // Preserve intraday times for Tradovate CSVs
        if (brokerConfig.id === 'tradovate') {
          const bt = String(row['boughtTimestamp'] || row['Bought Timestamp'] || '').trim()
          const st = String(row['soldTimestamp'] || row['Sold Timestamp'] || '').trim()
          const timeOf = (v: string): string | undefined => {
            if (!v) return undefined
            // extract time component if present
            const parts = v.split(/[T\s]/)
            if (parts.length >= 2) {
              const time = parts[1].trim()
              // ensure HH:mm or HH:mm:ss
              const m = time.match(/^(\d{1,2}:\d{2})(?::\d{2})?/) 
              return m ? m[0] : undefined
            }
            return undefined
          }
          const et = timeOf(bt)
          const xt = timeOf(st)
          if (et) trade.entryTime = et
          if (xt) trade.exitTime = xt
        }

        // Set derived fields
        this.setDerivedFields(trade, brokerConfig.id)

        // Validate required fields
        if (this.validateTradeData(trade, brokerConfig)) {
          trades.push(trade as Trade)
        }

      } catch (error) {
        logger.warn('Failed to transform row:', error, row)
      }
    }

    return trades
  }

  private static setDerivedFields(trade: Partial<Trade>, brokerId: string): void {
    // Set ID if not present
    if (!trade.id) {
      trade.id = `${brokerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Set close date from open date if not present
    if (!trade.closeDate && trade.openDate) {
      trade.closeDate = trade.openDate
    }

    // Infer and set instrument type from symbol
    if (trade.symbol && !trade.instrumentType) {
      trade.instrumentType = inferInstrumentType(trade.symbol)
    }

    // Handle forex-specific fields
    if (trade.instrumentType === 'forex' && trade.symbol) {
      const normalizedPair = normalizeForexPair(trade.symbol)
      if (isForexPair(normalizedPair)) {
        trade.symbol = normalizedPair
        // Calculate pips if entry and exit prices are available
        if (trade.entryPrice && trade.exitPrice) {
          trade.pips = calculatePips(normalizedPair, trade.entryPrice, trade.exitPrice)
        }
      }
    }

    // Handle options-specific fields
    if (trade.instrumentType === 'option' && trade.symbol) {
      const optionDetails = parseOptionSymbol(trade.symbol)
      if (optionDetails) {
        // Use type assertion since these properties may not be in the base Trade interface yet
        ;(trade as any).optionType = optionDetails.optionType
        ;(trade as any).strike = optionDetails.strike
        trade.expirationDate = optionDetails.expiration.toISOString().split('T')[0]
        // Calculate DTE if we have expiration date
        if (trade.openDate) {
          const openDate = new Date(trade.openDate)
          ;(trade as any).dte = calculateDTE(optionDetails.expiration, openDate)
        }
      }
    }

    // Determine status from P&L
    if (typeof trade.netPnl === 'number') {
      trade.status = trade.netPnl >= 0 ? 'WIN' : 'LOSS'
    }

    // Calculate gross P&L if not present
    if (!trade.grossPnl && trade.netPnl && trade.commissions) {
      trade.grossPnl = trade.netPnl + trade.commissions
    }

    // Set default values
    trade.contractsTraded = trade.contractsTraded || 1
    trade.side = trade.side || 'LONG' // Default assumption

    // Set duration if available from CSV or calculate simple duration
    if (!trade.duration && trade.openDate && trade.closeDate) {
      try {
        const openTime = new Date(trade.openDate).getTime()
        const closeTime = new Date(trade.closeDate).getTime()
        const durationMs = closeTime - openTime
        
        if (durationMs > 0) {
          const hours = Math.floor(durationMs / (1000 * 60 * 60))
          const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
          
          if (hours > 24) {
            const days = Math.floor(hours / 24)
            trade.duration = `${days}d ${hours % 24}h`
          } else if (hours > 0) {
            trade.duration = `${hours}h ${minutes}m`
          } else {
            trade.duration = `${minutes}m`
          }
        }
      } catch (err) {
        console.debug('Duration computation failed for trade', { id: trade.id, err })
      }
    }
  }

  private static validateTradeData(trade: Partial<Trade>, brokerConfig: BrokerConfig): boolean {
    const requiredMappedFields = brokerConfig.validation.required
      .map(field => brokerConfig.fieldMappings[field])
      .filter(Boolean)

    return requiredMappedFields.every(field => 
      trade[field as keyof Trade] !== undefined && 
      trade[field as keyof Trade] !== null
    )
  }

  private static async updateAnalytics(trades: Trade[]): Promise<void> {
    try {
      // Store trades in the centralized data store
      // This will trigger any reactive updates automatically
      DataStore.addTrades(trades)
    } catch (error) {
      logger.warn('Failed to update analytics:', error)
    }
  }

  private static parseCSVRow(row: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < row.length) {
      const char = row[i]
      
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"'
          i += 2
        } else {
          inQuotes = !inQuotes
          i++
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }

    result.push(current.trim())
    return result
  }

  // Verify basic calculation consistency and surface warnings (non-blocking)
  private static verifyCalculations(trades: Trade[], brokerId: string): string[] {
    const warnings: string[] = []
    if (!trades || trades.length === 0) return warnings

    // 1) NaN or undefined netPnl check
    const invalidPnl = trades.filter(t => typeof t.netPnl !== 'number' || Number.isNaN(t.netPnl as any))
    if (invalidPnl.length > 0) {
      warnings.push(`Detected ${invalidPnl.length} trade(s) with invalid netPnl. They may be excluded from analytics.`)
    }

    // 2) Sign consistency between price delta and netPnl when both prices exist
    const withPrices = trades.filter(t => typeof t.entryPrice === 'number' && typeof t.exitPrice === 'number' && typeof t.netPnl === 'number')
    if (withPrices.length > 0) {
      let inconsistent = 0
      for (const t of withPrices) {
        const delta = (t.exitPrice as number) - (t.entryPrice as number)
        const s1 = delta === 0 ? 0 : delta > 0 ? 1 : -1
        const s2 = (t.netPnl as number) === 0 ? 0 : (t.netPnl as number) > 0 ? 1 : -1
        if (s1 !== 0 && s2 !== 0 && s1 !== s2) inconsistent++
      }
      const ratio = inconsistent / withPrices.length
      if (ratio > 0.15) {
        warnings.push(`Approximately ${(ratio*100).toFixed(0)}% of trades have price-vs-P&L sign mismatches. Please verify point values or commissions.`)
      }
    }

    // 3) For Tradovate, ensure entry/exit intraday times preserved where present
    if (brokerId === 'tradovate') {
      const hadTimes = trades.filter(t => !!t.entryTime || !!t.exitTime).length
      if (hadTimes === 0) {
        warnings.push('No entry/exit time components were detected. Ensure timestamps include time (HH:mm or HH:mm:ss).')
      }
    }

    return warnings
  }
}