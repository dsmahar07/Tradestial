'use client'

import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react'
import { CheckCircle2, Check } from 'lucide-react'
import * as Modal from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ManualRule {
  id: string
  name: string
  days: string
  completed?: boolean
}

interface DailyCheckListDialogProps {
  open: boolean
  onClose: () => void
  manualRules: ManualRule[]
  onUpdateManualRules: (rules: ManualRule[]) => void
  selectedDate?: string
}

export function DailyCheckListDialog({ 
  open, 
  onClose, 
  manualRules, 
  onUpdateManualRules,
  selectedDate 
}: DailyCheckListDialogProps) {
  const [localRules, setLocalRules] = useState<ManualRule[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize local rules when dialog opens
  useEffect(() => {
    if (open && !isInitialized) {
      setLocalRules([...manualRules])
      setIsInitialized(true)
    } else if (!open) {
      setIsInitialized(false)
    }
  }, [open, manualRules, isInitialized])

  // Filter rules that should appear today
  const getTodaysManualRules = () => {
    const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
    
    return localRules.filter(rule => {
      if (rule.days === 'Daily') return true
      if (rule.days === 'Mon-Fri' && today >= 1 && today <= 5) return true
      if (rule.days === 'Weekends' && (today === 0 || today === 6)) return true
      return false
    })
  }

  const todaysRules = getTodaysManualRules()

  const toggleRuleCompletion = (ruleId: string) => {
    setLocalRules(prev => 
      prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, completed: !rule.completed }
          : rule
      )
    )
  }

  const handleSave = () => {
    // Persist today's completion states for manual rules to localStorage history
    try {
      const toKey = (d: Date) => {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }
      const todayKey = toKey(new Date())
      const allCompletions = JSON.parse(localStorage.getItem('tradestial:rule-completions') || '{}')
      if (!allCompletions[todayKey]) allCompletions[todayKey] = {}
      // Write each manual rule's current completion status under manual_ prefix
      for (const rule of localRules) {
        allCompletions[todayKey][`manual_${rule.id}`] = !!rule.completed
      }
      localStorage.setItem('tradestial:rule-completions', JSON.stringify(allCompletions))
    } catch (error) {
      logger.error('Error saving manual rule completions from Daily Check List:', error)
    }

    // Update parent state and close
    onUpdateManualRules(localRules)
    onClose()
  }

  const handleCancel = () => {
    setLocalRules([...manualRules]) // Reset to original state
    onClose()
  }

  return (
    <Modal.Root open={open} onOpenChange={onClose}>
      <Modal.Content className="max-w-md">
        <Modal.Header
          icon={CheckCircle2}
          title="Daily Check List"
          description={selectedDate ? `Confirm completion for ${selectedDate}` : 'Confirm completion for today'}
        />
        
        <Modal.Body className="space-y-4">
          {todaysRules.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-3">
                <CheckCircle2 className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No manual rules to confirm today
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mark the rules you have completed today:
              </p>
              
              <div className="space-y-3">
                {todaysRules.map((rule, index) => (
                  <div key={rule.id}>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200">
                      <div className="flex items-center space-x-3 flex-1">
                        <button
                          onClick={() => toggleRuleCompletion(rule.id)}
                          className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0",
                            rule.completed
                              ? "bg-green-500 border-green-500 text-white shadow-sm"
                              : "border-gray-300 dark:border-gray-600 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                          )}
                        >
                          {rule.completed && <Check className="w-3 h-3" />}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "text-sm font-medium transition-all duration-200",
                            rule.completed 
                              ? "text-green-600 dark:text-green-400 line-through" 
                              : "text-gray-900 dark:text-white"
                          )}>
                            {rule.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {rule.days}
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-3 shrink-0">
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-200",
                          rule.completed 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        )}>
                          {rule.completed ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Vertical separator between items */}
                    {index < todaysRules.length - 1 && (
                      <div className="flex justify-center py-2">
                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </Modal.Body>
        
        <Modal.Footer className="justify-end">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  )
}
