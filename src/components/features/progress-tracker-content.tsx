'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Edit, Info, HelpCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RulesModal } from '@/components/ui/rules-modal'
import { ProgressTrackerHeatmap } from '@/components/ui/progress-tracker-heatmap'

interface TradingRule {
  id: string
  name: string
  enabled: boolean
  type: 'trading_hours' | 'start_day' | 'link_playbook' | 'stop_loss' | 'max_loss_trade' | 'max_loss_day'
  config?: any
}

interface ManualRule {
  id: string
  name: string
  days: string
  completed?: boolean
}

interface Rule {
  id: string
  name: string
  condition: string
  streak: number
  avgPerformance: string
  followRate: string
  isActive: boolean
  completed?: boolean
}

export function ProgressTrackerContent() {
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false)
  
  // State for rules from modal
  const [tradingDays, setTradingDays] = useState(['Mo', 'Tu', 'We', 'Th', 'Fr'])
  const [tradingRules, setTradingRules] = useState<TradingRule[]>([
    {
      id: '1',
      name: 'Trading hours',
      enabled: true,
      type: 'trading_hours',
      config: { from: '09:00', to: '12:00' }
    },
    {
      id: '2',
      name: 'Start my day by',
      enabled: true,
      type: 'start_day',
      config: { time: '08:30' }
    },
    {
      id: '3',
      name: 'Link trades to playbook',
      enabled: true,
      type: 'link_playbook'
    },
    {
      id: '4',
      name: 'Input Stop loss to all trades',
      enabled: true,
      type: 'stop_loss'
    },
    {
      id: '5',
      name: 'Net max loss /trade',
      enabled: true,
      type: 'max_loss_trade',
      config: { amount: '100', type: '$' }
    },
    {
      id: '6',
      name: 'Net max loss /day',
      enabled: true,
      type: 'max_loss_day',
      config: { amount: '100' }
    }
  ])
  
  const [manualRules, setManualRules] = useState<ManualRule[]>([
    {
      id: '1',
      name: 'Sleep',
      days: 'Mon-Fri',
      completed: false
    }
  ])

  // Store today's rule completions and day completion status - MOVED HERE BEFORE useMemo
  const [todayCompletions, setTodayCompletions] = useState<Record<string, boolean>>({})
  const [isDayFinished, setIsDayFinished] = useState(false)

  // Check if today is a trading day
  const isTradingDay = useMemo(() => {
    const today = new Date().getDay()
    const dayMap = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    return tradingDays.includes(dayMap[today])
  }, [tradingDays])

  // Calculate active rules for today (for the progress tracker section)
  const activeRules = useMemo(() => {
    console.log('Calculating active rules:', { isTradingDay, tradingRules, manualRules })
    if (!isTradingDay) return []
    
    const rules: Rule[] = []
    
    // Add enabled trading rules
    tradingRules.forEach(rule => {
      if (rule.enabled) {
        let condition = ''
        switch (rule.type) {
          case 'trading_hours':
            condition = `${rule.config?.from || '09:00'}/${rule.config?.to || '12:00'}`
            break
          case 'start_day':
            condition = rule.config?.time || '08:30'
            break
          case 'link_playbook':
          case 'stop_loss':
            condition = '100%'
            break
          case 'max_loss_trade':
          case 'max_loss_day':
            condition = `${rule.config?.type || '$'}${rule.config?.amount || '100'}`
            break
          default:
            condition = '–'
        }
        
        rules.push({
          id: rule.id,
          name: rule.name,
          condition,
          streak: 0,
          avgPerformance: rule.type.includes('loss') ? '$0' : (rule.type.includes('link') || rule.type.includes('stop') ? '0%' : '–'),
          followRate: '0%',
          isActive: rule.enabled,
          completed: todayCompletions[rule.id] || false
        })
      }
    })
    
    // Add manual rules for today
    manualRules.forEach(rule => {
      const today = new Date().getDay()
      let shouldInclude = false
      
      if (rule.days === 'Daily') shouldInclude = true
      else if (rule.days === 'Mon-Fri' && today >= 1 && today <= 5) shouldInclude = true
      else if (rule.days === 'Weekends' && (today === 0 || today === 6)) shouldInclude = true
      
      if (shouldInclude) {
        rules.push({
          id: `manual_${rule.id}`,
          name: rule.name,
          condition: '–',
          streak: 0,
          avgPerformance: '–',
          followRate: '0%',
          isActive: true,
          completed: rule.completed || false
        })
      }
    })
    
    return rules
  }, [tradingRules, manualRules, isTradingDay, todayCompletions])

  // Calculate all rules for the table (regardless of trading day)
  const allRules = useMemo(() => {
    console.log('Calculating all rules for table:', { tradingRules, manualRules })
    const rules: Rule[] = []
    
    // Add all trading rules (enabled and disabled)
    tradingRules.forEach(rule => {
      let condition = ''
      switch (rule.type) {
        case 'trading_hours':
          condition = `${rule.config?.from || '09:00'}/${rule.config?.to || '12:00'}`
          break
        case 'start_day':
          condition = rule.config?.time || '08:30'
          break
        case 'link_playbook':
        case 'stop_loss':
          condition = '100%'
          break
        case 'max_loss_trade':
        case 'max_loss_day':
          condition = `${rule.config?.type || '$'}${rule.config?.amount || '100'}`
          break
        default:
          condition = '–'
      }
      
      rules.push({
        id: rule.id,
        name: rule.name,
        condition,
        streak: 0,
        avgPerformance: rule.type.includes('loss') ? '$0' : (rule.type.includes('link') || rule.type.includes('stop') ? '0%' : '–'),
        followRate: '0%',
        isActive: rule.enabled,
        completed: false
      })
    })
    
    // Add all manual rules
    manualRules.forEach(rule => {
      rules.push({
        id: `manual_${rule.id}`,
        name: rule.name,
        condition: '–',
        streak: 0,
        avgPerformance: '–',
        followRate: '0%',
        isActive: true,
        completed: rule.completed || false
      })
    })
    
    return rules
  }, [tradingRules, manualRules])

  // Calculate progress metrics
  const progressMetrics = useMemo(() => {
    const totalRules = activeRules.length
    const completedRules = activeRules.filter(rule => rule.completed).length
    const progressPercentage = totalRules > 0 ? (completedRules / totalRules) * 100 : 0
    
    return {
      total: totalRules,
      completed: completedRules,
      percentage: progressPercentage,
      hasActiveRules: totalRules > 0
    }
  }, [activeRules])

  // Current streak calculation (simplified for demo)
  const currentStreak = useMemo(() => {
    // In a real app, this would calculate based on historical data
    return progressMetrics.percentage === 100 ? 1 : 0
  }, [progressMetrics.percentage])

  // Finish My Day functionality
  const finishMyDay = () => {
    if (progressMetrics.percentage === 100) {
      setIsDayFinished(true)
      // In a real app, this would save to backend and update historical data
      console.log('Day finished with 100% completion!')
    }
  }

  // Toggle rule completion
  const toggleRuleCompletion = (ruleId: string) => {
    if (isDayFinished) return // Prevent changes after day is finished
    
    if (ruleId.startsWith('manual_')) {
      const manualId = ruleId.replace('manual_', '')
      setManualRules(prev => 
        prev.map(rule => 
          rule.id === manualId 
            ? { ...rule, completed: !rule.completed }
            : rule
        )
      )
    } else {
      // Handle trading rule completion
      setTodayCompletions(prev => ({
        ...prev,
        [ruleId]: !prev[ruleId]
      }))
    }
  }

  // Handle rules update from modal
  const handleRulesUpdate = (newTradingRules: TradingRule[], newManualRules: ManualRule[], newTradingDays: string[]) => {
    console.log('Updating rules:', { newTradingRules, newManualRules, newTradingDays })
    setTradingRules(newTradingRules)
    setManualRules(newManualRules)
    setTradingDays(newTradingDays)
  }
  
  return (
    <>
      <RulesModal 
        isOpen={isRulesModalOpen} 
        onClose={() => setIsRulesModalOpen(false)}
        onUpdate={handleRulesUpdate}
        initialTradingRules={tradingRules}
        initialManualRules={manualRules}
        initialTradingDays={tradingDays}
      />
    <main className="flex-1 overflow-y-auto px-6 pb-6 pt-10 bg-gray-50 dark:bg-[#1C1C1C]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Stats Column */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Current Streak */}
            <div className="bg-white dark:bg-[#171717] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current streak</span>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentStreak} day{currentStreak !== 1 ? 's' : ''}
                </span>
                <span className="text-lg">{currentStreak > 0 ? '🔥' : '😔'}</span>
              </div>
            </div>
            
            {/* Current Period Score */}
            <div className="bg-white dark:bg-[#171717] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current period score</span>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="relative">
                <div className="w-16 h-16 mx-auto">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="2"
                      className="dark:stroke-gray-700"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={progressMetrics.percentage >= 50 ? "#10b981" : "#ef4444"}
                      strokeWidth="2"
                      strokeDasharray={`${progressMetrics.percentage}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {Math.round(progressMetrics.percentage)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Today's Progress */}
            <div className="bg-white dark:bg-[#171717] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Today's progress</span>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="mb-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {progressMetrics.completed}/{progressMetrics.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progressMetrics.percentage}%` }}
                ></div>
              </div>
            </div>
            
          </div>
          
          {/* Center Progress Tracker Heatmap */}
          <div className="lg:col-span-3">
            <ProgressTrackerHeatmap 
              todayScore={progressMetrics.percentage}
              todayCompleted={progressMetrics.completed}
              todayTotal={progressMetrics.total}
            />
          </div>
          
        </div>
        
        {/* Today's Active Rules Section */}
        {isTradingDay && (
          <div className="bg-white dark:bg-[#171717] rounded-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Rules</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Complete your daily rules to maintain your streak
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {progressMetrics.completed} of {progressMetrics.total} completed
                </span>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                  disabled={progressMetrics.percentage !== 100 || isDayFinished}
                  onClick={finishMyDay}
                >
                  {isDayFinished ? '✅ Day Completed' : 'Finish My Day'}
                </Button>
              </div>
            </div>
            
            {isDayFinished && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mx-6">
                <div className="flex items-center space-x-2">
                  <div className="text-green-600 dark:text-green-400">🎉</div>
                  <div>
                    <div className="text-sm font-medium text-green-800 dark:text-green-200">
                      Day completed successfully!
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      All rules have been locked for today. Great job maintaining your discipline!
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-6 space-y-4">
              {activeRules.map((rule) => (
                <div key={rule.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <button
                    onClick={() => toggleRuleCompletion(rule.id)}
                    disabled={isDayFinished}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      rule.completed 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : isDayFinished
                        ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                        : 'border-gray-300 dark:border-gray-600 hover:border-green-400 cursor-pointer'
                    }`}
                  >
                    {rule.completed && (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className={`font-medium ${
                      rule.completed 
                        ? 'text-gray-500 dark:text-gray-400 line-through' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {rule.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {rule.condition !== '–' && rule.condition}
                    </div>
                  </div>
                  
                  {rule.completed && (
                    <div className="text-green-500">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))}
              
              {activeRules.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No rules active for today. Enjoy your day off! 🎉
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {!isTradingDay && (
          <div className="bg-white dark:bg-[#171717] rounded-lg p-6">
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📴</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Non-Trading Day
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Today is not a trading day according to your schedule. Rules are not active.
              </p>
            </div>
          </div>
        )}
        
        {/* Current Rules Table */}
        <div className="bg-white dark:bg-[#171717] rounded-lg">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current rules</h2>
            <Button 
              variant="outline" 
              size="sm"
              className="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600"
              onClick={() => setIsRulesModalOpen(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit rules
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    RULE
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    CONDITION
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    RULE STREAK
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    AVERAGE PERFORMANCE
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    FOLLOW RATE
                  </th>
                </tr>
              </thead>
              <tbody>
                {allRules.map((rule) => (
                  <tr key={rule.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        {rule.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : rule.isActive ? (
                          <X className="w-4 h-4 text-red-500" />
                        ) : (
                          <X className="w-4 h-4 text-gray-400" />
                        )}
                        <span className={`text-sm ${
                          rule.completed 
                            ? 'text-green-600 dark:text-green-400 line-through' 
                            : rule.isActive
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {rule.name}
                        </span>
                        {!rule.isActive && (
                          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            Disabled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                      {rule.condition}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                      {rule.streak}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                      {rule.avgPerformance}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-sm font-medium ${
                        rule.completed ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {rule.completed ? '100%' : rule.followRate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </main>
    </>
  )
}