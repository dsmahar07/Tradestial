'use client'

import { logger } from '@/lib/logger'

import { useState, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { X, Plus, Minus, Upload } from 'lucide-react'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'

interface ModelMakerProps {
  isOpen: boolean
  onClose: () => void
  onModelCreated?: () => void
}

interface RuleGroup {
  id: string
  title: string
  rules: string[]
}

const getInitialFormData = () => ({
  name: '',
  description: '',
  emoji: '📈',
  emojiUnified: '1f4c8', // Unicode codepoint for 📈
  image: null as string | null,
  ruleGroups: [] as RuleGroup[]
})


export function ModelMaker({ isOpen, onClose, onModelCreated }: ModelMakerProps) {
  const [formData, setFormData] = useState(getInitialFormData)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData())
      setShowEmojiPicker(false)
    }
  }, [isOpen])

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker && !(event.target as Element)?.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Basic validation
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size must be less than 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setFormData(prev => ({
          ...prev,
          image: result,
          emoji: ''
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const selectEmoji = (emoji: string) => {
    setFormData(prev => ({
      ...prev,
      emoji: emoji,
      image: null
    }))
    setShowEmojiPicker(false)
  }

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setFormData(prev => ({
      ...prev,
      emoji: emojiData.emoji,
      emojiUnified: emojiData.unified,
      image: null
    }))
    setShowEmojiPicker(false)
  }

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null,
      emoji: '📈',
      emojiUnified: '1f4c8'
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addRuleGroup = () => {
    const newGroup: RuleGroup = {
      id: `group_${Date.now()}`,
      title: '',
      rules: ['']
    }
    setFormData(prev => ({
      ...prev,
      ruleGroups: [...prev.ruleGroups, newGroup]
    }))
  }

  const removeRuleGroup = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      ruleGroups: prev.ruleGroups.filter(group => group.id !== groupId)
    }))
  }

  const updateGroupTitle = (groupId: string, title: string) => {
    setFormData(prev => ({
      ...prev,
      ruleGroups: prev.ruleGroups.map(group =>
        group.id === groupId ? { ...group, title } : group
      )
    }))
  }

  const addRule = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      ruleGroups: prev.ruleGroups.map(group =>
        group.id === groupId
          ? { ...group, rules: [...group.rules, ''] }
          : group
      )
    }))
  }

  const removeRule = (groupId: string, ruleIndex: number) => {
    setFormData(prev => ({
      ...prev,
      ruleGroups: prev.ruleGroups.map(group =>
        group.id === groupId
          ? { ...group, rules: group.rules.filter((_, index) => index !== ruleIndex) }
          : group
      )
    }))
  }

  const updateRule = (groupId: string, ruleIndex: number, ruleText: string) => {
    setFormData(prev => ({
      ...prev,
      ruleGroups: prev.ruleGroups.map(group =>
        group.id === groupId
          ? {
              ...group,
              rules: group.rules.map((rule, index) =>
                index === ruleIndex ? ruleText : rule
              )
            }
          : group
      )
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      return // HTML5 validation will handle this
    }
    
    // Normalize rule groups to the format expected by the main rules page
    const normalizedRuleGroups = (formData.ruleGroups || []).map(g => ({
      id: g.id,
      title: g.title || '',
      rules: (g.rules || [])
        .map(r => (typeof r === 'string' ? r : String(r)))
        .map(r => r.trim())
        .filter(r => r.length > 0)
        .map(r => ({ id: `rule_${Date.now()}_${Math.random().toString(36).slice(2)}`, text: r, frequency: 'Always' as const }))
    }))

    // Create the strategy object in the structured format
    const strategy = {
      id: `strategy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name.trim(),
      emoji: formData.image ? '' : formData.emoji,
      emojiUnified: formData.image ? '' : formData.emojiUnified,
      image: formData.image,
      updatedAt: Date.now(),
      description: formData.description.trim(),
      ruleGroups: normalizedRuleGroups
    }

    try {
      // Get existing strategies from localStorage with safe parsing
      let existingStrategies = []
      try {
        const existingStrategiesRaw = localStorage.getItem('tradestial:strategies')
        existingStrategies = existingStrategiesRaw ? JSON.parse(existingStrategiesRaw) : []
      } catch (parseError) {
        logger.warn('Failed to parse existing strategies, starting fresh:', parseError)
        existingStrategies = []
      }
      
      // Add new strategy to the beginning of the list
      const updatedStrategies = [strategy, ...existingStrategies]
      
      // Save back to localStorage
      localStorage.setItem('tradestial:strategies', JSON.stringify(updatedStrategies))
      
      logger.debug('Trading Model created:', strategy)
      
      // Reset form data for next use
      setFormData(getInitialFormData())
      
      // Notify parent component and close modal
      onModelCreated?.()
      onClose()
    } catch (error) {
      logger.error('Failed to save strategy:', error)
      alert('Failed to create model. Please try again.')
    }
  }

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50" />
          <Dialog.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-[#0f0f0f] rounded-xl shadow-lg border border-gray-200 dark:border-[#2a2a2a] duration-200 max-h-[90vh] overflow-y-auto scrollbar-hide z-50">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
            <div className="flex items-center gap-4">
              {/* Clickable Avatar */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-blue-300 transition-all group-hover:opacity-90"
                >
                  {formData.image ? (
                    <img 
                      src={formData.image} 
                      alt="Model avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img 
                      src={`https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${formData.emojiUnified}.png`}
                      alt="Model emoji"
                      className="w-8 h-8"
                      onError={(e) => {
                        // Fallback to Unicode emoji if Apple image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  )}
                  {/* Fallback Unicode emoji (hidden by default) */}
                  {!formData.image && (
                    <span className="text-xl text-white hidden">{formData.emoji}</span>
                  )}
                </button>
                {(formData.image || formData.emoji !== '📈') && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                {/* iOS-Style Full Emoji Picker */}
                {showEmojiPicker && (
                  <div className="emoji-picker-container absolute top-full left-0 mt-2 z-[60] shadow-2xl rounded-lg overflow-hidden">
                    <EmojiPicker 
                      onEmojiClick={onEmojiClick}
                      width={350}
                      height={400}
                      searchDisabled={false}
                      skinTonesDisabled={false}
                      previewConfig={{
                        defaultEmoji: "1f60a",
                        defaultCaption: "Choose your perfect emoji!",
                        showPreview: true
                      }}
                    />
                  </div>
                )}
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">Create Model</Dialog.Title>
                <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400">Create a new trading model with rules</Dialog.Description>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Dialog.Close asChild>
                <button className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none dark:ring-offset-gray-950 dark:focus:ring-gray-300">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
              </Dialog.Close>
            </div>
          </div>


          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Form Content */}
          <form id="model-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Model Name */}
            <div>
              <label htmlFor="model-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model Name *</label>
              <input
                id="model-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your model name (e.g., ICT 2024 Strategy)"
                className="w-full h-11 rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white px-4 border border-gray-300 dark:border-[#2a2a2a] outline-none focus:ring-0"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="model-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea
                id="model-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your trading model and methodology (optional)"
                rows={3}
                className="w-full rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white px-4 py-3 border border-gray-300 dark:border-[#2a2a2a] outline-none focus:ring-0 resize-none"
              />
            </div>

            {/* Rules Groups */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Trading Rules (Optional)</label>
                <Button
                  type="button"
                  onClick={addRuleGroup}
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs bg-white dark:bg-[#0f0f0f] border-gray-300 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#171717]"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Rule Group
                </Button>
              </div>

              {formData.ruleGroups.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  No rules added yet. Click "Add Rule Group" to create your first rule group.
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.ruleGroups.map((group) => (
                    <div key={group.id} className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4 bg-gray-50 dark:bg-[#0f0f0f]">
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          value={group.title}
                          onChange={(e) => updateGroupTitle(group.id, e.target.value)}
                          placeholder="Rule group name (e.g., Entry Conditions)"
                          className="flex-1 h-9 rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white px-3 border border-gray-300 dark:border-[#2a2a2a] outline-none focus:ring-0"
                        />
                        <Button
                          type="button"
                          onClick={() => removeRuleGroup(group.id)}
                          size="sm"
                          variant="ghost"
                          className="h-9 w-9 p-0 text-gray-500 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {group.rules.map((rule, ruleIndex) => (
                          <div key={ruleIndex} className="flex items-center gap-2">
                            <input
                              value={rule}
                              onChange={(e) => updateRule(group.id, ruleIndex, e.target.value)}
                              placeholder="Enter trading rule (e.g., Price above VWAP)"
                              className="flex-1 h-9 rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white px-3 border border-gray-300 dark:border-[#2a2a2a] outline-none focus:ring-0"
                            />
                            <Button
                              type="button"
                              onClick={() => removeRule(group.id, ruleIndex)}
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 p-0 text-gray-500 hover:text-red-600"
                              disabled={group.rules.length === 1}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          onClick={() => addRule(group.id)}
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-[#171717] bg-white dark:bg-[#0f0f0f] border border-gray-300 dark:border-[#2a2a2a] rounded-md"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Rule
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0f0f0f] rounded-b-xl">
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="px-6 py-2 text-sm border-gray-300 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0f0f0f] rounded-lg hover:bg-gray-100 dark:hover:bg-[#171717]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="model-form"
              className="px-6 py-2 text-sm bg-[#3559E9] hover:bg-[#2947d1] text-white border-none shadow-sm overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none relative rounded-lg"
            >
              Create Model
            </Button>
          </div>
        </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
