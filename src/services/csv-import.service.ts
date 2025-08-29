/**
 * Enhanced CSV Import Service with Dynamic Analytics Integration
 * Supports broker-specific parsing and real-time analytics updates
 */

import { Trade } from './trade-data.service'
import { DataParserService, ParsedTradeData } from './data-parser.service'
import { ReactiveAnalyticsService } from './reactive-analytics.service'
import { AnalyticsCacheService } from './analytics-cache.service'

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
      
      // Detect broker if not specified
      const detectedBroker = brokerId || this.detectBroker(csvContent)
      const brokerConfig = this.brokerConfigs.get(detectedBroker)

      if (!brokerConfig) {
        return {
          success: false,
          trades: [],
          errors: [`Unsupported broker: ${detectedBroker}. Please use manual field mapping.`],
          warnings: [],
          metadata: {
            broker: detectedBroker,
            originalRowCount: 0,
            processedRowCount: 0,
            skippedRowCount: 0,
            parseTime: 0
          }
        }
      }

      // Parse CSV with broker-specific configuration
      const parseResult = await DataParserService.parseCSVData(
        csvContent,
        {
          required: brokerConfig.validation.required,
          optional: brokerConfig.validation.optional
        },
        parseOptions
      )

      // Transform parsed data to Trade format
      const trades = this.transformToTrades(parseResult.trades, brokerConfig, customMapping)

      // Update reactive analytics system
      await this.updateAnalytics(trades)

      const parseTime = performance.now() - startTime
      

      return {
        success: parseResult.errors.length === 0,
        trades,
        errors: parseResult.errors.map(e => e.message),
        warnings: parseResult.warnings.map(w => w.message),
        metadata: {
          broker: brokerConfig.name,
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
    return Array.from(this.brokerConfigs.values()).map(config => ({
      id: config.id,
      name: config.name
    }))
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
    // Tradovate Configuration
    this.brokerConfigs.set('tradovate', {
      id: 'tradovate',
      name: 'Tradovate',
      fieldMappings: {
        'Position ID': 'id',
        'Trade Date': 'openDate',
        'Contract': 'symbol',
        'Product': 'symbol', // Fallback
        'P/L': 'netPnl',
        'Paired Qty': 'contractsTraded',
        'Buy Price': 'entryPrice',
        'Sell Price': 'exitPrice',
        'Bought Timestamp': 'entryTime',
        'Sold Timestamp': 'exitTime',
        'Account': 'accountName',
        'Product Description': 'instrument'
      },
      dateFormat: 'MM/DD/YYYY',
      transformations: {
        'P/L': (value: string) => parseFloat(value.replace(/,/g, '')) || 0,
        'Trade Date': (value: string) => {
          // Convert YYYY-MM-DD to standard format
          return value
        },
        'Bought Timestamp': (value: string) => {
          // Extract time from MM/DD/YYYY HH:mm:ss
          const timePart = value.split(' ')[1]
          return timePart || value
        },
        'Sold Timestamp': (value: string) => {
          // Extract time from MM/DD/YYYY HH:mm:ss
          const timePart = value.split(' ')[1]
          return timePart || value
        },
        'Contract': (value: string) => {
          // Extract base symbol from futures contract (NQU5 -> NQ)
          return value.replace(/[UMZ]\d+$/, '') // Remove month/year suffix
        }
      },
      validation: {
        required: ['Position ID', 'Trade Date', 'P/L', 'Contract'],
        optional: ['Paired Qty', 'Buy Price', 'Sell Price', 'Bought Timestamp', 'Sold Timestamp', 'Account']
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

    // Add more broker configurations as needed...
  }

  private static detectBroker(csvContent: string): string {
    const firstLine = csvContent.split('\n')[0].toLowerCase()

    // Tradovate detection - unique fields
    if (firstLine.includes('position id') && firstLine.includes('pair id') && firstLine.includes('bought timestamp')) {
      return 'tradovate'
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
            console.log(`CSV Import: netPnl parsed: ${v} -> cleaned: ${cleaned} -> parsed: ${n}`)
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

        // Set derived fields
        this.setDerivedFields(trade, brokerConfig.id)

        // Validate required fields
        if (this.validateTradeData(trade, brokerConfig)) {
          trades.push(trade as Trade)
        }

      } catch (error) {
        console.warn('Failed to transform row:', error, row)
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
      // Get reactive analytics instance
      const analytics = ReactiveAnalyticsService.getInstance()
      
      // Replace with new trades (not add to existing)
      await analytics.updateTrades(trades)
      
      // Wait for all data preparation to complete
      await analytics.waitForDataPreparation()
      
      // Invalidate related cache entries
      AnalyticsCacheService.invalidate('trades:*')
      
    } catch (error) {
      console.warn('Failed to update analytics:', error)
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
}