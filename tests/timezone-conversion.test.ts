/**
 * Test suite for timezone conversion functionality
 */

import { convertToUTC, convertFromUTC, getBrokerTimezoneDefault } from '../src/utils/timezones'
import { DataParserService } from '../src/services/data-parser.service'

describe('Timezone Conversion', () => {
  describe('convertToUTC', () => {
    it('should convert IST datetime to UTC correctly', () => {
      // Your example: 19:34 IST (UTC+5:30) → 14:04 UTC
      const istDateTime = '2025-08-30 19:34:00'
      const istOffset = 330 // IST is UTC+5:30 (330 minutes)
      
      const utcResult = convertToUTC(istDateTime, istOffset)
      
      expect(utcResult).toBe('2025-08-30T14:04:00.000Z')
    })

    it('should convert EST datetime to UTC correctly', () => {
      // EST is UTC-5 (-300 minutes)
      const estDateTime = '2025-08-30 10:30:00'
      const estOffset = -300
      
      const utcResult = convertToUTC(estDateTime, estOffset)
      
      expect(utcResult).toBe('2025-08-30T15:30:00.000Z')
    })

    it('should handle date-only strings', () => {
      const dateOnly = '2025-08-30'
      const istOffset = 330
      
      const utcResult = convertToUTC(dateOnly, istOffset)
      
      // Should convert midnight IST to UTC
      expect(utcResult).toBe('2025-08-29T18:30:00.000Z')
    })

    it('should handle MM/DD/YYYY format', () => {
      const usDate = '08/30/2025 15:30:00'
      const estOffset = -300
      
      const utcResult = convertToUTC(usDate, estOffset)
      
      expect(utcResult).toBe('2025-08-30T20:30:00.000Z')
    })
  })

  describe('convertFromUTC', () => {
    it('should convert UTC to IST for display', () => {
      const utcDateTime = '2025-08-30T14:04:00.000Z'
      const istOffset = 330
      
      const istResult = convertFromUTC(utcDateTime, istOffset)
      
      expect(istResult).toBe('2025-08-30 19:34:00')
    })

    it('should convert UTC to EST for display', () => {
      const utcDateTime = '2025-08-30T15:30:00.000Z'
      const estOffset = -300
      
      const estResult = convertFromUTC(utcDateTime, estOffset)
      
      expect(estResult).toBe('2025-08-30 10:30:00')
    })

    it('should handle timezone date changes', () => {
      // UTC midnight should show as previous day in EST
      const utcMidnight = '2025-08-30T00:00:00.000Z'
      const estOffset = -300
      
      const estResult = convertFromUTC(utcMidnight, estOffset)
      
      expect(estResult).toBe('2025-08-29 19:00:00')
    })
  })

  describe('getBrokerTimezoneDefault', () => {
    it('should return correct defaults for known brokers', () => {
      expect(getBrokerTimezoneDefault('tradovate')).toBe(330) // IST
      expect(getBrokerTimezoneDefault('ninjatrader')).toBe(-360) // CST
      expect(getBrokerTimezoneDefault('interactivebrokers')).toBe(0) // UTC
    })

    it('should return current timezone for unknown brokers', () => {
      const result = getBrokerTimezoneDefault('unknown_broker')
      expect(typeof result).toBe('number')
    })
  })

  describe('DataParserService timezone integration', () => {
    it('should convert timestamps to UTC during parsing', async () => {
      const csvContent = `symbol,openDate,netPnl,entryTime
NQ,2025-08-30,100,19:34:00
ES,2025-08-31,-50,10:15:00`

      const parseOptions = {
        timezoneOffsetMinutes: 330 // IST
      }

      const result = await DataParserService.parseCSVData(csvContent, undefined, parseOptions)

      expect(result.trades).toHaveLength(2)
      
      // First trade: 2025-08-30 should remain as date, but entryTime should be converted
      const nqTrade = result.trades[0]
      expect(nqTrade.symbol).toBe('NQ')
      expect(nqTrade.openDate).toBe('2025-08-30') // Date part unchanged
      
      // Second trade
      const esTrade = result.trades[1]
      expect(esTrade.symbol).toBe('ES')
      expect(esTrade.openDate).toBe('2025-08-31')
    })

    it('should handle datetime fields correctly', async () => {
      const csvContent = `symbol,boughtTimestamp,netPnl
NQ,2025-08-30 19:34:00,100
ES,2025-08-31 10:15:00,-50`

      const parseOptions = {
        timezoneOffsetMinutes: 330 // IST
      }

      const result = await DataParserService.parseCSVData(csvContent, undefined, parseOptions)

      expect(result.trades).toHaveLength(2)
      
      // Check that datetime fields are converted to UTC ISO strings
      const nqTrade = result.trades[0]
      expect(nqTrade.boughtTimestamp).toBe('2025-08-30T14:04:00.000Z')
      
      const esTrade = result.trades[1]
      expect(esTrade.boughtTimestamp).toBe('2025-08-31T04:45:00.000Z')
    })

    it('should handle zero timezone offset (UTC)', async () => {
      const csvContent = `symbol,openDate,netPnl,entryTime
NQ,2025-08-30,100,14:04:00`

      const parseOptions = {
        timezoneOffsetMinutes: 0 // UTC
      }

      const result = await DataParserService.parseCSVData(csvContent, undefined, parseOptions)

      expect(result.trades).toHaveLength(1)
      
      const trade = result.trades[0]
      expect(trade.openDate).toBe('2025-08-30')
      expect(trade.entryTime).toBe('14:04:00')
    })
  })

  describe('Real-world scenarios', () => {
    it('should handle Tradovate CSV with IST timestamps', async () => {
      // Simulate Tradovate Performance.csv with IST timestamps
      const tradovateCSV = `symbol,qty,buyPrice,sellPrice,pnl,boughtTimestamp,soldTimestamp
NQ,1,20000,20010,10,2025-08-30 19:34:00,2025-08-30 19:45:00
ES,2,4500,4505,10,2025-08-30 20:15:00,2025-08-30 20:30:00`

      const parseOptions = {
        timezoneOffsetMinutes: 330 // IST
      }

      const result = await DataParserService.parseCSVData(csvContent, undefined, parseOptions)

      expect(result.trades).toHaveLength(2)
      expect(result.errors).toHaveLength(0)
      
      // Verify UTC conversion
      const nqTrade = result.trades[0]
      expect(nqTrade.boughtTimestamp).toBe('2025-08-30T14:04:00.000Z')
      expect(nqTrade.soldTimestamp).toBe('2025-08-30T14:15:00.000Z')
    })

    it('should handle US broker CSV with EST timestamps', async () => {
      // Simulate US broker CSV with EST timestamps
      const usBrokerCSV = `Trade #,Entry time,Exit time,Instrument,Profit/Loss
1,2025-08-30 09:30:00,2025-08-30 10:15:00,NQ,150
2,2025-08-30 14:00:00,2025-08-30 14:30:00,ES,-75`

      const parseOptions = {
        timezoneOffsetMinutes: -300 // EST
      }

      const result = await DataParserService.parseCSVData(usBrokerCSV, undefined, parseOptions)

      expect(result.trades).toHaveLength(2)
      
      // Verify UTC conversion for EST
      const nqTrade = result.trades[0]
      expect(nqTrade['Entry time']).toBe('2025-08-30T14:30:00.000Z') // 09:30 EST → 14:30 UTC
      expect(nqTrade['Exit time']).toBe('2025-08-30T15:15:00.000Z') // 10:15 EST → 15:15 UTC
    })
  })

  describe('Edge cases', () => {
    it('should handle daylight saving time transitions', () => {
      // Test a date during DST transition
      const dstDateTime = '2025-03-09 02:30:00' // Spring forward date in US
      const estOffset = -300 // EST (not accounting for DST in this test)
      
      const utcResult = convertToUTC(dstDateTime, estOffset)
      
      expect(utcResult).toBe('2025-03-09T07:30:00.000Z')
    })

    it('should handle invalid date strings gracefully', () => {
      const invalidDate = 'invalid-date-string'
      const istOffset = 330
      
      const utcResult = convertToUTC(invalidDate, istOffset)
      
      // Should return a valid ISO string (current time as fallback)
      expect(utcResult).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('should handle extreme timezone offsets', () => {
      // Test with maximum timezone offset (+14 hours = 840 minutes)
      const dateTime = '2025-08-30 12:00:00'
      const extremeOffset = 840
      
      const utcResult = convertToUTC(dateTime, extremeOffset)
      
      expect(utcResult).toBe('2025-08-29T22:00:00.000Z')
    })
  })
})
