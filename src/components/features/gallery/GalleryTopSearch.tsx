'use client'

import { Search, Upload } from 'lucide-react'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { Root as FancyButton } from '@/components/ui/fancy-button'
import { GalleryIcon } from '@/components/ui/custom-icons'
import Image from 'next/image'

interface GalleryTopSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filterType: 'all' | 'images' | 'videos'
  onFilterTypeChange: (type: 'all' | 'images' | 'videos') => void
  sortBy: 'name' | 'date' | 'size'
  onSortByChange: (sort: 'name' | 'date' | 'size') => void
  onUploadClick: () => void
}

export function GalleryTopSearch({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  sortBy,
  onSortByChange,
  onUploadClick
}: GalleryTopSearchProps) {
  return (
    <div className="px-6 py-4 border-b border-gray-200 dark:border-[#404040] bg-white dark:bg-[#0f0f0f] flex-shrink-0 rounded-t-xl">
      <div className="flex items-center justify-between">
        {/* Gallery Icon - Left aligned */}
        <div className="flex items-center">
          <GalleryIcon className="text-purple-600 dark:text-purple-400" size={28} />
        </div>
        
        <div className="flex items-center gap-4 flex-1 justify-center">
          {/* Search Input */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#888888]" />
            <input
              type="text"
              placeholder="Search name or tags"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#404040] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filter Dropdowns */}
          <div className="flex items-center gap-3">
            {/* Type dropdown */}
            <CustomDropdown
              variant="glass"
              value={filterType}
              onChange={(v) => onFilterTypeChange(v as 'all' | 'images' | 'videos')}
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
              onChange={(v) => onSortByChange(v as 'name' | 'date' | 'size')}
              options={[
                { value: 'date', label: 'Date' },
                { value: 'name', label: 'Name' },
                { value: 'size', label: 'Size' },
              ]}
              className="w-36"
            />
          </div>
        </div>
        
        {/* Upload button and Logo on the right */}
        <div className="flex items-center gap-3">
          <FancyButton
            onClick={onUploadClick}
            variant="primary"
            size="small"
          >
            <Upload className="h-4 w-4" />
            Upload
          </FancyButton>
          <div className="w-10 h-10 relative">
            <Image
              src="/new-tradestial-logo.png"
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
