'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import React, { useEffect, useMemo, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import {
  Upload,
  Search,
  Image as ImageIcon,
  Video as VideoIcon,
  X,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Play,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { usePageTitle } from '@/hooks/use-page-title'

// Lightweight tag input (exposes finalize to capture current input)
const TagInput = forwardRef(function TagInput(
  { tags, onChange, placeholder = 'Add tags and press Enter' }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string },
  ref: React.Ref<{ finalize: () => string[] }>
) {
  const [value, setValue] = useState('')

  const addFromValue = () => {
    const raw = value
      .split(/[\,\n]/)
      .map(t => t.trim())
      .filter(Boolean)
    if (raw.length === 0) return tags
    const next = Array.from(new Set([...tags, ...raw]))
    onChange(next)
    setValue('')
    return next
  }

  useImperativeHandle(ref, () => ({
    finalize: () => addFromValue(),
  }))

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-neutral-200/70 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 px-2 py-1 text-xs">
            {t}
            <button
              type="button"
              onClick={() => onChange(tags.filter(x => x !== t))}
              className="ml-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5"
              aria-label={`Remove ${t}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            addFromValue()
          }
        }}
        placeholder={placeholder}
        className="w-full rounded-lg bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/10"
      />
      <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">Separate with Enter or comma. Tags apply to these uploads.</div>
    </div>
  )
})

type MediaItem = {
  id: string
  name: string
  type: 'image' | 'video'
  url: string
  size: number
  uploadDate: string
  category: string
  tags: string[]
}

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
    localStorage.setItem('gallery-media', JSON.stringify(mediaItems))
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

  const handleFileUpload = (files: FileList) => {
    const nextItems: MediaItem[] = []
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file)
        nextItems.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          url,
          size: file.size,
          uploadDate: new Date().toISOString(),
          category: 'General',
          tags: [],
        })
      }
    })
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
    setMediaItems(prev => [...withTags, ...prev])
    setPendingUploads([])
    setPendingTags([])
    setTagModalOpen(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) handleFileUpload(files)
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files)
  }

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault()

  const deleteMedia = (id: string) => {
    setMediaItems(prev => prev.filter(m => m.id !== id))
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
    <div className="flex h-screen bg-white dark:bg-[#0B0B0B]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto">
          {/* Hero */}
          <section className="relative">
            <div className="border-b border-black/5 dark:border-white/10">
              <div className="container mx-auto px-6 py-16 sm:py-20">
                <div className="text-center">
                  <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Gallery</h1>
                  <p className="mt-3 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                    A calm space for your charts, screenshots, and analysis.
                  </p>
                  <div className="mt-8 inline-flex items-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="relative inline-flex items-center gap-2 rounded-full bg-[#3559E9] hover:bg-[#2947d1] text-white border-none shadow-sm overflow-hidden px-5 py-2.5 transition-colors before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none"
                    >
                      <Upload className="h-4 w-4 relative z-10" />
                      <span className="font-medium relative z-10">Upload</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Controls */}
          <section className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-900/60 border-b border-black/5 dark:border-white/10">
            <div className="container mx-auto px-6 py-4">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name or tags"
                    className="w-full rounded-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 pl-10 pr-4 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/10"
                  />
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                  {/* Type dropdown */}
                  <CustomDropdown
                    variant="glass"
                    value={filterType}
                    onChange={(v) => setFilterType(v as 'all' | 'images' | 'videos')}
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'images', label: 'Images' },
                      { value: 'videos', label: 'Videos' },
                    ]}
                    className="w-40"
                  />

                  {/* Sort dropdown */}
                  <CustomDropdown
                    variant="glass"
                    value={sortBy}
                    onChange={(v) => setSortBy(v as 'name' | 'date' | 'size')}
                    options={[
                      { value: 'date', label: 'Date' },
                      { value: 'name', label: 'Name' },
                      { value: 'size', label: 'Size' },
                    ]}
                    className="w-36"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Drop zone when empty */}
          {filteredAndSortedItems.length === 0 ? (
            <section className="px-6 py-28" onDrop={onDrop} onDragOver={onDragOver}>
              <div className="container mx-auto">
                <div className="max-w-3xl text-center mx-auto ring-1 ring-black/5 dark:ring-white/10 rounded-2xl p-12 bg-white/60 dark:bg-white/5 backdrop-blur">
                  <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center">
                    <Upload className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Drag and drop to upload</h3>
                  <p className="mt-2 text-neutral-600 dark:text-neutral-400">Drop images or videos here, or choose files to begin.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="relative inline-flex items-center gap-2 rounded-full bg-[#3559E9] hover:bg-[#2947d1] text-white border-none shadow-sm overflow-hidden px-5 py-2.5 transition-colors before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none"
                    >
                      <Upload className="h-4 w-4 relative z-10" />
                      <span className="relative z-10">Choose files</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="px-6 py-10">
              <div className="container mx-auto">
                {/* Modern Card Grid */}
                <div
                  className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6"
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                >
                  {filteredAndSortedItems.map((item, index) => (
                    <div
                      key={item.id}
                                             className="bg-white dark:bg-[#0B0B0B] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-neutral-200/60 dark:border-neutral-700/60 group"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate mb-2">
                            {item.tags.length > 0 ? item.tags[0] : item.type === 'image' ? 'Trading Chart' : 'Trading Video'}
                          </h3>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
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
                        className="aspect-video w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden mb-4 cursor-pointer"
                        onClick={() => openViewerAt(index)}
                      >
                        {item.type === 'image' ? (
                          <img
                            src={item.url}
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="relative h-full w-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                            <div className="h-12 w-12 rounded-full bg-neutral-900/80 text-white dark:bg-white/80 dark:text-neutral-900 flex items-center justify-center backdrop-blur">
                              <Play className="h-6 w-6" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const link = document.createElement('a')
                              link.href = item.url
                              link.download = item.name
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                            }}
                            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteMedia(item.id)
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="mt-3 pt-3 border-t border-neutral-200/60 dark:border-neutral-700/60">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {formatDate(item.uploadDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
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
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Example: strategy, ticker, timeframe. You can press Save without tags.
              </div>
            )}
          </div>
          <DialogFooter className="mt-6">
            <button
              className="rounded-full px-4 py-2 text-sm bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200/70 dark:hover:bg-white/15"
              onClick={() => {
                // Add without tags
                setMediaItems(prev => [...pendingUploads, ...prev])
                setPendingUploads([])
                setPendingTags([])
                setTagModalOpen(false)
              }}
            >
              Skip
            </button>
            <button
              className="relative inline-flex items-center gap-2 rounded-full bg-[#3559E9] hover:bg-[#2947d1] text-white border-none shadow-sm overflow-hidden px-5 py-2 text-sm transition-colors before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none"
              onClick={confirmTagsForPending}
            >
              Save Tags
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox Viewer */}
      {viewerOpen && selected && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
          <button
            className="absolute top-6 right-6 h-10 w-10 inline-flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={closeViewer}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative bg-white dark:bg-neutral-900 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] p-12 ring-2 ring-black/10 dark:ring-white/20 backdrop-blur-sm">
              {selected.type === 'image' ? (
                <img 
                  src={selected.url} 
                  alt={selected.name} 
                  className="max-w-[70vw] max-h-[60vh] object-contain rounded-2xl shadow-lg" 
                />
              ) : (
                <video 
                  src={selected.url} 
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
              {selected.type === 'image' ? <ImageIcon className="h-4 w-4" /> : <VideoIcon className="h-4 w-4" />}
              {selected.name}
            </span>
            <span className="rounded-full bg-white/10 text-white px-3 py-2 text-xs backdrop-blur">{formatFileSize(selected.size)}</span>
            <span className="rounded-full bg-white/10 text-white px-3 py-2 text-xs backdrop-blur">{formatDate(selected.uploadDate)}</span>
            <button
              onClick={() => {
                const link = document.createElement('a')
                link.href = selected.url
                link.download = selected.name
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
              className="ml-3 inline-flex items-center gap-2 rounded-full bg-white text-neutral-900 px-4 py-2 text-sm hover:opacity-90"
            >
              <Download className="h-4 w-4" /> Download
            </button>
            <button
              onClick={() => deleteMedia(selected.id)}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 text-white px-4 py-2 text-sm hover:opacity-90"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>

          {/* Nav arrows */}
          {filteredAndSortedItems.length > 1 && (
            <>
              <button
                onClick={showPrev}
                className="absolute left-6 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 text-white hover:bg-white/20 inline-flex items-center justify-center"
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={showNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 text-white hover:bg-white/20 inline-flex items-center justify-center"
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}