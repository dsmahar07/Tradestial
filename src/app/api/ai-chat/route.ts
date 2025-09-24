import { NextRequest, NextResponse } from 'next/server'
import { aiChatRateLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { DataStore } from '@/services/data-store.service'
import TradeMetadataService from '@/services/trade-metadata.service'

interface HighlightTrade {
  id: string
  symbol: string
  side?: string
  pnl?: number
  netRoi?: number
  date?: string
  tags: string[]
  trackerUrl: string
  strategyInfo?: {
    id: string
    name: string
  }
}

interface StructuredAnalysis {
  summary: string
  highlightTrades: HighlightTrade[]
  recommendations: string[]
  strategiesSummary?: {
    best?: StrategySnapshot
    worst?: StrategySnapshot
    all: StrategySnapshot[]
    descriptions?: Array<{ id: string; name: string; description?: string }>
  }
}

interface StrategySnapshot {
  id: string
  name: string
  trades: number
  netPnl: number
  winRate: number
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL ?? 'http://localhost:3000'
const OPENROUTER_APP_TITLE = process.env.OPENROUTER_APP_TITLE ?? 'Tradestial Trading Assistant'
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? 'x-ai/grok-4-fast:free'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await aiChatRateLimiter.limit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  let messages: any[] = []
  let tradingContext: any = null
  let strategyAssignments: Record<string, string[]> = {}
  let strategies: Array<{ id: string; name: string; description?: string }> = []

  try {
    const parsedBody = await request.json()
    messages = Array.isArray(parsedBody?.messages) ? parsedBody.messages : []
    tradingContext = parsedBody?.tradingContext ?? null
    strategyAssignments = parsedBody?.strategyAssignments ?? {}
    strategies = Array.isArray(parsedBody?.strategies) ? parsedBody.strategies : []

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
    const strategyDescriptions = strategies
      .map((s) => `- ${s.name}: ${s.description || 'No description provided'}`)
      .join('\n')

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

## Strategy Library
${strategyDescriptions || '(no strategies recorded yet)'}

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

    const structuredAnalysis: StructuredAnalysis = await generateStructuredAnalysis({
      tradingContext,
      strategyAssignments,
      strategies
    })

    try {
      // Use free Gemini 2.0 Flash model
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': OPENROUTER_SITE_URL,
          'X-Title': OPENROUTER_APP_TITLE,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 15000
        })
      })

      logger.debug('OpenRouter response status:', response.status)
      if (!response.ok) {
        const errorText = await response.text()
        logger.error('OpenRouter error:', errorText)

        const fallbackContent = buildFallbackContent({
          structuredAnalysis,
          messages,
          tradingContext
        })

        return NextResponse.json({
          choices: [{
            message: {
              content: fallbackContent
            }
          }],
          structuredAnalysis
        })
      }

      const data = await response.json()
      logger.debug('OpenRouter response:', data)
      return NextResponse.json({ ...data, structuredAnalysis })

    } catch (apiError) {
      logger.error('API call error:', apiError)
      // Return a fallback response with trading context
      return NextResponse.json({
        choices: [{
          message: {
            content: `I can see your trading statistics: ${tradingContext?.totalTrades || 0} total trades, ${tradingContext?.winRate || 0}% win rate, $${tradingContext?.totalPnl || 0} total P&L. While I'm having trouble connecting to my full analysis capabilities, I can still help you understand your trading patterns. What would you like to know?`
          }
        }],
        structuredAnalysis
      })
    }

  } catch (error) {
    logger.error('AI chat error:', error)
    const structuredAnalysis = await generateStructuredAnalysis({
      tradingContext,
      strategyAssignments,
      strategies
    })

    const lastUserMessage = [...messages].reverse().find((msg) => msg?.role === 'user')?.content?.toLowerCase() || ''

    let fallbackContent = 'I could not reach the AI model this time, so here is an on-the-fly summary from your latest trades.'

    const { best, worst } = structuredAnalysis?.strategiesSummary || {}
    const descriptions = structuredAnalysis?.strategiesSummary?.descriptions || []

    if (best) {
      fallbackContent += `\n\nTop performer: ${best.name} — ${formatCurrency(best.netPnl)} across ${best.trades} trade${best.trades === 1 ? '' : 's'} with a ${best.winRate.toFixed(1)}% win rate.`
      const desc = descriptions.find((d) => d.id === best.id)?.description
      if (desc) {
        fallbackContent += `\nWhy it works: ${desc}`
      }
    }

    if (worst && (!best || best.id !== worst.id)) {
      fallbackContent += `\nNeeds work: ${worst.name} — ${formatCurrency(worst.netPnl)} over ${worst.trades} trade${worst.trades === 1 ? '' : 's'} (${worst.winRate.toFixed(1)}% win rate).`
      const desc = descriptions.find((d) => d.id === worst.id)?.description
      if (desc) {
        fallbackContent += `\nPossible fix: ${desc}`
      }
    }

    if (!best && !worst) {
      fallbackContent += '\nNo strategy assignments detected yet. Assign trades to a strategy to unlock strategy-by-strategy insights.'
    }

    if (lastUserMessage.includes('best strategy')) {
      if (best) {
        fallbackContent += `\n\nYour best strategy right now is ${best.name}. Study its setups and tag future trades to keep tracking it.`
      } else {
        fallbackContent += '\n\nAssign trades to a strategy so I can highlight which one performs best.'
      }
    }
 
    return NextResponse.json({
      choices: [{
        message: {
          content: fallbackContent
        }
      }],
      structuredAnalysis
    })
  }
}

