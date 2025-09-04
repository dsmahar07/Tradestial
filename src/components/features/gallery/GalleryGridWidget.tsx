'use client'

import React from 'react'
import {
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Download,
  Trash2,
  Play,
} from 'lucide-react'
import { Root as FancyButton } from '@/components/ui/fancy-button'

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

interface GalleryGridWidgetProps {
  items: MediaItem[]
  onItemClick: (index: number) => void
  onDeleteItem: (id: string) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onUploadClick: () => void
  formatFileSize: (bytes: number) => string
  formatDate: (iso: string) => string
}

export function GalleryGridWidget({
  items,
  onItemClick,
  onDeleteItem,
  onDrop,
  onDragOver,
  onUploadClick,
  formatFileSize,
  formatDate
}: GalleryGridWidgetProps) {
  if (items.length === 0) {
    return (
      <div className="flex-1 bg-white dark:bg-[#0f0f0f] p-6">
        <div className="h-full flex items-center justify-center" onDrop={onDrop} onDragOver={onDragOver}>
          <div className="max-w-3xl text-center mx-auto ring-1 ring-gray-200 dark:ring-[#404040] rounded-2xl p-12 bg-white/60 dark:bg-[#0f0f0f]/60 backdrop-blur">
            <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 flex items-center justify-center">
              <Upload className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Drag and drop to upload</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Drop images or videos here, or choose files to begin.</p>
            <div className="mt-6">
              <FancyButton
                onClick={onUploadClick}
                variant="primary"
                size="medium"
              >
                <Upload className="h-4 w-4" />
                Choose files
              </FancyButton>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-white dark:bg-[#0f0f0f] p-6 overflow-y-auto">
      <div
        className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className="bg-white dark:bg-[#0f0f0f] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-[#404040] group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate mb-2">
                  {item.tags.length > 0 ? item.tags[0] : item.type === 'image' ? 'Trading Chart' : 'Trading Video'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {item.tags.length > 0
                    ? `Tagged with ${item.tags.slice(0, 3).join(', ')}${item.tags.length > 3 ? ` and ${item.tags.length - 3} more` : ''}`
                    : 'Trading chart analysis and market insights'
                  }
                </p>
              </div>

              {/* Avatar */}
              <div className="ml-4 flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-10 h-10 object-contain"
                />
              </div>
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="mb-4">
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-[#3559E9]/10 text-[#3559E9] dark:bg-[#3559E9]/20">
                  {item.tags[0]}
                </span>
              </div>
            )}

            {/* Image/Video Preview */}
            <div
              className="aspect-video w-full bg-gray-100 dark:bg-[#1a1a1a] rounded-xl overflow-hidden mb-4 cursor-pointer"
              onClick={() => onItemClick(index)}
            >
              {item.type === 'image' ? (
                <img
                  src={item.url}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                />
              ) : (
                <div className="relative h-full w-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-gray-900/80 text-white dark:bg-white/80 dark:text-gray-900 flex items-center justify-center backdrop-blur">
                    <Play className="h-6 w-6" />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <Download className="h-4 w-4" />
                  <span>{formatFileSize(item.size)}</span>
                </span>
                <span className="flex items-center space-x-1">
                  {item.type === 'image' ? <ImageIcon className="h-4 w-4" /> : <VideoIcon className="h-4 w-4" />}
                  <span>{item.type.toUpperCase()}</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <FancyButton
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    const link = document.createElement('a')
                    link.href = item.url
                    link.download = item.name
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}
                  variant="basic"
                  size="xsmall"
                  className="!p-1.5"
                >
                  <Download className="h-4 w-4" />
                </FancyButton>
                <FancyButton
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    onDeleteItem(item.id)
                  }}
                  variant="destructive"
                  size="xsmall"
                  className="!p-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                </FancyButton>
              </div>
            </div>

            {/* Date */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#404040]">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(item.uploadDate)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
