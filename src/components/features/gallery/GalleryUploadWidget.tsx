'use client'

import React, { useRef, forwardRef, useImperativeHandle, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Root as FancyButton } from '@/components/ui/fancy-button'

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
        className="w-full rounded-lg bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#404040] px-3 py-2.5 text-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">Separate with Enter or comma. Tags apply to these uploads.</div>
    </div>
  )
})

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

interface GalleryUploadWidgetProps {
  onUploadClick: () => void
}

export function GalleryUploadWidget({ onUploadClick }: GalleryUploadWidgetProps) {
  return (
    <div className="px-6 py-6 bg-white dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-[#404040]">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          Gallery
        </h1>
      </div>
    </div>
  )
}

export { TagInput }
