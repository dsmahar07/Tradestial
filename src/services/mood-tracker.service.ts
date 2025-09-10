import { logger } from '@/lib/logger'

import { MoodEntry, MoodType } from '@/components/features/mood-selection-modal'

export class MoodTrackerService {
  private static readonly STORAGE_KEY = 'tradestial_mood_entries'

  /**
   * Save a mood entry for a specific date
   */
  static saveMoodEntry(date: Date, mood: MoodType, notes?: string): void {
    const dateStr = this.formatDateKey(date)
    const entries = this.getAllMoodEntries()
    
    const moodEntry: MoodEntry = {
      date: dateStr,
      mood,
      notes,
      timestamp: Date.now()
    }

    // Replace existing entry for the same date or add new one
    const existingIndex = entries.findIndex(entry => entry.date === dateStr)
    if (existingIndex >= 0) {
      entries[existingIndex] = moodEntry
    } else {
      entries.push(moodEntry)
    }

    // Sort by date (newest first)
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries))
  }

  /**
   * Get mood entry for a specific date
   */
  static getMoodEntry(date: Date): MoodEntry | null {
    const dateStr = this.formatDateKey(date)
    const entries = this.getAllMoodEntries()
    return entries.find(entry => entry.date === dateStr) || null
  }

  /**
   * Get all mood entries
   */
  static getAllMoodEntries(): MoodEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []
      return JSON.parse(stored) as MoodEntry[]
    } catch (error) {
      logger.error('Failed to load mood entries:', error)
      return []
    }
  }

  /**
   * Get mood entries within a date range
   */
  static getMoodEntriesInRange(startDate: Date, endDate: Date): MoodEntry[] {
    const entries = this.getAllMoodEntries()
    const startStr = this.formatDateKey(startDate)
    const endStr = this.formatDateKey(endDate)
    
    return entries.filter(entry => {
      return entry.date >= startStr && entry.date <= endStr
    })
  }

  /**
   * Get mood statistics for analytics
   */
  static getMoodStatistics(): {
    totalEntries: number
    moodDistribution: Record<MoodType, number>
    recentMood?: MoodType
    moodTrend: { date: string; mood: MoodType }[]
  } {
    const entries = this.getAllMoodEntries()
    const moodDistribution: Record<MoodType, number> = {
      euphoric: 0,
      excited: 0,
      confident: 0,
      focused: 0,
      optimistic: 0,
      neutral: 0,
      cautious: 0,
      anxious: 0,
      frustrated: 0,
      stressed: 0,
      overwhelmed: 0,
      fearful: 0
    }

    entries.forEach(entry => {
      moodDistribution[entry.mood]++
    })

    const recentEntries = entries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30) // Last 30 entries

    return {
      totalEntries: entries.length,
      moodDistribution,
      recentMood: entries[0]?.mood,
      moodTrend: recentEntries.map(entry => ({
        date: entry.date,
        mood: entry.mood
      }))
    }
  }

  /**
   * Delete mood entry for a specific date
   */
  static deleteMoodEntry(date: Date): void {
    const dateStr = this.formatDateKey(date)
    const entries = this.getAllMoodEntries()
    const filtered = entries.filter(entry => entry.date !== dateStr)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
  }

  /**
   * Check if user has logged mood for today
   */
  static hasTodaysMood(): boolean {
    const today = new Date()
    return this.getMoodEntry(today) !== null
  }

  /**
   * Get mood entries count by mood type
   */
  static getMoodCount(mood: MoodType): number {
    const entries = this.getAllMoodEntries()
    return entries.filter(entry => entry.mood === mood).length
  }

  /**
   * Export mood data for backup
   */
  static exportMoodData(): string {
    const entries = this.getAllMoodEntries()
    return JSON.stringify(entries, null, 2)
  }

  /**
   * Import mood data from backup
   */
  static importMoodData(jsonData: string): boolean {
    try {
      const entries = JSON.parse(jsonData) as MoodEntry[]
      
      // Validate structure
      if (!Array.isArray(entries)) {
        throw new Error('Invalid data format')
      }

      entries.forEach(entry => {
        if (!entry.date || !entry.mood || !entry.timestamp) {
          throw new Error('Invalid entry structure')
        }
      })

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries))
      return true
    } catch (error) {
      logger.error('Failed to import mood data:', error)
      return false
    }
  }

  /**
   * Format date to YYYY-MM-DD string for consistent storage keys
   */
  private static formatDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * Clear all mood data (for testing/reset purposes)
   */
  static clearAllMoodData(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }
}
