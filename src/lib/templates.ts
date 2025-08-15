import { TradeJournalingTemplate } from '@/types/templates'

export type { TradeJournalingTemplate } from '@/types/templates'

export const defaultTemplates: TradeJournalingTemplate[] = [
  {
    id: 'daily-trade-log',
    name: 'Daily Trading Journal',
    description: 'Track your daily P&L, trades, market conditions, and emotions',
    icon: '📊',
    color: '#10b981',
    category: 'daily',
    isCustomizable: true,
    tags: ['daily', 'pnl', 'performance'],
    fields: [
      {
        id: 'date',
        label: 'Trading Date',
        type: 'date',
        required: true,
        defaultValue: new Date().toISOString().split('T')[0]
      },
      {
        id: 'market-session',
        label: 'Market Session',
        type: 'select',
        required: true,
        options: ['Pre-Market', 'Market Open', 'Mid-Day', 'Market Close', 'After Hours'],
        defaultValue: 'Market Open'
      },
      {
        id: 'overall-pnl',
        label: 'Overall P&L',
        type: 'currency',
        required: true,
        placeholder: '0.00'
      },
      {
        id: 'total-trades',
        label: 'Total Trades',
        type: 'number',
        required: true,
        defaultValue: 0
      },
      {
        id: 'winning-trades',
        label: 'Winning Trades',
        type: 'number',
        required: true,
        defaultValue: 0
      },
      {
        id: 'losing-trades',
        label: 'Losing Trades',
        type: 'number',
        required: true,
        defaultValue: 0
      },
      {
        id: 'market-conditions',
        label: 'Market Conditions',
        type: 'select',
        options: ['Trending Up', 'Trending Down', 'Sideways/Choppy', 'High Volatility', 'Low Volatility'],
        placeholder: 'Select market conditions'
      },
      {
        id: 'emotional-state',
        label: 'Emotional State',
        type: 'select',
        options: ['Confident', 'Anxious', 'Calm', 'Frustrated', 'Excited', 'Nervous', 'Focused'],
        placeholder: 'How did you feel today?'
      },
      {
        id: 'key-lessons',
        label: 'Key Lessons Learned',
        type: 'textarea',
        placeholder: 'What did you learn from today\'s trading session?'
      },
      {
        id: 'mistakes-made',
        label: 'Mistakes Made',
        type: 'textarea',
        placeholder: 'What mistakes did you make and how can you avoid them?'
      },
      {
        id: 'tomorrow-plan',
        label: 'Tomorrow\'s Plan',
        type: 'textarea',
        placeholder: 'What\'s your plan for the next trading session?'
      }
    ]
  },
  {
    id: 'single-trade-analysis',
    name: 'Trade Breakdown',
    description: 'Analyze individual trades - entry, exit, reasoning, and lessons',
    icon: '🎯',
    color: '#3b82f6',
    category: 'trade',
    isCustomizable: true,
    tags: ['trade', 'analysis', 'review'],
    fields: [
      {
        id: 'symbol',
        label: 'Symbol/Ticker',
        type: 'text',
        required: true,
        placeholder: 'e.g., AAPL, SPY, TSLA'
      },
      {
        id: 'trade-type',
        label: 'Trade Type',
        type: 'select',
        required: true,
        options: ['Long', 'Short', 'Option Call', 'Option Put', 'Spread', 'Scalp'],
        defaultValue: 'Long'
      },
      {
        id: 'entry-price',
        label: 'Entry Price',
        type: 'currency',
        required: true,
        placeholder: '0.00'
      },
      {
        id: 'exit-price',
        label: 'Exit Price',
        type: 'currency',
        required: true,
        placeholder: '0.00'
      },
      {
        id: 'quantity',
        label: 'Quantity/Size',
        type: 'number',
        required: true,
        defaultValue: 1
      },
      {
        id: 'entry-time',
        label: 'Entry Time',
        type: 'time',
        required: true
      },
      {
        id: 'exit-time',
        label: 'Exit Time',  
        type: 'time',
        required: true
      },
      {
        id: 'pnl',
        label: 'P&L',
        type: 'currency',
        required: true,
        placeholder: '0.00'
      },
      {
        id: 'setup-type',
        label: 'Setup Type',
        type: 'select',
        options: ['Breakout', 'Pullback', 'Reversal', 'Momentum', 'Support/Resistance', 'Pattern', 'News'],
        placeholder: 'What setup did you trade?'
      },
      {
        id: 'entry-reason',
        label: 'Entry Reason',
        type: 'textarea',
        required: true,
        placeholder: 'Why did you enter this trade?'
      },
      {
        id: 'exit-reason',
        label: 'Exit Reason',
        type: 'textarea',
        required: true,
        placeholder: 'Why did you exit this trade?'
      },
      {
        id: 'what-worked',
        label: 'What Worked Well',
        type: 'textarea',
        placeholder: 'What aspects of this trade were executed well?'
      },
      {
        id: 'what-failed',
        label: 'What Could Be Improved',
        type: 'textarea',
        placeholder: 'What could you have done better?'
      },
      {
        id: 'risk-reward',
        label: 'Risk/Reward Ratio',
        type: 'text',
        placeholder: 'e.g., 1:2, 1:3'
      }
    ]
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    description: 'Review your week - numbers, wins, losses, and goals for next week',
    icon: '📋',
    color: '#8b5cf6',
    category: 'review',
    isCustomizable: true,
    tags: ['weekly', 'review', 'goals'],
    fields: [
      {
        id: 'week-starting',
        label: 'Week Starting',
        type: 'date',
        required: true
      },
      {
        id: 'week-ending',
        label: 'Week Ending',
        type: 'date',
        required: true
      },
      {
        id: 'total-pnl',
        label: 'Total P&L',
        type: 'currency',
        required: true,
        placeholder: '0.00'
      },
      {
        id: 'total-trades',
        label: 'Total Trades',
        type: 'number',
        required: true,
        defaultValue: 0
      },
      {
        id: 'win-rate',
        label: 'Win Rate (%)',
        type: 'number',
        required: true,
        placeholder: '0'
      },
      {
        id: 'avg-win',
        label: 'Average Win',
        type: 'currency',
        placeholder: '0.00'
      },
      {
        id: 'avg-loss',
        label: 'Average Loss',
        type: 'currency',
        placeholder: '0.00'
      },
      {
        id: 'largest-win',
        label: 'Largest Win',
        type: 'currency',
        placeholder: '0.00'
      },
      {
        id: 'largest-loss',
        label: 'Largest Loss',
        type: 'currency',
        placeholder: '0.00'
      },
      {
        id: 'goals-achieved',
        label: 'Goals Achieved',
        type: 'textarea',
        placeholder: 'What goals did you achieve this week?'
      },
      {
        id: 'challenges-faced',
        label: 'Challenges Faced',
        type: 'textarea',
        placeholder: 'What challenges did you encounter?'
      },
      {
        id: 'key-insights',
        label: 'Key Insights',
        type: 'textarea',
        placeholder: 'What key insights did you gain this week?'
      },
      {
        id: 'next-week-goals',
        label: 'Next Week Goals',
        type: 'textarea',
        placeholder: 'What are your goals for next week?'
      },
      {
        id: 'strategy-adjustments',
        label: 'Strategy Adjustments',
        type: 'textarea',
        placeholder: 'What adjustments will you make to your strategy?'
      }
    ]
  },
  {
    id: 'market-analysis',
    name: 'Market Notes',
    description: 'Track market direction, hot sectors, news, and opportunities',
    icon: '📈',
    color: '#f59e0b',
    category: 'analysis',
    isCustomizable: true,
    tags: ['market', 'sectors', 'news'],
    fields: [
      {
        id: 'analysis-date',
        label: 'Analysis Date',
        type: 'date',
        required: true,
        defaultValue: new Date().toISOString().split('T')[0]
      },
      {
        id: 'market-direction',
        label: 'Overall Market Direction',
        type: 'select',
        options: ['Bullish', 'Bearish', 'Neutral', 'Uncertain'],
        required: true
      },
      {
        id: 'major-indices',
        label: 'Major Indices Performance',
        type: 'textarea',
        placeholder: 'How did SPY, QQQ, IWM perform today?'
      },
      {
        id: 'sector-leaders',
        label: 'Leading Sectors',
        type: 'textarea',
        placeholder: 'Which sectors performed well today?'
      },
      {
        id: 'sector-laggards',
        label: 'Lagging Sectors',
        type: 'textarea',
        placeholder: 'Which sectors underperformed today?'
      },
      {
        id: 'key-news',
        label: 'Key News Events',
        type: 'textarea',
        placeholder: 'What major news events affected the market?'
      },
      {
        id: 'economic-data',
        label: 'Economic Data Releases',
        type: 'textarea',
        placeholder: 'Any important economic data released today?'
      },
      {
        id: 'market-sentiment',
        label: 'Market Sentiment',
        type: 'select',
        options: ['Very Bullish', 'Bullish', 'Neutral', 'Bearish', 'Very Bearish', 'Fear', 'Greed'],
        placeholder: 'Overall market sentiment'
      },
      {
        id: 'opportunities',
        label: 'Tomorrow\'s Opportunities',
        type: 'textarea',
        placeholder: 'What opportunities do you see for tomorrow?'
      },
      {
        id: 'risks',
        label: 'Tomorrow\'s Risks',
        type: 'textarea',
        placeholder: 'What risks should you be aware of tomorrow?'
      }
    ]
  },
  {
    id: 'quick-note',
    name: 'Quick Thought',
    description: 'Fast way to capture trading ideas, observations, and reminders',
    icon: '💭',
    color: '#ec4899',
    category: 'daily',
    isCustomizable: true,
    tags: ['quick', 'ideas', 'notes'],
    fields: [
      {
        id: 'timestamp',
        label: 'Time',
        type: 'time',
        required: true,
        defaultValue: new Date().toTimeString().slice(0, 5)
      },
      {
        id: 'quick-thought',
        label: 'Quick Thought',
        type: 'textarea',
        required: true,
        placeholder: 'What\'s on your mind about the market or your trades?'
      },
      {
        id: 'action-required',
        label: 'Action Required',
        type: 'checkbox',
        defaultValue: false
      },
      {
        id: 'priority',
        label: 'Priority',
        type: 'select',
        options: ['Low', 'Medium', 'High', 'Urgent'],
        defaultValue: 'Medium'
      }
    ]
  }
]

