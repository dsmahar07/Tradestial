'use client'

import { logger } from '@/lib/logger'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, ArrowUp, Download, Copy, ThumbsUp, ThumbsDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Root as FancyButton, Icon as FancyButtonIcon } from '@/components/ui/fancy-button'
import { DataStore } from '@/services/data-store.service'
import { TradeDataService, type Trade } from '@/services/trade-data.service'

interface ChatMessage {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
  lastMessage: Date
}

interface StialChatProps {
  isOpen: boolean
  onClose: () => void
}

export function StialChat({ isOpen, onClose }: StialChatProps) {
  const [tradingContext, setTradingContext] = useState<any>(null)
  const [conversations, setConversations] = useState<ChatConversation[]>([])

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const activeConversation = conversations.find(c => c.id === activeConversationId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [activeConversation?.messages])

  // Fetch trading context when chat opens
  useEffect(() => {
    if (isOpen) {
      fetchTradingContext()
    }
  }, [isOpen])

  const fetchTradingContext = async (): Promise<any> => {
    try {
      logger.debug('Fetching trading context...')
      const trades: Trade[] = DataStore.getAllTrades() as unknown as Trade[]
      logger.debug('Fetched trades:', trades.length, trades)
      
      if (trades.length === 0) {
        logger.debug('No trades found, setting empty context')
        const emptyCtx = {
          totalTrades: 0,
          winRate: '0.00',
          profitFactor: '0.00',
          totalPnl: '0.00',
          bestTrade: null,
          worstTrade: null,
          avgWin: '0.00',
          avgLoss: '0.00',
          currentStreak: 0,
          tradingDays: 0,
          mostTradedSymbol: 'N/A',
          accountBalance: 10000,
          dailyAverage: '0.00',
          riskRewardRatio: '0.00',
          recentTrades: []
        }
        setTradingContext(emptyCtx)
        return emptyCtx
      }
      
      // Calculate trading metrics using service for consistency
      const metrics = TradeDataService.calculateMetrics(trades)
      const totalPnl = trades.reduce((sum, t) => sum + (t.netPnl || 0), 0)
      const winRate = metrics.winRate
      const avgWin = metrics.avgWinAmount
      const avgLoss = metrics.avgLossAmount
      const profitFactor = metrics.profitFactor

      // Find best and worst trades
      const bestTrade = trades.reduce((best: Trade | null, trade: Trade) => 
        (!best || (trade.netPnl || 0) > (best.netPnl || 0)) ? trade : best, null)
      const worstTrade = trades.reduce((worst: Trade | null, trade: Trade) => 
        (!worst || (trade.netPnl || 0) < (worst.netPnl || 0)) ? trade : worst, null)
      
      // Get most traded symbol
      const symbolCounts = trades.reduce((acc: Record<string, number>, trade: any) => {
        const symbol = trade.symbol || 'UNKNOWN'
        acc[symbol] = (acc[symbol] || 0) + 1
        return acc
      }, {})
      const mostTradedSymbol = Object.entries(symbolCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'N/A'
      
      // Calculate streak
      let currentStreak = 0
      for (let i = trades.length - 1; i >= 0; i--) {
        const pnl = (trades[i] as any).pnl || 0
        if (pnl > 0) {
          if (currentStreak >= 0) currentStreak++
          else break
        } else if (pnl < 0) {
          if (currentStreak <= 0) currentStreak--
          else break
        }
      }
      
      // Get unique trading days
      const tradingDays = new Set(trades.map((t: Trade) => {
        const d = t.closeDate || t.openDate
        return d
      })).size
      
      // Calculate daily average
      const dailyAverage = tradingDays > 0 ? totalPnl / tradingDays : 0
      
      // Calculate risk/reward ratio
      const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0
      
      // Build symbol-level aggregates for deeper context
      const bySymbol = trades.reduce((acc: Record<string, { trades: number; wins: number; pnl: number; avgR: number; rSum: number }>, t) => {
        const k = t.symbol || 'UNKNOWN'
        if (!acc[k]) acc[k] = { trades: 0, wins: 0, pnl: 0, avgR: 0, rSum: 0 }
        acc[k].trades += 1
        acc[k].wins += (t.netPnl || 0) > 0 ? 1 : 0
        acc[k].pnl += (t.netPnl || 0)
        acc[k].rSum += typeof t.rMultiple === 'number' ? t.rMultiple : 0
        return acc
      }, {})
      const symbolStatsTable = (() => {
        const header = 'Symbol | Trades | Win% | P&L | Avg R\n---|---:|---:|---:|---:'
        const rows = Object.entries(bySymbol)
          .sort((a, b) => Math.abs(b[1].pnl) - Math.abs(a[1].pnl))
          .slice(0, 10)
          .map(([sym, s]) => {
            const winPct = s.trades ? ((s.wins / s.trades) * 100).toFixed(1) : '0.0'
            const avgR = s.trades ? (s.rSum / s.trades).toFixed(2) : '0.00'
            return `${sym} | ${s.trades} | ${winPct}% | ${s.pnl.toFixed(2)} | ${avgR}`
          })
        return rows.length ? `${header}\n${rows.join('\n')}` : '(no symbol stats)'
      })()

      const context = {
        totalTrades: trades.length,
        winRate: winRate.toFixed(2),
        profitFactor: profitFactor.toFixed(2),
        totalPnl: totalPnl.toFixed(2),
        bestTrade: bestTrade ? { pnl: (bestTrade.netPnl || 0).toFixed(2), symbol: bestTrade.symbol || 'UNKNOWN' } : null,
        worstTrade: worstTrade ? { pnl: (worstTrade.netPnl || 0).toFixed(2), symbol: worstTrade.symbol || 'UNKNOWN' } : null,
        avgWin: avgWin.toFixed(2),
        avgLoss: avgLoss.toFixed(2),
        currentStreak,
        tradingDays,
        mostTradedSymbol,
        accountBalance: 10000 + totalPnl,
        dailyAverage: dailyAverage.toFixed(2),
        riskRewardRatio: riskRewardRatio.toFixed(2),
        metrics,
        symbolStatsTable,
        recentTrades: [...trades]
          .sort((a, b) => new Date(`${b.openDate} ${b.entryTime || '00:00:00'}`).getTime() - new Date(`${a.openDate} ${a.entryTime || '00:00:00'}`).getTime())
          .slice(0, 15)
          .map(t => ({
            id: t.id,
            date: t.closeDate || t.openDate,
            symbol: t.symbol,
            side: t.side || 'LONG',
            pnl: t.netPnl,
            r: t.rMultiple,
            model: t.model || '',
            entry: t.entryPrice,
            exit: t.exitPrice
          }))
      }
      
      logger.debug('Calculated trading context:', context)
      setTradingContext(context)
      return context
    } catch (error) {
      logger.error('Error fetching trading context:', error)
      // Set fallback context
      const fb = {
        totalTrades: 0,
        winRate: '0.00',
        profitFactor: '0.00',
        totalPnl: '0.00',
        bestTrade: null,
        worstTrade: null,
        avgWin: '0.00',
        avgLoss: '0.00',
        currentStreak: 0,
        tradingDays: 0,
        mostTradedSymbol: 'N/A',
        accountBalance: 10000,
        dailyAverage: '0.00',
        riskRewardRatio: '0.00',
        recentTrades: []
      }
      setTradingContext(fb)
      return fb
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    }

    // Add user message
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversationId 
        ? { ...conv, messages: [...conv.messages, newMessage], lastMessage: new Date() }
        : conv
    ))

    const messageToSend = inputMessage
    setInputMessage('')
    setIsLoading(true)

    try {
      // Ensure we have fresh trading context before sending and use the returned object
      const contextToSend = tradingContext ?? await fetchTradingContext()

      // Get current conversation messages for context
      const currentMessages = activeConversation?.messages || []
      const messages = [
        ...currentMessages.map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: messageToSend }
      ]

      // Call AI API with trading context
      logger.debug('Sending request to AI API with context:', tradingContext)
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.slice(-10), // Send last 10 messages for context
          tradingContext: contextToSend
        })
      })

      logger.debug('API Response status:', response.status)
      if (!response.ok) {
        const errorText = await response.text()
        logger.error('API Error:', errorText)
        throw new Error(`Failed to get AI response: ${response.status}`)
      }

      const data = await response.json()
      const aiContent = data.choices?.[0]?.message?.content || 'I apologize, but I encountered an error processing your request. Please try again.'

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiContent,
        isUser: false,
        timestamp: new Date()
      }

      setConversations(prev => prev.map(conv => 
        conv.id === activeConversationId 
          ? { ...conv, messages: [...conv.messages, aiResponse], lastMessage: new Date() }
          : conv
      ))
    } catch (error) {
      logger.error('Error getting AI response:', error)
      
      // Fallback response on error
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I encountered an error while processing your request. Please ensure your trading data is loaded and try again.',
        isUser: false,
        timestamp: new Date()
      }

      setConversations(prev => prev.map(conv => 
        conv.id === activeConversationId 
          ? { ...conv, messages: [...conv.messages, errorResponse], lastMessage: new Date() }
          : conv
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const createNewConversation = () => {
    const newConversation: ChatConversation = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      lastMessage: new Date()
    }
    
    setConversations(prev => [newConversation, ...prev])
    setActiveConversationId(newConversation.id)
  }

  const deleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId))
    
    // If we're deleting the active conversation, switch to another one or create new
    if (conversationId === activeConversationId) {
      const remainingConversations = conversations.filter(conv => conv.id !== conversationId)
      if (remainingConversations.length > 0) {
        setActiveConversationId(remainingConversations[0].id)
      } else {
        // Create a new conversation if no conversations remain
        createNewConversation()
      }
    }
  }

  const handleCopyConversation = async () => {
    if (!activeConversation || activeConversation.messages.length === 0) return
    
    const conversationText = activeConversation.messages
      .map(message => `${message.isUser ? 'You' : 'AI'}: ${message.content}`)
      .join('\n\n')
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(conversationText)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = conversationText
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
    } catch (err) {
      logger.error('Failed to copy conversation:', err)
    }
  }

  // Auto-create first conversation when chat opens
  React.useEffect(() => {
    if (isOpen && conversations.length === 0) {
      createNewConversation()
    }
  }, [isOpen, conversations.length])

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      // Check if clipboard API is available and we have permissions
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content)
        logger.debug('Message copied to clipboard')
        setCopiedMessageId(messageId)
        setTimeout(() => setCopiedMessageId(null), 2000)
        return
      }
    } catch (err) {
      logger.error('Clipboard API failed:', err)
    }
    
    // Fallback method for all cases where clipboard API fails
    try {
      const textArea = document.createElement('textarea')
      textArea.value = content
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        logger.debug('Message copied to clipboard (fallback)')
        setCopiedMessageId(messageId)
        setTimeout(() => setCopiedMessageId(null), 2000)
      } else {
        logger.error('Copy command failed')
      }
    } catch (fallbackErr) {
      logger.error('Fallback copy failed:', fallbackErr)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0}
            dragTransition={{ power: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50"
            style={{
              right: '20px',
              top: 'calc(50% - 35vh)'
            }}
          >
            <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-2xl drop-shadow-2xl border border-gray-200 dark:border-gray-700 w-[720px] h-[65vh] flex overflow-hidden relative cursor-move">
              {/* Drag Handle */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
                <div className="w-10 h-1 bg-gray-400 dark:bg-gray-600 rounded-full" />
              </div>
        {/* Sidebar */}
        <div className="w-56 bg-[#FAFAFA] dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <span className="font-semibold bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">
                Chat history
              </span>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <button
                onClick={createNewConversation}
                className="w-full py-2 px-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mb-2 border-2 border-dashed border-gray-300 dark:border-gray-600"
              >
                <span className="text-gray-500 dark:text-gray-400">+ New Chat</span>
              </button>

              {/* Conversations */}
              {conversations.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">Recent</div>
                  {conversations.map((conv) => (
                    <div key={conv.id} className="relative group">
                      <button
                        onClick={() => setActiveConversationId(conv.id)}
                        className={`w-full py-2 px-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mb-1 relative ${
                          activeConversationId === conv.id ? 'bg-blue-100 dark:bg-blue-800/30' : ''
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate pr-8">
                          {conv.title}
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                      >
                        <X className="w-3 h-3 text-gray-500 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 flex items-center justify-between">
            <button
              onClick={handleCopyConversation}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600 dark:text-gray-400">
                <path d="M21.25 6.86111V13.2025C21.2502 13.4737 21.1967 13.7423 21.0927 13.9928C20.9886 14.2433 20.836 14.4707 20.6436 14.6619L14.6619 20.6436C14.4707 20.836 14.2433 20.9886 13.9928 21.0927C13.7423 21.1967 13.4737 21.2502 13.2025 21.25H6.86111C5.77078 21.25 4.7251 20.8169 3.95412 20.0459C3.18313 19.2749 2.75 18.2292 2.75 17.1389V6.86111C2.75 5.77078 3.18313 4.7251 3.95412 3.95412C4.7251 3.18313 5.77078 2.75 6.86111 2.75H17.1389C18.2292 2.75 19.2749 3.18313 20.0459 3.95412C20.8169 4.7251 21.25 5.77078 21.25 6.86111Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.0556 21.0753L13.5417 16.9642C13.4832 16.4981 13.532 16.0248 13.6844 15.5804C13.8367 15.1361 14.0886 14.7324 14.4208 14.4002C14.753 14.0681 15.1566 13.8162 15.601 13.6638C16.0453 13.5115 16.5186 13.4626 16.9847 13.5211L21.0958 14.035" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.86108 7.88892H16.1111" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.86108 12H10.9722" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.86108 16.1111H9.94442" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeConversation?.messages.map((message) => (
              <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl text-gray-900 dark:text-gray-100 bg-transparent rounded-2xl p-4`}>
                  <div className="text-sm leading-relaxed">
                    {message.isUser ? (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    ) : (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown 
                          components={{
                            h1: ({children}) => <h1 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">{children}</h1>,
                            h2: ({children}) => <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">{children}</h2>,
                            h3: ({children}) => <h3 className="text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">{children}</h3>,
                            p: ({children}) => <p className="mb-2 text-gray-700 dark:text-gray-300">{children}</p>,
                            ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1 text-gray-700 dark:text-gray-300">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-700 dark:text-gray-300">{children}</ol>,
                            li: ({children}) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
                            strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
                            em: ({children}) => <em className="italic text-gray-700 dark:text-gray-300">{children}</em>,
                            code: ({children}) => <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono text-gray-800 dark:text-gray-200">{children}</code>,
                            blockquote: ({children}) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 mb-2">{children}</blockquote>
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  {!message.isUser && (
                    <div className="flex items-center gap-2 mt-3 pt-3">
                      <button 
                        onClick={() => handleCopyMessage(message.content, message.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        title={copiedMessageId === message.id ? "Copied!" : "Copy message"}
                      >
                        {copiedMessageId === message.id ? (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Copied!</span>
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          

          {/* Input Area */}
          <div className="px-6 pt-6 pb-4">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything..."
                className="w-full py-2 px-4 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 dark:bg-gray-800 dark:text-white"
                rows={1}
                style={{ minHeight: '36px', maxHeight: '120px' }}
              />
              <FancyButton
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                variant="neutral"
                size="xsmall"
                className="absolute right-2 top-[calc(50%-1px)] transform -translate-y-1/2 !h-6 !w-6 !p-1 flex items-center justify-center"
              >
                <ArrowUp className="w-3 h-3" />
              </FancyButton>
            </div>
          </div>
        </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
