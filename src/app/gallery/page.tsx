'use client'

import { motion } from 'framer-motion'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { usePageTitle } from '@/hooks/use-page-title'
import { Root as FancyButton } from '@/components/ui/fancy-button'
import { GalleryGridWidget, MediaItem } from '@/components/features/gallery/GalleryGridWidget'
import { GalleryUploadWidget, TagInput } from '@/components/features/gallery/GalleryUploadWidget'
import { GalleryViewerWidget } from '@/components/features/gallery/GalleryViewerWidget'
import { GalleryTopSearch } from '@/components/features/gallery/GalleryTopSearch'


export default function GalleryPage() {
  usePageTitle('Gallery')
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'images' | 'videos'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date')

  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [pendingUploads, setPendingUploads] = useState<MediaItem[]>([])
  const [pendingTags, setPendingTags] = useState<string[]>([])
  const tagInputRef = useRef<{ finalize: () => string[] } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('gallery-media')
    if (saved) {
      try {
        const parsed: MediaItem[] = JSON.parse(saved)
        setMediaItems(parsed.map(i => ({ ...i, tags: i.tags ?? [] })))
      } catch {
        // ignore
      }
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (mediaItems.length > 0) {
      localStorage.setItem('gallery-media', JSON.stringify(mediaItems))
    }
  }, [mediaItems])

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleFileUpload = async (files: FileList) => {
    const nextItems: MediaItem[] = []
    
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        // Convert file to base64 for persistent storage
        const base64Url = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        
        nextItems.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          url: base64Url,
          size: file.size,
          uploadDate: new Date().toISOString(),
          category: 'General',
          tags: [],
        })
      }
    }
    
    if (nextItems.length) {
      setPendingUploads(nextItems)
      setPendingTags([])
      setTagModalOpen(true)
    }
  }

  const confirmTagsForPending = () => {
    if (pendingUploads.length === 0) {
      setTagModalOpen(false)
      return
    }
    const finalTags = tagInputRef.current?.finalize() ?? pendingTags
    const withTags = pendingUploads.map(item => ({ ...item, tags: finalTags }))
    const newMediaItems = [...withTags, ...mediaItems]
    setMediaItems(newMediaItems)
    
    // Immediately save to localStorage
    localStorage.setItem('gallery-media', JSON.stringify(newMediaItems))
    
    setPendingUploads([])
    setPendingTags([])
    setTagModalOpen(false)
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) await handleFileUpload(files)
  }

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files) await handleFileUpload(e.dataTransfer.files)
  }

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault()

  const deleteMedia = (id: string) => {
    const updatedItems = mediaItems.filter(m => m.id !== id)
    setMediaItems(updatedItems)
    
    // Update localStorage immediately
    if (updatedItems.length > 0) {
      localStorage.setItem('gallery-media', JSON.stringify(updatedItems))
    } else {
      localStorage.removeItem('gallery-media')
    }
    
    if (viewerIndex !== null) {
      const idx = filteredAndSortedItems.findIndex(m => m.id === id)
      if (idx === viewerIndex) {
        setViewerOpen(false)
        setViewerIndex(null)
      }
    }
  }

  const filteredAndSortedItems = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return mediaItems
      .filter(item => {
        const matchesSearch =
          item.name.toLowerCase().includes(q) ||
          item.tags.some(t => t.toLowerCase().includes(q))
        const matchesType =
          filterType === 'all' ||
          (filterType === 'images' && item.type === 'image') ||
          (filterType === 'videos' && item.type === 'video')
        return matchesSearch && matchesType
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name)
          case 'size':
            return b.size - a.size
          case 'date':
          default:
            return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        }
      })
  }, [mediaItems, searchQuery, filterType, sortBy])

  const openViewerAt = (index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  const closeViewer = () => {
    setViewerOpen(false)
    setViewerIndex(null)
  }

  const showPrev = () => {
    if (!viewerOpen || viewerIndex === null || filteredAndSortedItems.length === 0) return
    setViewerIndex((prev) => (prev! - 1 + filteredAndSortedItems.length) % filteredAndSortedItems.length)
  }

  const showNext = () => {
    if (!viewerOpen || viewerIndex === null || filteredAndSortedItems.length === 0) return
    setViewerIndex((prev) => (prev! + 1) % filteredAndSortedItems.length)
  }

  // Keyboard navigation for viewer
  useEffect(() => {
    if (!viewerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeViewer()
      if (e.key === 'ArrowLeft') showPrev()
      if (e.key === 'ArrowRight') showNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewerOpen])

  const selected = viewerIndex !== null ? filteredAndSortedItems[viewerIndex] : null

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 min-h-0 overflow-hidden px-6 pb-6 pt-6 bg-[#fafafa] dark:bg-[#171717]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="h-full min-h-0 flex flex-col bg-white dark:bg-[#0f0f0f] rounded-xl overflow-hidden shadow-lg"
          >
            {/* Top Search Bar */}
            <GalleryTopSearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              onUploadClick={() => fileInputRef.current?.click()}
            />
            
            
            {/* Gallery Grid Widget */}
            <GalleryGridWidget
              items={filteredAndSortedItems}
              onItemClick={openViewerAt}
              onDeleteItem={deleteMedia}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onUploadClick={() => fileInputRef.current?.click()}
              formatFileSize={formatFileSize}
              formatDate={formatDate}
            />
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </motion.div>
        </main>
      </div>

      {/* Tag modal */}
      <Dialog open={tagModalOpen} onClose={confirmTagsForPending}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add tags to {pendingUploads.length} file{pendingUploads.length > 1 ? 's' : ''}</DialogTitle>
          </DialogHeader>
          <div className="mt-3 space-y-4">
            <TagInput tags={pendingTags} onChange={setPendingTags} ref={tagInputRef} />
            {pendingUploads.length > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Example: strategy, ticker, timeframe. You can press Save without tags.
              </div>
            )}
          </div>
          <DialogFooter className="mt-6">
            <FancyButton
              variant="basic"
              size="small"
              onClick={() => {
                // Add without tags
                setMediaItems(prev => [...pendingUploads, ...prev])
                setPendingUploads([])
                setPendingTags([])
                setTagModalOpen(false)
              }}
            >
              Skip
            </FancyButton>
            <FancyButton
              variant="primary"
              size="small"
              onClick={confirmTagsForPending}
            >
              Save Tags
            </FancyButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gallery Viewer Widget */}
      <GalleryViewerWidget
        isOpen={viewerOpen}
        selectedItem={selected}
        items={filteredAndSortedItems}
        currentIndex={viewerIndex}
        onClose={closeViewer}
        onPrevious={showPrev}
        onNext={showNext}
        onDelete={(id) => {
          deleteMedia(id)
          closeViewer()
        }}
        formatFileSize={formatFileSize}
        formatDate={formatDate}
      />
    </div>
  )
}