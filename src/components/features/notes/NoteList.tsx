'use client'

import { motion } from 'framer-motion'
import { Search, Filter, MoreHorizontal, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Note } from '@/app/notes/page'
import { useState } from 'react'

interface NoteListProps {
  selectedFolder: string
  selectedNote: Note | null
  onNoteSelect: (note: Note) => void
}

// Mock data - you can replace this with real data from your backend
const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Thu Apr 13, 2023',
    content: 'Pre-Market Watchlist and session thoughts...',
    createdAt: '2023-07-20T09:00:00Z',
    updatedAt: '2023-07-20T09:00:00Z',
    folder: 'Trade Notes',
    tags: ['SPY', 'AMZN']
  },
  {
    id: '2', 
    title: 'Mon Jul 10, 2023',
    content: 'Today was a challenging day...',
    createdAt: '2023-07-10T09:00:00Z',
    updatedAt: '2023-07-10T09:00:00Z',
    folder: 'Daily Journal',
    tags: ['Mistakes']
  },
  {
    id: '3',
    title: 'Tue May 09, 2023',
    content: 'Great session today with solid execution...',
    createdAt: '2023-05-09T09:00:00Z',
    updatedAt: '2023-05-09T09:00:00Z',
    folder: 'Sessions Recap',
    tags: ['Good Trades']
  },
  {
    id: '4',
    title: 'Mon Apr 05, 2023',
    content: 'Market analysis and preparation...',
    createdAt: '2023-04-05T09:00:00Z',
    updatedAt: '2023-04-05T09:00:00Z',
    folder: 'Trading Plan',
    tags: ['Planning']
  },
  {
    id: '5',
    title: 'Tue Mar 21, 2023',
    content: 'FOMC day trading strategy...',
    createdAt: '2023-03-21T09:00:00Z',
    updatedAt: '2023-03-21T09:00:00Z',
    folder: 'Trade Notes',
    tags: ['FOMC']
  },
  {
    id: '6',
    title: 'Wed Mar 08, 2023',
    content: 'Weekly performance review...',
    createdAt: '2023-03-08T09:00:00Z',
    updatedAt: '2023-03-08T09:00:00Z',
    folder: 'Sessions Recap',
    tags: ['Review']
  }
]

export function NoteList({ selectedFolder, selectedNote, onNoteSelect }: NoteListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filter notes based on selected folder and search query
  const filteredNotes = mockNotes.filter(note => {
    const matchesFolder = selectedFolder === 'All notes' || note.folder === selectedFolder
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesFolder && matchesSearch
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatPnl = (pnl: number | undefined) => {
    if (!pnl) return null
    const isPositive = pnl > 0
    return (
      <div className={cn(
        "flex items-center space-x-1 text-xs font-medium",
        isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
      )}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>${Math.abs(pnl).toFixed(2)}</span>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="w-80 bg-white dark:bg-[#171717] border-r border-gray-200 dark:border-gray-700 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Log day</h2>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="julie"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#404040] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Filter className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Select All */}
        <div className="mt-3 flex items-center space-x-2">
          <input type="checkbox" className="rounded" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Select All</span>
        </div>
      </div>

      {/* Note List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.map((note) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ x: 2 }}
            transition={{ duration: 0.1 }}
            onClick={() => onNoteSelect(note)}
            className={cn(
              "p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors",
              selectedNote?.id === note.id
                ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
                : "hover:bg-gray-50 dark:hover:bg-[#2A2A2A]"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {note.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDate(note.createdAt)}
                </p>
              </div>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
              {note.content}
            </p>
            
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-gray-100 dark:bg-[#1C1C1C] text-gray-600 dark:text-gray-400 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}