interface GenerateAnalysisParams {
  tradingContext: any
  strategyAssignments?: Record<string, string[]>
  strategies?: Array<{ id: string; name: string }>
}

async function generateStructuredAnalysis({ tradingContext, strategyAssignments = {}, strategies = [] }: GenerateAnalysisParams): Promise<StructuredAnalysis> {
  try {
    const summaryLines: string[] = []
    const recommendations: string[] = []
    const highlightTrades: HighlightTrade[] = []
    const strategySnapshots: StrategySnapshot[] = []

    if (!tradingContext || !tradingContext.totalTrades) {
      return {
        summary: 'No trading data found. Import your trades to unlock detailed analysis.',
        highlightTrades,
        recommendations: [
          'Import your trading history via the CSV importer to get started.',
          'Once data is available, ask Stial to analyze specific symbols or date ranges.'
        ],
        strategiesSummary: { all: [] }
      }
    }

    summaryLines.push(`Total Trades: ${tradingContext.totalTrades}`)
    summaryLines.push(`Win Rate: ${Number(tradingContext.winRate).toFixed(2)}%`)
    summaryLines.push(`Profit Factor: ${Number(tradingContext.profitFactor).toFixed(2)}`)
    summaryLines.push(`Total P&L: ${formatCurrency(Number(tradingContext.totalPnl))}`)

    if (Array.isArray(tradingContext.recentTrades)) {
      const decoratedTrades = decorateTradesWithMetadata(tradingContext.recentTrades)

      const topTrades = [...decoratedTrades]
        .filter(t => typeof t.pnl === 'number')
        .sort((a, b) => Math.abs((b.pnl ?? 0)) - Math.abs((a.pnl ?? 0)))
        .slice(0, 3)

      topTrades.forEach(trade => {
        const tags = extractTags(trade)
        const strategy = determineStrategy(strategyAssignments, strategies, trade.id)

        highlightTrades.push({
          id: trade.id || trade.tradeId || `${trade.symbol}-${trade.date}`,
          symbol: trade.symbol || 'Unknown',
          side: trade.side,
          pnl: trade.pnl,
          netRoi: trade.netRoi,
          date: trade.date || trade.closeDate || trade.openDate,
          tags,
          trackerUrl: trade.id ? `/trades/tracker/${trade.id}` : '/trades/tracker',
          strategyInfo: strategy ? { id: strategy.id, name: strategy.name } : undefined
        })
      })

      if (highlightTrades.length) {
        summaryLines.push(`Highlighted Trades: ${highlightTrades.map(t => `${t.symbol} (${formatCurrency(t.pnl)})`).join(', ')}`)
      }

      const strategyNames = Array.from(new Set(highlightTrades
        .map(t => t.strategyInfo?.name)
        .filter(Boolean) as string[]))

      if (strategyNames.length > 1) {
        summaryLines.push(`Strategies In Focus: ${strategyNames.join(', ')}`)
      }

      const positiveTags = highlightTrades.flatMap(t => t.tags.filter(tag => !tag.toLowerCase().includes('mistake')))
      const negativeTags = highlightTrades.flatMap(t => t.tags.filter(tag => tag.toLowerCase().includes('mistake')))

      if (positiveTags.length) {
        recommendations.push(`Lean into strategies tagged: ${Array.from(new Set(positiveTags)).join(', ')}`)
      }

      if (negativeTags.length) {
        recommendations.push(`Review trades with mistake tags: ${Array.from(new Set(negativeTags)).join(', ')}`)
      }

      if (strategyNames.length) {
        recommendations.push(`Dive deeper into ${strategyNames.join(', ')} — review playbooks and tagged trades to reinforce what’s working.`)
      }
    }

    const strategyStats = buildStrategySnapshots(tradingContext?.recentTrades || [], strategyAssignments, strategies)
    strategySnapshots.push(...strategyStats)

    if (strategySnapshots.length) {
      const best = strategySnapshots[0]
      if (best) {
        summaryLines.push(`Best Strategy: ${best.name} (${formatCurrency(best.netPnl)}) with a ${best.winRate.toFixed(1)}% win rate.`)
      }

      const worst = strategySnapshots[strategySnapshots.length - 1]
      if (worst && worst.id !== best?.id) {
        summaryLines.push(`Needs Attention: ${worst.name} (${formatCurrency(worst.netPnl)}) across ${worst.trades} trade${worst.trades === 1 ? '' : 's'}.`)
      }

      if (best && best.netPnl <= 0) {
        recommendations.push(`Your top strategy ${best.name} is still net negative. Audit its playbook and tighten risk controls before adding size.`)
      }

      if (worst && worst.id !== best?.id) {
        recommendations.push(`Pause or rework ${worst.name} — it’s currently dragging performance (${formatCurrency(worst.netPnl)} P&L).`)
      }
    }

    if (parseFloat(tradingContext.profitFactor) < 1.2) {
      recommendations.push('Improve risk management to lift profit factor above 1.2 — review stop placements and position sizing.')
    }

    if (parseFloat(tradingContext.winRate) < 50) {
      recommendations.push('Focus on trade selection to push win rate beyond 50%. Consider filtering setups by tag or market regime.')
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep refining your process — focus on the tagged strategies that are consistently profitable.')
    }

    return {
      summary: summaryLines.join(' • '),
      highlightTrades,
      recommendations,
      strategiesSummary: {
        best: strategySnapshots[0],
        worst: strategySnapshots[strategySnapshots.length - 1],
        all: strategySnapshots,
        descriptions: strategies.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description
        }))
      }
    }
  } catch (error) {
    logger.error('Failed to generate structured analysis', error)
    return {
      summary: 'Unable to compute detailed highlights. Showing baseline metrics only.',
      highlightTrades: [],
      recommendations: [
        'Try reloading your trades or refreshing the page.',
        'If the issue persists, contact support.'
      ],
      strategiesSummary: { all: [] }
    }
  }
}

