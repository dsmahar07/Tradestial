'use client'

import {
  Share2,
  Download,
  MoreHorizontal,
  Edit3,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Image,
  Smile,
  Code,
  Camera,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Hash,
  CheckSquare,
  Copy,
  FileText,
  Trash2,
  ChevronDown,
  Calendar,
  Plus,
  X,
  Save,
  MoreVertical,
  Palette,
  Type,
  Sparkles,
  Loader2,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  FileDown
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Button } from '@/components/ui/button'
import * as FancyButton from '@/components/ui/fancy-button'
import { TemplateSelector } from '@/components/features/notes/TemplateSelector'
import { SimpleTemplateEditor } from '@/components/features/notes/SimpleTemplateEditor'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Note } from '@/app/notes/page'
import type { TradeJournalingTemplate } from '@/lib/templates'
import type { TemplateInstance } from '@/types/templates'
import { useState, useRef, useEffect, useCallback, useMemo, useLayoutEffect } from 'react'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { ImageMentionPicker, MediaItem } from '@/components/features/notes/ImageMentionPicker'
import { cn } from '@/lib/utils'
import { encodeNoteToToken } from '@/lib/note-share'
import { DataStore } from '@/services/data-store.service'
import { accountService } from '@/services/account.service'
import { aiEnhancementService, type EnhancementOptions } from '@/services/ai-enhancement.service'
import { tradeSummaryService } from '@/services/trade-summary.service'
import { useToast } from '@/components/ui/notification-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface NotebookEditorProps {
  note: Note | null
  onUpdateNote?: (id: string, content: string, title?: string, color?: string, tags?: string[], sharing?: { isShared: boolean; shareToken?: string; isAnonymous: boolean; sharedAt?: string }) => void
  onDeleteNote?: (id: string, noteTitle: string) => void
  useDatePicker?: boolean
  onDateChange?: (selectedDate: Date) => void
  useRangePicker?: boolean
  onRangeChange?: (startDate: Date, endDate: Date) => void
  // When using Sessions Recap, parent can pass the active range so sharing has stats even if user didn't open picker here
  rangeFrom?: Date
  rangeTo?: Date
  hideNetPnl?: boolean
  headerStats?: React.ReactNode
  netPnlValue?: number
  netPnlIsProfit?: boolean
  // Template creation props (optional)
  onCreateNote?: () => void
  onCreateNoteFromTemplate?: (template: TradeJournalingTemplate, templateInstance: TemplateInstance, generatedContent: string) => void
  onQuickApplyTemplate?: (template: TradeJournalingTemplate, content: string) => void
  onDeleteTemplate?: (template: TradeJournalingTemplate) => void
  // Fullscreen props
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  templates?: TradeJournalingTemplate[]
}

