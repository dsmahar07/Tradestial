'use client'

import { logger } from '@/lib/logger'

import React, { useState, useEffect } from 'react'
import { Search, Image as ImageIcon, Video as VideoIcon } from 'lucide-react'

export interface MediaItem {
  id: string
  name: string
  type: 'image' | 'video'
  url: string
  size: number
  uploadDate: string
  category: string
  tags: string[]
}

interface ImageMentionPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelectImage: (image: MediaItem) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  position: { top: number; left: number }
}

export function ImageMentionPicker({
  isOpen,
  onClose,
  onSelectImage,
  searchQuery,
  onSearchChange,
  position
}: ImageMentionPickerProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])

  useEffect(() => {
    // Load media items from localStorage (same as gallery page)
    if (typeof window !== 'undefined') {
      const savedItems = localStorage.getItem('gallery-media')
      if (savedItems) {
        try {
          setMediaItems(JSON.parse(savedItems))
        } catch (error) {
          logger.error('Error loading gallery items:', error)
        }
      }
    }
  }, [])

  const filteredItems = mediaItems.filter(item => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }).slice(0, 6) // Limit to 6 items for better UX

  if (!isOpen) return null

  return (
    <div 
      className="fixed z-50 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#404040] rounded-lg shadow-lg w-80 max-h-96 overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Search Header */}
      <div className="p-3 border-b border-gray-200 dark:border-[#404040]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#404040] rounded-md text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      </div>

      {/* Image Grid */}
      <div className="max-h-80 overflow-y-auto">
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 p-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectImage(item)}
                className="group cursor-pointer bg-gray-50 dark:bg-[#1a1a1a] rounded-lg overflow-hidden hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors"
              >
                {item.type === 'image' ? (
                  <div className="aspect-video relative">
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-200 dark:bg-[#2a2a2a] flex items-center justify-center">
                    <VideoIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="p-2">
                  <div className="flex items-center gap-1 mb-1">
                    {item.type === 'image' ? (
                      <ImageIcon className="w-3 h-3 text-gray-400" />
                    ) : (
                      <VideoIcon className="w-3 h-3 text-gray-400" />
                    )}
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {item.name}
                    </span>
                  </div>
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 2 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{item.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No images found' : 'No images available'}
          </div>
        )}
      </div>
    </div>
  )
}