function decorateTradesWithMetadata(trades: any[]): any[] {
  const metadataMap = TradeMetadataService.getAllTradeMetadata()
  const storeTrades = DataStore.getAllTrades()
  return trades.map(trade => {
    const metadata = metadataMap[trade.id || trade.tradeId || ''] || {}
    const storeTrade = storeTrades.find(t => t.id === trade.id)
    return {
      ...trade,
      ...storeTrade,
      metadata
    }
  })
}

function determineStrategy(
  assignments: Record<string, string[]>,
  strategies: Array<{ id: string; name: string }>,
  tradeId?: string
) {
  if (!tradeId) return null
  const entry = Object.entries(assignments).find(([, tradeIds]) => tradeIds.includes(tradeId))
  if (!entry) return null

  const [strategyId] = entry
  return strategies.find(s => String(s.id) === String(strategyId)) || null
}

function buildStrategySnapshots(
  recentTrades: any[],
  assignments: Record<string, string[]>,
  strategies: Array<{ id: string; name: string }>
): StrategySnapshot[] {
  if (!recentTrades.length) return []

  const tradeMap = new Map<string, any>()
  recentTrades.forEach((trade: any) => {
    if (trade?.id) {
      tradeMap.set(String(trade.id), trade)
    }
  })

  const snapshots: StrategySnapshot[] = []

  for (const [strategyId, tradeIds] of Object.entries(assignments)) {
    const trades = tradeIds
      .map(id => tradeMap.get(String(id)))
      .filter(Boolean)

    if (!trades.length) continue

    let wins = 0
    let pnlSum = 0

    trades.forEach(trade => {
      const pnl = parseNumber(trade?.pnl)
      pnlSum += pnl
      if (pnl > 0) wins += 1
    })

    const winRate = trades.length ? (wins / trades.length) * 100 : 0
    const strategyMeta = strategies.find(s => String(s.id) === String(strategyId))

    snapshots.push({
      id: String(strategyId),
      name: strategyMeta?.name || `Strategy ${strategyId}`,
      trades: trades.length,
      netPnl: pnlSum,
      winRate
    })
  }

  return snapshots.sort((a, b) => b.netPnl - a.netPnl)
}

