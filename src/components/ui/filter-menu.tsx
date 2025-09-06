'use client'

import * as React from "react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 px-3 gap-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
            className
          )}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[280px] bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-1 z-50"
          sideOffset={5}
          align="end"
        >
          {groups.map((group, groupIndex) => (
            <React.Fragment key={group.id}>
              {groupIndex > 0 && (
                <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              )}
              
              <div className="px-2 py-1.5">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {group.label}
                </div>
                
                <DropdownMenu.RadioGroup
                  value={group.value}
                  onValueChange={group.onChange}
                >
                  {group.options.map((option) => (
                    <DropdownMenu.RadioItem
                      key={option.id}
                      value={option.id}
                      disabled={option.disabled}
                      className={cn(
                        "flex items-start gap-3 px-2 py-2.5 rounded-md cursor-pointer select-none outline-none",
                        "hover:bg-gray-50 dark:hover:bg-gray-800",
                        "focus:bg-gray-50 dark:focus:bg-gray-800",
                        "data-[state=checked]:bg-blue-50 dark:data-[state=checked]:bg-blue-900/20",
                        option.disabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {option.icon || filterIcons[option.id as keyof typeof filterIcons]}
                        
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
                      
                      <DropdownMenu.ItemIndicator className="flex items-center justify-center">
                        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                  ))}
                </DropdownMenu.RadioGroup>
              </div>
            </React.Fragment>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
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
