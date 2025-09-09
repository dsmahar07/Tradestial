'use client'

import * as React from "react"
import { Check, ChevronDown, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/fancy-select"

export type FilterOption = {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
}

export type FilterGroup = {
  id: string
  label: string
  options: FilterOption[]
  value?: string
  onChange?: (value: string) => void
}

interface FilterMenuProps {
  groups: FilterGroup[]
  className?: string
}

const filterIcons = {
  dollar: (
    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
      <span className="text-green-600 dark:text-green-400 text-xs font-bold">$</span>
    </div>
  ),
  percentage: (
    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
      <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">%</span>
    </div>
  ),
  privacy: (
    <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
      <span className="text-purple-600 dark:text-purple-400 text-xs font-bold">P</span>
    </div>
  ),
  rmultiple: (
    <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
      <span className="text-orange-600 dark:text-orange-400 text-xs font-bold">R</span>
    </div>
  ),
  ticks: (
    <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center">
      <span className="text-teal-600 dark:text-teal-400 text-xs font-bold">T</span>
    </div>
  ),
  pips: (
    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
      <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">PP</span>
    </div>
  ),
  points: (
    <div className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
      <span className="text-pink-600 dark:text-pink-400 text-xs font-bold">P</span>
    </div>
  ),
}

export function FilterMenu({ groups, className }: FilterMenuProps) {
  // For now, we'll use the first group as the primary filter
  // This can be extended to support multiple groups if needed
  const primaryGroup = groups[0]
  const currentOption = primaryGroup?.options.find(opt => opt.id === primaryGroup.value)

  const handleValueChange = (value: string) => {
    primaryGroup?.onChange?.(value)
  }

  if (!primaryGroup) return null

  return (
    <Select value={primaryGroup.value || ''} onValueChange={handleValueChange}>
      <SelectTrigger className={cn("min-w-[140px] max-w-[200px] focus:outline-none focus:ring-0 focus-visible:ring-0", className)}>
        <SelectValue>
          <div className="flex items-center gap-2 min-w-0">
            <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm font-medium truncate">
              {currentOption?.label || 'Select Filter'}
            </span>
          </div>
        </SelectValue>
      </SelectTrigger>
      
      <SelectContent className="w-[280px]">
        <SelectGroup>
          <SelectLabel>{primaryGroup.label}</SelectLabel>
          {primaryGroup.options.map((option) => (
            <SelectItem key={option.id} value={option.id} disabled={option.disabled}>
              <div className="flex items-center gap-3 w-full">
                <div className="flex-shrink-0">
                  {option.icon || filterIcons[option.id as keyof typeof filterIcons]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      {option.description}
                    </div>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
        
        {groups.length > 1 && (
          <>
            <SelectSeparator />
            {groups.slice(1).map((group) => (
              <SelectGroup key={group.id}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.options.map((option) => (
                  <SelectItem key={option.id} value={option.id} disabled={option.disabled}>
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0">
                        {option.icon || filterIcons[option.id as keyof typeof filterIcons]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  )
}

// Default filter configuration based on the image
export const defaultFilterGroups: FilterGroup[] = [
  {
    id: 'display-format',
    label: 'Display Format',
    options: [
      {
        id: 'dollar',
        label: 'Dollar',
        icon: filterIcons.dollar,
      },
      {
        id: 'percentage',
        label: 'Percentage',
        icon: filterIcons.percentage,
      },
      {
        id: 'privacy',
        label: 'Privacy',
        icon: filterIcons.privacy,
      },
      {
        id: 'rmultiple',
        label: 'R-multiple',
        description: 'It is shown for trades with entered initial risk only',
        icon: filterIcons.rmultiple,
      },
      {
        id: 'ticks',
        label: 'Ticks',
        description: 'It is shown for future trades only',
        icon: filterIcons.ticks,
      },
      {
        id: 'pips',
        label: 'Pips',
        description: 'It is shown for forex trades only',
        icon: filterIcons.pips,
      },
      {
        id: 'points',
        label: 'Points',
        description: 'It is shown for future trades only',
        icon: filterIcons.points,
      },
    ],
    value: 'dollar', // Default selection
  },
]
