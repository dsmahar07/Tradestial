/**
 * Direct Tradovate CSV Parser
 * Simplified parser specifically for Tradovate CSV format
 */

import { Trade } from './trade-data.service'

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

    console.log('📋 Total lines in CSV:', lines.length)

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
    console.log('📑 Headers found:', headers)

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
    console.log('🗺️ Field mapping:', fieldMap)

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const row = this.parseCSVRow(lines[i])
        
        // Skip empty rows
        if (row.length === 0 || row.every(cell => !cell.trim())) {
          skippedCount++
          continue
        }

        console.log(`📝 Processing row ${i}:`, row.slice(0, 5)) // Show first 5 columns

        const trade = this.createTradeFromRow(row, fieldMap, i, options)
        if (trade) {
          trades.push(trade)
          console.log(`✅ Created trade:`, trade.id, trade.symbol, trade.netPnl)
        } else {
          skippedCount++
          warnings.push(`Row ${i + 1}: Could not create valid trade`)
        }

      } catch (error) {
        skippedCount++
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`)
        console.error(`❌ Error parsing row ${i}:`, error)
      }
    }

    const parseTime = performance.now() - startTime

    console.log(`🎯 Parse complete: ${trades.length} trades, ${errors.length} errors, ${warnings.length} warnings`)

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

      console.log(`🔍 Row ${rowIndex} extracted:`, { positionId, tradeDate, pnlStr, contract, qtyStr })

      if (!positionId || !pnlStr || !contract) {
        console.warn(`⚠️ Row ${rowIndex}: Missing required fields`, { positionId: !!positionId, pnlStr: !!pnlStr, contract: !!contract })
        return null
      }

      // Parse P&L (handle quoted values with commas)
      const netPnl = this.parsePnL(pnlStr)
      if (isNaN(netPnl)) {
        console.warn(`⚠️ Row ${rowIndex}: Invalid P&L value: ${pnlStr}`)
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

      // Determine trade side based on buy/sell timestamps and prices
      // In Tradovate CSV, if we have both buy and sell, we need to determine which came first
      let tradeSide: 'LONG' | 'SHORT' = 'LONG' // Default
      
      if (buyTimestamp && sellTimestamp && buyPrice && sellPrice) {
        // Compare timestamps to see which action came first
        try {
          const buyTime = new Date(`1970-01-01 ${this.extractTime(buyTimestamp)}`)
          const sellTime = new Date(`1970-01-01 ${this.extractTime(sellTimestamp)}`)
          
          if (buyTime < sellTime) {
            // Bought first, then sold = LONG trade
            tradeSide = 'LONG'
            console.log(`✅ LONG trade detected: Buy ${this.extractTime(buyTimestamp)} → Sell ${this.extractTime(sellTimestamp)}`)
          } else if (sellTime < buyTime) {
            // Sold first, then bought = SHORT trade  
            tradeSide = 'SHORT'
            console.log(`✅ SHORT trade detected: Sell ${this.extractTime(sellTimestamp)} → Buy ${this.extractTime(buyTimestamp)}`)
          }
          // If times are equal, use price logic as fallback
        } catch {
          // If timestamp parsing fails, use default LONG
          console.warn(`Could not parse timestamps for trade ${positionId}, defaulting to LONG`)
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

      // Compute entry/exit timestamps aligned to trade side
      const entryTimestamp = tradeSide === 'LONG' ? buyTimestamp : sellTimestamp
      const exitTimestamp = tradeSide === 'LONG' ? sellTimestamp : buyTimestamp

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
        console.log(` ${tradeSide} ROI calculation: P&L=${netPnl} / EntryValue=${entryValue} = ${calculatedRoi.toFixed(2)}%`)
      }

      // Create trade object with unique ID including pair ID for uniqueness
      const pairId = this.getField(row, fieldMap, 'Pair ID') || this.getField(row, fieldMap, 'pair id')
      const buyFillId = this.getField(row, fieldMap, 'Buy Fill ID') || this.getField(row, fieldMap, 'buy fill id')
      const sellFillId = this.getField(row, fieldMap, 'Sell Fill ID') || this.getField(row, fieldMap, 'sell fill id')
      
      // Use multiple unique identifiers to ensure uniqueness
      const uniqueId = `tradovate_${positionId}_${pairId}_${buyFillId}_${sellFillId}_${rowIndex}`
      console.log(` Generated unique ID: ${uniqueId}`)
      
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

      return trade

    } catch (error) {
      console.error(` Error creating trade from row ${rowIndex}:`, error)
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
      console.warn('Date parse error:', error)
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
      console.warn('Time extraction error:', error)
    }
    
    return undefined
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
      console.warn('Date extraction error:', e)
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
}