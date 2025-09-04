'use client'

import { Search } from 'lucide-react'
import { CustomDropdown } from '@/components/ui/custom-dropdown'

interface GalleryFiltersWidgetProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filterType: 'all' | 'images' | 'videos'
  onFilterTypeChange: (type: 'all' | 'images' | 'videos') => void
  sortBy: 'name' | 'date' | 'size'
  onSortByChange: (sort: 'name' | 'date' | 'size') => void
}

export function GalleryFiltersWidget({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  sortBy,
  onSortByChange
}: GalleryFiltersWidgetProps) {
  return (
    <div className="bg-white dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-[#404040] p-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name or tags"
            className="w-full rounded-full bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#404040] pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
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
    </div>
  )
}
