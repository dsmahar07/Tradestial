/**
 * TradingView CSV Parser
 * Parses TradingView export with Action column containing trade details
 */

import { Trade } from './trade-data.service'
import { DataParserService } from './data-parser.service'
import { inferInstrumentType } from '../config/instruments'
import { parseOptionSymbol, calculateDTE } from '../utils/options'
import { normalizeForexPair, isForexPair, calculatePips } from '../utils/forex'

export interface TradingViewImportResult {
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

export class TradingViewCsvParser {
  static async parseCSV(
    csvContent: string,
    options?: { preferredDateFormat?: string; timezoneOffsetMinutes?: number }
  ): Promise<TradingViewImportResult> {
    const start = performance.now()
    const lines = csvContent.trim().split('\n')
    const trades: Trade[] = []
    const errors: string[] = []
    const warnings: string[] = []
    let skipped = 0

    if (lines.length < 2) {
      return {
        success: false,
        trades: [],
        errors: ['CSV must contain at least header and one data row'],
        warnings: [],
        metadata: { broker: 'TradingView', originalRowCount: 0, processedRowCount: 0, skippedRowCount: 0, parseTime: 0 }
      }
    }

    const headers = this.parseCSVRow(lines[0])
    const idx = this.createFieldMapping(headers)

    const required = ['Time', 'Realized P&L (value)', 'Action']
    const missing = required.filter(r => idx[r] === undefined && idx[r.toLowerCase()] === undefined)
    if (missing.length) {
      return {
        success: false,
        trades: [],
        errors: [`Missing required TradingView headers: ${missing.join(', ')}`],
        warnings: [],
        metadata: { broker: 'TradingView', originalRowCount: lines.length - 1, processedRowCount: 0, skippedRowCount: lines.length - 1, parseTime: performance.now() - start }
      }
    }

    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCSVRow(lines[i])
      if (row.length === 0 || row.every(c => !c.trim())) { skipped++; continue }
      try {
        const trade = this.createTradeFromRow(row, idx, i, options)
        if (trade) trades.push(trade)
        else { skipped++; warnings.push(`Row ${i + 1}: Could not parse Action into a trade`) }
      } catch (e) {
        skipped++
        errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : 'Parse error'}`)
      }
    }

    return {
      success: trades.length > 0,
      trades,
      errors,
      warnings,
      metadata: {
        broker: 'TradingView',
        originalRowCount: lines.length - 1,
        processedRowCount: trades.length,
        skippedRowCount: skipped,
        parseTime: Math.round(performance.now() - start)
      }
    }
  }

  private static createFieldMapping(headers: string[]): Record<string, number> {
    const map: Record<string, number> = {}
    headers.forEach((h, i) => { map[h.trim()] = i; map[h.trim().toLowerCase()] = i })
    return map
  }

  private static getField(row: string[], map: Record<string, number>, name: string): string {
    const i = map[name] ?? map[name.toLowerCase()]
    return i !== undefined && i < row.length ? (row[i] || '').trim() : ''
  }

  private static parseNumber(s: string): number {
    if (!s) return 0
    return parseFloat(s.replace(/[",]/g, '')) || 0
  }

  private static parseLocalYMD(ts: string): string {
    // TradingView Time is "YYYY-MM-DD HH:mm:ss"
    const d = new Date(ts.replace(' ', 'T'))
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    return new Date().toISOString().slice(0,10)
  }

  private static extractSymbol(raw: string): string {
    // e.g., CME_MINI:NQU2025 or CME_MINI:NQ1!
    const m = raw.match(/symbol\s+([A-Z_]+:)?([A-Z]+)[A-Z]*\d*!?/i)
    if (m) return m[2].toUpperCase()
    // fallback: try after colon
    const afterColon = raw.split(':')[1]
    return (afterColon || raw).replace(/\d|!|\s|\./g, '').toUpperCase()
  }

  private static createTradeFromRow(
    row: string[],
    map: Record<string, number>,
    rowIndex: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: { preferredDateFormat?: string; timezoneOffsetMinutes?: number }
  ): Trade | null {
    const timeStr = this.getField(row, map, 'Time')
    const pnlStr = this.getField(row, map, 'Realized P&L (value)')
    const action = this.getField(row, map, 'Action')
    if (!timeStr || !pnlStr || !action) return null

    // Regex to extract fields from Action
    // Examples:
    // "Close long position for symbol CME_MINI:NQU2025 at price 23508.00 for 1 units. Position AVG Price was 23500.500000, ... point value: 20.000000"
    const sideMatch = action.match(/Close\s+(long|short)\s+position/i)
    const symbolMatch = action.match(/symbol\s+([^\s]+)\s+at/i)
    const priceMatch = action.match(/at price\s+([0-9.]+)/i)
    const qtyMatch = action.match(/for\s+([0-9.]+)\s+units/i)
    const avgMatch = action.match(/AVG Price was\s+([0-9.]+)/i)

    if (!sideMatch || !symbolMatch || !priceMatch || !avgMatch) return null

    const side = sideMatch[1].toLowerCase() === 'long' ? 'LONG' : 'SHORT'
    const rawSymbol = symbolMatch[1]
    const symbol = this.extractSymbol(rawSymbol)
    const exitPrice = parseFloat(priceMatch[1]) || 0
    const entryPrice = parseFloat(avgMatch[1]) || 0
    const qty = qtyMatch ? Math.max(1, Math.round(parseFloat(qtyMatch[1]))) : 1
    const netPnl = this.parseNumber(pnlStr)

    const openDate = this.parseLocalYMD(timeStr) // No entry time available; align open to close date
    const closeDate = this.parseLocalYMD(timeStr)

    // ROI
    let netRoi = 0
    if (entryPrice > 0 && qty > 0) {
      const entryValue = entryPrice * qty
      netRoi = (netPnl / entryValue) * 100
    }

    const trade: Trade = {
      id: `tradingview_${symbol}_${timeStr}_${rowIndex}`,
      symbol,
      openDate,
      closeDate,
      entryPrice: side === 'LONG' ? entryPrice : entryPrice, // same source
      exitPrice: exitPrice,
      netPnl,
      netRoi,
      status: netPnl >= 0 ? 'WIN' : 'LOSS',
      contractsTraded: qty,
      side: side as 'LONG' | 'SHORT',
      commissions: 0,
      grossPnl: netPnl,
    }

    // Add instrument typing and instrument-specific enrichment
    this.enrichTradeWithInstrumentData(trade)

    return trade
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

  private static parseCSVRow(row: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0
    while (i < row.length) {
      const ch = row[i]
      if (ch === '"') {
        if (inQuotes && row[i + 1] === '"') { current += '"'; i += 2 }
        else { inQuotes = !inQuotes; i++ }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim()); current = ''; i++
      } else { current += ch; i++ }
    }
    result.push(current.trim())
    return result
  }
}
