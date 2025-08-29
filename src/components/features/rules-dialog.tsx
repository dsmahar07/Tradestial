'use client'

import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/fancy-select'
import { cn } from '@/lib/utils'
import { Root as FancyButton } from '@/components/ui/fancy-button'

interface TradingRule {
  id: string
  name: string
  enabled: boolean
  type: 'trading_hours' | 'start_day' | 'link_model' | 'stop_loss' | 'max_loss_trade' | 'max_loss_day'
  config?: any
}

interface ManualRule {
  id: string
  name: string
  days: string
  completed?: boolean
}

interface RulesDialogProps {
  open: boolean
  onClose: () => void
  tradingDays: string[]
  setTradingDays: (days: string[]) => void
  tradingRules: TradingRule[]
  setTradingRules: (rules: TradingRule[]) => void
  manualRules: ManualRule[]
  setManualRules: (rules: ManualRule[]) => void
  onResetProgress?: () => void
}

// Get user's local timezone info (GMT offset and IANA name)
function getUserTimezone() {
  const d = new Date()
  const offsetMin = -d.getTimezoneOffset() // minutes east of UTC
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  const name = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  return { offset: `GMT${sign}${hh}:${mm}`, name }
}

const DAYS = [
  { key: 'Mo', label: 'Mo' },
  { key: 'Tu', label: 'Tu' },
  { key: 'We', label: 'We' },
  { key: 'Th', label: 'Th' },
  { key: 'Fr', label: 'Fr' },
  { key: 'Sa', label: 'Sa' },
  { key: 'Su', label: 'Su' }
]

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
]

const MANUAL_RULE_DAYS = ['Daily', 'Mon-Fri', 'Weekends']

