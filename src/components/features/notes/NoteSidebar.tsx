'use client'

import { motion } from 'framer-motion'
import { 
  Plus, 
  Folder, 
  FolderOpen,
  ChevronDown,
  ChevronRight,
  StickyNote,
  Calendar,
  Target,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface NoteSidebarProps {
  selectedFolder: string
  onFolderSelect: (folder: string) => void
}

interface FolderItem {
  id: string
  label: string
  icon: any
  count?: number
  children?: FolderItem[]
}

const folderStructure: FolderItem[] = [
  { id: 'all-notes', label: 'All notes', icon: StickyNote },
  { id: 'trade-notes', label: 'Trade Notes', icon: TrendingUp },
  { id: 'daily-journal', label: 'Daily Journal', icon: Calendar },
  { id: 'sessions-recap', label: 'Sessions Recap', icon: BarChart3 },
  { id: 'quarterly-goals', label: 'Quarterly Goals', icon: Target, count: 3 },
  { id: 'trading-goals', label: 'Trading Goals', icon: TrendingUp, count: 2 },
  { id: 'trading-plan', label: 'Trading Plan', icon: Lightbulb, count: 1 },
  { id: '2023-goals-plan', label: '2023 Goals + Plan', icon: Target, count: 2 },
  { id: 'notes', label: 'Notes', icon: StickyNote, count: 4 },
  { id: 'plan-of-action', label: 'Plan of Action', icon: Target, count: 1 },
  { id: 'mistakes-reflection', label: 'Mistakes Reflection', icon: AlertTriangle },
]

export function NoteSidebar({ selectedFolder, onFolderSelect }: NoteSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['all-notes'])

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    )
  }

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 bg-white dark:bg-[#1C1C1C] border-r border-gray-200 dark:border-gray-700 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Notebook</h1>
        <Button 
          size="sm" 
          className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add folder
        </Button>
      </div>

      {/* Folders */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Folders
          </div>
          
          {folderStructure.map((folder) => (
            <motion.div
              key={folder.id}
              whileHover={{ x: 2 }}
              transition={{ duration: 0.1 }}
            >
              <button
                onClick={() => onFolderSelect(folder.label)}
                className={cn(
                  "w-full flex items-center space-x-2 px-2 py-2 text-sm rounded-lg transition-colors text-left group",
                  selectedFolder === folder.label
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A2A2A]"
                )}
              >
                <folder.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{folder.label}</span>
                {folder.count && (
                  <span className="text-xs bg-gray-200 dark:bg-[#1C1C1C] text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                    {folder.count}
                  </span>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Tags Section */}
        <div className="mt-6 space-y-1">
          <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Tags
          </div>
          
          <div className="space-y-1">
            {[
              { label: 'FOMC', count: 1, color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300' },
              { label: 'Earnings', count: 2, color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' },
              { label: 'Market News', count: 1, color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
              { label: 'Mistakes', count: 3, color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' },
              { label: 'Plan of Action', count: 1, color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' },
              { label: 'Trading Rules 1.0', count: 1, color: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' },
            ].map((tag) => (
              <button
                key={tag.label}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
              >
                <span className={cn("px-2 py-1 rounded-full font-medium", tag.color)}>
                  {tag.label}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {tag.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recently Deleted */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button className="w-full flex items-center space-x-2 px-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors">
          <Trash2 className="w-4 h-4" />
          <span>Recently Deleted</span>
        </button>
      </div>
    </motion.div>
  )
}