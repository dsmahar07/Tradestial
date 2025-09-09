'use client'

import { Plus, MoreHorizontal, Edit3, Trash2, GripVertical, ChevronLeft, Share2, Users, Menu, X, MoreVertical, Bookmark, FolderOpen } from 'lucide-react'
import { Root as FancyButton } from '@/components/ui/fancy-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Note, Folder } from '@/app/notes/page'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'


interface NotebookMiddlePanelProps {
  selectedFolder: string
  selectedTag?: string | null
  selectedNote: Note | null
  notes: Note[]
  folders: Folder[]
  onNoteSelect: (note: Note) => void
  onCreateNote: () => void
  onDeleteNote: (id: string, noteTitle: string) => void
  onUpdateNote: (id: string, content: string, title?: string) => void
  onMoveNote: (noteId: string, targetFolder: string) => void
  onToggleBookmark: (noteId: string) => void
  onReorderNotes: (startIndex: number, endIndex: number) => void
  onDeleteAllNotes?: () => void
  onToggleCollapse?: () => void
  isSidebarCollapsed?: boolean
}

export function NotebookMiddlePanel({ 
  selectedFolder, 
  selectedTag = null,
  selectedNote, 
  notes, 
  folders,
  onNoteSelect, 
  onCreateNote, 
  onDeleteNote, 
  onUpdateNote, 
  onMoveNote,
  onToggleBookmark,
  onReorderNotes, 
  onDeleteAllNotes, 
  onToggleCollapse, 
  isSidebarCollapsed 
}: NotebookMiddlePanelProps) {
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


  const filteredNotes = notes.filter(note => {
    const matchesTag = !selectedTag || note.tags?.includes(selectedTag)
    const matchesFolder = selectedTag ? true : 
      selectedFolder === 'All notes' || 
      selectedFolder === 'Bookmarked' ? true : 
      note.folder === selectedFolder
    const matchesBookmark = selectedFolder === 'Bookmarked' ? note.isBookmarked === true : true
    return matchesTag && matchesFolder && matchesBookmark
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
    <div className="h-full bg-white dark:bg-[#0f0f0f] flex flex-col">
      {/* Header with back arrow and New note */}
      <div className="p-4 bg-white dark:bg-[#0f0f0f] flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
          </div>
          <FancyButton
            variant="basic"
            size="small"
            className="!bg-white dark:!bg-[#0f0f0f] !border-gray-200 dark:!border-[#404040] hover:!bg-gray-50 dark:hover:!bg-[#171717]"
            onClick={onCreateNote}
            title="New note"
          >
            <Plus className="w-4 h-4" />
          </FancyButton>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 flex items-center justify-center text-gray-600 dark:text-[#CCCCCC] hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-md transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-[#404040]">
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
        </div>

      </div>



      {/* Notes List */}
<div className="flex-1 overflow-y-auto min-h-0">
        {filteredNotes.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Edit3 className="w-16 h-16 mx-auto mb-6 opacity-40" />
            <p className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No notes found</p>
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
                "p-3 hover:bg-gray-50 dark:hover:bg-[#171717] transition-all duration-300 ease-in-out group relative rounded-xl transform",
                                  selectedNote?.id === note.id 
                    ? "bg-gray-50 dark:bg-[#171717]" 
                    : "bg-white dark:bg-[#0f0f0f]",
                draggedNote === index && "opacity-60 scale-95 rotate-1 z-10",
                draggedOverNote === index && draggedNote !== index && "ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-105"
              )}
            >
              
              <div className="flex items-start space-x-3">
                
                {/* Drag handle */}
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-grab active:cursor-grabbing hover:scale-110">
                  <GripVertical className="w-3 h-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 mt-1" />
                </div>

                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => onNoteSelect(note)}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-300 leading-tight break-words">{note.title}</h3>
                    {note.isBookmarked && (
                      <Bookmark className="w-4 h-4 fill-current text-yellow-500" />
                    )}
                    {note.sharing?.isShared && (
                      <div className="flex items-center gap-1">
                        {note.sharing.isAnonymous ? (
                          <div title="Shared anonymously">
                            <Users className="w-4 h-4 text-blue-500" />
                          </div>
                        ) : (
                          <div title="Shared publicly">
                            <Share2 className="w-4 h-4 text-blue-500" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(note.createdAt)}
                    {note.sharing?.isShared && (
                      <span className="ml-2 text-blue-500 text-xs">
                        • {note.sharing.isAnonymous ? 'Anonymous' : 'Public'} share
                      </span>
                    )}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <DropdownMenuPrimitive.Root>
                    <DropdownMenuPrimitive.Trigger asChild>
                      <button
                        className="h-6 w-6 rounded hover:bg-gray-200 dark:hover:bg-[#2A2A2A] p-1 transition-colors flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-3 h-3" />
                      </button>
                    </DropdownMenuPrimitive.Trigger>
                    <DropdownMenuPrimitive.Portal>
                      <DropdownMenuPrimitive.Content
                        className="min-w-[160px] bg-white dark:bg-[#1A1A1A] rounded-md p-1 shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                        sideOffset={5}
                      >
                        <DropdownMenuPrimitive.Item
                          className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-[#2A2A2A] text-gray-700 dark:text-gray-300 outline-none"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleBookmark(note.id)
                          }}
                        >
                          <Bookmark className={cn("w-4 h-4", note.isBookmarked ? "fill-current text-yellow-500" : "")} />
                          {note.isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                        </DropdownMenuPrimitive.Item>
                        <DropdownMenuPrimitive.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                        {folders.filter(f => f.name !== note.folder).slice(0, 3).map((folder) => (
                          <DropdownMenuPrimitive.Item
                            key={folder.id}
                            className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-[#2A2A2A] text-gray-700 dark:text-gray-300 outline-none"
                            onClick={(e) => {
                              e.stopPropagation()
                              onMoveNote(note.id, folder.name)
                            }}
                          >
                            <FolderOpen className="w-4 h-4" />
                            Move to {folder.name}
                          </DropdownMenuPrimitive.Item>
                        ))}
                        <DropdownMenuPrimitive.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                        <DropdownMenuPrimitive.Item
                          className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 outline-none"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteNote(note.id, note.title)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </DropdownMenuPrimitive.Item>
                      </DropdownMenuPrimitive.Content>
                    </DropdownMenuPrimitive.Portal>
                  </DropdownMenuPrimitive.Root>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  )
}