export function NotebookEditor({ note, onUpdateNote, onDeleteNote, useDatePicker = false, onDateChange, useRangePicker = false, onRangeChange, rangeFrom, rangeTo, hideNetPnl = false, headerStats, netPnlValue, netPnlIsProfit, onCreateNote, onCreateNoteFromTemplate, onQuickApplyTemplate, onDeleteTemplate, templates, isFullscreen, onToggleFullscreen }: NotebookEditorProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState('')
  const [content, setContent] = useState('')
  const [showStats, setShowStats] = useState(false)
  // Guard to prevent empty saves during the first tick of entering edit mode
  const isSettingUpEdit = useRef(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState<string>('')
  const [isAnonymousShare, setIsAnonymousShare] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showRangePicker, setShowRangePicker] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [calendarDate, setCalendarDate] = useState(new Date())
  // Template editor state
  const [selectedTemplate, setSelectedTemplate] = useState<TradeJournalingTemplate | null>(null)
  // Image mention state
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [imagePickerPosition, setImagePickerPosition] = useState({ top: 0, left: 0 })
  const [imageSearchQuery, setImageSearchQuery] = useState('')
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  // AI Enhancement state
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [showEnhancementOptions, setShowEnhancementOptions] = useState(false)
  const [isGeneratingTradeSummary, setIsGeneratingTradeSummary] = useState(false)
  const { success, error, info } = useToast()

  // Clipboard helper to avoid runtime errors in non-secure/unsupported contexts
  const safeCopyToClipboard = useCallback(async (text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function' && (window as any).isSecureContext !== false) {
        await navigator.clipboard.writeText(text)
        return true
      }
    } catch {
      // fall back to execCommand
    }
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      return ok
    } catch {
      return false
    }
  }, [])

  const handleTitleEdit = () => {
    if (note) {
      if (useRangePicker) {
        setShowRangePicker(!showRangePicker)
        setShowDatePicker(false)
      } else if (useDatePicker) {
        setShowDatePicker(!showDatePicker)
        setShowRangePicker(false)
      } else {
        setTempTitle(note.title)
        setIsEditingTitle(true)
      }
    }
  }

  // Compute tradingData snapshot for sharing when the note doesn't already have it.
  // Supports both single-day and range (Sessions Recap) contexts.
  const computeTradingDataForShare = useCallback((n: Note | null) => {
    if (!n) return undefined
    if (n.tradingData) return n.tradingData
    // If we're in Sessions Recap and have a selected range, compute range stats
    if (useRangePicker) {
      const start = dateRange.from || rangeFrom
      const end = dateRange.to || rangeTo
      if (start && end) {
        const trades = DataStore.getTradesByDateRange(start, end)
      if (!Array.isArray(trades) || trades.length === 0) return undefined

      const totalTrades = trades.length
      const winners = trades.filter((t: any) => t.netPnl > 0).length
      const losers = trades.filter((t: any) => t.netPnl < 0).length
      const winrate = totalTrades > 0 ? `${Math.round((winners / totalTrades) * 100)}%` : '0%'
      const grossPnl = trades.reduce((s: number, t: any) => s + (t.grossPnl ?? t.netPnl ?? 0), 0)
      const commissions = trades.reduce((s: number, t: any) => s + (t.commissions ?? 0), 0)
      const volume = trades.reduce((s: number, t: any) => s + (t.contractsTraded ?? 0), 0)
      const avgWin = winners > 0 ? trades.filter((t: any) => t.netPnl > 0).reduce((s: number, t: any) => s + (t.netPnl ?? 0), 0) / winners : 0
      const avgLoss = losers > 0 ? Math.abs(trades.filter((t: any) => t.netPnl < 0).reduce((s: number, t: any) => s + (t.netPnl ?? 0), 0)) / losers : 0
      const profitFactor = avgLoss > 0 ? +(avgWin / avgLoss).toFixed(2) : 0

      const points = trades
        .map((t: any) => ({
          time: (t.entryTime || t.openTime || t.closeTime || '16:00')?.slice(0, 5),
          pnl: t.netPnl ?? 0,
        }))
        .sort((a: any, b: any) => a.time.localeCompare(b.time))

      let running = 0
      const chartData = points.map((p: any) => {
        running += p.pnl
        return { time: p.time, value: Math.round(running) }
      })

      const netPnl = Math.round(trades.reduce((sum: number, t: any) => sum + (t.netPnl || 0), 0))

      const fmt = (d: Date) => {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${dd}`
      }

      return {
        netPnl,
        isProfit: netPnl >= 0,
        stats: {
          totalTrades,
          winners,
          losers,
          winrate,
          grossPnl: Math.round(grossPnl),
          volume,
          commissions: Math.round(commissions),
          profitFactor,
        },
        chartData,
        trades,
        date: `${fmt(start)}..${fmt(end)}`,
      }
      }
    }

    // Otherwise, infer a single journal day in a robust way
    let day: Date | null = null
    const parsedFromTitle = Date.parse(n.title || '')
    if (!isNaN(parsedFromTitle)) {
      day = new Date(parsedFromTitle)
    } else if (n.createdAt) {
      const parsedCreated = Date.parse(String(n.createdAt))
      if (!isNaN(parsedCreated)) day = new Date(parsedCreated)
    } else if (n.updatedAt) {
      const parsedUpdated = Date.parse(String(n.updatedAt))
      if (!isNaN(parsedUpdated)) day = new Date(parsedUpdated)
    }
    if (!day) return undefined
    const trades = DataStore.getTradesByDateRange(day, day)
    if (!Array.isArray(trades) || trades.length === 0) return undefined

    const totalTrades = trades.length
    const winners = trades.filter((t: any) => t.netPnl > 0).length
    const losers = trades.filter((t: any) => t.netPnl < 0).length
    const winrate = totalTrades > 0 ? `${Math.round((winners / totalTrades) * 100)}%` : '0%'
    const grossPnl = trades.reduce((s: number, t: any) => s + (t.grossPnl ?? t.netPnl ?? 0), 0)
    const commissions = trades.reduce((s: number, t: any) => s + (t.commissions ?? 0), 0)
    const volume = trades.reduce((s: number, t: any) => s + (t.contractsTraded ?? 0), 0)
    const avgWin = winners > 0 ? trades.filter((t: any) => t.netPnl > 0).reduce((s: number, t: any) => s + (t.netPnl ?? 0), 0) / winners : 0
    const avgLoss = losers > 0 ? Math.abs(trades.filter((t: any) => t.netPnl < 0).reduce((s: number, t: any) => s + (t.netPnl ?? 0), 0)) / losers : 0
    const profitFactor = avgLoss > 0 ? +(avgWin / avgLoss).toFixed(2) : 0

    const points = trades
      .map((t: any) => ({
        time: (t.entryTime || t.openTime || t.closeTime || '16:00')?.slice(0, 5),
        pnl: t.netPnl ?? 0,
      }))
      .sort((a: any, b: any) => a.time.localeCompare(b.time))

    let running = 0
    const chartData = points.map((p: any) => {
      running += p.pnl
      return { time: p.time, value: Math.round(running) }
    })

    const netPnl = Math.round(trades.reduce((sum: number, t: any) => sum + (t.netPnl || 0), 0))
    const y = day.getFullYear()
    const m = String(day.getMonth() + 1).padStart(2, '0')
    const d = String(day.getDate()).padStart(2, '0')

    return {
      netPnl,
      isProfit: netPnl >= 0,
      stats: {
        totalTrades,
        winners,
        losers,
        winrate,
        grossPnl: Math.round(grossPnl),
        volume,
        commissions: Math.round(commissions),
        profitFactor,
      },
      chartData,
      trades,
      date: `${y}-${m}-${d}`,
    }
  }, [])

  const handleTemplateSelect = (template: TradeJournalingTemplate) => {
    setSelectedTemplate(template)
    setShowTemplateEditor(true)
  }

  const handleTemplateEditorSave = (content: string) => {
    if (selectedTemplate && onCreateNoteFromTemplate) {
      const templateInstance: TemplateInstance = {
        templateId: selectedTemplate.id,
        fieldValues: {},
        customFields: [],
      }
      onCreateNoteFromTemplate(selectedTemplate, templateInstance, content)
    }
    setShowTemplateEditor(false)
    setSelectedTemplate(null)
  }

  const handleTemplateEditorCancel = () => {
    setShowTemplateEditor(false)
    setSelectedTemplate(null)
  }

  // AI Enhancement handlers
  const handleAIEnhancement = async (type: EnhancementOptions['type']) => {
    if (!note) return

    // Special handling for summarize - use full trading report
    if (type === 'summarize') {
      return handleFullTradingReportSummary()
    }

    if (!content.trim()) return

    setIsEnhancing(true)
    setShowEnhancementOptions(false)

    // Show info toast about enhancement starting
    info('AI Enhancement Started', 'Processing your text with Llama 4 Maverick AI...', 3000)

    try {
      const result = await aiEnhancementService.enhanceText(content, { 
        type, 
        context: 'trade-journal' 
      })
      
      console.log('DEBUG AI Enhancement result:', {
        originalContent: content,
        enhancedText: result.enhancedText,
        noteId: note.id
      })
      
      // Update both local state and persist immediately to ensure consistency
      setContent(result.enhancedText)
      if (onUpdateNote) {
        onUpdateNote(note.id, result.enhancedText)
      }
      
      // Force exit edit mode to show the enhanced preview
      setIsEditing(false)

      // Show success toast
      success('Enhancement Complete', 'Your text has been successfully enhanced!', 4000)
    } catch (err) {
      console.error('AI Enhancement failed:', err)
      
      // Show error toast with helpful message
      error(
        'Enhancement Failed', 
        'Unable to enhance text. Please check your API key and try again.', 
        6000
      )
    } finally {
      setIsEnhancing(false)
    }
  }

  // Full Trading Report Summary handler
  const handleFullTradingReportSummary = async () => {
    if (!note) return

    setIsEnhancing(true)
    setShowEnhancementOptions(false)

    info('Generating Full Trading Report Summary', 'Analyzing all your trades and performance data...', 4000)

    try {
      // Get all trades from DataStore
      let allTrades = []
      try {
        allTrades = DataStore.getAllTrades()
        console.log('Retrieved all trades for summary:', allTrades.length)
      } catch (dataError) {
        console.error('Error accessing DataStore:', dataError)
        error('Data Access Error', 'Unable to access trade data. Please ensure trades are imported.', 6000)
        return
      }

      if (allTrades.length === 0) {
        error('No Trades Found', 'No trades found in your account. Please import trades first.', 6000)
        return
      }

      // Calculate comprehensive statistics
      const totalTrades = allTrades.length
      const winners = allTrades.filter((t: any) => (t.netPnl || 0) > 0).length
      const losers = allTrades.filter((t: any) => (t.netPnl || 0) < 0).length
      const breakeven = totalTrades - winners - losers
      const winRate = totalTrades > 0 ? Math.round((winners / totalTrades) * 100) : 0
      
      const totalPnL = allTrades.reduce((sum: number, t: any) => sum + (t.netPnl || 0), 0)
      const grossPnL = allTrades.reduce((sum: number, t: any) => sum + (t.grossPnl || t.netPnl || 0), 0)
      const totalCommissions = allTrades.reduce((sum: number, t: any) => sum + (t.commissions || 0), 0)
      const totalVolume = allTrades.reduce((sum: number, t: any) => sum + (t.contractsTraded || 0), 0)
      
      const winningTrades = allTrades.filter((t: any) => (t.netPnl || 0) > 0)
      const losingTrades = allTrades.filter((t: any) => (t.netPnl || 0) < 0)
      
      const avgWin = winners > 0 ? winningTrades.reduce((sum: number, t: any) => sum + (t.netPnl || 0), 0) / winners : 0
      const avgLoss = losers > 0 ? Math.abs(losingTrades.reduce((sum: number, t: any) => sum + (t.netPnl || 0), 0)) / losers : 0
      const profitFactor = avgLoss > 0 ? (avgWin / avgLoss) : 0
      
      // Advanced analytics
      const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map((t: any) => t.netPnl || 0)) : 0
      const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map((t: any) => t.netPnl || 0)) : 0
      const maxDrawdown = Math.abs(largestLoss)
      
      // Consecutive analysis
      let currentStreak = 0
      let maxWinStreak = 0
      let maxLossStreak = 0
      let currentWinStreak = 0
      let currentLossStreak = 0
      
      allTrades.forEach((trade: any, index: number) => {
        const pnl = trade.netPnl || 0
        if (pnl > 0) {
          currentWinStreak++
          currentLossStreak = 0
          maxWinStreak = Math.max(maxWinStreak, currentWinStreak)
        } else if (pnl < 0) {
          currentLossStreak++
          currentWinStreak = 0
          maxLossStreak = Math.max(maxLossStreak, currentLossStreak)
        }
      })
      
      // Risk metrics
      const riskRewardRatio = avgLoss > 0 ? (avgWin / avgLoss) : 0
      const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss
      
      // Time analysis
      const uniqueSymbols = [...new Set(allTrades.map((t: any) => t.symbol).filter(Boolean))]
      const tradingDates = [...new Set(allTrades.map((t: any) => {
        const date = t.entryDate || t.openDate || t.closeDate
        return date ? date.split('T')[0] : null
      }).filter(Boolean))]
      const tradingDays = tradingDates.length
      
      // Performance by symbol
      const symbolPerformance = uniqueSymbols.map(symbol => {
        const symbolTrades = allTrades.filter((t: any) => t.symbol === symbol)
        const symbolPnL = symbolTrades.reduce((sum: number, t: any) => sum + (t.netPnl || 0), 0)
        const symbolWinRate = symbolTrades.length > 0 ? Math.round((symbolTrades.filter((t: any) => (t.netPnl || 0) > 0).length / symbolTrades.length) * 100) : 0
        return {
          symbol,
          trades: symbolTrades.length,
          pnl: symbolPnL,
          winRate: symbolWinRate
        }
      }).sort((a, b) => b.pnl - a.pnl)
      
      // Trading frequency analysis
      const avgTradesPerDay = tradingDays > 0 ? (totalTrades / tradingDays) : 0

      // Create comprehensive trading report with enhanced insights
      const reportContent = `# 📊 Complete Trading Performance Analysis

## 🎯 **Executive Summary**
Comprehensive analysis of **${totalTrades} trades** executed over **${tradingDays} trading days** across **${uniqueSymbols.length} instruments**.

### 💰 **Financial Performance**
- **Net P&L:** ${totalPnL >= 0 ? '🟢 +' : '🔴 '}$${Math.round(totalPnL).toLocaleString()}
- **Gross P&L:** $${Math.round(grossPnL).toLocaleString()}
- **Total Commissions:** $${Math.round(totalCommissions).toLocaleString()} (${grossPnL !== 0 ? Math.round((totalCommissions / Math.abs(grossPnL)) * 100) : 0}% of gross)
- **Win Rate:** ${winRate}% (${winners}W / ${losers}L / ${breakeven}BE)

---

## 📈 **Advanced Performance Metrics**

| **Core Metrics** | **Value** | **Risk Metrics** | **Value** |
|------------------|-----------|------------------|-----------|
| **Profit Factor** | ${profitFactor.toFixed(2)} | **Risk/Reward Ratio** | ${riskRewardRatio.toFixed(2)} |
| **Average Win** | $${Math.round(avgWin).toLocaleString()} | **Expectancy** | $${expectancy.toFixed(2)} |
| **Average Loss** | $${Math.round(avgLoss).toLocaleString()} | **Largest Win** | $${Math.round(largestWin).toLocaleString()} |
| **Total Volume** | ${totalVolume.toLocaleString()} contracts | **Largest Loss** | $${Math.round(largestLoss).toLocaleString()} |

### 🔥 **Streak Analysis**
- **Max Win Streak:** ${maxWinStreak} consecutive wins
- **Max Loss Streak:** ${maxLossStreak} consecutive losses
- **Current Performance:** ${currentWinStreak > 0 ? `${currentWinStreak} win streak` : currentLossStreak > 0 ? `${currentLossStreak} loss streak` : 'No active streak'}

---

## 🎯 **Symbol Performance Breakdown**

${symbolPerformance.slice(0, 5).map((sym, index) => 
  `**${index + 1}. ${sym.symbol}** | ${sym.trades} trades | ${sym.pnl >= 0 ? '+' : ''}$${Math.round(sym.pnl).toLocaleString()} | ${sym.winRate}% win rate`
).join('\n')}

### 📊 **Trading Activity Analysis**
- **Average Trades/Day:** ${avgTradesPerDay.toFixed(1)} trades
- **Most Active Period:** ${tradingDays} days of trading activity
- **Diversification:** ${uniqueSymbols.length} different instruments traded

---

## 🧠 **Detailed Performance Insights**

### ${totalPnL > 0 ? '🟢 **Profitable Trading Performance**' : '🔴 **Performance Requires Attention**'}

**Win Rate Analysis:**
${winRate >= 65 ? '✅ **Excellent** - Your 65%+ win rate shows superior trade selection and timing' : 
  winRate >= 55 ? '✅ **Good** - Your 55%+ win rate indicates solid trading skills with room for optimization' :
  winRate >= 45 ? '⚠️ **Average** - Your win rate suggests inconsistent trade selection - focus on quality setups' :
  '❌ **Needs Improvement** - Win rate below 45% indicates fundamental issues with strategy or execution'}

**Profit Factor Assessment:**
${profitFactor >= 2.0 ? '🌟 **Outstanding** - Profit factor above 2.0 shows exceptional risk management' :
  profitFactor >= 1.5 ? '✅ **Strong** - Solid profit factor indicates good balance between wins and losses' :
  profitFactor >= 1.2 ? '⚠️ **Acceptable** - Profit factor is positive but could be optimized' :
  profitFactor >= 1.0 ? '⚠️ **Marginal** - Barely profitable - immediate strategy review needed' :
  '❌ **Unprofitable** - Losses exceed wins - fundamental strategy overhaul required'}

**Risk Management Evaluation:**
${riskRewardRatio >= 2.0 ? '🛡️ **Excellent Risk Control** - Your 2:1+ risk/reward ratio is exceptional' :
  riskRewardRatio >= 1.5 ? '✅ **Good Risk Management** - Solid risk/reward discipline' :
  riskRewardRatio >= 1.0 ? '⚠️ **Adequate** - Risk/reward is positive but could be improved' :
  '❌ **Poor Risk Control** - Average losses exceed average wins - tighten stop losses'}

---

## 🚀 **Specific Action Plan & Recommendations**

### 🎯 **Immediate Actions (Next 1-2 Weeks)**

${totalPnL <= 0 ? 
`**🚨 Priority: Stop the Bleeding**
1. **Pause Trading** - Take a break to analyze what's not working
2. **Review Last 10 Trades** - Identify common patterns in losses
3. **Reduce Position Size** - Cut risk by 50% until consistency returns
4. **Focus on 1-2 Best Setups** - Eliminate low-probability trades` :

`**💪 Optimize Your Success**
1. **Document Winning Patterns** - Record what's working well
2. **Gradual Scale-Up** - Consider 10-20% position size increase
3. **Maintain Discipline** - Don't deviate from proven strategies
4. **Track Daily Performance** - Monitor for any degradation`}

### 📈 **Medium-Term Improvements (Next Month)**

${winRate < 50 ? 
`**🎯 Trade Selection Enhancement**
- **Setup Refinement:** Only trade A+ setups that meet all criteria
- **Market Timing:** Focus on optimal market conditions for your strategy
- **Backtest Analysis:** Review historical data for pattern validation
- **Entry Precision:** Work on better entry timing and execution` : 

`**🔧 Performance Optimization**
- **Strategy Refinement:** Fine-tune your best performing setups
- **Market Expansion:** Consider adding complementary instruments
- **Risk Scaling:** Optimize position sizing based on setup confidence
- **Performance Tracking:** Implement detailed trade journaling`}

${profitFactor < 1.3 ? 
`**⚖️ Risk/Reward Optimization**
- **Stop Loss Review:** Analyze if stops are too tight or too wide
- **Profit Target Analysis:** Ensure you're capturing adequate moves
- **Exit Strategy:** Improve partial profit-taking and trailing stops
- **Trade Management:** Better position management during winning trades` : ''}

### 🎓 **Long-Term Development (Next Quarter)**

**📚 Skill Development Areas:**
${maxLossStreak > 5 ? '- **Emotional Control:** Work on managing losing streaks and avoiding revenge trading' : ''}
${avgTradesPerDay > 10 ? '- **Quality over Quantity:** Reduce overtrading and focus on best opportunities' : ''}
${symbolPerformance.length > 10 ? '- **Focus Strategy:** Consider specializing in your most profitable instruments' : ''}
- **Advanced Analysis:** Implement more sophisticated performance metrics
- **Market Adaptation:** Develop strategies for different market conditions
- **Technology Upgrade:** Consider better tools for analysis and execution

**🎯 Performance Targets:**
- **Win Rate Target:** ${winRate < 55 ? '55%+' : winRate < 65 ? '65%+' : 'Maintain 65%+'}
- **Profit Factor Goal:** ${profitFactor < 1.5 ? '1.5+' : profitFactor < 2.0 ? '2.0+' : 'Maintain 2.0+'}
- **Risk/Reward Target:** ${riskRewardRatio < 1.5 ? '1.5:1' : riskRewardRatio < 2.0 ? '2.0:1' : 'Maintain 2.0:1+'}

---

## 📋 **Next Steps Checklist**

${totalPnL <= 0 ? '🚨 **Recovery Mode**' : '📈 **Growth Mode**'}

- [ ] ${totalPnL <= 0 ? 'Complete trading pause and strategy review' : 'Document current successful strategies'}
- [ ] ${winRate < 50 ? 'Analyze last 20 trades for pattern identification' : 'Identify top 3 most profitable setups'}
- [ ] ${profitFactor < 1.2 ? 'Revise risk management rules' : 'Optimize position sizing strategy'}
- [ ] ${maxLossStreak > 3 ? 'Develop emotional control protocols' : 'Create performance scaling guidelines'}
- [ ] Set up weekly performance review schedule
- [ ] ${totalCommissions / Math.abs(grossPnL) > 0.1 ? 'Review commission costs and broker options' : 'Monitor commission impact monthly'}

---

*📅 Analysis generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*
*🔄 Recommended review frequency: Weekly for first month, then bi-weekly*`

      // Update content with comprehensive report
      setContent(reportContent)
      if (onUpdateNote) {
        onUpdateNote(note.id, reportContent)
      }

      // Force exit edit mode to show the report
      setIsEditing(false)

      success('Trading Report Generated', `Analyzed ${totalTrades} trades and created comprehensive performance summary!`, 5000)
    } catch (err) {
      console.error('Full Trading Report Summary failed:', err)
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      error(
        'Report Generation Failed', 
        `Error: ${errorMessage}`, 
        8000
      )
    } finally {
      setIsEnhancing(false)
    }
  }

  // Daily Trade Summary handler
  const handleDailyTradeSummary = async () => {
    if (!note) return

    setIsGeneratingTradeSummary(true)
    setShowEnhancementOptions(false)

    // Get today's date or use note's date if available
    const today = new Date().toISOString().split('T')[0]
    const targetDate = note.title.match(/\d{4}-\d{2}-\d{2}/) ? note.title.match(/\d{4}-\d{2}-\d{2}/)![0] : today

    info('Generating Trade Summary', 'Analyzing your trades and creating comprehensive daily report...', 4000)

    try {
      // Get all trades from DataStore
      let allTrades = []
      try {
        allTrades = DataStore.getAllTrades()
        console.log('Retrieved trades:', allTrades.length)
      } catch (dataError) {
        console.error('Error accessing DataStore:', dataError)
        error('Data Access Error', 'Unable to access trade data. Please ensure trades are imported.', 6000)
        return
      }

      const tradesForDate = tradeSummaryService.getTradesForDate(allTrades, targetDate)
      console.log(`Trades for ${targetDate}:`, tradesForDate.length)

      if (tradesForDate.length === 0) {
        error('No Trades Found', `No trades found for ${targetDate}. Please import trades or select a different date.`, 6000)
        return
      }

      const result = await tradeSummaryService.generateDailySummary({
        date: targetDate,
        trades: tradesForDate,
        notes: content.trim() || undefined
      })

      // Replace content with comprehensive AI-generated summary
      const summaryContent = `# Daily Trading Summary - ${targetDate}

${result.summary}

---

**Quick Stats:**
- Total Trades: ${result.analysis.totalTrades}
- Win Rate: ${result.analysis.winRate}%
- Net P&L: $${result.analysis.netPnL}
- Profit Factor: ${result.analysis.profitFactor}
- Average R-Multiple: ${result.analysis.avgRMultiple}

*Generated by AI on ${new Date().toLocaleString()}*`

      setContent(summaryContent)
      if (onUpdateNote) {
        onUpdateNote(note.id, summaryContent)
      }

      success('Trade Summary Generated', `Analyzed ${result.tradesAnalyzed} trades and created comprehensive daily report!`, 5000)
    } catch (err) {
      console.error('Trade Summary failed:', err)
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      error(
        'Summary Generation Failed', 
        `Error: ${errorMessage}`, 
        8000
      )
    } finally {
      setIsGeneratingTradeSummary(false)
    }
  }

  const handleDateSelect = (selectedDate: Date) => {
    if (note) {
      if (useDatePicker && onDateChange) {
        onDateChange(selectedDate)
      } else {
        const formattedDate = selectedDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        onUpdateNote?.(note.id, note.content, formattedDate)
      }
      setShowDatePicker(false)
    }
  }

  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })

  const handleRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    if (range.from && range.to && onRangeChange) {
      onRangeChange(range.from, range.to)
      setDateRange(range)
      setShowRangePicker(false)
    }
  }

  // Generate calendar for date picker
  const generateCalendarDays = () => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({
        date: prevDate.getDate(),
        fullDate: prevDate,
        isCurrentMonth: false
      })
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = new Date(year, month, day)
      days.push({
        date: day,
        fullDate,
        isCurrentMonth: true
      })
    }
    
    // Next month's days to complete the grid
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day)
      days.push({
        date: day,
        fullDate: nextDate,
        isCurrentMonth: false
      })
    }
    
    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(calendarDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCalendarDate(newDate)
  }

  const getMonthYearDisplay = () => {
    return calendarDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  const handleTitleSave = () => {
    if (note && tempTitle.trim() && tempTitle !== note.title) {
      onUpdateNote?.(note.id, note.content, tempTitle.trim())
    }
    setIsEditingTitle(false)
  }

  const handleTitleCancel = () => {
    setTempTitle('')
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      handleTitleCancel()
    }
  }
  const [showTagInput, setShowTagInput] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [fontSize, setFontSize] = useState('15px')
  const [fontFamily, setFontFamily] = useState('Inter')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // Basic, dependency-free HTML sanitizer to prevent XSS
  const sanitizeHtml = useCallback((html: string): string => {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, null)
      const dangerousTags = new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'])
      const dangerousAttrs = [/^on/i, /javascript:/i, /data:text\/html/i]
      let node = walker.currentNode as HTMLElement | null
      while (node) {
        const el = node as HTMLElement
        // Remove dangerous elements entirely
        if (dangerousTags.has(el.tagName.toLowerCase())) {
          const toRemove = el
          node = walker.nextNode() as HTMLElement | null
          toRemove.remove()
          continue
        }
        // Strip dangerous attributes
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name
          const value = attr.value
          if (dangerousAttrs.some((re) => re.test(name)) || dangerousAttrs.some((re) => re.test(value))) {
            el.removeAttribute(name)
            continue
          }
          if (name === 'src' || name === 'href') {
            const lowered = value.trim().toLowerCase()
            if (lowered.startsWith('javascript:') || lowered.startsWith('data:text/html')) {
              el.removeAttribute(name)
            }
          }
        }
        node = walker.nextNode() as HTMLElement | null
      }
      return doc.body.innerHTML
    } catch {
      return ''
    }
  }, [])

  // Load note content ONLY when switching to a different note
  const previousNoteId = useRef<string | null>(null)
  useEffect(() => {
    if (note) {
      const noteContent = note.content || ''
      const isNewNote = previousNoteId.current !== note.id
      console.log('DEBUG useEffect note switch:', {
        noteId: note.id,
        noteContent: noteContent.substring(0, 100) + '...',
        currentLocalContent: content.substring(0, 100) + '...',
        isEnhancing,
        isEditing,
        isNewNote
      })
      // Only load content when switching to a completely different note
      if (isNewNote) {
        setContent(noteContent)
        setIsEditing(false)
        previousNoteId.current = note.id
      }
    } else {
      setContent('')
      setIsEditing(false)
      previousNoteId.current = null
    }
  }, [note?.id, note?.content, isEnhancing, isEditing])

  // Avoid mutating the editor DOM outside of React while not editing.
  // Preview is rendered below via convertMarkdownToHTML, so no DOM writes here.

  // Auto-save functionality with debouncing
  useEffect(() => {
    if (note && !isSettingUpEdit.current && content && content !== note.content && isEditing && content.trim() !== '' && content !== '<p><br></p>') {
      const timeoutId = setTimeout(() => {
        onUpdateNote?.(note.id, content)
        setLastSaved(new Date())
      }, 2000) // Increased delay to reduce rapid saves

      return () => clearTimeout(timeoutId)
    }
  }, [content, note?.id, onUpdateNote, isEditing])

  // Function to convert markdown to HTML for WYSIWYG editing
  const convertMarkdownToHTML = (markdown: string): string => {
    return markdown
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2 text-gray-900 dark:text-white">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3 text-gray-900 dark:text-white">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">$1</h1>')
      // Highlights first so they survive list/formatting
      .replace(/==(.*?)==/g, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>')
      // Bullet points (* or - at start of line)
      .replace(/^\s*\* (.*$)/gm, '<li class="text-gray-900 dark:text-white">$1</li>')
      .replace(/^\s*- (.*$)/gm, '<li class="text-gray-900 dark:text-white">$1</li>')
      // Wrap each li in a ul (simple approach; consecutive lists will render fine visually)
      .replace(/(<li[^>]*>.*?<\/li>)/g, '<ul class="list-disc list-inside mb-3 space-y-1 text-gray-900 dark:text-white">$1<\/ul>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
      // Italics (avoid matching list markers by requiring non-space before *)
      .replace(/(^|\S)\*(.*?)\*/g, (_m, p1, p2) => `${p1}<em class="italic text-gray-900 dark:text-white">${p2}<\/em>`)
      // Paragraphs for remaining bare lines
      .replace(/^(?!<\/?(h1|h2|h3|ul|li|blockquote|pre|code|p)\b)(.+)$/gm, '<p class="mb-3 text-gray-900 dark:text-white">$2<\/p>')
      // Clean up empty paragraphs
      .replace(/<p class="mb-3 text-gray-900 dark:text-white"><\/p>/g, '')
  }

  // Do not mutate editor innerHTML on entering edit mode to keep typing smooth.

  // Function to convert HTML back to markdown
  const convertHTMLToMarkdown = (html: string): string => {
    return html
      // Headers
      .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1')
      .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1')
      .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1')
      // Bold
      .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
      // Italics
      .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
      // Highlights
      .replace(/<mark[^>]*>(.*?)<\/mark>/g, '==$1==')
      // List items
      .replace(/<li[^>]*>(.*?)<\/li>/g, '* $1')
      // Remove list wrappers
      .replace(/<\/?ul[^>]*>/g, '')
      // Paragraphs
      .replace(/<p[^>]*>(.*?)<\/p>/g, '$1')
      // Clean up extra whitespace
      .replace(/\n\s*\n/g, '\n\n')
      .trim()
  }

  const handleEditorClick = () => {
    if (!isEditing) {
      // Mark setup phase to avoid input/autosave race conditions
      isSettingUpEdit.current = true
      setIsEditing(true)
    }
  }

  // Synchronously prefill editor before paint to avoid empty flash
  useLayoutEffect(() => {
    if (isEditing && isSettingUpEdit.current && editorRef.current) {
      // Always prioritize local content state over note.content to preserve enhancements
      const currentContent = content || note?.content || ''
      console.log('DEBUG useLayoutEffect entering edit mode:', {
        isEditing,
        isSettingUpEdit: isSettingUpEdit.current,
        localContent: content.substring(0, 100) + '...',
        noteContent: note?.content?.substring(0, 100) + '...',
        currentContent: currentContent.substring(0, 100) + '...',
        noteId: note?.id
      })
      // For WYSIWYG editing, render enhanced content as HTML but make it editable
      editorRef.current.innerHTML = sanitizeHtml(convertMarkdownToHTML(currentContent))
      // place caret at end
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(editorRef.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
      // End setup phase
      isSettingUpEdit.current = false
    }
  }, [isEditing, content, note?.content])

  const handleEditorInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    if (!note) return
    // Skip input handling during the initial setup to avoid empty saves
    if (isSettingUpEdit.current) return

    try {
      const target = e.currentTarget
      if (target) {
        // Convert HTML back to markdown for storage while preserving WYSIWYG experience
        const htmlContent = target.innerHTML || ''
        const markdownContent = convertHTMLToMarkdown(htmlContent)

        // Only update if content actually changed and we're in editing mode
        if (markdownContent !== content && isEditing) {
          setContent(markdownContent)
        }
      }
    } catch (error) {
      console.error('Error in handleEditorInput:', error)
    }
  }, [content, note, isEditing])

  const handleEditorBlur = useCallback((e: React.FocusEvent) => {
    // Only save and exit editing if focus is leaving the editor entirely
    const relatedTarget = e.relatedTarget as HTMLElement
    
    // Check if focus is moving to toolbar buttons, dropdowns, or other editor controls
    const isToolbarElement = relatedTarget && (
      relatedTarget.closest('[role="toolbar"]') ||
      relatedTarget.closest('button') ||
      relatedTarget.closest('[data-toolbar]') ||
      relatedTarget.closest('.toolbar') ||
      relatedTarget.closest('[data-radix-popper-content-wrapper]') || // Radix dropdown content
      relatedTarget.closest('[data-radix-dropdown-menu-content]') ||
      relatedTarget.closest('[role="menu"]') ||
      relatedTarget.closest('[role="menuitem"]') ||
      relatedTarget.closest('.dropdown-menu') ||
      relatedTarget.hasAttribute('data-toolbar-button') ||
      relatedTarget.tagName === 'BUTTON'
    )
    
    // Also check if we're interacting with AI enhancement elements
    const isAIElement = relatedTarget && (
      relatedTarget.closest('[data-ai-enhancement]') ||
      relatedTarget.closest('.ai-enhancement-dropdown') ||
      relatedTarget.id?.includes('ai-') ||
      relatedTarget.className?.includes('ai-')
    )
    
    // Don't exit edit mode if clicking on toolbar, AI elements, or if no related target
    const shouldStayInEditMode = !relatedTarget || isToolbarElement || isAIElement ||
      editorRef.current?.contains(relatedTarget)
    
    if (!shouldStayInEditMode) {
      // Convert final HTML content to markdown before saving
      if (editorRef.current && note) {
        const htmlContent = editorRef.current.innerHTML || ''
        const markdownContent = convertHTMLToMarkdown(htmlContent)
        
        // Prevent accidental empty overwrite unless user truly cleared it
        if (markdownContent.trim() === '' && content.trim() !== '') {
          // Restore previous content and skip saving empty
          editorRef.current.innerHTML = sanitizeHtml(convertMarkdownToHTML(content))
        } else if (markdownContent !== content) {
          setContent(markdownContent)
          onUpdateNote?.(note.id, markdownContent)
        }
      }
      setTimeout(() => setIsEditing(false), 150) // Increased delay to prevent premature exit
    }
  }, [content, note, onUpdateNote])

  const handleEditorPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()

    try {
      // Try to get HTML content first, then fall back to plain text
      const htmlPaste = e.clipboardData.getData('text/html')
      const plainPaste = e.clipboardData.getData('text/plain')

      const selection = window.getSelection()

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()

        if (htmlPaste) {
          // For HTML content, sanitize before insert
          const safe = sanitizeHtml(htmlPaste)
          document.execCommand('insertHTML', false, safe)
        } else if (plainPaste) {
          // For plain text, check if it contains emojis and convert them to Apple emojis
          const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu

          if (emojiRegex.test(plainPaste)) {
            // Convert emojis to Apple emoji images
            const convertedContent = plainPaste.replace(emojiRegex, (emoji) => {
              return getAppleEmojiHTML(emoji)
            })
            document.execCommand('insertHTML', false, sanitizeHtml(convertedContent))
          } else {
            // Regular text, insert as text node
            const textNode = document.createTextNode(plainPaste)
            range.insertNode(textNode)
            range.setStartAfter(textNode)
            range.collapse(true)

            selection.removeAllRanges()
            selection.addRange(range)
          }
        }

        // Update content with delay - convert HTML to markdown for storage
        setTimeout(() => {
          if (editorRef.current) {
            const htmlContent = editorRef.current.innerHTML
            const markdownContent = convertHTMLToMarkdown(htmlContent)
            setContent(markdownContent)
            setIsEditing(true)
          }
        }, 0)
      }
    } catch (error) {
      console.error('Error handling paste:', error)
      // Fallback to default paste behavior
      try {
        document.execCommand('paste')
        setTimeout(() => {
          if (editorRef.current) {
            const htmlContent = editorRef.current.innerHTML
            const markdownContent = convertHTMLToMarkdown(htmlContent)
            setContent(markdownContent)
            setIsEditing(true)
          }
        }, 0)
      } catch (fallbackError) {
        console.error('Fallback paste also failed:', fallbackError)
      }
    }
  }

  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    // Handle @ key for image mentions
    if (e.key === '@' && !showImagePicker) {
      e.preventDefault()
      // Get cursor position for picker placement
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setImagePickerPosition({
          top: rect.bottom + window.scrollY + 5,
          left: rect.left + window.scrollX
        })
        setMentionStartPos(range.startOffset)
        setShowImagePicker(true)
        setImageSearchQuery('')
      }
      return
    }

    // Handle escape to close image picker
    if (e.key === 'Escape' && showImagePicker) {
      setShowImagePicker(false)
      setImageSearchQuery('')
      setMentionStartPos(null)
      return
    }

    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          formatText('bold')
          break
        case 'i':
          e.preventDefault()
          formatText('italic')
          break
        case 'u':
          e.preventDefault()
          formatText('underline')
          break
        case 'z':
          e.preventDefault()
          if (e.shiftKey) {
            formatText('redo')
          } else {
            formatText('undo')
          }
          break
      }
    }
  }

  const formatText = useCallback((command: string, value?: string) => {
    if (!editorRef.current || !note) return

    try {
      // Ensure editor is focused and in editing mode
      if (!isEditing) {
        setIsEditing(true)
        // Wait for editor to be ready
        setTimeout(() => formatText(command, value), 50)
        return
      }

      editorRef.current.focus()

      // Save current selection
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      // Execute the command
      document.execCommand(command, false, value)

      // Get the updated content and convert back to markdown for storage
      setTimeout(() => {
        if (editorRef.current) {
          const htmlContent = editorRef.current.innerHTML
          const markdownContent = convertHTMLToMarkdown(htmlContent)
          setContent(markdownContent)
          setIsEditing(true)
        }
      }, 10)

    } catch (error) {
      console.error(`Error executing command ${command}:`, error)
    }
  }, [note, isEditing, convertHTMLToMarkdown])

  const handleImageSelect = useCallback((image: MediaItem) => {
    if (!editorRef.current || !note) return

    try {
      editorRef.current.focus()
      
      // Create a draggable image mention chip
      const mentionChip = document.createElement('span')
      mentionChip.className = 'image-mention inline-flex items-center gap-1 mx-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-sm border border-blue-200 dark:border-blue-700/50 cursor-grab hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors'
      mentionChip.style.display = 'inline'
      mentionChip.style.verticalAlign = 'baseline'
      mentionChip.setAttribute('contenteditable', 'false')
      mentionChip.setAttribute('draggable', 'true')
      mentionChip.setAttribute('data-image-id', image.id)
      mentionChip.setAttribute('data-image-name', image.name)
      mentionChip.setAttribute('data-image-url', image.url)
      mentionChip.setAttribute('title', `Drag to move or click to view: ${image.name}`)
      
      // Create drag handle
      const dragHandle = document.createElement('span')
      dragHandle.innerHTML = '⋮⋮'
      dragHandle.className = 'text-xs opacity-50 cursor-grab'
      dragHandle.style.fontSize = '10px'
      
      // Create icon
      const icon = document.createElement('span')
      icon.innerHTML = '🖼️'
      icon.className = 'text-xs'
      
      // Create text
      const text = document.createElement('span')
      text.textContent = image.name.length > 20 ? image.name.substring(0, 20) + '...' : image.name
      text.className = 'font-medium'
      
      mentionChip.appendChild(dragHandle)
      mentionChip.appendChild(icon)
      mentionChip.appendChild(text)
      
      // Add drag and drop functionality
      let isDragging = false
      let dragStartTime = 0
      
      mentionChip.addEventListener('dragstart', (e) => {
        isDragging = true
        dragStartTime = Date.now()
        mentionChip.style.opacity = '0.5'
        mentionChip.style.cursor = 'grabbing'
        e.dataTransfer?.setData('text/html', mentionChip.outerHTML)
        e.dataTransfer!.effectAllowed = 'move'
      })
      
      mentionChip.addEventListener('dragend', (e) => {
        mentionChip.style.opacity = '1'
        mentionChip.style.cursor = 'grab'
        setTimeout(() => { isDragging = false }, 100)
      })
      
      // Add click handler for preview (only if not dragging)
      mentionChip.addEventListener('click', (e) => {
        // Prevent click if we just finished dragging
        if (isDragging || (Date.now() - dragStartTime) < 200) {
          return
        }
        
        e.preventDefault()
        // Create a simple preview modal
        const modal = document.createElement('div')
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50'
        modal.onclick = () => modal.remove()
        
        const img = document.createElement('img')
        img.src = image.url
        img.className = 'max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl'
        img.onclick = (e) => e.stopPropagation()
        
        modal.appendChild(img)
        document.body.appendChild(modal)
      })
      
      // Insert at current cursor position without forcing position
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        
        // Simply insert the mention chip at cursor position
        range.insertNode(mentionChip)
        
        // Move cursor to after the mention chip
        range.setStartAfter(mentionChip)
        range.setEndAfter(mentionChip)
        
        // Clear selection and set new range
        selection.removeAllRanges()
        selection.addRange(range)
      }
      
      // Update content
      setTimeout(() => {
        if (editorRef.current) {
          const newContent = sanitizeHtml(editorRef.current.innerHTML)
          setContent(newContent)
          setIsEditing(true)
        }
      }, 10)
    } catch (error) {
      console.error('Error inserting image:', error)
    }
    
    // Close picker
    setShowImagePicker(false)
    setImageSearchQuery('')
    setMentionStartPos(null)
  }, [note, sanitizeHtml])

  // Helper function to convert emoji to Apple emoji image HTML
  const getAppleEmojiHTML = useCallback((emoji: string) => {
    // Handle compound emojis (with variation selectors) properly
    const getEmojiCodepoints = (emoji: string): string[] => {
      const codepoints = []
      for (let i = 0; i < emoji.length; ) {
        const codepoint = emoji.codePointAt(i)
        if (codepoint) {
          // Skip variation selectors (U+FE0F) for image URLs
          if (codepoint !== 0xFE0F) {
            codepoints.push(codepoint.toString(16).toLowerCase())
          }
          i += codepoint > 0xFFFF ? 2 : 1
        } else {
          i++
        }
      }
      return codepoints
    }

    const codepoints = getEmojiCodepoints(emoji)
    if (codepoints.length === 0) return emoji // fallback

    const primaryCodepoint = codepoints[0].padStart(4, '0')
    // No inline event handlers; safe src only
    return `<img src="https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64/${primaryCodepoint}.png" alt="${emoji}" class="inline-block w-5 h-5 align-text-bottom" style="display: inline-block; width: 20px; height: 20px; vertical-align: text-bottom; margin: 0 1px;" />`
  }, [])

  const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'

  const insertContent = useCallback((content: string) => {
    if (!editorRef.current || !note) {
      if (isDev) console.debug('insertContent: missing editor or note', { editor: !!editorRef.current, note: !!note })
      return
    }

    if (isDev) console.debug('insertContent called with:', content)

    try {
      // Ensure editor is focused and in editing mode
      editorRef.current.focus()
      setIsEditing(true)

      // Check if content is a single emoji
      const isEmoji = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/u.test(content.trim())

      if (isEmoji && content.length <= 2) {
        // For emojis, insert as Apple emoji image
        const emojiHTML = getAppleEmojiHTML(content)
        document.execCommand('insertHTML', false, sanitizeHtml(emojiHTML))
      } else {
        // For other content, use insertHTML
        document.execCommand('insertHTML', false, sanitizeHtml(content))
      }

      // Force content update
      setTimeout(() => {
        if (editorRef.current) {
          const htmlContent = editorRef.current.innerHTML
          const markdownContent = convertHTMLToMarkdown(htmlContent)
          if (isDev) console.debug('Content after insert:', markdownContent)
          setContent(markdownContent)
        }
      }, 0)

    } catch (error) {
      if (isDev) console.error('Error inserting content:', error)

      // Ultimate fallback: directly modify innerHTML
      try {
        if (editorRef.current) {
          const selection = window.getSelection()

          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)

            // Check if it's an emoji and create appropriate content
            const isEmoji = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/u.test(content.trim())

            if (isEmoji && content.length <= 2) {
              // Insert as Apple emoji image
              const emojiHTML = getAppleEmojiHTML(content)
              const tempDiv = document.createElement('div')
              tempDiv.innerHTML = sanitizeHtml(emojiHTML)
              const emojiElement = tempDiv.firstChild

              if (emojiElement) {
                range.insertNode(emojiElement)
                range.setStartAfter(emojiElement)
                range.collapse(true)
                selection.removeAllRanges()
                selection.addRange(range)
              }
            } else {
              // Insert as text or HTML
              const tempDiv = document.createElement('div')
              tempDiv.innerHTML = sanitizeHtml(content)
              
              while (tempDiv.firstChild) {
                range.insertNode(tempDiv.firstChild)
              }
            }

            // Update content
            setTimeout(() => {
              if (editorRef.current) {
                const htmlContent = editorRef.current.innerHTML
                const markdownContent = convertHTMLToMarkdown(htmlContent)
                setContent(markdownContent)
              }
            }, 0)
          }
        }
      } catch (fallbackError) {
        if (isDev) console.error('Fallback insert also failed:', fallbackError)
      }
    }
  }, [note, sanitizeHtml, getAppleEmojiHTML, convertHTMLToMarkdown, isDev])

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.style.display = 'none'

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string
          const imageHtml = `<p>&nbsp;</p><p>&nbsp;</p><div style="margin:16px 0;"><img src="${imageUrl}" style="width:500px;max-width:none;height:auto;border-radius:8px;display:block;" alt="Uploaded image" /></div><p>&nbsp;</p><p>&nbsp;</p>`

          // Use the safer insertContent method
          insertContent(imageHtml)
        }
        reader.readAsDataURL(file)
      } else {
        if (isDev) console.debug('Please select an image file under 5MB')
      }
    }

    document.body.appendChild(input)
    input.click()
    document.body.removeChild(input)
  }, [insertContent, isDev])

  const handleImagePickerClose = useCallback(() => {
    setShowImagePicker(false)
    setImageSearchQuery('')
    setMentionStartPos(null)
    if (editorRef.current) {
      editorRef.current.focus()
    }
  }, [])

  const setHighlight = useCallback((color: string) => {
    if (!editorRef.current || !note) return

    try {
      // Ensure editor is in edit mode and focused
      if (!isEditing) {
        setIsEditing(true)
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.focus()
            document.execCommand('hiliteColor', false, color)
            
            setTimeout(() => {
              if (editorRef.current) {
                const htmlContent = editorRef.current.innerHTML
                const markdownContent = convertHTMLToMarkdown(htmlContent)
                setContent(markdownContent)
              }
            }, 10)
          }
        }, 10)
      } else {
        editorRef.current.focus()
        document.execCommand('hiliteColor', false, color)
        
        setTimeout(() => {
          if (editorRef.current) {
            const htmlContent = editorRef.current.innerHTML
            const markdownContent = convertHTMLToMarkdown(htmlContent)
            setContent(markdownContent)
          }
        }, 10)
      }
    } catch (error) {
      console.error('Error setting highlight:', error)
    }
  }, [note, isEditing, convertHTMLToMarkdown])

  const toggleQuote = useCallback(() => {
    if (!editorRef.current || !note) return

    try {
      editorRef.current.focus()
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)
      const container = range.commonAncestorContainer
      
      // Find if we're inside a blockquote
      let blockquote = container.nodeType === Node.ELEMENT_NODE ? 
        container as Element : container.parentElement
      
      while (blockquote && blockquote !== editorRef.current) {
        if (blockquote.tagName === 'BLOCKQUOTE') break
        blockquote = blockquote.parentElement
      }

      if (blockquote && blockquote.tagName === 'BLOCKQUOTE') {
        // Remove blockquote - replace with paragraph
        document.execCommand('formatBlock', false, 'p')
      } else {
        // Add blockquote
        document.execCommand('formatBlock', false, 'blockquote')
      }

      setTimeout(() => {
        if (editorRef.current) {
          const htmlContent = editorRef.current.innerHTML
          const markdownContent = convertHTMLToMarkdown(htmlContent)
          setContent(markdownContent)
          setIsEditing(true)
        }
      }, 10)
    } catch (error) {
      console.error('Error toggling quote:', error)
    }
  }, [note, convertHTMLToMarkdown])

  const insertRandomEmoji = useCallback(() => {
    const emojis = ['😀', '😂', '😍', '🤔', '👍', '❤️', '🎉', '🔥', '💡', '✅', '❌', '⭐', '📝', '💼', '🚀']
    const emoji = emojis[Math.floor(Math.random() * emojis.length)]
    insertContent(emoji)
  }, [insertContent])

  const handleLinkInsert = useCallback(() => {
    if (!editorRef.current || !note) return

    // Ensure editor is in edit mode
    if (!isEditing) {
      setIsEditing(true)
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus()
          const url = prompt('Enter URL:')
          if (url && url.trim()) {
            const u = url.trim()
            const lower = u.toLowerCase()
            if (lower.startsWith('http://') || lower.startsWith('https://')) {
              const selection = window.getSelection()
              const selectedText = selection?.toString() || u
              const linkHtml = `<a href="${u}" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;" target="_blank">${selectedText}</a>`
              insertContent(linkHtml)
            }
          }
        }
      }, 10)
    } else {
      const url = prompt('Enter URL:')
      if (url && url.trim()) {
        const u = url.trim()
        const lower = u.toLowerCase()
        if (lower.startsWith('http://') || lower.startsWith('https://')) {
          const selection = window.getSelection()
          const selectedText = selection?.toString() || u
          const linkHtml = `<a href="${u}" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;" target="_blank">${selectedText}</a>`
          insertContent(linkHtml)
        }
      }
    }
  }, [insertContent, note, isEditing])

  if (!note) {
    return (
      <div className="flex-1 bg-white dark:bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a note to start editing</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="flex-1 min-h-0 min-w-0 bg-white dark:bg-[#0f0f0f] flex flex-col">
      {/* Trading Journal Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#0f0f0f]">
        {/* Top Header with Date and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4 relative">
            {isEditingTitle ? (
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="text-xl font-semibold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-0 p-0 min-w-0 flex-1"
                autoFocus
              />
            ) : (
              <div className="relative">
                <h1 
                  className={cn(
                    "text-xl font-semibold text-gray-900 dark:text-white cursor-pointer px-2 py-1 rounded transition-colors flex items-center space-x-2",
                    useDatePicker 
                      ? "hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  onClick={handleTitleEdit}
                  title={useDatePicker ? "Click to select date" : "Click to edit title"}
                >
                  <span>{note.title}</span>
                </h1>
                
                {/* Date Picker Dropdown - positioned as overlay */}
                {showDatePicker && useDatePicker && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDatePicker(false)}
                    />
                    
                    {/* Date Picker */}
                    <div className="absolute top-full left-0 mt-2 z-20 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#404040] rounded-lg shadow-xl p-4 min-w-[320px] animate-in fade-in-0 zoom-in-95 duration-200">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Select Date</h3>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigateMonth('prev')}
                              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                            >
                              <ChevronDown className="h-4 w-4 rotate-90" />
                            </Button>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
                              {getMonthYearDisplay()}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigateMonth('next')}
                              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                            >
                              <ChevronDown className="h-4 w-4 -rotate-90" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {/* Calendar Headers */}
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
                              {day}
                            </div>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1">
                          {/* Calendar Days */}
                          {generateCalendarDays().map((day, index) => {
                            const isToday = day.fullDate.toDateString() === new Date().toDateString()
                            const isCurrentMonth = day.isCurrentMonth
                            
                            return (
                              <button
                                key={index}
                                onClick={() => handleDateSelect(day.fullDate)}
                                className={cn(
                                  "h-8 w-8 rounded-md text-sm transition-all duration-150 hover:scale-110",
                                  isCurrentMonth 
                                    ? "text-gray-900 dark:text-white hover:bg-blue-100 dark:hover:bg-blue-900" 
                                    : "text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700",
                                  isToday && "bg-blue-500 text-white hover:bg-blue-600 shadow-md"
                                )}
                              >
                                {day.date}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-600">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDateSelect(new Date())}
                          className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          Today
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDatePicker(false)}
                          className="text-gray-600 dark:text-gray-400"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Range Picker - using Radix UI component */}
                {showRangePicker && useRangePicker && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setShowRangePicker(false)}
                    />
                    {/* Range Picker Container */}
                    <div className="absolute top-full left-0 mt-2 z-20">
                      <DateRangePicker
                        value={dateRange}
                        onValueChange={handleRangeChange}
                        placeholder="Select date range"
                        className="w-auto"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Tags in header - display existing tags */}
            {note && note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 max-w-md">
                {note.tags.map((tag, index) => {
                  // Define color palette with sync button styling structure
                  const tagColors = [
                    { bg: '#FB3748', hover: '#e12d3f' }, // Red
                    { bg: '#1FC16B', hover: '#1ba85c' }, // Green
                    { bg: '#F6B51E', hover: '#e0a31b' }, // Orange/Yellow
                    { bg: '#7D52F4', hover: '#6b45e0' }, // Purple
                    { bg: '#FB4BA3', hover: '#e73d92' }, // Pink
                    { bg: '#3559E9', hover: '#2947d1' }  // Original blue
                  ]
                  
                  // Calculate color index based on tag content for consistency
                  const colorIndex = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % tagColors.length
                  const selectedColor = tagColors[colorIndex]
                  
                  return (
                    <span
                      key={index}
                      className="relative inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-white border-none shadow-sm overflow-hidden group transition-colors before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none"
                      style={{
                        backgroundColor: selectedColor.bg,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = selectedColor.hover
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = selectedColor.bg
                      }}
                    >
                      <span className="relative z-10">{tag}</span>
                      <button
                        onClick={() => {
                          if (note) {
                            const updatedTags = note.tags.filter((_, i) => i !== index)
                            onUpdateNote?.(note.id, note.content, note.title, note.color, updatedTags)
                            console.log('Removing tag:', tag, 'from note:', note.id)
                          }
                        }}
                        className="ml-1 w-3 h-3 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100 relative z-10"
                        title="Remove tag"
                      >
                        <span className="text-xs leading-none text-white">×</span>
                      </button>
                    </span>
                  )
                })}
              </div>
            )}

            {/* Add tag button */}
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => setShowTagInput(!showTagInput)}
              className="text-gray-600 dark:text-[#CCCCCC] hover:text-gray-800 dark:hover:text-white px-2 py-1 h-7 text-xs border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-md"
              disabled={!note}
            >
              <Hash className="w-3 h-3 mr-1" />
              Tag
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <FancyButton.Root variant="basic" size="xsmall" className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </FancyButton.Root>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#404040] shadow-lg rounded-lg p-1">
                {templates && templates.length > 0 && (
                  <DropdownMenuItem onClick={() => setShowTemplatePicker(true)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Create from template
                  </DropdownMenuItem>
                )}
                {note?.sharing?.isShared ? (
                  <DropdownMenuItem
                    onClick={() => {
                      if (note && onUpdateNote) {
                        onUpdateNote(note.id, content, undefined, undefined, undefined, {
                          isShared: false,
                          shareToken: undefined,
                          isAnonymous: false,
                          sharedAt: undefined
                        })
                      }
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Stop Sharing
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      if (note) {
                        // Ensure latest edits are persisted
                        onUpdateNote?.(note.id, content)
                        setIsAnonymousShare(false)
                        setShowShareModal(true)
                      }
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#2a2a2a]" />
                <DropdownMenuItem
                  onClick={() => {
                    if (note) {
                      const printWindow = window.open('', '_blank')
                      printWindow?.document.write(`
                        <html>
                          <head><title>${note.title}</title></head>
                          <body>
                            <h1>${note.title}</h1>
                            <p>Created: ${new Date(note.createdAt).toLocaleString()}</p>
                            <hr/>
                            <div>${content}</div>
                          </body>
                        </html>
                      `)
                      printWindow?.document.close()
                      printWindow?.print()
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (note) {
                      const lexicalData = JSON.stringify({
                        id: note.id,
                        title: note.title,
                        content: content,
                        createdAt: note.createdAt,
                        updatedAt: note.updatedAt,
                        folder: note.folder,
                        tags: note.tags
                      }, null, 2)

                      const blob = new Blob([lexicalData], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${note.title}.json`
                      a.click()
                      URL.revokeObjectURL(url)
                    }
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export as Lexical
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#2a2a2a]" />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    if (note) {
                      onDeleteNote?.(note.id, note.title)
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Note
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats rendering moved to collapsible under Net P&L */}

        {/* Tag input field - positioned below header when active */}
        {showTagInput && (
          <div className="px-6 pb-3">
            <input
              type="text"
              placeholder="Enter tag name..."
              className="px-3 py-1 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 max-w-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const tagName = e.currentTarget.value.trim()
                  if (tagName && note) {
                    const currentTags = note.tags || []
                    if (!currentTags.includes(tagName)) {
                      const updatedTags = [...currentTags, tagName]
                      onUpdateNote?.(note.id, note.content, note.title, note.color, updatedTags)
                      console.log('Adding tag:', tagName, 'to note:', note.id)
                    }
                    e.currentTarget.value = ''
                    setShowTagInput(false)
                  }
                } else if (e.key === 'Escape') {
                  setShowTagInput(false)
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowTagInput(false), 150)
              }}
            />
          </div>
        )}



        {/* Meta and optional Net P&L */}
        {note && (
          <div className="mb-4">
            {!hideNetPnl && (
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                <button
                  type="button"
                  onClick={() => setStatsOpen((v) => !v)}
                  className="inline-flex items-center gap-2 group cursor-pointer select-none"
                  aria-expanded={statsOpen}
                  title={statsOpen ? 'Hide stats' : 'Show stats'}
                >
                  <span>Net P&L</span>
                  {typeof netPnlValue === 'number' ? (
                    <span className={(netPnlIsProfit ?? netPnlValue >= 0) ? 'text-[#10B981]' : 'text-red-600 dark:text-red-400'}>
                      {netPnlValue >= 0 ? '+' : ''}${Math.abs(netPnlValue).toLocaleString('en-US')}
                    </span>
                  ) : (note as any)?.tradingData ? (
                    <span className={(note as any)?.tradingData.isProfit ? 'text-[#10B981]' : 'text-red-600 dark:text-red-400'}>
                      {(note as any)?.tradingData.netPnl >= 0 ? '+' : ''}${(note as any)?.tradingData.netPnl}
                    </span>
                  ) : null}
                  <svg
                    className={`w-4 h-4 transition-transform ${statsOpen ? 'rotate-180' : 'rotate-0'} text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200`}
                    viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
              </h2>
            )}
            <div className="text-sm text-gray-500 dark:text-[#888888] space-x-4">
              <span>Created: {formatDate(note.createdAt)}</span>
              <span>Last updated: {formatDate(note.updatedAt)}</span>
            </div>
          </div>
        )}

        {/* Collapsible Stats + Table (headerStats) */}
        {headerStats && statsOpen && (
          <div className="mb-4">
            {headerStats}
          </div>
        )}

        {/* Stats toggle removed for strategy notebook usage */}

        {/* Trading Statistics removed */}
        {false && (
          <div className="mb-4 p-4">
          <div className="flex items-start space-x-8">
            {/* Chart Section */}
            <div className="flex-shrink-0 w-64">
              {/* P&L Chart with Dashboard Styling */}
              <div className="h-40 bg-white dark:bg-[#0f0f0f] rounded-lg overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={(note as any)?.tradingData ? (note as any).tradingData.chartData : [
                      { time: '9:30', value: 0 },
                      { time: '10:00', value: -50 },
                      { time: '10:30', value: -120 },
                      { time: '11:00', value: -180 },
                      { time: '11:30', value: -250 },
                      { time: '12:00', value: -320 },
                      { time: '12:30', value: -380 },
                      { time: '13:00', value: -420 },
                      { time: '13:30', value: -480 },
                      { time: '14:00', value: -520 },
                      { time: '14:30', value: -580 },
                      { time: '15:00', value: -620 },
                      { time: '15:30', value: -650 },
                      { time: '16:00', value: -680 }
                    ]}
                    margin={{ top: 5, right: 15, left: 0, bottom: 25 }}
                  >
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06d6a0" stopOpacity={0.6}/>
                        <stop offset="100%" stopColor="#06d6a0" stopOpacity={0.15}/>
                      </linearGradient>
                      <linearGradient id="negativeAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF4757" stopOpacity={0.15}/>
                        <stop offset="100%" stopColor="#FF4757" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="time" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      height={25}
                      tickMargin={5}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      tickFormatter={(value) => {
                        if (value === 0) return '$0';
                        return `$${(value/100).toFixed(0)}`;
                      }}
                      domain={[
                        (dataMin) => Math.floor(Math.min(0, dataMin) * 1.1),
                        (dataMax) => Math.ceil(Math.max(0, dataMax) * 1.2)
                      ]}
                      padding={{ top: 5, bottom: 5 }}
                      width={40}
                    />
                    <ReferenceLine y={0} stroke="#d1d5db" strokeDasharray="4 4" strokeWidth={1} />
                    
                    {/* Green area for positive parts */}
                    <Area
                      type="monotone"
                      dataKey={(data) => data.value >= 0 ? data.value : 0}
                      stroke="none"
                      fill="url(#areaGradient)"
                      fillOpacity={0.7}
                      isAnimationActive={false}
                      baseValue={0}
                      activeDot={false}
                      connectNulls={true}
                    />
                    
                    {/* Red area for negative parts */}
                    <Area
                      type="monotone"
                      dataKey={(data) => data.value < 0 ? data.value : 0}
                      stroke="none"
                      fill="url(#negativeAreaGradient)"
                      fillOpacity={0.7}
                      isAnimationActive={false}
                      baseValue={0}
                      activeDot={false}
                      connectNulls={true}
                    />
                    
                    {/* Main stroke line */}
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#335CFF"
                      strokeWidth={2}
                      fill="transparent"
                      isAnimationActive={false}
                      dot={false}
                      connectNulls={true}
                      activeDot={{
                        r: 4,
                        fill: "#335CFF",
                        stroke: "#fff",
                        strokeWidth: 2
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-4 gap-x-8 gap-y-4">
                {/* First Row */}
                <div className="text-left">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Trades</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(note as any)?.tradingData ? (note as any).tradingData.stats.totalTrades : 40}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Winners</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(note as any)?.tradingData ? (note as any).tradingData.stats.winners : 15}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gross P&L</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${(note as any)?.tradingData ? (note as any).tradingData.stats.grossPnl : 101.97}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Commissions</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${(note as any)?.tradingData ? (note as any).tradingData.stats.commissions : 552.94}
                  </div>
                </div>

                {/* Second Row */}
                <div className="text-left">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Winrate</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(note as any)?.tradingData ? (note as any).tradingData.stats.winrate : '37.50%'}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Losers</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(note as any)?.tradingData ? (note as any).tradingData.stats.losers : 25}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Volume</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(note as any)?.tradingData ? (note as any).tradingData.stats.volume : 5747}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Profit Factor</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(note as any)?.tradingData ? (note as any).tradingData.stats.profitFactor : 0.89}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

      </div>

      {/* Toolbar */}
      <div className="px-6 py-2 border-b border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#0f0f0f]" data-toolbar="true">
        <div className="flex items-center space-x-4" data-toolbar="true">
          {/* Simple Undo/Redo */}
          <FancyButton.Root
            variant="basic"
            size="xsmall"
            className="h-8 w-8 p-0"
            onClick={() => formatText('undo')}
            title="Undo"
            disabled={!note}
            data-toolbar-button="true"
          >
            <Undo className="w-4 h-4" />
          </FancyButton.Root>
          <FancyButton.Root
            variant="basic"
            size="xsmall"
            className="h-8 w-8 p-0"
            onClick={() => formatText('redo')}
            title="Redo"
            disabled={!note}
            data-toolbar-button="true"
          >
            <Redo className="w-4 h-4" />
          </FancyButton.Root>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#404040] mx-2" />

          {/* Font Family Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <FancyButton.Root
                variant="basic"
                size="xsmall"
                className="h-8 px-3 text-sm min-w-[100px] justify-between"
                disabled={!note}
                data-toolbar-button="true"
              >
                {fontFamily}
                <ChevronDown className="w-3 h-3 ml-1" />
              </FancyButton.Root>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[140px] bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#404040] shadow-lg rounded-lg p-1">
              {[
                'Inter',
                'SF Pro',
                'Arial',
                'Times New Roman',
                'Helvetica',
                'Georgia',
                'Verdana',
                'Courier New'
              ].map((font) => (
                <DropdownMenuItem
                  key={font}
                  onClick={() => {
                    setFontFamily(font)
                    if (editorRef.current) {
                      // Map font names to their CSS font-family values
                      const fontFamilyMap: { [key: string]: string } = {
                        'Inter': 'Inter, sans-serif',
                        'SF Pro': '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        'Arial': 'Arial, sans-serif',
                        'Times New Roman': '"Times New Roman", Times, serif',
                        'Helvetica': 'Helvetica, Arial, sans-serif',
                        'Georgia': 'Georgia, serif',
                        'Verdana': 'Verdana, Geneva, sans-serif',
                        'Courier New': '"Courier New", Courier, monospace'
                      }

                      // Ensure editor is in edit mode
                      if (!isEditing) {
                        setIsEditing(true)
                        setTimeout(() => {
                          if (editorRef.current) {
                            editorRef.current.focus()
                            document.execCommand('fontName', false, fontFamilyMap[font] || font)
                            
                            setTimeout(() => {
                              if (editorRef.current) {
                                const htmlContent = editorRef.current.innerHTML
                                const markdownContent = convertHTMLToMarkdown(htmlContent)
                                setContent(markdownContent)
                              }
                            }, 10)
                          }
                        }, 10)
                      } else {
                        editorRef.current.focus()
                        document.execCommand('fontName', false, fontFamilyMap[font] || font)
                        
                        setTimeout(() => {
                          if (editorRef.current) {
                            const htmlContent = editorRef.current.innerHTML
                            const markdownContent = convertHTMLToMarkdown(htmlContent)
                            setContent(markdownContent)
                          }
                        }, 10)
                      }
                    }
                  }}
                  className={fontFamily === font ? "bg-blue-50 dark:bg-blue-900/50 dark:text-white" : "dark:text-white"}
                >
                  <span style={{
                    fontFamily: font === 'Inter' ? 'Inter, sans-serif' :
                      font === 'SF Pro' ? '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' :
                        font
                  }}>
                    {font}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Font Size Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <FancyButton.Root
                variant="basic"
                size="xsmall"
                className="h-8 px-3 text-sm min-w-[70px] justify-between"
                disabled={!note}
                data-toolbar-button="true"
              >
                {fontSize}
                <ChevronDown className="w-3 h-3 ml-1" />
              </FancyButton.Root>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[80px] bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#404040] shadow-lg rounded-lg p-1">
              {['10px', '12px', '14px', '15px', '16px', '18px', '20px', '24px', '28px', '32px'].map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => {
                    setFontSize(size)
                    if (editorRef.current) {
                      // Ensure editor is in edit mode
                      if (!isEditing) {
                        setIsEditing(true)
                        setTimeout(() => {
                          if (editorRef.current) {
                            editorRef.current.focus()
                            document.execCommand('fontSize', false, '7') // Use a large size then override with CSS
                            
                            // Apply the specific size via CSS
                            const selection = window.getSelection()
                            if (selection && selection.rangeCount > 0) {
                              const range = selection.getRangeAt(0)
                              const selectedContent = range.extractContents()
                              const span = document.createElement('span')
                              span.style.fontSize = size
                              span.appendChild(selectedContent)
                              range.insertNode(span)
                            }
                            
                            setTimeout(() => {
                              if (editorRef.current) {
                                const htmlContent = editorRef.current.innerHTML
                                const markdownContent = convertHTMLToMarkdown(htmlContent)
                                setContent(markdownContent)
                              }
                            }, 10)
                          }
                        }, 10)
                      } else {
                        editorRef.current.focus()
                        
                        // Apply font size to selected text
                        const selection = window.getSelection()
                        if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
                          const range = selection.getRangeAt(0)
                          const selectedContent = range.extractContents()
                          const span = document.createElement('span')
                          span.style.fontSize = size
                          span.appendChild(selectedContent)
                          range.insertNode(span)
                          
                          setTimeout(() => {
                            if (editorRef.current) {
                              const htmlContent = editorRef.current.innerHTML
                              const markdownContent = convertHTMLToMarkdown(htmlContent)
                              setContent(markdownContent)
                            }
                          }, 10)
                        }
                      }
                    }
                  }}
                  className={`rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#1a1a1a] ${fontSize === size ? "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}
                >
                  {size}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#404040] mx-2" />

          {/* Text Formatting */}
          <FancyButton.Root
            variant="basic"
            size="xsmall"
            className="h-8 w-8 p-0"
            onClick={() => formatText('bold')}
            title="Bold"
            disabled={!note}
            data-toolbar-button="true"
          >
            <Bold className="w-4 h-4" />
          </FancyButton.Root>
          <FancyButton.Root
            variant="basic"
            size="xsmall"
            className="h-8 w-8 p-0"
            onClick={() => formatText('italic')}
            title="Italic"
            disabled={!note}
            data-toolbar-button="true"
          >
            <Italic className="w-4 h-4" />
          </FancyButton.Root>
          <FancyButton.Root
            variant="basic"
            size="xsmall"
            className="h-8 w-8 p-0"
            onClick={() => formatText('underline')}
            title="Underline"
            disabled={!note}
            data-toolbar-button="true"
          >
            <Underline className="w-4 h-4" />
          </FancyButton.Root>

          {/* Text color */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <FancyButton.Root
                variant="basic"
                size="xsmall"
                className="h-8 w-8 p-0"
                title="Text Color"
                disabled={!note}
                data-toolbar-button="true"
              >
                <Type className="w-4 h-4" />
              </FancyButton.Root>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-3 grid grid-cols-4 gap-2 w-40 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#404040] shadow-lg rounded-lg">
              {['#335CFF','#FB3748','#F6B51E','#7D52F4','#47C2FF','#FB4BA3','#22D3BB'].map(c => (
                <button key={c} className="h-6 w-6 rounded-sm border border-gray-200 dark:border-[#2a2a2a]" style={{ backgroundColor: c }} onClick={() => formatText('foreColor', c)} data-toolbar-button="true" />
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Highlight color */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <FancyButton.Root
                variant="basic"
                size="xsmall"
                className="h-8 w-8 p-0"
                title="Highlight Text"
                disabled={!note}
                data-toolbar-button="true"
              >
                <Palette className="w-4 h-4" />
              </FancyButton.Root>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-3 grid grid-cols-4 gap-2 w-40 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#404040] shadow-lg rounded-lg">
              {['#335CFF','#FB3748','#F6B51E','#7D52F4','#47C2FF','#FB4BA3','#22D3BB'].map(c => (
                <button key={c} className="h-6 w-6 rounded-sm border border-gray-200 dark:border-[#2a2a2a]" style={{ backgroundColor: c }} onClick={() => setHighlight(c)} data-toolbar-button="true" />
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#404040] mx-2" />

          {/* Links */}
          <FancyButton.Root
            variant="basic"
            size="xsmall"
            className="h-8 w-8 p-0"
            onClick={handleLinkInsert}
            title="Insert Link"
            disabled={!note}
            data-toolbar-button="true"
          >
            <Link className="w-4 h-4" />
          </FancyButton.Root>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#404040] mx-2" />

          {/* AI Enhancement Dropdown */}
          <DropdownMenu open={showEnhancementOptions} onOpenChange={setShowEnhancementOptions}>
            <DropdownMenuTrigger asChild>
              <FancyButton.Root
                variant="basic"
                size="xsmall"
                className={cn(
                  "h-8 px-3 flex items-center gap-1.5 relative overflow-hidden transition-all duration-200",
                  "bg-gradient-to-r from-blue-50 via-purple-50 to-orange-50",
                  "dark:from-blue-950/30 dark:via-purple-950/30 dark:to-orange-950/30",
                  "border border-blue-200/50 dark:border-blue-800/50",
                  "hover:shadow-md hover:shadow-blue-500/20 dark:hover:shadow-blue-500/10",
                  "hover:border-blue-300 dark:hover:border-blue-700",
                  showEnhancementOptions && "shadow-lg shadow-blue-500/30 border-blue-400 dark:border-blue-600"
                )}
                title="AI Enhancement"
                disabled={!note || !content.trim() || isEnhancing}
                data-toolbar-button="true"
              >
                {isEnhancing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <Sparkles className="w-4 h-4 text-blue-600" />
                )}
                <span className="text-xs font-semibold bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">
                  AI Enhance
                </span>
              </FancyButton.Root>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-56 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#404040] shadow-lg rounded-lg"
              data-ai-enhancement="true"
            >
              <DropdownMenuItem 
                onClick={() => handleAIEnhancement('professional')}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer"
                data-ai-enhancement="true"
              >
                <Sparkles className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="font-medium">Make Professional</div>
                  <div className="text-xs text-gray-500">Improve tone and structure</div>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => handleAIEnhancement('trading-review')}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer"
                data-ai-enhancement="true"
              >
                <FileText className="w-4 h-4 text-green-500" />
                <div>
                  <div className="font-medium">Trading Review</div>
                  <div className="text-xs text-gray-500">Enhance trade analysis</div>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => handleAIEnhancement('grammar')}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer"
                data-ai-enhancement="true"
              >
                <Edit3 className="w-4 h-4 text-orange-500" />
                <div>
                  <div className="font-medium">Fix Grammar</div>
                  <div className="text-xs text-gray-500">Correct spelling & grammar</div>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => handleAIEnhancement('clarity')}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer"
                data-ai-enhancement="true"
              >
                <Type className="w-4 h-4 text-purple-500" />
                <div>
                  <div className="font-medium">Improve Clarity</div>
                  <div className="text-xs text-gray-500">Simplify and clarify</div>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => handleAIEnhancement('summarize')}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer"
                data-ai-enhancement="true"
              >
                <Copy className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium">Summarize</div>
                  <div className="text-xs text-gray-500">Create concise summary</div>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleDailyTradeSummary}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer"
                disabled={isGeneratingTradeSummary}
                data-ai-enhancement="true"
              >
                {isGeneratingTradeSummary ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                )}
                <div>
                  <div className="font-medium">Daily Trade Report</div>
                  <div className="text-xs text-gray-500">AI-powered trading summary</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#404040] mx-2" />

          {/* Text Alignment */}
          <FancyButton.Root
            variant="basic"
            size="xsmall"
            className="h-8 w-8 p-0"
            onClick={() => formatText('justifyLeft')}
            title="Align Left"
            disabled={!note}
          >
            <AlignLeft className="w-4 h-4" />
          </FancyButton.Root>
          <FancyButton.Root
            variant="basic"
            size="xsmall"
            className="h-8 w-8 p-0"
            onClick={() => formatText('justifyCenter')}
            title="Align Center"
            disabled={!note}
          >
            <AlignCenter className="w-4 h-4" />
          </FancyButton.Root>
          <FancyButton.Root
            variant="basic"
            size="xsmall"
            className="h-8 w-8 p-0"
            onClick={() => formatText('justifyRight')}
            title="Align Right"
            disabled={!note}
          >
            <AlignRight className="w-4 h-4" />
          </FancyButton.Root>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#404040] mx-2" />

          {/* Lists */}
          <FancyButton.Root
            variant="basic"
            size="xsmall"
            className="h-8 w-8 p-0"
            onClick={() => formatText('insertUnorderedList')}
            title="Bullet List"
            disabled={!note}
          >
            <List className="w-4 h-4" />
          </FancyButton.Root>
          <FancyButton.Root
            variant="basic"
            size="xsmall"
            className="h-8 w-8 p-0"
            onClick={() => formatText('insertOrderedList')}
            title="Numbered List"
            disabled={!note}
          >
            <ListOrdered className="w-4 h-4" />
          </FancyButton.Root>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#404040] mx-2" />

          {/* Media & Special */}
          <FancyButton.Root
            variant="basic"
            size="xsmall"
            className="h-8 w-8 p-0"
            onClick={handleImageUpload}
            title="Insert Image"
            disabled={!note}
          >
            <Camera className="w-4 h-4" />
          </FancyButton.Root>

          <div className="relative">
            <FancyButton.Root
              variant="basic"
              size="xsmall"
              className="h-8 w-8 p-0"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Insert Emoji"
              disabled={!note}
            >
              <Smile className="w-4 h-4" />
            </FancyButton.Root>
            
            <EmojiPicker
              isOpen={showEmojiPicker}
              onClose={() => setShowEmojiPicker(false)}
              onEmojiSelect={(emoji) => {
                console.log('Emoji selected:', emoji)
                insertContent(emoji)
                setShowEmojiPicker(false)
              }}
            />
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#404040] mx-2" />

          {/* Special Elements */}
          <FancyButton.Root
            variant="basic"
            size="xsmall"
            className="h-8 w-8 p-0"
            onClick={() => insertContent('<input type="checkbox" style="margin-right: 8px;" /> ')}
            title="Insert Checkbox"
            disabled={!note}
          >
            <CheckSquare className="w-4 h-4" />
          </FancyButton.Root>
          <FancyButton.Root
            variant="basic"
            size="xsmall"
            className="h-8 w-8 p-0"
            onClick={toggleQuote}
            title="Quote"
            disabled={!note}
          >
            <Quote className="w-4 h-4" />
          </FancyButton.Root>
          <FancyButton.Root
            variant="basic"
            size="xsmall"
            className="h-8 w-8 p-0"
            onClick={() => formatText('formatBlock', 'pre')}
            title="Code Block"
            disabled={!note}
          >
            <Code className="w-4 h-4" />
          </FancyButton.Root>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 min-h-0 p-4 overflow-y-auto bg-white dark:bg-[#0f0f0f]">
        {!note ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a note to start editing</p>
            </div>
          </div>
        ) : (
          <div className="relative h-full">
            {/* Markdown Preview Mode */}
            {!isEditing && content && (
              <div
                className={cn(
                  "min-h-full outline-none leading-relaxed transition-colors cursor-text",
                  "text-gray-900 dark:text-white",
                  "prose prose-gray dark:prose-invert max-w-none",
                  "break-words"
                )}
                style={{
                  fontFamily: fontFamily === 'Inter' ? 'Inter, sans-serif' :
                    fontFamily === 'SF Pro' ? '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' :
                      fontFamily === 'Times New Roman' ? '"Times New Roman", Times, serif' :
                        fontFamily === 'Courier New' ? '"Courier New", Courier, monospace' :
                          fontFamily,
                  fontSize: fontSize,
                  minHeight: '400px',
                  lineHeight: '1.6',
                }}
                onClick={handleEditorClick}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(convertMarkdownToHTML(content))
                  }}
                />
              </div>
            )}

            {/* Raw Markdown Editor Mode */}
            {(isEditing || !content) && (
              <div
                ref={editorRef}
                contentEditable={!!note}
                className={cn(
                  "min-h-full outline-none leading-relaxed transition-colors",
                  "text-gray-900 dark:text-white",
                  "focus:ring-0 focus:outline-none",
                  "prose prose-gray dark:prose-invert max-w-none",
                  "break-words whitespace-pre-wrap",
                  // Ensure emoji images display inline properly
                  "[&_img[alt]]:inline-block [&_img[alt]]:align-text-bottom [&_img[alt]]:w-5 [&_img[alt]]:h-5 [&_img[alt]]:mx-0.5"
                )}
                style={{
                  fontFamily: fontFamily === 'Inter' ? 'Inter, sans-serif' :
                    fontFamily === 'SF Pro' ? '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' :
                      fontFamily === 'Times New Roman' ? '"Times New Roman", Times, serif' :
                        fontFamily === 'Courier New' ? '"Courier New", Courier, monospace' :
                          fontFamily,
                  fontSize: fontSize,
                  minHeight: '400px',
                  maxHeight: 'none',
                  height: 'auto',
                  direction: 'ltr',
                  textAlign: 'left',
                  writingMode: 'horizontal-tb',
                  unicodeBidi: 'embed',
                  lineHeight: '1.6',
                  // Ensure proper Unicode and emoji rendering
                  fontFeatureSettings: '"liga" 1, "kern" 1',
                  textRendering: 'optimizeLegibility',
                  /* inherit font smoothing from global settings */
                }}
                suppressContentEditableWarning={true}
                onInput={handleEditorInput}
                onKeyDown={handleEditorKeyDown}
                onFocus={() => {
                  setIsEditing(true)
                }}
                onPaste={handleEditorPaste}
                onBlur={handleEditorBlur}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const html = e.dataTransfer.getData('text/html')
                  if (html && html.includes('image-mention')) {
                    // Get drop position
                    const range = document.caretRangeFromPoint(e.clientX, e.clientY)
                    if (range) {
                      const selection = window.getSelection()
                      selection?.removeAllRanges()
                      selection?.addRange(range)
                      
                      // Insert the dragged mention at drop position
                      const tempDiv = document.createElement('div')
                      tempDiv.innerHTML = html
                      const mentionElement = tempDiv.firstChild as HTMLElement
                      
                      if (mentionElement) {
                        range.insertNode(mentionElement)
                        range.setStartAfter(mentionElement)
                        range.collapse(true)
                        selection?.removeAllRanges()
                        selection?.addRange(range)
                        
                        // Update content
                        setTimeout(() => {
                          if (editorRef.current) {
                            const newContent = sanitizeHtml(editorRef.current.innerHTML)
                            setContent(newContent)
                            setIsEditing(true)
                          }
                        }, 10)
                      }
                    }
                  }
                }}
                onClick={() => {
                  if (showImagePicker) {
                    setShowImagePicker(false)
                    setImageSearchQuery('')
                    setMentionStartPos(null)
                  }
                }}
              >
                {!content && (
                  <div className="text-gray-400 dark:text-gray-500 pointer-events-none">
                    Start typing your notes here...
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Selector (controlled, rendered outside dropdown) */}
      {templates && templates.length > 0 && (
        <TemplateSelector
          open={showTemplatePicker}
          onOpenChange={setShowTemplatePicker}
          useInlineTrigger={false}
          onTemplateSelect={handleTemplateSelect}
          onQuickApplyTemplate={(t, content) => onQuickApplyTemplate?.(t, content)}
          onCreateBlankNote={() => onCreateNote?.()}
          onDeleteTemplate={onDeleteTemplate}
          templates={templates}
        />
      )}

      {/* Template Editor Dialog */}
      {selectedTemplate && (
        <Dialog open={showTemplateEditor} onClose={handleTemplateEditorCancel}>
          <DialogContent className="max-w-2xl p-0 bg-white dark:bg-[#0f0f0f]">
            <SimpleTemplateEditor
              template={selectedTemplate}
              onCancel={handleTemplateEditorCancel}
              onSave={handleTemplateEditorSave}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Share Dialog */}
      <Dialog open={showShareModal} onClose={() => setShowShareModal(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Note
            </DialogTitle>
            <DialogDescription>
              Create a shareable link for "{note?.title}". Anyone with this link can view the note.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Privacy Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="anonymous-mode" className="text-sm font-medium">
                    Anonymous sharing
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Hide your identity from viewers
                  </p>
                </div>
                <Switch
                  checked={isAnonymousShare}
                  onCheckedChange={setIsAnonymousShare}
                />
              </div>
            </div>

            {shareUrl ? (
              <>
                <Separator />
                
                {/* Share URL Section */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Share Link</Label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-3 py-2 text-sm bg-muted rounded-md border border-input font-mono"
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (shareUrl) {
                          safeCopyToClipboard(shareUrl)
                        }
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                
                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if (shareUrl) window.open(shareUrl, '_blank')
                    }}
                  >
                    Preview
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setShowShareModal(false)
                      setShareUrl('')
                      setIsAnonymousShare(false)
                    }}
                  >
                    Done
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <Button
                  onClick={() => {
                    if (note) {
                      // Ensure latest edits are persisted
                      onUpdateNote?.(note.id, content)
                      const active = accountService.getActiveAccount()
                      const sharerName = isAnonymousShare ? undefined : (active?.name || 'Anonymous')
                      const initials = sharerName
                        ? sharerName
                            .split(/\s+/)
                            .map(s => s[0])
                            .filter(Boolean)
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)
                        : undefined
                      
                      const token = encodeNoteToToken({
                        title: note.title,
                        content: content,
                        tags: note.tags,
                        tradingData: (note as any).tradingData || computeTradingDataForShare(note),
                        color: note.color,
                        createdAt: note.createdAt,
                        updatedAt: note.updatedAt,
                        sharedBy: sharerName ? { name: sharerName, initials } : undefined,
                      })
                      
                      const url = `${window.location.origin}/notes/share/${token}`
                      setShareUrl(url)
                      
                      // Update note with sharing info
                      onUpdateNote?.(note.id, content, undefined, undefined, undefined, {
                        isShared: true,
                        shareToken: token,
                        isAnonymous: isAnonymousShare,
                        sharedAt: new Date().toISOString()
                      })
                    }
                  }}
                  className="w-full"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Create Share Link
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowShareModal(false)
                    setIsAnonymousShare(false)
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Mention Picker */}
      <ImageMentionPicker
        isOpen={showImagePicker}
        onClose={handleImagePickerClose}
        onSelectImage={handleImageSelect}
        searchQuery={imageSearchQuery}
        onSearchChange={setImageSearchQuery}
        position={imagePickerPosition}
      />

      {/* Bottom status bar removed to let the editor use the full area */}
    </div>
  )
}