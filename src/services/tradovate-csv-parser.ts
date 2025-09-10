import { logger } from '@/lib/logger'

/**
 * Direct Tradovate CSV Parser
 * Simplified parser specifically for Tradovate CSV format
 */

import { Trade } from './trade-data.service'
import { DataParserService } from './data-parser.service'
import { inferInstrumentType } from '../config/instruments'
import { parseOptionSymbol, calculateDTE } from '../utils/options'
import { normalizeForexPair, isForexPair, calculatePips } from '../utils/forex'

export interface TradovateImportResult {
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

export class TradovateCsvParser {
  static async parseCSV(
    csvContent: string,
    options?: { preferredDateFormat?: string; timezoneOffsetMinutes?: number }
  ): Promise<TradovateImportResult> {
    const startTime = performance.now()
    const lines = csvContent.trim().split('\n')
    const trades: Trade[] = []
    const errors: string[] = []
    const warnings: string[] = []
    let skippedCount = 0

    logger.debug('📋 Total lines in CSV:', lines.length)

    if (lines.length < 2) {
      return {
        success: false,
        trades: [],
        errors: ['CSV must contain at least header and one data row'],
        warnings: [],
        metadata: {
          broker: 'Tradovate',
          originalRowCount: 0,
          processedRowCount: 0,
          skippedRowCount: 0,
          parseTime: 0
        }
      }
    }

    // Parse header
    const headers = this.parseCSVRow(lines[0])
    logger.debug('📑 Headers found:', headers)

    // Verify this is a Tradovate CSV
    const requiredHeaders = ['Position ID', 'Trade Date', 'P/L', 'Contract', 'Paired Qty']
    const missingHeaders = requiredHeaders.filter(req => 
      !headers.some(h => h.trim().toLowerCase() === req.toLowerCase())
    )

    if (missingHeaders.length > 0) {
      return {
        success: false,
        trades: [],
        errors: [`Missing required Tradovate headers: ${missingHeaders.join(', ')}`],
        warnings: [],
        metadata: {
          broker: 'Tradovate',
          originalRowCount: lines.length - 1,
          processedRowCount: 0,
          skippedRowCount: lines.length - 1,
          parseTime: performance.now() - startTime
        }
      }
    }

    // Create field index mapping
    const fieldMap = this.createFieldMapping(headers)
    logger.debug('🗺️ Field mapping:', fieldMap)

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const row = this.parseCSVRow(lines[i])
        
        // Skip empty rows
        if (row.length === 0 || row.every(cell => !cell.trim())) {
          skippedCount++
          continue
        }

        logger.debug(`📝 Processing row ${i}:`, row.slice(0, 5)) // Show first 5 columns

        const trade = this.createTradeFromRow(row, fieldMap, i, options)
        if (trade) {
          trades.push(trade)
          logger.debug(`✅ Created trade:`, trade.id, trade.symbol, trade.netPnl)
        } else {
          skippedCount++
          warnings.push(`Row ${i + 1}: Could not create valid trade`)
        }

      } catch (error) {
        skippedCount++
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`)
        logger.error(`❌ Error parsing row ${i}:`, error)
      }
    }

    const parseTime = performance.now() - startTime

    logger.debug(`🎯 Parse complete: ${trades.length} trades, ${errors.length} errors, ${warnings.length} warnings`)

    return {
      success: trades.length > 0,
      trades,
      errors,
      warnings,
      metadata: {
        broker: 'Tradovate',
        originalRowCount: lines.length - 1,
        processedRowCount: trades.length,
        skippedRowCount: skippedCount,
        parseTime: Math.round(parseTime)
      }
    }
  }

  private static createFieldMapping(headers: string[]): Record<string, number> {
    const mapping: Record<string, number> = {}
    
    headers.forEach((header, index) => {
      const cleanHeader = header.trim()
      mapping[cleanHeader] = index
      
      // Create lowercase mapping for easier lookup
      mapping[cleanHeader.toLowerCase()] = index
    })

    return mapping
  }

  private static createTradeFromRow(
    row: string[],
    fieldMap: Record<string, number>,
    rowIndex: number,
    options?: { preferredDateFormat?: string; timezoneOffsetMinutes?: number }
  ): Trade | null {
    try {
      // Required fields
      const positionId = this.getField(row, fieldMap, 'Position ID') || this.getField(row, fieldMap, 'position id')
      const tradeDate = this.getField(row, fieldMap, 'Trade Date') || this.getField(row, fieldMap, 'trade date')
      const pnlStr = this.getField(row, fieldMap, 'P/L') || this.getField(row, fieldMap, 'p/l')
      const contract = this.getField(row, fieldMap, 'Contract') || this.getField(row, fieldMap, 'contract')
      const qtyStr = this.getField(row, fieldMap, 'Paired Qty') || this.getField(row, fieldMap, 'paired qty')

      logger.debug(`🔍 Row ${rowIndex} extracted:`, { positionId, tradeDate, pnlStr, contract, qtyStr })

      if (!positionId || !pnlStr || !contract) {
        logger.warn(`⚠️ Row ${rowIndex}: Missing required fields`, { positionId: !!positionId, pnlStr: !!pnlStr, contract: !!contract })
        return null
      }

      // Parse P&L (handle quoted values with commas)
      const netPnl = this.parsePnL(pnlStr)
      if (isNaN(netPnl)) {
        logger.warn(`⚠️ Row ${rowIndex}: Invalid P&L value: ${pnlStr}`)
        return null
      }

      // Parse quantity
      const contractsTraded = parseInt(qtyStr) || 1

      // Optional fields
      const buyPrice = this.parseNumber(this.getField(row, fieldMap, 'Buy Price') || this.getField(row, fieldMap, 'buy price'))
      const sellPrice = this.parseNumber(this.getField(row, fieldMap, 'Sell Price') || this.getField(row, fieldMap, 'sell price'))
      // const account = this.getField(row, fieldMap, 'Account') || this.getField(row, fieldMap, 'account')
      const buyTimestamp = this.getField(row, fieldMap, 'Bought Timestamp') || this.getField(row, fieldMap, 'bought timestamp')
      const sellTimestamp = this.getField(row, fieldMap, 'Sold Timestamp') || this.getField(row, fieldMap, 'sold timestamp')

      // Extract symbol from contract (NQU5 -> NQ)
      const symbol = contract.replace(/[UMZ]\d+$/, '').trim() || contract

      // Determine trade side using a more robust approach
      // Tradovate CSV shows individual fills, so timestamps may not indicate trade direction
      // Use price analysis and P&L correlation as primary indicators
      let tradeSide: 'LONG' | 'SHORT' = 'LONG' // Default
      
      if (buyPrice && sellPrice && !isNaN(buyPrice) && !isNaN(sellPrice)) {
        // Method 1: P&L correlation analysis
        // For LONG: profit when sell > buy, loss when sell < buy  
        // For SHORT: profit when buy > sell, loss when buy < sell
        const priceDiff = sellPrice - buyPrice
        const isProfit = netPnl > 0
        
        if ((priceDiff > 0 && isProfit) || (priceDiff < 0 && !isProfit)) {
          tradeSide = 'LONG'
          logger.debug(`✅ LONG trade detected via P&L correlation: Buy=${buyPrice}, Sell=${sellPrice}, P&L=${netPnl}`)
        } else if ((priceDiff < 0 && isProfit) || (priceDiff > 0 && !isProfit)) {
          tradeSide = 'SHORT'
          logger.debug(`✅ SHORT trade detected via P&L correlation: Buy=${buyPrice}, Sell=${sellPrice}, P&L=${netPnl}`)
        } else {
          // Fallback to timestamp comparison if P&L correlation is unclear
          if (buyTimestamp && sellTimestamp) {
            try {
              const buyTime = new Date(buyTimestamp.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2'))
              const sellTime = new Date(sellTimestamp.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2'))
              
              tradeSide = buyTime < sellTime ? 'LONG' : 'SHORT'
              logger.debug(`✅ ${tradeSide} trade detected via timestamps: ${this.extractTime(buyTimestamp)} → ${this.extractTime(sellTimestamp)}`)
            } catch {
              logger.warn(`Could not parse timestamps for trade ${positionId}, using LONG as default`)
            }
          }
        }
      }

      // Determine correct entry/exit prices based on trade side
      let actualEntryPrice = 0
      let actualExitPrice = 0
      if (tradeSide === 'LONG') {
        actualEntryPrice = buyPrice || 0
        actualExitPrice = sellPrice || 0
      } else {
        actualEntryPrice = sellPrice || 0
        actualExitPrice = buyPrice || 0
      }

      // Compute entry/exit timestamps using chronological order for duration calculation
      let entryTimestamp = buyTimestamp
      let exitTimestamp = sellTimestamp
      
      if (buyTimestamp && sellTimestamp) {
        logger.debug(`🔍 Raw timestamps for ${positionId}:`, { buyTimestamp, sellTimestamp })
        
        try {
          // Convert MM/DD/YYYY HH:mm:ss to a format JavaScript can parse reliably
          const buyTimeConverted = this.convertTimestampFormat(buyTimestamp)
          const sellTimeConverted = this.convertTimestampFormat(sellTimestamp)
          
          logger.debug(`🔍 Converted timestamps:`, { buyTimeConverted, sellTimeConverted })
          
          const buyTime = new Date(buyTimeConverted)
          const sellTime = new Date(sellTimeConverted)
          
          logger.debug(`🔍 Parsed Date objects:`, { 
            buyTime: buyTime.toISOString(), 
            sellTime: sellTime.toISOString(),
            buyValid: !isNaN(buyTime.getTime()),
            sellValid: !isNaN(sellTime.getTime())
          })
          
          if (isNaN(buyTime.getTime()) || isNaN(sellTime.getTime())) {
            logger.warn(`❌ Invalid dates parsed for ${positionId}`)
            entryTimestamp = buyTimestamp
            exitTimestamp = sellTimestamp
          } else {
            // Always use the EARLIER timestamp as entry and LATER as exit for duration
            if (buyTime.getTime() < sellTime.getTime()) {
              entryTimestamp = buyTimestamp
              exitTimestamp = sellTimestamp
            } else {
              entryTimestamp = sellTimestamp  
              exitTimestamp = buyTimestamp
            }
            
            logger.debug(`⏱️ Chronological assignment: Entry=${this.extractTime(entryTimestamp)} → Exit=${this.extractTime(exitTimestamp)}`)
            const timeDiffMs = new Date(this.convertTimestampFormat(exitTimestamp)).getTime() - new Date(this.convertTimestampFormat(entryTimestamp)).getTime()
            logger.debug(`⏱️ Time difference: ${timeDiffMs}ms (${timeDiffMs / 1000}s)`)
          }
        } catch (error) {
          logger.warn(`❌ Timestamp parsing error for ${positionId}:`, error)
          // Fallback: use original timestamps
          entryTimestamp = buyTimestamp
          exitTimestamp = sellTimestamp
        }
      } else {
        logger.warn(`⚠️ Missing timestamps for ${positionId}: buy=${!!buyTimestamp}, sell=${!!sellTimestamp}`)
      }

      // Prefer dates from timestamps; fallback to Trade Date
      const openDate = this.extractDate(entryTimestamp, options?.timezoneOffsetMinutes) || this.parseTradeDate(tradeDate, options?.preferredDateFormat)
      const closeDate = this.extractDate(exitTimestamp, options?.timezoneOffsetMinutes) || this.parseTradeDate(tradeDate, options?.preferredDateFormat)

      // Calculate ROI based on entry value
      // ROI = (P&L / Entry Value) × 100
      // Entry Value = Entry Price × Contracts Traded
      let calculatedRoi = 0
      if (actualEntryPrice && contractsTraded && actualEntryPrice > 0) {
        const entryValue = actualEntryPrice * contractsTraded
        calculatedRoi = (netPnl / entryValue) * 100
        logger.debug(` ${tradeSide} ROI calculation: P&L=${netPnl} / EntryValue=${entryValue} = ${calculatedRoi.toFixed(2)}%`)
      }

      // Create trade object with unique ID including pair ID for uniqueness
      const pairId = this.getField(row, fieldMap, 'Pair ID') || this.getField(row, fieldMap, 'pair id')
      const buyFillId = this.getField(row, fieldMap, 'Buy Fill ID') || this.getField(row, fieldMap, 'buy fill id')
      const sellFillId = this.getField(row, fieldMap, 'Sell Fill ID') || this.getField(row, fieldMap, 'sell fill id')
      
      // Use multiple unique identifiers to ensure uniqueness
      const uniqueId = `tradovate_${positionId}_${pairId}_${buyFillId}_${sellFillId}_${rowIndex}`
      logger.debug(` Generated unique ID: ${uniqueId}`)
      
      const trade: Trade = {
        id: uniqueId,
        symbol: symbol,
        openDate: openDate,
        closeDate: closeDate,
        entryPrice: actualEntryPrice,
        exitPrice: actualExitPrice,
        netPnl: netPnl,
        netRoi: calculatedRoi,
        status: netPnl >= 0 ? 'WIN' : 'LOSS',
        contractsTraded: contractsTraded,
        side: tradeSide, // Determined from timestamps
        commissions: 0, // Not provided in Tradovate CSV
        grossPnl: netPnl, // Assume same as net if no commission info
        entryTime: entryTimestamp ? this.extractTime(entryTimestamp) : undefined,
        exitTime: exitTimestamp ? this.extractTime(exitTimestamp) : undefined
      }

      // Add instrument typing and instrument-specific enrichment
      this.enrichTradeWithInstrumentData(trade)

      return trade

    } catch (error) {
      logger.error(` Error creating trade from row ${rowIndex}:`, error)
      return null
    }
  }

  private static getField(row: string[], fieldMap: Record<string, number>, fieldName: string): string {
    const index = fieldMap[fieldName] ?? fieldMap[fieldName.toLowerCase()]
    if (index !== undefined && index < row.length) {
      return row[index]?.trim() || ''
    }
    return ''
  }

  // Format a Date to YYYY-MM-DD using LOCAL timezone to avoid UTC day shifts
  private static formatLocalYMD(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  private static parsePnL(pnlStr: string): number {
    if (!pnlStr) return 0
    
    // Remove quotes and parse
    const cleaned = pnlStr.replace(/["']/g, '').replace(/,/g, '')
    return parseFloat(cleaned) || 0
  }

  private static parseNumber(numStr: string): number {
    if (!numStr) return 0
    const cleaned = numStr.replace(/["',]/g, '')
    return parseFloat(cleaned) || 0
  }

  private static parseTradeDate(dateStr: string, preferredDateFormat?: string): string {
    if (!dateStr) return new Date().toISOString().split('T')[0]
    
    try {
      // Prefer explicit format if provided
      if (preferredDateFormat === 'YYYY-MM-DD' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr
      }
      if (preferredDateFormat === 'MM/DD/YYYY' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [month, day, year] = dateStr.split('/')
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
      if (preferredDateFormat === 'DD/MM/YYYY' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/')
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }

      // Fallback autodetect
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr
      }
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [a, b, year] = dateStr.split('/')
        // Heuristic: if preferred not given, assume MM/DD/YYYY for Tradovate
        const month = preferredDateFormat === 'DD/MM/YYYY' ? b : a
        const day = preferredDateFormat === 'DD/MM/YYYY' ? a : b
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
      
      // Try parsing as Date
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        // Use local time to avoid UTC shift
        return this.formatLocalYMD(date)
      }
    } catch (error) {
      logger.warn('Date parse error:', error)
    }
    
    return this.formatLocalYMD(new Date())
  }

  private static extractTime(timestampStr: string): string | undefined {
    if (!timestampStr) return undefined
    
    try {
      // Extract time part from "MM/DD/YYYY HH:mm:ss"
      const parts = timestampStr.split(' ')
      if (parts.length >= 2) {
        return parts[1] // Return HH:mm:ss part
      }
    } catch (error) {
      logger.warn('Time extraction error:', error)
    }
    
    return undefined
  }

  private static convertTimestampFormat(timestampStr: string): string {
    // Convert "MM/DD/YYYY HH:mm:ss" to "YYYY-MM-DD HH:mm:ss" for reliable parsing
    try {
      const match = timestampStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s(.+)$/)
      if (match) {
        const [, month, day, year, time] = match
        return `${year}-${month}-${day} ${time}`
      }
    } catch (error) {
      logger.warn('Timestamp format conversion error:', error)
    }
    
    // Return original if conversion fails
    return timestampStr
  }

  private static extractDate(timestampStr: string | undefined, timezoneOffsetMinutes?: number): string | undefined {
    if (!timestampStr) return undefined
    try {
      // Expect formats like MM/DD/YYYY HH:mm:ss
      const parts = timestampStr.split(' ')
      const datePart = parts[0]
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(datePart)) {
        const [mm, dd, yyyy] = datePart.split('/')
        return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
      }
      // Try general Date parsing
      const d = new Date(timestampStr)
      if (!isNaN(d.getTime())) {
        // Apply explicit timezone offset if provided to avoid UTC day shifts
        const adjusted = typeof timezoneOffsetMinutes === 'number'
          ? new Date(d.getTime() + timezoneOffsetMinutes * 60 * 1000)
          : d
        return this.formatLocalYMD(adjusted)
      }
    } catch (e) {
      logger.warn('Date extraction error:', e)
    }
    return undefined
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

  private static enrichTradeWithInstrumentData(trade: Trade): void {
    // Infer and set instrument type from symbol
    if (!trade.instrumentType) {
      trade.instrumentType = inferInstrumentType(trade.symbol)
    }

    // Handle forex-specific fields
    if (trade.instrumentType === 'forex' && trade.symbol) {
      const normalizedPair = normalizeForexPair(trade.symbol)
      if (isForexPair(normalizedPair)) {
        trade.symbol = normalizedPair
        // Calculate pips if entry and exit prices are available
        if (trade.entryPrice && trade.exitPrice) {
          ;(trade as any).pips = calculatePips(normalizedPair, trade.entryPrice, trade.exitPrice)
        }
      }
    }

    // Handle options-specific fields
    if (trade.instrumentType === 'option' && trade.symbol) {
      const optionDetails = parseOptionSymbol(trade.symbol)
      if (optionDetails) {
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
  }
}