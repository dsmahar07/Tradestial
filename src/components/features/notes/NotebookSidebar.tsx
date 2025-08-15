'use client'

import { Plus, FolderOpen, Folder, MoreHorizontal, ChevronDown, ChevronRight, Edit3, Trash2, GripVertical, Palette, ChevronLeft, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AdvancedColorPicker } from '@/components/ui/advanced-color-picker'
import { Tooltip } from '@/components/ui/tooltip'
import { useState, useEffect } from 'react'
import { Folder as FolderType } from '@/app/notes/page'

// Color options for folders
const folderColors = [
  { value: '#3b82f6', name: 'Blue' },
  { value: '#ef4444', name: 'Red' },
  { value: '#10b981', name: 'Green' },
  { value: '#f59e0b', name: 'Orange' },
  { value: '#8b5cf6', name: 'Purple' },
  { value: '#ec4899', name: 'Pink' },
  { value: '#06b6d4', name: 'Cyan' },
  { value: '#84cc16', name: 'Lime' },
  { value: '#f97316', name: 'Deep Orange' },
  { value: '#dc2626', name: 'Crimson' },
  { value: '#059669', name: 'Emerald' },
  { value: '#0891b2', name: 'Sky Blue' },
  { value: '#7c3aed', name: 'Violet' },
  { value: '#be185d', name: 'Rose' },
  { value: '#0d9488', name: 'Teal' },
  { value: '#65a30d', name: 'Olive' },
]

