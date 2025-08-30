/**
 * Utility to load test data from the example CSV for debugging
 */

import { DataStore } from '@/services/data-store.service'
import { TradovateCsvParser } from '@/services/tradovate-csv-parser'

export async function loadTestDataFromCSV(): Promise<void> {
  try {
    // Load the example CSV data
    const response = await fetch('/Example CSV/Tradovate.csv')
    const csvContent = await response.text()
    
    console.log('📁 Loaded CSV content:', csvContent.length, 'characters')
    
    // Parse the CSV
    const result = await TradovateCsvParser.parseCSV(csvContent)
    
    console.log('📊 Parsed trades:', result.trades.length, 'trades')
    
    if (result.trades.length > 0) {
      // Clear existing and add new data
      await DataStore.replaceTrades(result.trades)
      console.log('✅ Test data loaded successfully')
      
      // Log sample trade for verification
      console.log('📋 Sample trade:', result.trades[0])
      
      // Calculate basic stats
      const totalPnL = result.trades.reduce((sum, t) => sum + (t.netPnl || 0), 0)
      const winCount = result.trades.filter(t => t.netPnl > 0).length
      const winRate = (winCount / result.trades.length) * 100
      
      console.log(`💰 Total P&L: $${totalPnL.toFixed(2)}`)
      console.log(`🎯 Win Rate: ${winRate.toFixed(1)}%`)
      console.log(`📈 Total Trades: ${result.trades.length}`)
    } else {
      console.warn('⚠️ No trades parsed from CSV')
    }
    
  } catch (error) {
    console.error('❌ Failed to load test data:', error)
  }
}

/**
 * Generate sample data for testing chart components when CSV is not available
 */
export function generateSampleChartData() {
  const dates = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }
  
  return dates.map((date, index) => ({
    date,
    value: Math.random() * 1000 - 500 + (index * 10) // Trending upward with noise
  }))
}

/**
 * Quick function to add test data - can be called from browser console
 */
declare global {
  interface Window {
    loadTestData: () => Promise<void>
    generateSampleData: () => any[]
  }
}

if (typeof window !== 'undefined') {
  window.loadTestData = loadTestDataFromCSV
  window.generateSampleData = generateSampleChartData
}