function extractTags(trade: any): string[] {
  const rawTags: string[] = []
  if (Array.isArray(trade?.tags)) rawTags.push(...trade.tags)
  if (Array.isArray(trade?.customTags)) rawTags.push(...trade.customTags)
  if (Array.isArray(trade?.mistakes)) rawTags.push(...trade.mistakes.map((tag: string) => `mistake:${tag}`))
  if (Array.isArray(trade?.metadata?.tags)) rawTags.push(...trade.metadata.tags)
  if (Array.isArray(trade?.metadata?.customTags)) rawTags.push(...trade.metadata.customTags)
  if (Array.isArray(trade?.metadata?.mistakes)) rawTags.push(...trade.metadata.mistakes.map((tag: string) => `mistake:${tag}`))
  return Array.from(new Set(rawTags.filter(Boolean)))
}

function formatCurrency(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A'
  return (value >= 0 ? '+' : '-') + '$' + Math.abs(value).toFixed(2)
}

function parseNumber(value: any): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[$,]/g, ''))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function loadStrategies(): Array<{ id: string; name: string }> {
  try {
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('tradestial:strategies')
      if (raw) {
        const list = JSON.parse(raw)
        if (Array.isArray(list)) {
          return list.map((s: any) => ({ id: String(s.id), name: s.name || 'Unnamed Strategy' }))
        }
      }
    }
  } catch (error) {
    logger.warn('Failed to parse strategies from storage', error)
  }
  return []
}

function buildFallbackContent({ structuredAnalysis, messages, tradingContext }: {
  structuredAnalysis: StructuredAnalysis
  messages: any[]
  tradingContext: any
}) {
  const lastUserMessage = [...messages].reverse().find((msg) => msg?.role === 'user')?.content?.toLowerCase() || ''
 
  let fallbackContent = 'I could not reach the AI model this time, so here is an on-the-fly summary from your latest trades.'
 
  const { best, worst } = structuredAnalysis?.strategiesSummary || {}
  const descriptions = structuredAnalysis?.strategiesSummary?.descriptions || []
 
  if (best) {
    fallbackContent += `\n\nTop performer: ${best.name} — ${formatCurrency(best.netPnl)} across ${best.trades} trade${best.trades === 1 ? '' : 's'} with a ${best.winRate.toFixed(1)}% win rate.`
    const desc = descriptions.find((d) => d.id === best.id)?.description
    if (desc) {
      fallbackContent += `\nWhy it works: ${desc}`
    }
  }
 
  if (worst && (!best || best.id !== worst.id)) {
    fallbackContent += `\nNeeds work: ${worst.name} — ${formatCurrency(worst.netPnl)} over ${worst.trades} trade${worst.trades === 1 ? '' : 's'} (${worst.winRate.toFixed(1)}% win rate).`
    const desc = descriptions.find((d) => d.id === worst.id)?.description
    if (desc) {
      fallbackContent += `\nPossible fix: ${desc}`
    }
  }
 
  if (!best && !worst) {
    fallbackContent += '\nNo strategy assignments detected yet. Assign trades to a strategy to unlock strategy-by-strategy insights.'
  }
 
  if (lastUserMessage.includes('best strategy')) {
    if (best) {
      fallbackContent += `\n\nYour best strategy right now is ${best.name}. Study its setups and tag future trades to keep tracking it.`
    } else {
      fallbackContent += '\n\nAssign trades to a strategy so I can highlight which one performs best.'
    }
  }
}
