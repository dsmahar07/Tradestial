'use client'

import { useState, useEffect } from 'react'
import { X, Plus, RotateCcw, Trash2, GripVertical } from 'lucide-react'
import { Button } from './button'

interface RulesModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate?: (tradingRules: TradingRule[], manualRules: ManualRule[], tradingDays: string[]) => void
  initialTradingRules?: TradingRule[]
  initialManualRules?: ManualRule[]
  initialTradingDays?: string[]
}

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
}

export function RulesModal({ 
  isOpen, 
  onClose, 
  onUpdate,
  initialTradingRules = [
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
  ],
  initialManualRules = [
    {
      id: '1',
      name: 'Sleep',
      days: 'Mon-Fri'
    }
  ],
  initialTradingDays = ['Mo', 'Tu', 'We', 'Th', 'Fr']
}: RulesModalProps) {
  const [tradingDays, setTradingDays] = useState(initialTradingDays)
  const [tradingRules, setTradingRules] = useState(initialTradingRules)
  const [manualRules, setManualRules] = useState(initialManualRules)

  // Sync with initial props when modal opens
  useEffect(() => {
    if (isOpen) {
      setTradingDays(initialTradingDays)
      setTradingRules(initialTradingRules)
      setManualRules(initialManualRules)
    }
  }, [isOpen, initialTradingDays, initialTradingRules, initialManualRules])

  const days = [
    { key: 'Mo', label: 'Mo' },
    { key: 'Tu', label: 'Tu' },
    { key: 'We', label: 'We' },
    { key: 'Th', label: 'Th' },
    { key: 'Fr', label: 'Fr' },
    { key: 'Sa', label: 'Sa' },
    { key: 'Su', label: 'Su' }
  ]

  const toggleTradingDay = (day: string) => {
    setTradingDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  const toggleRule = (ruleId: string) => {
    setTradingRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    )
  }

  const updateRuleConfig = (ruleId: string, config: any) => {
    setTradingRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, config: { ...rule.config, ...config } } : rule
      )
    )
  }

  const addManualRule = () => {
    const newRule: ManualRule = {
      id: Date.now().toString(),
      name: 'New rule',
      days: 'Mon-Fri'
    }
    setManualRules(prev => [...prev, newRule])
  }

  const removeManualRule = (ruleId: string) => {
    setManualRules(prev => prev.filter(rule => rule.id !== ruleId))
  }

  const updateManualRule = (ruleId: string, updates: Partial<ManualRule>) => {
    setManualRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#171717] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Rules</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Changes you make will only update your scoring for today and for future days.
          </p>

          {/* Trading Days */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Trading days</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              The days on which these rules should be active.
            </p>
            <div className="flex space-x-2">
              {days.map(day => (
                <button
                  key={day.key}
                  onClick={() => toggleTradingDay(day.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    tradingDays.includes(day.key)
                      ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/10'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trading Rules */}
          <div className="space-y-4">
            {tradingRules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between">
                {/* Left Side: Toggle + Rule Info */}
                <div className="flex items-center space-x-4 flex-1">
                  {/* Toggle Switch */}
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      rule.enabled
                        ? 'bg-purple-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        rule.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>

                  {/* Rule Info */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{rule.name}</h4>
                    
                    {rule.type === 'trading_hours' && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Set trading hours in a 24-hour format.
                        <br />
                        Your current timezone: -04:00 GMT
                      </p>
                    )}

                    {rule.type === 'start_day' && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        The time you should start your day by and enter your starting journal entry before your trading session.
                      </p>
                    )}

                    {rule.type === 'link_playbook' && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        All trades opened must have a playbook attached.
                      </p>
                    )}

                    {rule.type === 'stop_loss' && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        All trades opened must have a stop loss added.
                      </p>
                    )}

                    {rule.type === 'max_loss_trade' && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        The maximum net loss on a trade in amount or in percentage of the trade's account balance.
                      </p>
                    )}

                    {rule.type === 'max_loss_day' && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        The maximum net loss on a day among all accounts.
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Side: Controls */}
                <div className="flex items-center space-x-2">
                  {rule.type === 'trading_hours' && (
                    <>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">From</div>
                        <select
                          value={rule.config?.from || '09:00'}
                          onChange={(e) => updateRuleConfig(rule.id, { from: e.target.value })}
                          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none cursor-pointer"
                        >
                          <option value="06:00">06:00</option>
                          <option value="07:00">07:00</option>
                          <option value="08:00">08:00</option>
                          <option value="09:00">09:00</option>
                          <option value="10:00">10:00</option>
                          <option value="11:00">11:00</option>
                        </select>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">To</div>
                        <select
                          value={rule.config?.to || '12:00'}
                          onChange={(e) => updateRuleConfig(rule.id, { to: e.target.value })}
                          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none cursor-pointer"
                        >
                          <option value="12:00">12:00</option>
                          <option value="13:00">13:00</option>
                          <option value="14:00">14:00</option>
                          <option value="15:00">15:00</option>
                          <option value="16:00">16:00</option>
                          <option value="17:00">17:00</option>
                          <option value="18:00">18:00</option>
                        </select>
                      </div>
                    </>
                  )}

                  {rule.type === 'start_day' && (
                    <input
                      type="time"
                      value={rule.config?.time || '09:30'}
                      onChange={(e) => updateRuleConfig(rule.id, { time: e.target.value })}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none cursor-pointer"
                    />
                  )}

                  {rule.type === 'max_loss_trade' && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => updateRuleConfig(rule.id, { type: '%' })}
                        className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                          rule.config?.type === '%'
                            ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        %
                      </button>
                      <button
                        onClick={() => updateRuleConfig(rule.id, { type: '$' })}
                        className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                          rule.config?.type === '$'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        $
                      </button>
                      <input
                        type="number"
                        value={rule.config?.amount || '100'}
                        onChange={(e) => updateRuleConfig(rule.id, { amount: e.target.value })}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-16 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                    </div>
                  )}

                  {rule.type === 'max_loss_day' && (
                    <input
                      type="number"
                      value={rule.config?.amount || '100'}
                      onChange={(e) => updateRuleConfig(rule.id, { amount: e.target.value })}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-16 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Manual Rules */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manual rules</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The rule will be added as a daily check list
                </p>
              </div>
              <button
                onClick={addManualRule}
                className="flex items-center text-teal-600 hover:text-teal-700 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add rule
              </button>
            </div>

            <div className="space-y-3">
              {manualRules.map(rule => (
                <div key={rule.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={rule.name}
                    onChange={(e) => updateManualRule(rule.id, { name: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                  <select
                    value={rule.days}
                    onChange={(e) => updateManualRule(rule.id, { days: e.target.value })}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none cursor-pointer min-w-[100px]"
                  >
                    <option value="Mon-Fri">Mon-Fri</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekends">Weekends</option>
                  </select>
                  <button
                    onClick={() => removeManualRule(rule.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Reset Section */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Reset your progress tracker</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Start over with new rules, streak and habit building.
            </p>
            <button className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset all progress
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-[#171717] flex-shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onUpdate?.(tradingRules, manualRules, tradingDays)
              onClose()
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}