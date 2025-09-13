'use client'

import { logger } from '@/lib/logger'

import { Button } from "@/components/ui/button"
import { AccountSelector } from "@/components/ui/account-selector"
import { FilterMenu, defaultFilterGroups, FilterGroup } from "@/components/ui/filter-menu"
import { AskStial } from "@/components/ui/ask-stial"
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { usePrivacy } from '@/contexts/privacy-context'
import { Cog6ToothIcon, TrashIcon, PlusIcon, BookmarkIcon } from '@heroicons/react/24/outline'
import * as Dialog from '@radix-ui/react-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/fancy-select'
import { RadixJournalDatePicker } from '@/components/ui/radix-journal-date-picker'
import { MoodSelectionModal, MoodType } from '@/components/features/mood-selection-modal'
import { MoodTrackerService } from '@/services/mood-tracker.service'

const LAYOUTS_KEY = 'tradestial:dashboard:layouts:v1'
const ACTIVE_LAYOUT_KEY = 'tradestial:dashboard:active-layout:v1'

interface LayoutManagementDropdownProps {
  onCustomizeChange: (isCustomizing: boolean) => void
  isEditMode: boolean
}

// Layout Management Component
function LayoutManagementDropdown({ onCustomizeChange, isEditMode }: LayoutManagementDropdownProps) {
  const [savedLayouts, setSavedLayouts] = useState<Record<string, any>>({})
  const [activeLayout, setActiveLayout] = useState<string>("Default")

  // Load saved layouts from localStorage on component mount
  useEffect(() => {
    try {
      const layoutsRaw = localStorage.getItem(LAYOUTS_KEY)
      const activeRaw = localStorage.getItem(ACTIVE_LAYOUT_KEY)
      const layouts = layoutsRaw ? JSON.parse(layoutsRaw) : undefined
      if (!layoutsRaw) {
        const initial = { Default: { order: [], hidden: {} } }
        localStorage.setItem(LAYOUTS_KEY, JSON.stringify(initial))
        localStorage.setItem(ACTIVE_LAYOUT_KEY, JSON.stringify("Default"))
        setSavedLayouts(initial)
        setActiveLayout("Default")
      } else {
        setSavedLayouts(layouts)
        setActiveLayout(activeRaw ? JSON.parse(activeRaw) : "Default")
      }
    } catch {
      setSavedLayouts({ Default: { order: [], hidden: {} } })
      setActiveLayout("Default")
    }
  }, [])

  // Refresh layouts/active name when a layout is saved or storage changes
  useEffect(() => {
    const refresh = () => {
      try {
        const layoutsRaw = localStorage.getItem(LAYOUTS_KEY)
        const activeRaw = localStorage.getItem(ACTIVE_LAYOUT_KEY)
        if (layoutsRaw) setSavedLayouts(JSON.parse(layoutsRaw))
        if (activeRaw) setActiveLayout(JSON.parse(activeRaw))
      } catch {}
    }
    const onSave = () => setTimeout(refresh, 0)
    const onStorage = (e: StorageEvent) => {
      if (e.key === LAYOUTS_KEY || e.key === ACTIVE_LAYOUT_KEY) {
        refresh()
      }
    }
    window.addEventListener('saveLayout', onSave as EventListener)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('saveLayout', onSave as EventListener)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const handleLoadLayout = (layoutName: string) => {
    try {
      localStorage.setItem(ACTIVE_LAYOUT_KEY, JSON.stringify(layoutName))
      setActiveLayout(layoutName)
      // Notify widgets board to switch active layout
      window.dispatchEvent(new CustomEvent('setActiveLayout', { detail: layoutName }))
      // If switching to Default while editing, exit edit mode
      if (layoutName === 'Default' && isEditMode) {
        onCustomizeChange(false)
      }
    } catch {}
  }

  const handleCreateLayout = () => {
    // Enter edit mode without asking for name upfront
    onCustomizeChange(true)
    // Mark new layout editing session so board suppresses persistence until saved
    window.dispatchEvent(new Event('startNewLayoutSession'))
  }

  const handleDeleteLayout = (layoutName: string) => {
    // Immediate delete (skip confirmation for now); protect Default
    if (!layoutName || layoutName === 'Default') return
    if (savedLayouts[layoutName]) {
      const updatedLayouts = { ...savedLayouts }
      delete updatedLayouts[layoutName]
      setSavedLayouts(updatedLayouts)
      try {
        localStorage.setItem(LAYOUTS_KEY, JSON.stringify(updatedLayouts))
        if (activeLayout === layoutName) {
          const fallback = 'Default'
          setActiveLayout(fallback)
          localStorage.setItem(ACTIVE_LAYOUT_KEY, JSON.stringify(fallback))
          window.dispatchEvent(new CustomEvent('setActiveLayout', { detail: fallback }))
        }
      } catch {}
    }
  }

  // Removed confirm delete flow; immediate delete instead

  const layoutNames = Object.keys(savedLayouts).filter(name => name !== 'Default')

  const handleValueChange = (value: string) => {
    if (value === "create_new") {
      onCustomizeChange(true)
      window.dispatchEvent(new Event('startNewLayoutSession'))
    } else if (value === "edit_mode") {
      if (activeLayout !== "Default") {
        onCustomizeChange(!isEditMode)
      }
    } else if (value.startsWith("delete_")) {
      const layoutName = value.replace("delete_", "")
      handleDeleteLayout(layoutName)
    } else {
      handleLoadLayout(value)
    }
  }

  return (
    <>
      <Select value={activeLayout} onValueChange={handleValueChange}>
        <SelectTrigger className="w-16 h-10 px-2 border border-gray-200 dark:border-[#404040] bg-white dark:bg-[#0f0f0f] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:text-gray-900 dark:hover:text-white text-gray-600 dark:text-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-0 focus-visible:ring-0 [&>svg]:hidden transition-colors duration-200">
          <div className="flex items-center justify-center w-full h-full">
            <Cog6ToothIcon className="w-5 h-5" />
          </div>
        </SelectTrigger>
        
        <SelectContent className="w-[240px]">
          <SelectGroup>
            <SelectLabel>Dashboard Layouts</SelectLabel>
            
            {/* Default Layout */}
            <SelectItem value="Default">
              <div className="flex items-center gap-2">
                <span>Default</span>
              </div>
            </SelectItem>
            
            {/* Custom Layouts */}
            {layoutNames.map((layoutName) => (
              <SelectItem key={layoutName} value={layoutName}>
                <div className="flex items-center justify-between w-full">
                  <span>{layoutName}</span>
                  <button
                    onMouseDown={(e) => {
                      // Prevent Radix Select from selecting the item/closing the menu
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeleteLayout(layoutName)
                    }}
                    className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded opacity-60 hover:opacity-100"
                    title="Delete layout"
                  >
                    <TrashIcon className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
          
          <SelectSeparator />
          
          <SelectGroup>
            <SelectItem value="create_new">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <PlusIcon className="w-3 h-3 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm text-blue-600">Create New Layout</span>
                  <span className="text-xs text-gray-500">Customize dashboard</span>
                </div>
              </div>
            </SelectItem>
            
            <SelectItem value="edit_mode" disabled={activeLayout === 'Default'}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  <Cog6ToothIcon className="w-3 h-3 text-gray-600" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{isEditMode ? 'Exit Edit Mode' : 'Edit Current Layout'}</span>
                  <span className="text-xs text-gray-500">{activeLayout === 'Default' && !isEditMode ? "Default can't be edited. Create a layout." : 'Drag & drop widgets'}</span>
                </div>
              </div>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  )
}

interface DashboardHeaderProps {
  isEditMode?: boolean
  onEditModeChange?: (isEditing: boolean) => void
}

export function DashboardHeader({ isEditMode = false, onEditModeChange }: DashboardHeaderProps) {
  const pathname = usePathname()
  const { displayFormat, setDisplayFormat } = usePrivacy()
  const [isNavigating, setIsNavigating] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false)
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>(
    defaultFilterGroups.map(group => ({
      ...group,
      value: displayFormat
    }))
  )
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [saveLayoutName, setSaveLayoutName] = useState("")
  
  const getPageInfo = () => {
    switch (pathname) {
      case '/notes':
        return {
          title: 'Note',
          description: 'Your trading journal and notes'
        }
      case '/activity-journal':
        return {
          title: 'Activity Journal',
          description: 'Track your trading progress and milestones'
        }
      case '/daily-journal':
        return {
          title: 'Daily Journal',
          description: 'Your daily trading reflections and insights'
        }
      case '/journal-page':
        return {
          title: 'Journal',
          description: 'Your trading journal and daily reflections'
        }
      case '/analytics':
        return {
          title: 'Analytics',
          description: 'Advanced trading analytics and performance insights'
        }
      case '/model':
        return {
          title: 'Model Builder',
          description: 'Create and manage your trading strategies'
        }
      case '/statistics':
        return {
          title: 'Trades',
          description: 'View and analyze your trading history'
        }
      case '/gallery':
        return {
          title: 'Gallery',
          description: 'Your trading charts and screenshots'
        }
      case '/trades':
        return {
          title: 'Trades',
          description: 'View and manage your trading history'
        }
      case '/trades/tracker':
        return {
          title: 'Tracker',
          description: 'Detailed view of your trading performance'
        }
      case '/import-data':
        return {
          title: 'Import Trading Data',
          description: 'Sync and import your trading data from various platforms'
        }
      case '/resources':
        return {
          title: 'Trading Resources',
          description: 'Essential tools and information for successful trading'
        }
      case '/account':
        return {
          title: 'Account Management',
          description: 'Manage your trading accounts and view performance summaries'
        }
      case '/settings':
        return {
          title: 'Settings',
          description: 'Manage your account preferences and application settings'
        }
      case '/dashboard':
      default:
        if (pathname.startsWith('/trades/tracker/')) {
          return {
            title: 'Tracker',
            description: 'Detailed view of your trading performance'
          }
        }
        return {
          title: 'Dashboard',
          description: ''
        }
    }
  }

  const { title, description } = getPageInfo()

  const handleAccountChange = (accountId: string) => {
    // Account switching is handled by the AccountSelector component
    // Analytics will automatically update through the DataStore sync
    logger.debug('Switched to account:', accountId)
  }

  const handleFilterChange = (groupId: string, value: string) => {
    setFilterGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? { ...group, value }
          : group
      )
    )
    // Update privacy context when filter changes
    setDisplayFormat(value)
    logger.debug('Filter changed:', groupId, value)
  }

  // Determine if filters should be shown based on current page
  const shouldShowFilters = () => {
    return pathname === '/dashboard'
  }

  const handleDateSelect = (date: Date) => {
    // Check if mood is already logged for this date
    const existingMood = MoodTrackerService.getMoodEntry(date)
    
    if (existingMood) {
      // Mood already logged, navigate directly
      navigateToJournal(date)
    } else {
      // Show mood selection modal first
      setSelectedDate(date)
      setIsMoodModalOpen(true)
    }
  }

  const navigateToJournal = (date: Date) => {
    setIsNavigating(true)
    // Navigate to journal page with selected date
    // Use local date formatting to avoid timezone issues
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}` // Format: YYYY-MM-DD
    window.location.href = `/journal-page?date=${dateStr}`
  }

  const handleMoodSelected = (mood: MoodType, notes?: string) => {
    if (selectedDate) {
      // Save mood entry
      MoodTrackerService.saveMoodEntry(selectedDate, mood, notes)
      
      // Navigate to journal after mood selection
      navigateToJournal(selectedDate)
    }
  }

  const handleMoodModalClose = () => {
    setIsMoodModalOpen(false)
    setSelectedDate(null)
    setIsNavigating(false)
  }

  return (
    <header className="bg-[#f8f9f8] dark:bg-[#171717] px-6 py-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl"><span className="font-semibold bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">{title}</span></h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {pathname === '/dashboard' && (
            <RadixJournalDatePicker
              onDateSelect={handleDateSelect}
              isNavigating={isNavigating}
            />
          )}
          <AskStial />
          {pathname === '/dashboard' && isEditMode && (
            <Dialog.Root open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
              <Dialog.Trigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm rounded-lg">
                  <BookmarkIcon className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#0f0f0f] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-xl p-6 w-full max-w-md z-50">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Save Current Layout
                  </Dialog.Title>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Layout Name
                      </label>
                      <input
                        type="text"
                        value={saveLayoutName}
                        onChange={(e) => setSaveLayoutName(e.target.value)}
                        placeholder="Enter layout name..."
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && saveLayoutName.trim()) {
                            window.dispatchEvent(new CustomEvent('saveLayout', { detail: saveLayoutName.trim() }))
                            setSaveLayoutName("")
                            setIsSaveDialogOpen(false)
                          } else if (e.key === 'Escape') {
                            setIsSaveDialogOpen(false)
                          }
                        }}
                        autoFocus
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Dialog.Close asChild>
                        <Button variant="outline" className="px-3 py-2 text-sm">
                          Cancel
                        </Button>
                      </Dialog.Close>
                      <Dialog.Close asChild>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm"
                          disabled={!saveLayoutName.trim()}
                          onClick={() => {
                            if (saveLayoutName.trim()) {
                              window.dispatchEvent(new CustomEvent('saveLayout', { detail: saveLayoutName.trim() }))
                              setSaveLayoutName("")
                            }
                          }}
                        >
                          Save Layout
                        </Button>
                      </Dialog.Close>
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          )}
          {pathname === '/dashboard' && (
            <LayoutManagementDropdown 
              isEditMode={isEditMode}
              onCustomizeChange={onEditModeChange || (() => {})}
            />
          )}
          {shouldShowFilters() && (
            <FilterMenu 
              groups={filterGroups.map(group => ({
                ...group,
                onChange: (value: string) => handleFilterChange(group.id, value)
              }))}
            />
          )}
          <AccountSelector onAccountChange={handleAccountChange} />
        </div>
      </div>

      {/* Mood Selection Modal */}
      {selectedDate && (
        <MoodSelectionModal
          open={isMoodModalOpen}
          onClose={handleMoodModalClose}
          onMoodSelected={handleMoodSelected}
          selectedDate={selectedDate}
        />
      )}
    </header>
  )
}