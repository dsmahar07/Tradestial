import { NextRequest, NextResponse } from 'next/server'
import { aiChatRateLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await aiChatRateLimiter.limit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const { messages, tradingContext } = await request.json()
    
    logger.info('AI Chat API called', { 
      messageCount: messages?.length,
      hasTradingContext: !!tradingContext 
    })

    // Always try to use the API if key exists, only fallback if API completely fails
    logger.debug('API Key configured', { hasKey: !!OPENROUTER_API_KEY })

    // Build a compact recent trades table (up to 15 rows) for stronger context
    const recent = Array.isArray(tradingContext?.recentTrades) ? tradingContext.recentTrades.slice(0, 15) : []
    const recentHeader = 'Date | Symbol | Side | Entry | Exit | P&L | R | Model\n---|---|---|---:|---:|---:|---:|---'
    const recentRows = recent
      .map((t: any) => `${t.date || ''} | ${t.symbol || ''} | ${t.side || ''} | ${t.entry ?? ''} | ${t.exit ?? ''} | ${typeof t.pnl === 'number' ? t.pnl.toFixed(2) : t.pnl || ''} | ${t.r ?? ''} | ${t.model || ''}`)
      .join('\n')

    // Add symbol stats table if available
    const symbolStats = tradingContext?.symbolStatsTable || '(no symbol stats available)'

    // Build system prompt with trading context and explicit guidance
    const systemPrompt = `You are Stial, a professional trading coach embedded in the Tradestial platform. Generate comprehensive, well-formatted analysis using markdown formatting for better readability.

## Trading Performance Overview
- **Total Trades:** ${tradingContext?.totalTrades || 0}
- **Win Rate:** ${tradingContext?.winRate || 0}%
- **Profit Factor:** ${tradingContext?.profitFactor || 0}
- **Total P&L:** $${tradingContext?.totalPnl || 0}
- **Average Win:** $${tradingContext?.avgWin || 0}
- **Average Loss:** $${tradingContext?.avgLoss || 0}
- **Current Streak:** ${tradingContext?.currentStreak || 0}
- **Trading Days:** ${tradingContext?.tradingDays || 0}
- **Most Traded Symbol:** ${tradingContext?.mostTradedSymbol || 'N/A'}
- **Daily Average:** $${tradingContext?.dailyAverage || 0}
- **Risk/Reward Ratio:** ${tradingContext?.riskRewardRatio || 0}
- **Best Trade:** ${tradingContext?.bestTrade ? `$${tradingContext.bestTrade.pnl} (${tradingContext.bestTrade.symbol})` : 'N/A'}
- **Worst Trade:** ${tradingContext?.worstTrade ? `$${tradingContext.worstTrade.pnl} (${tradingContext.worstTrade.symbol})` : 'N/A'}

## Recent Trades Analysis
${recent.length ? `\`\`\`\n${recentHeader}\n${recentRows}\n\`\`\`` : '*No recent trades available*'}

