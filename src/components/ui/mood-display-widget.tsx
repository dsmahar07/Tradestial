'use client'

import { useEffect, useState } from 'react'
import { MoodTrackerService } from '@/services/mood-tracker.service'
import { MoodType, MoodEntry } from '@/components/features/mood-selection-modal'
import { Edit3, Heart } from 'lucide-react'
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

const moodConfig: Record<MoodType, { emoji: string; color: string; borderColor: string }> = {
  euphoric: { emoji: '🤩', color: 'text-emerald-600', borderColor: 'border-l-emerald-500' },
  excited: { emoji: '😄', color: 'text-green-600', borderColor: 'border-l-green-500' },
  confident: { emoji: '😎', color: 'text-blue-600', borderColor: 'border-l-blue-500' },
  focused: { emoji: '🎯', color: 'text-indigo-600', borderColor: 'border-l-indigo-500' },
  optimistic: { emoji: '😊', color: 'text-teal-600', borderColor: 'border-l-teal-500' },
  neutral: { emoji: '😐', color: 'text-gray-600', borderColor: 'border-l-gray-500' },
  cautious: { emoji: '🤔', color: 'text-amber-600', borderColor: 'border-l-amber-500' },
  anxious: { emoji: '😰', color: 'text-yellow-600', borderColor: 'border-l-yellow-500' },
  frustrated: { emoji: '😤', color: 'text-orange-600', borderColor: 'border-l-orange-500' },
  stressed: { emoji: '😫', color: 'text-pink-600', borderColor: 'border-l-pink-500' },
  overwhelmed: { emoji: '🤯', color: 'text-red-600', borderColor: 'border-l-red-500' },
  fearful: { emoji: '😨', color: 'text-rose-600', borderColor: 'border-l-rose-500' }
}

interface MoodDisplayWidgetProps {
  selectedDate: string // YYYY-MM-DD format
  onEditMood?: (mood: MoodEntry) => void
}

export function MoodDisplayWidget({ selectedDate, onEditMood }: MoodDisplayWidgetProps) {
  const [moodEntry, setMoodEntry] = useState<MoodEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadMoodEntry = () => {
      setIsLoading(true)
      try {
        // Parse the selected date string to create a Date object
        const [year, month, day] = selectedDate.split('-').map(Number)
        const date = new Date(year, month - 1, day) // month is 0-indexed
        
        const entry = MoodTrackerService.getMoodEntry(date)
        setMoodEntry(entry)
      } catch (error) {
        console.error('Failed to load mood entry:', error)
        setMoodEntry(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadMoodEntry()
  }, [selectedDate])

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!moodEntry) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="text-center py-6">
          <Heart className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            No mood logged for this day
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Mood is captured when you first access the journal
          </p>
        </div>
      </div>
    )
  }

  const config = moodConfig[moodEntry.mood]
  const formattedTime = new Date(moodEntry.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-l-4 ${config.borderColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-full flex items-center justify-center">
            <AppleEmoji emoji={config.emoji} className="w-6 h-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-medium ${config.color} capitalize`}>
                {moodEntry.mood}
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formattedTime}
              </span>
            </div>
            
            {moodEntry.notes && (
              <p className="text-sm text-gray-600 dark:text-gray-300 break-words">
                {moodEntry.notes}
              </p>
            )}
            
            {!moodEntry.notes && (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                No additional notes
              </p>
            )}
          </div>
        </div>
        
        {onEditMood && (
          <button
            onClick={() => onEditMood(moodEntry)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Edit mood"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Mood Tracking</span>
          <span>Journal Day</span>
        </div>
      </div>
    </div>
  )
}
