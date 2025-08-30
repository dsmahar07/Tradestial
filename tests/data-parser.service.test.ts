import { DataParserService, DataValidationRules, ParseOptions, ValidationIssue } from '../src/services/data-parser.service'

describe('DataParserService', () => {
  describe('parseCSVData', () => {
    it('should parse valid CSV with required fields', async () => {
      const csvContent = `symbol,openDate,netPnl
NQ,2024-01-01,100.50
ES,2024-01-02,-50.25`

      const result = await DataParserService.parseCSVData(csvContent)

      expect(result.trades).toHaveLength(2)
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
      expect(result.metadata.validTrades).toBe(2)
      expect(result.metadata.source).toBe('csv')
    })

    it('should handle missing required fields', async () => {
      const csvContent = `symbol,openDate
NQ,2024-01-01
ES,2024-01-02`

      const result = await DataParserService.parseCSVData(csvContent)

      expect(result.trades).toHaveLength(0)
      const errors = result.issues.filter(i => i.severity === 'error')
      expect(errors).toHaveLength(2)
      expect(errors[0].message).toContain("Required field 'netPnl' is missing")
    })

    it('should validate number fields', async () => {
      const csvContent = `symbol,openDate,netPnl
NQ,2024-01-01,invalid_number`

      const result = await DataParserService.parseCSVData(csvContent)

      const errors = result.issues.filter(i => i.severity === 'error')
      expect(errors.some(e => e.message.includes('must be a valid number'))).toBe(true)
    })

    it('should handle custom validation rules', async () => {
      const csvContent = `symbol,openDate,netPnl
TOOLONGSYMBOLNAME,2024-01-01,100`

      const result = await DataParserService.parseCSVData(csvContent)

      const errors = result.issues.filter(i => i.severity === 'error')
      expect(errors.some(e => e.field === 'symbol')).toBe(true)
    })

    it('should respect normalize option', async () => {
      const csvContent = `symbol,openDate,netPnl,Custom Field
NQ,2024-01-01,100.50,custom_value`

      const normalizedResult = await DataParserService.parseCSVData(csvContent, undefined, { normalize: true })
      const rawResult = await DataParserService.parseCSVData(csvContent, undefined, { normalize: false })

      // Normalized should have standard Trade structure
      expect(normalizedResult.trades[0]).toHaveProperty('id')
      expect(normalizedResult.trades[0]).toHaveProperty('contractsTraded')
      
      // Raw should preserve original CSV headers
      expect(rawResult.trades[0]).toHaveProperty('Custom Field')
    })

    it('should validate duplicate headers', async () => {
      const csvContent = `symbol,symbol,netPnl
NQ,NQ,100`

      const result = await DataParserService.parseCSVData(csvContent)

      const warnings = result.issues.filter(i => i.severity === 'warning')
      expect(warnings.some(w => w.message.includes('Duplicate column'))).toBe(true)
    })

    it('should validate P&L calculations with configurable tolerance', async () => {
      const csvContent = `symbol,openDate,netPnl,entryPrice,exitPrice,contractsTraded
NQ,2024-01-01,100,20000,20010,1`

      const customRules: Partial<DataValidationRules> = {
        pnlTolerance: 0.05 // 5% tolerance instead of default 10%
      }

      const result = await DataParserService.parseCSVData(csvContent, customRules)

      // Should pass validation with correct calculation
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })

    it('should warn about P&L calculation mismatches', async () => {
      const csvContent = `symbol,openDate,netPnl,entryPrice,exitPrice,contractsTraded
NQ,2024-01-01,500,20000,20010,1`

      const result = await DataParserService.parseCSVData(csvContent)

      const warnings = result.issues.filter(i => i.severity === 'warning')
      expect(warnings.some(w => w.message.includes('Calculated P&L') && w.message.includes('differs significantly'))).toBe(true)
    })
  })

  describe('parseJSONData', () => {
    it('should parse valid JSON array', async () => {
      const jsonContent = JSON.stringify([
        { symbol: 'NQ', openDate: '2024-01-01', netPnl: 100.50 },
        { symbol: 'ES', openDate: '2024-01-02', netPnl: -50.25 }
      ])

      const result = await DataParserService.parseJSONData(jsonContent)

      expect(result.trades).toHaveLength(2)
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
      expect(result.metadata.source).toBe('json')
    })

    it('should handle single JSON object', async () => {
      const jsonContent = JSON.stringify({ symbol: 'NQ', openDate: '2024-01-01', netPnl: 100.50 })

      const result = await DataParserService.parseJSONData(jsonContent)

      expect(result.trades).toHaveLength(1)
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })

    it('should respect normalize option for JSON', async () => {
      const jsonContent = JSON.stringify([{ symbol: 'NQ', openDate: '2024-01-01', netPnl: 100.50, customField: 'test' }])

      const normalizedResult = await DataParserService.parseJSONData(jsonContent, undefined, { normalize: true })
      const rawResult = await DataParserService.parseJSONData(jsonContent, undefined, { normalize: false })

      // Normalized should have standard structure
      expect(normalizedResult.trades[0]).toHaveProperty('id')
      
      // Raw should preserve original fields
      expect(rawResult.trades[0]).toHaveProperty('customField')
    })

    it('should throw error for invalid JSON', async () => {
      const invalidJson = '{ invalid json }'

      await expect(DataParserService.parseJSONData(invalidJson)).rejects.toThrow('Invalid JSON format')
    })
  })

  describe('validation rule merging', () => {
    it('should deep merge custom validation rules', async () => {
      const csvContent = `symbol,openDate,netPnl,status
NQ,2024-01-01,100,CUSTOM_STATUS`

      const customRules: Partial<DataValidationRules> = {
        enumFields: {
          status: ['WIN', 'LOSS', 'CUSTOM_STATUS'] // Extend default enum
        }
      }

      const result = await DataParserService.parseCSVData(csvContent, customRules)

      // Should not have enum validation error for CUSTOM_STATUS
      const enumErrors = result.issues.filter(i => 
        i.severity === 'error' && i.field === 'status' && i.message.includes('must be one of')
      )
      expect(enumErrors).toHaveLength(0)
    })

    it('should preserve default validators when adding custom ones', async () => {
      const csvContent = `symbol,openDate,netPnl,customField
TOOLONGSYMBOL,2024-01-01,100,test`

      const customRules: Partial<DataValidationRules> = {
        customValidators: {
          customField: (value: any) => value === 'test' || 'Custom field must be "test"'
        }
      }

      const result = await DataParserService.parseCSVData(csvContent, customRules)

      // Should still validate symbol length (default validator)
      const symbolErrors = result.issues.filter(i => i.field === 'symbol' && i.severity === 'error')
      expect(symbolErrors.length).toBeGreaterThan(0)
    })
  })

  describe('date parsing', () => {
    it('should handle various date formats', async () => {
      const csvContent = `symbol,openDate,netPnl
NQ,01/15/2024,100
ES,2024-01-15,200
YM,15-01-2024,300`

      const result = await DataParserService.parseCSVData(csvContent)

      expect(result.trades).toHaveLength(3)
      // Should have minimal date format warnings
      const dateWarnings = result.issues.filter(i => 
        i.severity === 'warning' && i.message.includes('date format')
      )
      expect(dateWarnings.length).toBeLessThanOrEqual(1) // Some formats might trigger warnings
    })

    it('should suggest better date parsing libraries', async () => {
      const csvContent = `symbol,openDate,netPnl
NQ,invalid-date-format,100`

      const result = await DataParserService.parseCSVData(csvContent)

      const dateWarnings = result.issues.filter(i => 
        i.severity === 'warning' && i.suggestion?.includes('date-fns')
      )
      expect(dateWarnings.length).toBeGreaterThan(0)
    })
  })

  describe('performance and metadata', () => {
    it('should track parsing performance', async () => {
      const csvContent = `symbol,openDate,netPnl
NQ,2024-01-01,100`

      const result = await DataParserService.parseCSVData(csvContent)

      expect(result.metadata.parseTime).toBeGreaterThan(0)
      expect(result.metadata.totalRows).toBe(1)
      expect(result.metadata.validTrades).toBe(1)
      expect(result.metadata.skippedRows).toBe(0)
    })

    it('should count skipped rows correctly', async () => {
      const csvContent = `symbol,openDate,netPnl
NQ,2024-01-01,100
,,,
ES,invalid-date,not-a-number`

      const result = await DataParserService.parseCSVData(csvContent)

      expect(result.metadata.totalRows).toBe(3)
      expect(result.metadata.validTrades).toBe(1)
      expect(result.metadata.skippedRows).toBe(2)
    })
  })

  describe('error resilience', () => {
    it('should handle special characters in headers', async () => {
      const csvContent = `symbol,P/L,Trade Date,Net P&L
NQ,100,2024-01-01,100`

      const result = await DataParserService.parseCSVData(csvContent, undefined, { normalize: false })

      expect(result.trades[0]).toHaveProperty('P/L')
      expect(result.trades[0]).toHaveProperty('Trade Date')
      expect(result.trades[0]).toHaveProperty('Net P&L')
    })

    it('should handle quoted CSV values with commas', async () => {
      const csvContent = `symbol,openDate,netPnl,notes
NQ,2024-01-01,100,"This is a note, with commas"
ES,2024-01-02,200,"Another note, ""with quotes"""`

      const result = await DataParserService.parseCSVData(csvContent)

      expect(result.trades).toHaveLength(2)
      expect(result.trades[0]).toHaveProperty('notes')
      expect(result.trades[1]).toHaveProperty('notes')
    })

    it('should handle empty and null values gracefully', async () => {
      const csvContent = `symbol,openDate,netPnl,optionalField
NQ,2024-01-01,100,
ES,2024-01-02,200,null`

      const result = await DataParserService.parseCSVData(csvContent)

      expect(result.trades).toHaveLength(2)
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })
  })
})