## Symbol Performance Breakdown
\`\`\`
${symbolStats}
\`\`\`

## Response Guidelines:
1. **Use proper markdown formatting** with headers, bold text, bullet points, and code blocks
2. **Analyze specific patterns** from the data above - reference actual trades, symbols, and dates
3. **Provide detailed insights** on:
   - Risk management effectiveness
   - Symbol-specific performance patterns
   - Entry/exit timing analysis
   - Expectancy and consistency metrics
4. **Give 3-5 prioritized recommendations** with specific action items
5. **Use professional trading terminology** and be specific about improvements
6. **Format responses clearly** with sections, highlights, and actionable steps
7. If no trading data exists, guide user to import CSV data first

Generate comprehensive, data-driven analysis that helps improve trading performance.`

    // Only use fallback if no API key exists
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({
        choices: [{
          message: {
            content: `## No API Key Configured

I need an OpenRouter API key to provide AI-powered analysis. Please configure the \`OPENROUTER_API_KEY\` environment variable.

**Current Trading Summary:**
- **Trades:** ${tradingContext?.totalTrades || 0}
- **Win Rate:** ${tradingContext?.winRate || 0}%
- **P&L:** $${tradingContext?.totalPnl || 0}

Once the API key is configured, I can provide detailed analysis and recommendations.`
          }
        }]
      })
    }

    try {
      // Use free Gemini 2.0 Flash model
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://tradestial.com',
          'X-Title': 'Tradestial Trading Assistant',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 15000
        })
      })

      console.log('OpenRouter response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('OpenRouter error:', errorText)
        
        // Try fallback to free model
        try {
          const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'HTTP-Referer': 'https://tradestial.com',
              'X-Title': 'Tradestial Trading Assistant',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'google/gemma-2-9b-it:free',
              messages: [
                { role: 'system', content: systemPrompt },
                ...messages
              ],
              temperature: 0.7,
              max_tokens: 600
            })
          })

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            return NextResponse.json(fallbackData)
          }
        } catch (fallbackError) {
          console.error('Fallback model also failed:', fallbackError)
        }
        
        // Generate detailed analysis using trading data if API fails
        const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || ''
        
        if (tradingContext?.totalTrades === 0) {
          return NextResponse.json({
            choices: [{
              message: {
                content: `## Welcome to Stial Trading Assistant

I'm here to provide deep analysis of your trading performance, but I don't see any trading data yet.

### Getting Started:
1. **Import your trading history** through the CSV import feature
2. **Supported formats:** TradingView, Tradovate, and other major platforms
3. **Once imported,** I can analyze:
   - Win rate and profit factor patterns
   - Symbol-specific performance
   - Risk management effectiveness
   - Entry/exit timing optimization
   - Detailed trade-by-trade insights

After importing your data, ask me to "analyze my performance" for a comprehensive report.`
              }
            }]
          })
        }

        // Generate comprehensive analysis from available data
        const recentTradesAnalysis = recent.length > 0 ? `

### Recent Trading Activity
\`\`\`
${recentHeader}
${recentRows}
\`\`\`

**Latest Trade Analysis:** Your most recent trade on ${recent[0]?.date} in ${recent[0]?.symbol} ${recent[0]?.side ? `(${recent[0].side})` : ''} closed with P&L $${typeof recent[0]?.pnl === 'number' ? recent[0].pnl.toFixed(2) : recent[0]?.pnl}.` : ''

        const symbolAnalysis = symbolStats !== '(no symbol stats available)' ? `

### Symbol Performance Breakdown
\`\`\`
${symbolStats}
\`\`\`` : ''

        const responseContent = `## Trading Performance Analysis

### Key Metrics Overview
- **Total Trades:** ${tradingContext.totalTrades}
- **Win Rate:** ${tradingContext.winRate}% ${parseFloat(tradingContext.winRate) > 50 ? '✅' : '⚠️'}
- **Profit Factor:** ${tradingContext.profitFactor} ${parseFloat(tradingContext.profitFactor) > 1.5 ? '✅' : parseFloat(tradingContext.profitFactor) > 1.0 ? '⚠️' : '❌'}
- **Total P&L:** $${tradingContext.totalPnl} ${parseFloat(tradingContext.totalPnl) > 0 ? '✅' : '❌'}
- **Risk/Reward Ratio:** ${tradingContext.riskRewardRatio}
- **Current Streak:** ${tradingContext.currentStreak} ${tradingContext.currentStreak > 0 ? '🔥' : tradingContext.currentStreak < 0 ? '❄️' : '➖'}

### Performance Highlights
- **Best Trade:** $${tradingContext?.bestTrade?.pnl} on ${tradingContext?.bestTrade?.symbol}
- **Worst Trade:** $${tradingContext?.worstTrade?.pnl} on ${tradingContext?.worstTrade?.symbol}
- **Average Win:** $${tradingContext.avgWin}
- **Average Loss:** $${tradingContext.avgLoss}
- **Daily Average:** $${tradingContext.dailyAverage}${recentTradesAnalysis}${symbolAnalysis}

### Key Recommendations
${parseFloat(tradingContext.winRate) < 50 ? '1. **Focus on Trade Selection** - Win rate below 50% suggests need for better entry criteria\n' : ''}${parseFloat(tradingContext.profitFactor) < 1.5 ? '2. **Improve Risk Management** - Profit factor could be enhanced with better position sizing\n' : ''}${Math.abs(parseFloat(tradingContext.avgLoss)) > parseFloat(tradingContext.avgWin) ? '3. **Tighten Stop Losses** - Average losses exceed average wins\n' : ''}4. **Analyze ${tradingContext.mostTradedSymbol}** - Your most traded symbol for optimization opportunities
5. **Review Recent Patterns** - Focus on consistency in your recent ${Math.min(recent.length, 10)} trades

*Note: AI analysis temporarily unavailable due to high demand. This analysis is based on your actual trading data.*`
        
        return NextResponse.json({
          choices: [{
            message: { content: responseContent }
          }]
        })
      }

      const data = await response.json()
      console.log('OpenRouter response:', data)
      return NextResponse.json(data)

    } catch (apiError) {
      console.error('API call error:', apiError)
      // Return a fallback response with trading context
      return NextResponse.json({
        choices: [{
          message: {
            content: `I can see your trading statistics: ${tradingContext?.totalTrades || 0} total trades, ${tradingContext?.winRate || 0}% win rate, $${tradingContext?.totalPnl || 0} total P&L. While I'm having trouble connecting to my full analysis capabilities, I can still help you understand your trading patterns. What would you like to know?`
          }
        }]
      })
    }

  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({
      choices: [{
        message: {
          content: 'I apologize for the technical issue. Please try again or check if your trading data is loaded.'
        }
      }]
    })
  }
}
