'use client'

import { Search, Plus, MoreHorizontal, Edit3, Trash2, GripVertical, Palette, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AdvancedColorPicker } from '@/components/ui/advanced-color-picker'
import { Note } from '@/app/notes/page'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

// Color options for note tags
const noteColors = [
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
  { value: '#ca8a04', name: 'Yellow' },
  { value: '#9333ea', name: 'Indigo' },
  { value: '#374151', name: 'Gray' },
  { value: '#1f2937', name: 'Dark Gray' },
]

interface NotebookMiddlePanelProps {
  selectedFolder: string
  selectedTag?: string | null
  selectedNote: Note | null
  notes: Note[]
  onNoteSelect: (note: Note) => void
  onCreateNote: () => void
  onDeleteNote: (id: string, noteTitle: string) => void
  onUpdateNote: (id: string, content: string, title?: string, color?: string) => void
  onReorderNotes: (startIndex: number, endIndex: number) => void
  onDeleteAllNotes?: () => void
  onToggleCollapse?: () => void
}

export function NotebookMiddlePanel({ 
  selectedFolder, 
  selectedTag = null,
  selectedNote, 
  notes, 
  onNoteSelect, 
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
  onReorderNotes,
  onDeleteAllNotes,
  onToggleCollapse
}: NotebookMiddlePanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)
  const [showAdvancedColorPicker, setShowAdvancedColorPicker] = useState<string | null>(null)
  const [draggedNote, setDraggedNote] = useState<number | null>(null)
  const [draggedOverNote, setDraggedOverNote] = useState<number | null>(null)

  // Drag and drop handlers for notes
  const handleNoteDragStart = (e: React.DragEvent, index: number) => {
    setDraggedNote(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleNoteDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedNote === null) return
    setDraggedOverNote(index)
  }

  const handleNoteDragEnd = () => {
    if (draggedNote !== null && draggedOverNote !== null && draggedNote !== draggedOverNote) {
      onReorderNotes(draggedNote, draggedOverNote)
    }
    setDraggedNote(null)
    setDraggedOverNote(null)
  }

  const handleNoteDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedNote === null) return
    onReorderNotes(draggedNote, index)
    setDraggedNote(null)
    setDraggedOverNote(null)
  }

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColorPicker && !(event.target as Element).closest('.color-picker-container')) {
        setShowColorPicker(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColorPicker])

  const filteredNotes = notes.filter(note => {
    const matchesTag = !selectedTag || note.tags?.includes(selectedTag)
    const matchesFolder = selectedTag ? true : (selectedFolder === 'All notes' || note.folder === selectedFolder)
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTag && matchesFolder && matchesSearch
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: '2-digit',
      day: '2-digit', 
      year: 'numeric'
    })
  }

  return (
    <div className="w-80 bg-white dark:bg-[#171717] border-r border-gray-200 dark:border-[#404040] flex flex-col">
      {/* Header with back arrow and New note */}
      <div className="p-4 bg-white dark:bg-[#171717] border-b border-gray-200 dark:border-[#404040]">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onToggleCollapse}
            className="h-8 w-8 flex items-center justify-center text-gray-600 dark:text-[#CCCCCC] hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-md transition-colors"
            title="Collapse notes panel"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <Button
            onClick={onCreateNote}
            className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 border-none shadow-sm transition-all duration-200 font-medium px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span>New note</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center text-gray-600 dark:text-[#CCCCCC] hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-md transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#171717] border-gray-200 dark:border-[#404040]">
              <DropdownMenuItem 
                className="text-red-600 dark:text-red-400 dark:hover:bg-[#2A2A2A]"
                onClick={() => {
                  if (filteredNotes.length > 0) {
                    onDeleteAllNotes?.()
                  }
                }}
                disabled={filteredNotes.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Notes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search notes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#404040] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>
      </div>



      {/* Notes List */}
      <div className="flex-1 overflow-y-auto rounded-bl-none">
        {filteredNotes.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Edit3 className="w-16 h-16 mx-auto mb-6 opacity-40" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No notes found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Create a new note to get started with your ideas</p>
          </div>
        ) : (
          filteredNotes.map((note, index) => (
            <div
              key={note.id}
              draggable
              onDragStart={(e) => handleNoteDragStart(e, index)}
              onDragOver={(e) => handleNoteDragOver(e, index)}
              onDragEnd={handleNoteDragEnd}
              onDrop={(e) => handleNoteDrop(e, index)}
              className={cn(
                "p-4 border-b border-gray-200 dark:border-[#404040] hover:bg-white dark:hover:bg-[#1C1C1C] transition-all duration-300 ease-in-out group relative rounded-lg transform",
                                  selectedNote?.id === note.id 
                    ? "bg-gray-50 dark:bg-[#1C1C1C] shadow-md" 
                    : "bg-white dark:bg-[#171717] hover:shadow-sm",
                draggedNote === index && "opacity-60 scale-95 rotate-1 shadow-xl z-50",
                draggedOverNote === index && draggedNote !== index && "ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-105 shadow-lg"
              )}
            >
              {/* Real fabric ribbon bookmark */}
              <div className="absolute left-0 top-0 bottom-0 w-2 overflow-hidden rounded-r-sm">
                <div 
                  className="w-full h-full relative"
                  style={{ backgroundColor: note.color || '#3b82f6' }}
                >
                  {/* Satin shine highlight */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/10 to-transparent"></div>
                  
                  {/* Center fold crease */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black/15 transform -translate-x-1/2"></div>
                  
                  {/* Left edge highlight */}
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-white/40"></div>
                  
                  {/* Right edge shadow */}
                  <div className="absolute right-0 top-0 bottom-0 w-px bg-black/20"></div>
                  
                  {/* Fabric texture weave */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="w-full h-full" style={{
                      backgroundImage: `repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 1px,
                        rgba(255,255,255,0.3) 1px,
                        rgba(255,255,255,0.3) 2px
                      )`
                    }}></div>
                  </div>
                  
                  {/* Soft shadow */}
                  <div className="absolute -right-1 top-0 bottom-0 w-2 bg-gradient-to-r from-black/5 to-transparent"></div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 ml-6">
                
                {/* Drag handle */}
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-grab active:cursor-grabbing hover:scale-110">
                  <GripVertical className="w-3 h-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 mt-1" />
                </div>

                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => onNoteSelect(note)}
                >
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white leading-tight break-words">{note.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(note.createdAt)}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] hover:scale-110 transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAdvancedColorPicker(note.id)
                    }}
                    title="Change note color"
                  >
                    <Palette className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-110 transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteNote(note.id, note.title)
                    }}
                    title="Delete note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Color picker dropdown */}
              {showColorPicker === note.id && (
                <div 
                  className="absolute top-full right-8 mt-2 bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#404040] rounded-lg shadow-2xl p-4 color-picker-container"
                  style={{ zIndex: 10000, position: 'absolute' }}
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">Choose note color</div>
                  <div className="grid grid-cols-5 gap-3">
                    {noteColors.map((color) => (
                      <button
                        key={color.value}
                        className={cn(
                          "w-8 h-8 rounded-full border-3 hover:scale-110 transition-all duration-200 relative",
                          note.color === color.value 
                            ? "border-gray-900 dark:border-white shadow-lg" 
                            : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                        )}
                        style={{ backgroundColor: color.value }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onUpdateNote(note.id, note.content, note.title, color.value)
                          setShowColorPicker(null)
                        }}
                        title={color.name}
                      >
                        {note.color === color.value && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Advanced Color Picker Modal */}
      <AdvancedColorPicker
        isOpen={showAdvancedColorPicker !== null}
        onClose={() => setShowAdvancedColorPicker(null)}
        onColorSelect={(color) => {
          if (showAdvancedColorPicker) {
            const note = filteredNotes.find(n => n.id === showAdvancedColorPicker)
            if (note) {
              onUpdateNote?.(note.id, note.content, note.title, color)
            }
          }
        }}
        currentColor={showAdvancedColorPicker ? filteredNotes.find(n => n.id === showAdvancedColorPicker)?.color : undefined}
        title="Choose note color"
      />
    </div>
  )
}