interface NotebookSidebarProps {
  selectedFolder: string
  folders: FolderType[]
  onFolderSelect: (folder: string) => void
  onAddFolder: () => void
  onDeleteFolder: (folderId: string, folderName: string) => void
  onRenameFolder: (folderId: string, newName: string) => void
  onReorderFolders: (startIndex: number, endIndex: number) => void
  onUpdateFolderColor: (folderId: string, color: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function NotebookSidebar({
  selectedFolder,
  folders,
  onFolderSelect,
  onAddFolder,
  onDeleteFolder,
  onRenameFolder,
  onReorderFolders,
  onUpdateFolderColor,
  isCollapsed = false,
  onToggleCollapse
}: NotebookSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['folders', 'tags'])
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const [showAdvancedColorPicker, setShowAdvancedColorPicker] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [draggedOver, setDraggedOver] = useState<number | null>(null)
  const [tags, setTags] = useState<string[]>(['Session Recap', 'Trade Analysis', 'Market Notes', 'Strategy Review'])

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const handleStartEdit = (folder: FolderType) => {
    setEditingFolder(folder.id)
    setEditName(folder.name)
  }

  const handleSaveEdit = () => {
    if (editingFolder && editName.trim()) {
      onRenameFolder(editingFolder, editName.trim())
    }
    setEditingFolder(null)
    setEditName('')
  }

  const handleCancelEdit = () => {
    setEditingFolder(null)
    setEditName('')
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (index === 0) {
      e.preventDefault() // Prevent dragging "All notes"
      return
    }
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (index === 0 || draggedItem === null) return // Can't drop on "All notes"
    setDraggedOver(index)
  }

  const handleDragEnd = () => {
    if (draggedItem !== null && draggedOver !== null && draggedItem !== draggedOver) {
      onReorderFolders(draggedItem, draggedOver)
    }
    setDraggedItem(null)
    setDraggedOver(null)
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (index === 0 || draggedItem === null) return
    onReorderFolders(draggedItem, index)
    setDraggedItem(null)
    setDraggedOver(null)
  }



  return (
    <div className={cn(
      "bg-white dark:bg-[#171717] flex flex-col rounded-bl-xl transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Header with collapse toggle */}
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Folders</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            "text-gray-600 dark:text-[#CCCCCC] hover:text-gray-800 dark:hover:text-white p-2",
            isCollapsed && "mx-auto"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", isCollapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Add folder button */}
      <div className="px-4 pb-4">
        {isCollapsed ? (
          <Tooltip content="Add folder" side="right">
            <Button
              onClick={onAddFolder}
              className="w-full h-10 relative bg-[#3559E9] hover:bg-[#2947d1] text-white border-none shadow-sm overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none"
            >
              <Plus className="w-4 h-4 relative z-10" />
            </Button>
          </Tooltip>
        ) : (
          <Button
            onClick={onAddFolder}
            className="w-full relative bg-[#3559E9] hover:bg-[#2947d1] text-white border-none shadow-sm overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none"
          >
            <Plus className="w-4 h-4 mr-2 relative z-10" />
            <span className="relative z-10">Add folder</span>
          </Button>
        )}
      </div>

      {/* Folders Section */}
      <div className="px-4">
        {!isCollapsed && (
          <button
            onClick={() => toggleSection('folders')}
            className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-600 dark:text-[#CCCCCC] hover:text-gray-800 dark:hover:text-white"
          >
            <span>Folders</span>
            {expandedSections.includes('folders') ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}

        {(expandedSections.includes('folders') || isCollapsed) && (
          <div className={cn("space-y-1", !isCollapsed && "mt-2")}>
            {folders.map((folder, index) => {
              if (isCollapsed) {
                // Collapsed view - show only icons with tooltips
                return (
                  <Tooltip key={folder.id} content={folder.name} side="right">
                    <div
                      className={cn(
                        "w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 ease-in-out cursor-pointer relative",
                        selectedFolder === folder.name
                          ? "bg-gray-100 dark:bg-[#2A2A2A] text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-[#CCCCCC] hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#222222]"
                      )}
                      onClick={() => onFolderSelect(folder.name)}
                    >
                      {/* Color indicator */}
                      <div 
                        className="absolute left-1 top-1/2 transform -translate-y-1/2 w-1 h-6 rounded-full"
                        style={{ backgroundColor: folder.color || '#3b82f6' }}
                      />
                      
                      {folder.id === 'all-notes' ? (
                        <FolderOpen className="w-5 h-5" />
                      ) : (
                        <Folder className="w-5 h-5" />
                      )}
                    </div>
                  </Tooltip>
                )
              }

              // Expanded view - full folder item
              return (
                <div
                  key={folder.id}
                  draggable={folder.id !== 'all-notes'}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                  className={cn(
                    "w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 ease-in-out group relative border-l-4 cursor-pointer",
                    selectedFolder === folder.name
                      ? "bg-gray-100 dark:bg-[#2A2A2A] text-gray-900 dark:text-white font-medium"
                      : "text-gray-600 dark:text-[#CCCCCC] hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#222222]",
                    draggedItem === index && "opacity-60 scale-95 rotate-2 shadow-xl z-50",
                    draggedOver === index && draggedItem !== index && "ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-105 shadow-lg"
                  )}
                  style={{
                    borderLeftColor: folder.color || '#3b82f6'
                  }}
                >
                  {/* Drag handle */}
                  {folder.id !== 'all-notes' && (
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-grab active:cursor-grabbing hover:scale-110">
                      <GripVertical className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                    </div>
                  )}

                  {folder.id === 'all-notes' ? (
                    <FolderOpen className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <Folder className="w-4 h-4 flex-shrink-0" />
                  )}

                  {editingFolder === folder.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      className="flex-1 bg-transparent border-b border-blue-500 outline-none text-gray-900 dark:text-white"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="flex-1 text-left cursor-pointer"
                      onClick={() => onFolderSelect(folder.name)}
                    >
                      {folder.name}
                    </span>
                  )}

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {/* Color picker button */}
                    <button
                      className="h-5 w-5 rounded hover:bg-gray-200 dark:hover:bg-[#2A2A2A] p-0.5 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowAdvancedColorPicker(folder.id)
                      }}
                      title="Change folder color"
                    >
                      <Palette className="w-3 h-3" />
                    </button>

                    {/* Edit button */}
                    <button
                      className="h-5 w-5 rounded hover:bg-gray-200 dark:hover:bg-[#2A2A2A] p-0.5 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartEdit(folder)
                      }}
                      title="Rename folder"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>

                    {/* Delete button */}
                    {folder.id !== 'all-notes' && (
                      <button
                        className="h-5 w-5 rounded hover:bg-red-200 dark:hover:bg-red-900 p-0.5 transition-colors text-red-500"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteFolder(folder.id, folder.name)
                        }}
                        title="Delete folder"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tags Section */}
      <div className="px-4 mt-6">
        {!isCollapsed && (
          <button
            onClick={() => toggleSection('tags')}
            className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-600 dark:text-[#CCCCCC] hover:text-gray-800 dark:hover:text-white"
          >
            <span>Tags</span>
            {expandedSections.includes('tags') ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}

        {(expandedSections.includes('tags') || isCollapsed) && (
          <div className={cn("space-y-1", !isCollapsed && "mt-2")}>
            {isCollapsed ? (
              // Collapsed view - show tags icon
              <Tooltip content="Tags" side="right">
                <div className="w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 ease-in-out cursor-pointer text-gray-600 dark:text-[#CCCCCC] hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#222222]">
                  <Hash className="w-5 h-5" />
                </div>
              </Tooltip>
            ) : (
              // Expanded view - show all tags
              <>
                {tags.map((tag, index) => (
                  <div
                    key={index}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 ease-in-out group relative cursor-pointer text-gray-600 dark:text-[#CCCCCC] hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#222222]"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>

                    <span className="flex-1 text-left">
                      {tag}
                    </span>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {/* Delete tag button */}
                      <button
                        className="h-5 w-5 rounded hover:bg-red-200 dark:hover:bg-red-900 p-0.5 transition-colors text-red-500"
                        onClick={(e) => {
                          e.stopPropagation()
                          setTags(prev => prev.filter((_, i) => i !== index))
                        }}
                        title="Delete tag"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new tag button */}
                <button
                  onClick={() => {
                    const newTag = prompt('Enter tag name:')
                    if (newTag && newTag.trim()) {
                      setTags(prev => [...prev, newTag.trim()])
                    }
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222222] border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add tag</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>



      {/* Advanced Color Picker Modal */}
      <AdvancedColorPicker
        isOpen={showAdvancedColorPicker !== null}
        onClose={() => setShowAdvancedColorPicker(null)}
        onColorSelect={(color) => {
          if (showAdvancedColorPicker) {
            onUpdateFolderColor?.(showAdvancedColorPicker, color)
          }
        }}
        currentColor={showAdvancedColorPicker ? folders.find(f => f.id === showAdvancedColorPicker)?.color : undefined}
        title="Choose folder color"
      />
    </div>
  )
}