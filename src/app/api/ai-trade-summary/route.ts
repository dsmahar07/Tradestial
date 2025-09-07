import { NextRequest, NextResponse } from 'next/server'

interface TradeSummaryRequest {
  trades: Array<{
    id: string
    symbol: string
    side: 'LONG' | 'SHORT'
    status: 'WIN' | 'LOSS'
    entryPrice: number
    exitPrice: number
    netPnl: number
    netRoi: number
    openDate: string
    closeDate: string
    entryTime?: string
    exitTime?: string
    contractsTraded?: number
    commissions?: number
    duration?: string
    rMultiple?: number
    model?: string
    tags?: string[]
    stialInsights?: string
  }>
  date: string // YYYY-MM-DD format
  accountBalance?: number
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const { trades, date, accountBalance, notes }: TradeSummaryRequest = await request.json()

    if (!trades || trades.length === 0) {
      return NextResponse.json(
        { error: 'No trades provided for analysis' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      )
    }

    // Analyze trade data
    const analysis = analyzeTradeData(trades, accountBalance)
    
    // Build comprehensive prompt
    const prompt = buildTradeSummaryPrompt(trades, date, analysis, notes)

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tradestial.com',
        'X-Title': 'Tradestial Daily Trade Summary'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-maverick',
        messages: [
          {
            role: 'system',
            content: 'You are an expert trading analyst specializing in comprehensive daily trade reviews. Provide detailed, professional analysis with actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 32000
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenRouter API error:', response.status, errorData)
      return NextResponse.json(
        { error: `AI service error: ${response.status} - ${errorData}` },
        { status: 503 }
      )
    }

    const data = await response.json()
    const summary = data.choices?.[0]?.message?.content || 'Unable to generate summary'

    return NextResponse.json({
      summary,
      analysis,
      tradesAnalyzed: trades.length,
      date
    })

  } catch (error) {
    console.error('Trade Summary API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function analyzeTradeData(trades: TradeSummaryRequest['trades'], accountBalance?: number) {
  const totalTrades = trades.length
  const winningTrades = trades.filter(t => t.status === 'WIN')
  const losingTrades = trades.filter(t => t.status === 'LOSS')
  
  const totalPnL = trades.reduce((sum, trade) => sum + trade.netPnl, 0)
  const totalCommissions = trades.reduce((sum, trade) => sum + (trade.commissions || 0), 0)
  const netPnL = totalPnL - totalCommissions
  
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0
  const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.netPnl, 0) / winningTrades.length : 0
  const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.netPnl, 0) / losingTrades.length) : 0
  const profitFactor = avgLoss > 0 ? (avgWin * winningTrades.length) / (avgLoss * losingTrades.length) : 0
  
  // R-Multiple analysis
  const rMultiples = trades.filter(t => t.rMultiple).map(t => t.rMultiple!)
  const avgRMultiple = rMultiples.length > 0 ? rMultiples.reduce((sum, r) => sum + r, 0) / rMultiples.length : 0
  
  // Symbol analysis
  const symbolStats = trades.reduce((acc, trade) => {
    if (!acc[trade.symbol]) {
      acc[trade.symbol] = { trades: 0, pnl: 0, wins: 0 }
    }
    acc[trade.symbol].trades++
    acc[trade.symbol].pnl += trade.netPnl
    if (trade.status === 'WIN') acc[trade.symbol].wins++
    return acc
  }, {} as Record<string, { trades: number; pnl: number; wins: number }>)
  
  // Model/Strategy analysis
  const modelStats = trades.reduce((acc, trade) => {
    const model = trade.model || 'Unknown'
    if (!acc[model]) {
      acc[model] = { trades: 0, pnl: 0, wins: 0 }
    }
    acc[model].trades++
    acc[model].pnl += trade.netPnl
    if (trade.status === 'WIN') acc[model].wins++
    return acc
  }, {} as Record<string, { trades: number; pnl: number; wins: number }>)
  
