'use client'

import React from 'react'
import {
  X,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Video as VideoIcon,
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

interface GalleryViewerWidgetProps {
  isOpen: boolean
  selectedItem: MediaItem | null
  items: MediaItem[]
  currentIndex: number | null
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  onDelete: (id: string) => void
  formatFileSize: (bytes: number) => string
  formatDate: (iso: string) => string
}

export function GalleryViewerWidget({
  isOpen,
  selectedItem,
  items,
  currentIndex,
  onClose,
  onPrevious,
  onNext,
  onDelete,
  formatFileSize,
  formatDate
}: GalleryViewerWidgetProps) {
  if (!isOpen || !selectedItem) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <FancyButton
        className="absolute top-6 right-6 h-10 w-10 !bg-white/10 !text-white hover:!bg-white/20 !border-none"
        onClick={onClose}
        variant="basic"
        size="xsmall"
      >
        <X className="h-5 w-5" />
      </FancyButton>

      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="relative bg-white dark:bg-[#0f0f0f] rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] p-12 ring-2 ring-gray-200 dark:ring-[#404040] backdrop-blur-sm">
          {selectedItem.type === 'image' ? (
            <img
              src={selectedItem.url}
              alt={selectedItem.name}
              className="max-w-[70vw] max-h-[60vh] object-contain rounded-2xl shadow-lg"
            />
          ) : (
            <video
              src={selectedItem.url}
              className="max-w-[70vw] max-h-[60vh] rounded-2xl shadow-lg"
              controls
              autoPlay
            />
          )}
        </div>
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 text-white px-4 py-2 text-sm backdrop-blur">
          {selectedItem.type === 'image' ? <ImageIcon className="h-4 w-4" /> : <VideoIcon className="h-4 w-4" />}
          {selectedItem.name}
        </span>
        <span className="rounded-full bg-white/10 text-white px-3 py-2 text-xs backdrop-blur">{formatFileSize(selectedItem.size)}</span>
        <span className="rounded-full bg-white/10 text-white px-3 py-2 text-xs backdrop-blur">{formatDate(selectedItem.uploadDate)}</span>
        <FancyButton
          onClick={() => {
            const link = document.createElement('a')
            link.href = selectedItem.url
            link.download = selectedItem.name
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
          }}
          variant="neutral"
          size="small"
          className="ml-3"
        >
          <Download className="h-4 w-4" /> Download
        </FancyButton>
        <FancyButton
          onClick={() => onDelete(selectedItem.id)}
          variant="destructive"
          size="small"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </FancyButton>
      </div>

      {/* Nav arrows */}
      {items.length > 1 && (
        <>
          <FancyButton
            onClick={onPrevious}
            className="absolute left-6 top-1/2 -translate-y-1/2 h-11 w-11 !bg-white/10 !text-white hover:!bg-white/20 !border-none"
            variant="basic"
            size="xsmall"
          >
            <ChevronLeft className="h-6 w-6" />
          </FancyButton>
          <FancyButton
            onClick={onNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 h-11 w-11 !bg-white/10 !text-white hover:!bg-white/20 !border-none"
            variant="basic"
            size="xsmall"
          >
            <ChevronRight className="h-6 w-6" />
          </FancyButton>
        </>
      )}
    </div>
  )
}
