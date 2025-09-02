'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as RadioGroup from '@radix-ui/react-radio-group'
import * as Separator from '@radix-ui/react-separator'
import { X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// Apple Emoji Component from existing emoji-picker.tsx
function AppleEmoji({ emoji, className = "w-5 h-5" }: { emoji: string; className?: string }) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)
  
  useEffect(() => {
    setHasError(false)
    setImageSrc(null)
    
    const getEmojiCodepoints = (emoji: string): string[] => {
      const codepoints = []
      for (let i = 0; i < emoji.length; ) {
        const codepoint = emoji.codePointAt(i)
        if (codepoint) {
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
    if (codepoints.length === 0) {
      setHasError(true)
      return
    }
    
    const primaryCodepoint = codepoints[0]
    const primaryPadded = primaryCodepoint.padStart(4, '0')
    const joinedCodepoints = codepoints.join('-')
    const joinedPadded = codepoints.map(cp => cp.padStart(4, '0')).join('-')
    
    const urls = [
      `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64/${primaryPadded}.png`,
      `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64/${primaryCodepoint}.png`,
      `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64/${joinedPadded}.png`,
      `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64/${joinedCodepoints}.png`,
      `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${primaryCodepoint}.png`,
      `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${joinedCodepoints}.png`,
      `https://twemoji.maxcdn.com/v/14.0.2/72x72/${primaryCodepoint}.png`
    ]
    
    const tryLoadImage = async (urlIndex: number = 0): Promise<void> => {
      if (urlIndex >= urls.length) {
        setHasError(true)
        return
      }
      
      const url = urls[urlIndex]
      const img = new Image()
      
      img.onload = () => {
        setImageSrc(url)
        setHasError(false)
      }
      
      img.onerror = () => {
        tryLoadImage(urlIndex + 1)
      }
      
      img.src = url
    }
    
    tryLoadImage()
  }, [emoji])
  
  if (imageSrc && !hasError) {
    return (
      <img
        src={imageSrc}
        alt={emoji}
        className={cn(className, "select-none object-contain")}
        draggable={false}
        onError={() => setHasError(true)}
      />
    )
  }
  
  return (
    <span 
      className={cn(className, "inline-flex items-center justify-center select-none")}
      style={{ 
        fontSize: '18px', 
        lineHeight: 1,
        fontFamily: '"Apple Color Emoji", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji"',
        textRendering: 'optimizeLegibility',
        fontFeatureSettings: '"liga" 1',
        filter: 'saturate(1.1) contrast(1.05)',
      }}
    >
      {emoji}
    </span>
  )
}

export type MoodType = 'euphoric' | 'excited' | 'confident' | 'focused' | 'optimistic' | 'neutral' | 'cautious' | 'anxious' | 'frustrated' | 'stressed' | 'overwhelmed' | 'fearful'

export interface MoodEntry {
  date: string // YYYY-MM-DD format
  mood: MoodType
  notes?: string
  timestamp: number
}

const moodOptions: { 
  value: MoodType; 
  label: string; 
  emoji: string; 
  description: string;
  category: 'positive' | 'neutral' | 'negative';
}[] = [
  { value: 'euphoric', label: 'Euphoric', emoji: '🤩', description: 'Extremely excited and overjoyed about market opportunities', category: 'positive' },
  { value: 'excited', label: 'Excited', emoji: '😄', description: 'Energetic and optimistic about trading opportunities', category: 'positive' },
  { value: 'confident', label: 'Confident', emoji: '😎', description: 'Self-assured and ready to execute my strategy', category: 'positive' },
  { value: 'focused', label: 'Focused', emoji: '🎯', description: 'Clear-minded and concentrated on trading goals', category: 'positive' },
  { value: 'optimistic', label: 'Optimistic', emoji: '😊', description: 'Positive outlook on market conditions and trades', category: 'positive' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', description: 'Balanced and objective mindset', category: 'neutral' },
  { value: 'cautious', label: 'Cautious', emoji: '🤔', description: 'Careful and thoughtful about market risks', category: 'neutral' },
  { value: 'anxious', label: 'Anxious', emoji: '😰', description: 'Worried or nervous about market conditions', category: 'negative' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😤', description: 'Annoyed or upset with recent performance', category: 'negative' },
  { value: 'stressed', label: 'Stressed', emoji: '😫', description: 'Feeling pressure and tension from trading decisions', category: 'negative' },
  { value: 'overwhelmed', label: 'Overwhelmed', emoji: '🤯', description: 'Feeling unable to process information or make decisions', category: 'negative' },
  { value: 'fearful', label: 'Fearful', emoji: '😨', description: 'Scared or worried about potential losses', category: 'negative' }
]

const categoryColors = {
  positive: 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f0f0f]',
  neutral: 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f0f0f]',
  negative: 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f0f0f]'
}

interface MoodSelectionModalProps {
  open: boolean
  onClose: () => void
  onMoodSelected: (mood: MoodType, notes?: string) => void
  selectedDate: Date
}

export function MoodSelectionModal({ 
  open, 
  onClose, 
  onMoodSelected, 
  selectedDate 
}: MoodSelectionModalProps) {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null)
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    if (selectedMood) {
      onMoodSelected(selectedMood, notes.trim() || undefined)
      // Reset form
      setSelectedMood(null)
      setNotes('')
    }
  }

  const handleClose = () => {
    setSelectedMood(null)
    setNotes('')
    onClose()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Group moods by category
  const moodsByCategory = {
    positive: moodOptions.filter(m => m.category === 'positive'),
    neutral: moodOptions.filter(m => m.category === 'neutral'),
    negative: moodOptions.filter(m => m.category === 'negative')
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#0f0f0f] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg h-[70vh] z-50 flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-semibold bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">
                  How are you feeling?
                </Dialog.Title>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(selectedDate)}
                </p>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Track your emotional state to better understand patterns in your trading performance.
              </p>

              <RadioGroup.Root
                value={selectedMood || ''}
                onValueChange={(value) => setSelectedMood(value as MoodType)}
                className="space-y-4"
              >
                {Object.entries(moodsByCategory).map(([category, moods]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                      {category} Emotions
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {moods.map((mood) => (
                        <RadioGroup.Item
                          key={mood.value}
                          value={mood.value}
                          className={`group relative p-4 rounded-xl transition-all duration-200 cursor-pointer ${
                            selectedMood === mood.value
                              ? 'bg-blue-50 dark:bg-blue-950/50'
                              : `${categoryColors[mood.category]} hover:bg-gray-50 dark:hover:bg-[#1a1a1a]`
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div>
                              <AppleEmoji emoji={mood.emoji} className="w-8 h-8" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">
                                  {mood.label}
                                </span>
                                <RadioGroup.Indicator className="w-2 h-2 rounded-full bg-blue-500 animate-in zoom-in-0 duration-200" />
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {mood.description}
                              </p>
                            </div>
                          </div>
                        </RadioGroup.Item>
                      ))}
                    </div>
                    {category !== 'negative' && <Separator.Root className="h-px bg-gray-200 dark:bg-gray-700 my-4" />}
                  </div>
                ))}
              </RadioGroup.Root>
            </div>

            <div className="mb-6">
              <label htmlFor="mood-notes" className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                Additional context (optional)
              </label>
              <textarea
                id="mood-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What's driving this feeling? Market events, personal factors, recent trades..."
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                rows={3}
              />
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <div className="flex gap-3">
              <Dialog.Close asChild>
                <button
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-medium"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleSubmit}
                disabled={!selectedMood}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg disabled:shadow-none"
              >
                Continue to Journal
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