export const getTemplateById = (id: string): TradeJournalingTemplate | undefined => {
  return defaultTemplates.find(template => template.id === id)
}

export const getTemplatesByCategory = (category: string): TradeJournalingTemplate[] => {
  return defaultTemplates.filter(template => template.category === category)
}

export const createCustomTemplate = (name: string, description: string, fields: any[]): TradeJournalingTemplate => {
  return {
    id: `custom-${Date.now()}`,
    name,
    description,
    icon: '📝',
    color: '#6b7280',
    category: 'custom',
    isCustomizable: true,
    tags: ['custom'],
    fields
  }
}

// Generate properly formatted, professional template content
export const generateQuickTemplateContent = (template: TradeJournalingTemplate): string => {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  })
  
  if (template.id === 'daily-trade-log') {
    return `<p><strong>Daily Trading Journal</strong></p>
<p>${today}</p>
<br>
<p><strong>Performance Summary</strong></p>
<p>Total P&L:</p>
<p>Win rate:</p>
<p>Number of trades:</p>
<br>
<p><strong>Best Performing Setups</strong></p>
<p>•</p>
<br>
<p><strong>Underperforming Setups</strong></p>
<p>•</p>
<br>
<p><strong>Market Conditions Today</strong></p>
<p>Overall market sentiment:</p>
<p>• SPY:</p>
<p>• QQQ:</p>
<p>• Key news:</p>
<br>
<p><strong>What Went Well</strong></p>
<p>•</p>
<br>
<p><strong>Areas for Improvement</strong></p>
<p>•</p>
<br>
<p><strong>Plan for Next Trading Day</strong></p>
<p>•</p>`
  }
  
  if (template.id === 'single-trade-analysis') {
    return `<p><strong>Trade Analysis</strong></p>
<p>${today}</p>
<br>
<p><strong>Trade Details</strong></p>
<p>• Symbol:</p>
<p>• Direction:</p>
<p>• Entry price:</p>
<p>• Exit price:</p>
<p>• P&L:</p>
<br>
<p><strong>Trade Setup</strong></p>
<p><br></p>
<br>
<p><strong>What Worked</strong></p>
<p>•</p>
<br>
<p><strong>What Could Be Improved</strong></p>
<p>•</p>
<br>
<p><strong>Lessons Learned</strong></p>
<p>•</p>`
  }
  
  if (template.id === 'quick-note') {
    return `<p><strong>Quick Trading Note</strong></p>
<p>${new Date().toLocaleTimeString()} - ${today}</p>
<br>
<p><strong>Observation</strong></p>
<p><br></p>
<br>
<p><strong>Action Required</strong></p>
<p>•</p>
<br>
<p><strong>Notes</strong></p>
<p>•</p>`
  }
  
  if (template.id === 'weekly-review') {
    return `<p><strong>Weekly Summary</strong></p>
<p>Week of ${today}</p>
<br>
<p>Total P&L:</p>
<p>Win rate:</p>
<p>Number of trades:</p>
<br>
<p><strong>Best Performing Setups</strong></p>
<p>•</p>
<br>
<p><strong>Underperforming Setups</strong></p>
<p>•</p>
<br>
<p><strong>Goals for Next Week</strong></p>
<p>•</p>`
  }
  
  if (template.id === 'market-analysis') {
    return `<p><strong>Market Analysis</strong></p>
<p>${today}</p>
<br>
<p>Overall market sentiment today:</p>
<p>• SPY:</p>
<p>• QQQ:</p>
<p>• Key news:</p>
<br>
<p><strong>Trade Summary</strong></p>
<p>Number of trades:</p>
<p>Win rate:</p>
<p>Total P&L:</p>
<br>
<p><strong>What Went Well</strong></p>
<p>•</p>
<br>
<p><strong>Areas for Improvement</strong></p>
<p>•</p>
<br>
<p><strong>Plan for Next Trading Day</strong></p>
<p>•</p>`
  }
  
  // Fallback for other templates
  return `<p><strong>${template.name}</strong></p>
<p>${today}</p>
<br>
<p><strong>Notes</strong></p>
<p><br></p>
<br>
<p><strong>Key Points</strong></p>
<p>•</p>
<br>
<p><strong>Action Items</strong></p>
<p>•</p>`
}