'use client'

import { motion } from 'framer-motion'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { NotebookEditor } from '@/components/features/notes/NotebookEditor'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePageTitle } from '@/hooks/use-page-title'
import { ProgressWidget } from '@/components/ui/progress-widget'
import { CalendarWidget } from '@/components/ui/calendar-widget'
import { themeColors } from '@/config/theme'
import { PageLoading } from '@/components/ui/loading-spinner'

export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  folder: string
  tags: string[]
  color?: string
}

function JournalPageContent() {
  usePageTitle('Journal')
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date') // Format: YYYY-MM-DD
  
  // Helper function to get initial title based on date param or current date
  const getInitialTitle = () => {
    let targetDate = new Date()
    
    if (dateParam && dateParam.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Parse the date parameter (YYYY-MM-DD) carefully to avoid timezone issues
      const [year, month, day] = dateParam.split('-').map(num => parseInt(num, 10))
      const parsedDate = new Date(year, month - 1, day) // month is 0-indexed
      
      // Validate the parsed date
      if (!isNaN(parsedDate.getTime()) && 
          parsedDate.getFullYear() === year && 
          parsedDate.getMonth() === month - 1 && 
          parsedDate.getDate() === day) {
        targetDate = parsedDate
      }
    }
    
    return targetDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const [currentNote, setCurrentNote] = useState<Note>({
    id: '1',
    title: getInitialTitle(),
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    folder: 'Journal',
    tags: [],
    color: themeColors.primary
  })

  // Update title when date parameter changes
  useEffect(() => {
    const getUpdatedTitle = () => {
      let targetDate = new Date()
      
      if (dateParam && dateParam.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Parse the date parameter (YYYY-MM-DD) carefully to avoid timezone issues
        const [year, month, day] = dateParam.split('-').map(num => parseInt(num, 10))
        const parsedDate = new Date(year, month - 1, day) // month is 0-indexed
        
        // Validate the parsed date
        if (!isNaN(parsedDate.getTime()) && 
            parsedDate.getFullYear() === year && 
            parsedDate.getMonth() === month - 1 && 
            parsedDate.getDate() === day) {
          targetDate = parsedDate
        }
      }
      
      return targetDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    setCurrentNote(prev => ({
      ...prev,
      title: getUpdatedTitle(),
      updatedAt: new Date().toISOString()
    }))
  }, [dateParam])

  const handleUpdateNote = (id: string, content: string, title?: string, color?: string, tags?: string[]) => {
    console.log('Updating journal entry:', id, 'with content length:', content.length)
    setCurrentNote(prev => ({
      ...prev,
      content,
      updatedAt: new Date().toISOString(),
      // Don't allow title updates from editor - we'll handle date changes separately
      // Only update color if explicitly provided
      ...(color !== undefined && { color }),
      // Only update tags if explicitly provided
      ...(tags !== undefined && { tags })
    }))
  }

  const handleDateChange = (selectedDate: Date) => {
    const formattedDate = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    setCurrentNote(prev => ({
      ...prev,
      title: formattedDate,
      updatedAt: new Date().toISOString()
    }))
  }


  const handleDeleteNote = () => {
    // For single notepad, just clear the content
    setCurrentNote(prev => ({
      ...prev,
      content: '',
      title: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      updatedAt: new Date().toISOString()
    }))
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[var(--color-bg-dark,#1C1C1C)]">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-[var(--color-bg-dark,#1C1C1C)] p-6">
          <div className="flex gap-6 h-full">
            {/* Main Notepad - Left Side */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 flex flex-col bg-white dark:bg-[var(--color-surface-dark,#171717)] rounded-xl overflow-hidden shadow-lg"
            >
              <NotebookEditor 
                note={currentNote} 
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                useDatePicker={true}
                onDateChange={handleDateChange}
              />
            </motion.div>

            {/* Right Sidebar Widgets */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-80 space-y-6"
            >
              <ProgressWidget 
                completed={0}
                total={0}
                title="Progress"
                emptyMessage="No active rules today"
              />

              <CalendarWidget 
                title="Calendar"
                hasEvents={false}
                emptyMessage="No economic events available for current filters."
              />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function JournalPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-gray-50 dark:bg-[var(--color-bg-dark,#1C1C1C)]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-[var(--color-bg-dark,#1C1C1C)] p-6">
            <div className="flex gap-6 h-full">
              <div className="flex-1 flex flex-col bg-white dark:bg-[var(--color-surface-dark,#171717)] rounded-xl overflow-hidden shadow-lg">
                <PageLoading text="Loading Journal..." />
              </div>
            </div>
          </main>
        </div>
      </div>
    }>
      <JournalPageContent />
    </Suspense>
  )
} 