  // Time analysis
  const timeStats = trades.reduce((acc, trade) => {
    if (trade.entryTime) {
      const hour = parseInt(trade.entryTime.split(':')[0])
      const timeSlot = `${hour}:00-${hour + 1}:00`
      if (!acc[timeSlot]) {
        acc[timeSlot] = { trades: 0, pnl: 0 }
      }
      acc[timeSlot].trades++
      acc[timeSlot].pnl += trade.netPnl
    }
    return acc
  }, {} as Record<string, { trades: number; pnl: number }>)

  return {
    totalTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: Math.round(winRate * 100) / 100,
    totalPnL: Math.round(totalPnL * 100) / 100,
    netPnL: Math.round(netPnL * 100) / 100,
    totalCommissions: Math.round(totalCommissions * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    avgRMultiple: Math.round(avgRMultiple * 100) / 100,
    largestWin: Math.max(...trades.map(t => t.netPnl)),
    largestLoss: Math.min(...trades.map(t => t.netPnl)),
    symbolStats,
    modelStats,
    timeStats,
    accountBalance
  }
}

function buildTradeSummaryPrompt(
  trades: TradeSummaryRequest['trades'], 
  date: string, 
  analysis: any, 
  notes?: string
): string {
  const tradesData = trades.map(trade => ({
    symbol: trade.symbol,
    side: trade.side,
    result: trade.status,
    pnl: trade.netPnl,
    roi: trade.netRoi,
    entry: trade.entryPrice,
    exit: trade.exitPrice,
    time: trade.entryTime || 'N/A',
    duration: trade.duration || 'N/A',
    rMultiple: trade.rMultiple || 'N/A',
    model: trade.model || 'N/A',
    insights: trade.stialInsights || ''
  }))

  return `Please create a comprehensive daily trading summary and analysis for ${date}.

**TRADING SESSION DATA:**
Total Trades: ${analysis.totalTrades}
Win Rate: ${analysis.winRate}%
Net P&L: $${analysis.netPnL}
Profit Factor: ${analysis.profitFactor}
Average R-Multiple: ${analysis.avgRMultiple}

**INDIVIDUAL TRADES:**
${tradesData.map((trade, i) => `
${i + 1}. ${trade.symbol} ${trade.side} - ${trade.result}
   Entry: $${trade.entry} → Exit: $${trade.exit}
   P&L: $${trade.pnl} (${trade.roi}% ROI)
   Time: ${trade.time} | Duration: ${trade.duration}
   R-Multiple: ${trade.rMultiple} | Strategy: ${trade.model}
   ${trade.insights ? `Notes: ${trade.insights}` : ''}
`).join('')}

**PERFORMANCE BREAKDOWN:**
- Winning Trades: ${analysis.winningTrades} (Avg: $${analysis.avgWin})
- Losing Trades: ${analysis.losingTrades} (Avg: -$${analysis.avgLoss})
- Largest Win: $${analysis.largestWin}
- Largest Loss: $${analysis.largestLoss}
- Total Commissions: $${analysis.totalCommissions}

**SYMBOL PERFORMANCE:**
${Object.entries(analysis.symbolStats).map(([symbol, stats]: [string, any]) => 
  `${symbol}: ${stats.trades} trades, $${stats.pnl.toFixed(2)} P&L, ${((stats.wins/stats.trades)*100).toFixed(1)}% win rate`
).join('\n')}

**STRATEGY PERFORMANCE:**
${Object.entries(analysis.modelStats).map(([model, stats]: [string, any]) => 
  `${model}: ${stats.trades} trades, $${stats.pnl.toFixed(2)} P&L, ${((stats.wins/stats.trades)*100).toFixed(1)}% win rate`
).join('\n')}

${notes ? `**ADDITIONAL NOTES:**\n${notes}` : ''}

Please provide a detailed analysis covering:

1. **Executive Summary** - Overall session performance and key highlights
2. **Trade Execution Analysis** - Quality of entries, exits, and timing
3. **Risk Management Review** - Position sizing, R-multiples, and drawdown control
4. **Strategy Performance** - Which setups worked best and why
5. **Market Conditions Impact** - How market environment affected results
6. **Key Lessons Learned** - What went well and areas for improvement
7. **Action Items** - Specific steps to improve future performance
8. **Psychological Notes** - Trading mindset and emotional observations

Make the summary professional, detailed, and actionable for a serious trader looking to improve their performance.`
}
