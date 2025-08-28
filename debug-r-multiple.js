// Debug script to test R-Multiple calculations
const { DataStore } = require('./src/services/data-store.service')

console.log('🔍 Debug R-Multiple Calculations')
console.log('================================')

try {
  // Get all trades
  const trades = DataStore.getAllTrades()
  console.log(`📊 Total trades: ${trades.length}`)

  if (trades.length === 0) {
    console.log('❌ No trades found. Please import some CSV data first.')
    process.exit(1)
  }

  // Calculate metrics 
  const metrics = DataStore.calculateMetrics()
  const kpis = DataStore.calculateDashboardKPIs()
  
  console.log('\n📈 R-Multiple Metrics:')
  console.log(`Avg Planned R-Multiple: ${metrics.avgPlannedRMultiple}`)
  console.log(`Avg Realized R-Multiple: ${metrics.avgRealizedRMultiple}`)
  console.log(`Trades with SL/TP: ${metrics.tradesWithValidSLTP}/${metrics.totalTrades}`)
  
  console.log('\n📊 KPIs (for analytics cards):')
  console.log(`KPI Avg Realized R-Multiple: ${kpis.avgRealizedRMultiple?.formatted || 'NOT FOUND'}`)
  console.log(`KPI Avg Planned R-Multiple: ${kpis.avgPlannedRMultiple?.formatted || 'NOT FOUND'}`)

  // Show sample trade data
  console.log('\n🎯 Sample Trade Data:')
  trades.slice(0, 3).forEach(trade => {
    console.log(`Trade ${trade.id}: Entry=${trade.entryPrice}, PnL=${trade.netPnl}, Symbol=${trade.symbol}`)
  })

  // Check metadata
  const TradeMetadataServiceModule = require('./src/services/trade-metadata.service')
  const TradeMetadataService = TradeMetadataServiceModule.default || TradeMetadataServiceModule
  
  console.log('\n🏷️ Metadata Check:')
  trades.slice(0, 3).forEach(trade => {
    const metadata = TradeMetadataService.getTradeMetadata(trade.id)
    console.log(`Trade ${trade.id} metadata:`, {
      profitTarget: metadata?.profitTarget || 'NOT SET',
      stopLoss: metadata?.stopLoss || 'NOT SET'
    })
  })

} catch (error) {
  console.error('❌ Error:', error.message)
  console.error(error.stack)
}