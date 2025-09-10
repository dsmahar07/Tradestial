import { logger } from '@/lib/logger'

/**
 * Test utility for CSV import functionality
 * Helps debug and test the Tradovate CSV parsing
 */

import { TradovateCsvParser } from '@/services/tradovate-csv-parser'
import { DataStore } from '@/services/data-store.service'

export async function testTradovateImport() {
  try {
    // Read the example Tradovate CSV
    const csvUrl = '/Example CSV/Tradovate.csv'
    
    logger.debug('🔍 Fetching Tradovate CSV from:', csvUrl)
    
    const response = await fetch(csvUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`)
    }
    
    const csvContent = await response.text()
    logger.debug('📄 CSV Content Preview:', csvContent.substring(0, 500))
    logger.debug('📄 CSV Full length:', csvContent.length)
    
    logger.debug('🚀 Processing Tradovate CSV with direct parser...')
    
    // Parse CSV directly
    const parseResult = await TradovateCsvParser.parseCSV(csvContent)
    
    logger.debug('✅ Parse Result:', {
      success: parseResult.success,
      trades: parseResult.trades.length,
      errors: parseResult.errors,
      warnings: parseResult.warnings,
      metadata: parseResult.metadata
    })
    
    if (parseResult.success && parseResult.trades.length > 0) {
      // Update DataStore
      await DataStore.replaceTrades(parseResult.trades)
      
      logger.debug('🎯 Sample imported trade:', parseResult.trades[0])
      logger.debug('📊 DataStore info:', DataStore.getDataInfo())
      
      return {
        success: true,
        trades: parseResult.trades,
        message: `Successfully imported ${parseResult.trades.length} trades from Tradovate CSV`
      }
    } else {
      return {
        success: false,
        trades: [],
        message: `Import failed: ${parseResult.errors.join(', ')}`
      }
    }
    
  } catch (error) {
    logger.error('❌ Test import failed:', error)
    return {
      success: false,
      trades: [],
      message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// Function to test CSV preview
export async function previewTradovateCSV() {
  try {
    const csvUrl = '/Example CSV/Tradovate.csv'
    const response = await fetch(csvUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status}`)
    }
    
    const csvContent = await response.text()
    const csvBlob = new Blob([csvContent], { type: 'text/csv' })
    const csvFile = new File([csvBlob], 'Tradovate.csv', { type: 'text/csv' })
    
    const result = await TradovateCsvParser.parseCSV(csvContent)
    
    logger.debug('📋 CSV Parse Result:', {
      success: result.success,
      tradeCount: result.trades.length,
      errors: result.errors,
      metadata: result.metadata
    })
    
    return result
    
  } catch (error) {
    logger.error('❌ Preview failed:', error)
    return null
  }
}

// Function to clear data 
export function clearAllData() {
  DataStore.clearData()
  logger.debug('🔄 All data cleared')
  logger.debug('📊 DataStore info:', DataStore.getDataInfo())
}

// Add to window for browser console testing
// if (typeof window !== 'undefined') {
//   (window as any).testTradovateImport = testTradovateImport
//   (window as any).clearAllData = clearAllData
// }