export function RulesDialog({
  open,
  onClose,
  tradingDays,
  setTradingDays,
  tradingRules,
  setTradingRules,
  manualRules,
  setManualRules,
  onResetProgress
}: RulesDialogProps) {
  const [newManualRule, setNewManualRule] = useState({ name: '', days: 'Mon-Fri' })

  const toggleTradingDay = (day: string) => {
    if (tradingDays.includes(day)) {
      setTradingDays(tradingDays.filter(d => d !== day))
    } else {
      setTradingDays([...tradingDays, day])
    }
  }

  const updateTradingRule = (id: string, updates: Partial<TradingRule>) => {
    setTradingRules(tradingRules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ))
  }

  const addManualRule = () => {
    const newRule: ManualRule = {
      id: Date.now().toString(),
      name: newManualRule.name.trim() || 'New Rule',
      days: newManualRule.days,
      completed: false
    }
    setManualRules([...manualRules, newRule])
    setNewManualRule({ name: '', days: 'Mon-Fri' })
  }

  const removeManualRule = (id: string) => {
    setManualRules(manualRules.filter(rule => rule.id !== id))
  }

  const handleSaveChanges = () => {
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogClose />
        
        <div className="space-y-4">
              {/* Header */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Rules</h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Changes you make will only update your scoring for today and for future days.
                </p>
              </div>

              {/* Trading Days */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Trading days</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      The days on which these rules should be active.
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {DAYS.map(day => (
                      <button
                        key={day.key}
                        onClick={() => toggleTradingDay(day.key)}
                        className={cn(
                          "px-2 py-1 rounded text-xs font-medium transition-colors",
                          tradingDays.includes(day.key)
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trading Hours */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Trading hours</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Set trading hours in a 24-hour format.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {(() => {
                        const tz = getUserTimezone()
                        return `Your current timezone: ${tz.offset}${tz.name ? ` ${tz.name}` : ''}`
                      })()}
                    </p>
                  </div>
                  <Switch
                    checked={tradingRules.find(r => r.type === 'trading_hours')?.enabled || false}
                    onCheckedChange={(checked) => updateTradingRule('1', { enabled: checked })}
                  />
                </div>
                
                {tradingRules.find(r => r.type === 'trading_hours')?.enabled && (
                  <div className="flex gap-2 items-center">
                    <Select
                      value={tradingRules.find(r => r.type === 'trading_hours')?.config?.from || '09:00'}
                      onValueChange={(value) => updateTradingRule('1', { 
                        config: { 
                          ...tradingRules.find(r => r.type === 'trading_hours')?.config,
                          from: value 
                        }
                      })}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-gray-500">to</span>
                    
                    <Select
                      value={tradingRules.find(r => r.type === 'trading_hours')?.config?.to || '12:00'}
                      onValueChange={(value) => updateTradingRule('1', { 
                        config: { 
                          ...tradingRules.find(r => r.type === 'trading_hours')?.config,
                          to: value 
                        }
                      })}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Start my day by */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Start my day by</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    The time you should start your day by and enter your starting journal entry before your trading session.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">09:30</span>
                  <Switch
                    checked={tradingRules.find(r => r.type === 'start_day')?.enabled || false}
                    onCheckedChange={(checked) => updateTradingRule('2', { enabled: checked })}
                  />
                </div>
              </div>

              {/* Link trades to playbook */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Link trades to playbook</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    All trades opened must have a playbook attached.
                  </p>
                </div>
                <Switch
                  checked={tradingRules.find(r => r.type === 'link_model')?.enabled || false}
                  onCheckedChange={(checked) => updateTradingRule('3', { enabled: checked })}
                />
              </div>

              {/* Input Stop loss to all trades */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Input Stop loss to all trades</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    All trades opened must have a stop loss added.
                  </p>
                </div>
                <Switch
                  checked={tradingRules.find(r => r.type === 'stop_loss')?.enabled || false}
                  onCheckedChange={(checked) => updateTradingRule('4', { enabled: checked })}
                />
              </div>

              {/* Net max loss /trade */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Net max loss /trade</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      The maximum net loss on a trade in amount or in percentage of the trade's account balance.
                    </p>
                  </div>
                  <Switch
                    checked={tradingRules.find(r => r.type === 'max_loss_trade')?.enabled || false}
                    onCheckedChange={(checked) => updateTradingRule('5', { enabled: checked })}
                  />
                </div>
                
                {tradingRules.find(r => r.type === 'max_loss_trade')?.enabled && (
                  <div className="flex gap-2 items-center">
                    <div className="flex rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <button
                        className={cn(
                          "px-2 py-1 text-xs font-medium transition-colors",
                          tradingRules.find(r => r.type === 'max_loss_trade')?.config?.type === '%'
                            ? "bg-blue-500 text-white"
                            : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        )}
                        onClick={() => updateTradingRule('5', { 
                          config: { 
                            ...tradingRules.find(r => r.type === 'max_loss_trade')?.config,
                            type: '%' 
                          }
                        })}
                      >
                        %
                      </button>
                      <button
                        className={cn(
                          "px-2 py-1 text-xs font-medium transition-colors",
                          tradingRules.find(r => r.type === 'max_loss_trade')?.config?.type === '$'
                            ? "bg-blue-500 text-white"
                            : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        )}
                        onClick={() => updateTradingRule('5', { 
                          config: { 
                            ...tradingRules.find(r => r.type === 'max_loss_trade')?.config,
                            type: '$' 
                          }
                        })}
                      >
                        $
                      </button>
                    </div>
                    <input
                      type="number"
                      step="any"
                      value={tradingRules.find(r => r.type === 'max_loss_trade')?.config?.amount ?? '100'}
                      onChange={(e) => updateTradingRule('5', { 
                        config: { 
                          ...tradingRules.find(r => r.type === 'max_loss_trade')?.config,
                          amount: e.target.value 
                        }
                      })}
                      className="w-16 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-0 focus:border-blue-300 dark:focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Net max loss /day */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Net max loss /day</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      The maximum net loss on a day among all accounts.
                    </p>
                  </div>
                  <Switch
                    checked={tradingRules.find(r => r.type === 'max_loss_day')?.enabled || false}
                    onCheckedChange={(checked) => updateTradingRule('6', { enabled: checked })}
                  />
                </div>
                
                {tradingRules.find(r => r.type === 'max_loss_day')?.enabled && (
                  <input
                    type="number"
                    step="any"
                    value={tradingRules.find(r => r.type === 'max_loss_day')?.config?.amount ?? '100'}
                    onChange={(e) => updateTradingRule('6', { 
                      config: { 
                        ...tradingRules.find(r => r.type === 'max_loss_day')?.config,
                        amount: e.target.value 
                      }
                    })}
                    className="w-16 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-0 focus:border-blue-300 dark:focus:border-blue-500"
                  />
                )}
              </div>
              {/* Manual Rules */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Manual rules</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    The rule will be added as a daily check list
                  </p>
                </div>

                {/* Existing Manual Rules */}
                {manualRules.map(rule => (
                  <div key={rule.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={rule.name}
                      onChange={(e) => setManualRules(manualRules.map(r => 
                        r.id === rule.id ? { ...r, name: e.target.value } : r
                      ))}
                      className="flex-1 px-2 py-2 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-0 focus:border-blue-300 dark:focus:border-blue-500"
                      placeholder="Name the rule"
                    />
                    <Select
                      value={rule.days}
                      onValueChange={(value) => setManualRules(manualRules.map(r => 
                        r.id === rule.id ? { ...r, days: value } : r
                      ))}
                    >
                      <SelectTrigger className="w-24 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MANUAL_RULE_DAYS.map(day => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeManualRule(rule.id)}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}

                {/* Add New Manual Rule */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newManualRule.name}
                    onChange={(e) => setNewManualRule({ ...newManualRule, name: e.target.value })}
                    className="flex-1 px-2 py-2 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-0 focus:border-blue-300 dark:focus:border-blue-500"
                    placeholder="Name the rule"
                  />
                  <Select
                    value={newManualRule.days}
                    onValueChange={(value) => setNewManualRule({ ...newManualRule, days: value })}
                  >
                    <SelectTrigger className="w-24 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MANUAL_RULE_DAYS.map(day => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addManualRule}
                    className="h-7 w-7 p-0 text-blue-500 hover:text-blue-600 border-blue-200 hover:border-blue-300"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                <button
                  onClick={addManualRule}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-medium"
                >
                  <Plus className="w-3 h-3" />
                  Add rule
                </button>
              </div>

              {/* Reset Progress */}
              <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Reset your progress tracker</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Start over with new rules, streak and habit building.
                </p>
                <Button
                  variant="outline"
                  onClick={onResetProgress}
                  className="text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 h-8 text-xs"
                >
                  Reset all progress
                </Button>
              </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose} className="h-8 text-xs">
              Cancel
            </Button>
            <FancyButton onClick={handleSaveChanges} variant="primary" size="xsmall" className="text-xs">
              Save changes
            </FancyButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
