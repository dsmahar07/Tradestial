'use client'

import { Search, Filter, Maximize, Minimize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import Image from 'next/image'

interface NotebookTopSearchProps {
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
}

export function NotebookTopSearch({ onToggleFullscreen, isFullscreen }: NotebookTopSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="px-6 py-4 border-b border-gray-200 dark:border-[#404040] bg-white dark:bg-[#0f0f0f] flex-shrink-0 rounded-t-xl">
      <div className="flex items-center justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#888888]" />
          <input
            type="text"
            placeholder="Search notes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#404040] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 text-gray-400 dark:text-[#888888] hover:text-gray-600 dark:hover:text-[#CCCCCC]"
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Fullscreen toggle button */}
          {onToggleFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFullscreen}
              className="h-8 w-8 text-gray-400 dark:text-[#888888] hover:text-gray-600 dark:hover:text-[#CCCCCC]"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          )}
          
          {/* Tradestial Logo */}
          <div className="w-10 h-10 relative">
            <Image
              src="/Branding/Tradestial.png"
              alt="Tradestial Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  )
}