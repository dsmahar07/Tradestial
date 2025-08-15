'use client'

import { motion } from 'framer-motion'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { NotebookTopSearch } from '@/components/features/notes/NotebookTopSearch'
import { NotebookSidebar } from '@/components/features/notes/NotebookSidebar'
import { NotebookMiddlePanel } from '@/components/features/notes/NotebookMiddlePanel'
import { NotebookEditor } from '@/components/features/notes/NotebookEditor'
import { useConfirmation } from '@/components/ui/confirmation-modal'
import { useToast } from '@/components/ui/notification-toast'
import { TradeJournalingTemplate, TemplateInstance, defaultTemplates } from '@/lib/templates'
import { useState, useEffect } from 'react'
import { usePageTitle } from '@/hooks/use-page-title'
import { useSearchParams } from 'next/navigation'


export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  folder: string
  tags: string[]
  color?: string // Color for the note badge/tag
  template?: {
    templateId: string
    customFields?: any[]
    fieldValues: Record<string, any>
  }
}

export interface Folder {
  id: string
  name: string
  order: number
  color?: string
}

export default function NotesPage() {
  usePageTitle('Notes')
  const searchParams = useSearchParams()
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [selectedFolder, setSelectedFolder] = useState('All notes')
  const { confirm, ConfirmationModal } = useConfirmation()
  const { success, error, warning, ToastContainer } = useToast()
  const [folders, setFolders] = useState<Folder[]>([
    { id: 'all-notes', name: 'All notes', order: 0, color: '#3b82f6' },
    { id: 'trade-notes', name: 'Trade Notes', order: 1, color: '#10b981' },
    { id: 'daily-journal', name: 'Daily Journal', order: 2, color: '#f59e0b' },
    { id: 'sessions-recap', name: 'Sessions Recap', order: 3, color: '#8b5cf6' },
    { id: 'my-notes', name: 'My notes', order: 4, color: '#ec4899' },
  ])
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      title: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      folder: 'All notes',
      tags: [],
      color: '#3b82f6' // Default blue color
    }
  ])
  const [templates, setTemplates] = useState<TradeJournalingTemplate[]>(defaultTemplates)

  // Handle navigation from Daily Journal with trade data
  useEffect(() => {
    const source = searchParams.get('source')
    const tradeId = searchParams.get('tradeId')
    
    if (source === 'trade' && tradeId) {
      // Set Daily Journal folder as selected
      setSelectedFolder('Daily Journal')
      
      // Get trade data from localStorage
      const tradeDataStr = localStorage.getItem('selectedTradeForNote')
      if (tradeDataStr) {
        try {
          const tradeData = JSON.parse(tradeDataStr)
          
          // Auto-create a note with trade information
          const now = new Date()
          const tradeNote: Note = {
            id: Date.now().toString(),
            title: `${tradeData.date} Trade Analysis`,
            content: `<h2>Trade Analysis - ${tradeData.date}</h2>
              <p><strong>Net P&L:</strong> $${tradeData.netPnl} ${tradeData.isProfit ? '✅' : '❌'}</p>
              <p><strong>Total Trades:</strong> ${tradeData.stats.totalTrades}</p>
              <p><strong>Winners:</strong> ${tradeData.stats.winners} | <strong>Losers:</strong> ${tradeData.stats.losers}</p>
              <p><strong>Win Rate:</strong> ${tradeData.stats.winrate}</p>
              <p><strong>Profit Factor:</strong> ${tradeData.stats.profitFactor}</p>
              <p><strong>Gross P&L:</strong> $${tradeData.stats.grossPnl}</p>
              <p><strong>Volume:</strong> ${tradeData.stats.volume}</p>
              
              <h3>Trade Details:</h3>
              <p><em>Click here to add your analysis, lessons learned, and trade review...</em></p>`,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            folder: 'Trade Notes',
            tags: ['trade-analysis', 'daily-journal'],
            color: '#10b981' // Trade Notes color
          }
          
          setNotes(prev => [tradeNote, ...prev])
          setSelectedNote(tradeNote)
          
          // Clean up localStorage
          localStorage.removeItem('selectedTradeForNote')
          
          success('Trade note created', 'Trade analysis note created successfully!')
        } catch (error) {
          console.error('Error parsing trade data:', error)
        }
      }
    }
  }, [searchParams, success])

  const handleCreateNote = () => {
    const now = new Date()
    const formattedDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    const newNote: Note = {
      id: Date.now().toString(),
      title: formattedDate,
      content: '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      folder: selectedFolder === 'All notes' ? 'My notes' : selectedFolder,
      tags: [],
      color: '#3b82f6' // Default blue color
    }
    setNotes(prev => [newNote, ...prev])
    setSelectedNote(newNote)
    console.log('Created new note:', newNote)
  }

  const handleCreateNoteFromTemplate = (template: TradeJournalingTemplate, templateInstance: TemplateInstance, generatedContent: string) => {
    const now = new Date()
    
    // Generate a more specific title based on template type
    let title = template.name
    if (template.category === 'daily') {
      title = `${template.name} - ${now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })}`
    } else if (template.category === 'trade') {
      const symbol = templateInstance.fieldValues['symbol'] || 'Trade'
      title = `${symbol} - ${template.name}`
    } else if (template.category === 'review') {
      const weekStart = templateInstance.fieldValues['week-starting'] || templateInstance.fieldValues['week-ending']
      if (weekStart) {
        title = `${template.name} - ${new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      }
    }
    
    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content: generatedContent,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      folder: selectedFolder === 'All notes' ? 'My notes' : selectedFolder,
      tags: [...template.tags],
      color: template.color,
      template: templateInstance
    }
    
    setNotes(prev => [newNote, ...prev])
    setSelectedNote(newNote)
    console.log('Created note from template:', newNote)
    success('Note created', `${template.name} note created successfully!`)
  }

  const handleQuickApplyTemplate = (template: TradeJournalingTemplate, content: string) => {
    const now = new Date()
    
    // Generate a more specific title based on template type and current date
    let title = template.name
    if (template.category === 'daily') {
      title = `${template.name} - ${now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })}`
    } else if (template.category === 'trade') {
      title = `${template.name} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    } else if (template.category === 'review') {
      title = `${template.name} - Week of ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    }
    
    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      folder: selectedFolder === 'All notes' ? 'My notes' : selectedFolder,
      tags: [...template.tags],
      color: template.color,
    }
    
    setNotes(prev => [newNote, ...prev])
    setSelectedNote(newNote)
    console.log('Quick applied template:', newNote)
    success('Template applied!', `${template.name} template applied instantly - ready to edit!`)
  }

  const handleUpdateNote = (id: string, content: string, title?: string, color?: string, tags?: string[]) => {
    console.log('Updating note:', id, 'with content length:', content.length)
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { 
            ...note, 
            content, 
            updatedAt: new Date().toISOString(),
            // Only update title if explicitly provided
            ...(title !== undefined && { title }),
            // Only update color if explicitly provided
            ...(color !== undefined && { color }),
            // Only update tags if explicitly provided
            ...(tags !== undefined && { tags })
          }
        : note
    ))
    // Update selected note state to stay in sync
    if (selectedNote?.id === id) {
      setSelectedNote(prev => prev ? { 
        ...prev, 
        content, 
        updatedAt: new Date().toISOString(),
        // Only update title if explicitly provided
        ...(title !== undefined && { title }),
        // Only update color if explicitly provided
        ...(color !== undefined && { color }),
        // Only update tags if explicitly provided
        ...(tags !== undefined && { tags })
      } : null)
    }
  }

  const handleReorderNotes = (startIndex: number, endIndex: number) => {
    const newNotes = [...notes]
    const [removed] = newNotes.splice(startIndex, 1)
    newNotes.splice(endIndex, 0, removed)
    setNotes(newNotes)
  }

  const handleDeleteNote = (id: string, noteTitle: string) => {
    const noteToDelete = notes.find(note => note.id === id)
    
    // Check if note has meaningful content (more than just title and empty content)
    const hasContent = noteToDelete && (
      (noteToDelete.content && 
       noteToDelete.content.trim() !== '' && 
       noteToDelete.content !== '<p><br></p>' && 
       noteToDelete.content !== '<p>Start typing...</p>') ||
      (noteToDelete.title && noteToDelete.title.trim() !== '')
    )
    
    confirm({
      title: 'Delete Note',
      message: `Are you sure you want to delete "${noteTitle}"? ${hasContent ? 'This note contains content and ' : ''}This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: () => {
        setNotes(prev => prev.filter(note => note.id !== id))
        if (selectedNote?.id === id) {
          setSelectedNote(null)
        }
        
        // Only show notification if note had meaningful content
        if (hasContent) {
          warning('Note deleted', `"${noteTitle}" has been permanently deleted.`)
        }
      }
    })
  }

  const handleDeleteAllNotes = () => {
    // Get notes in current folder
    const notesToDelete = selectedFolder === 'All notes' 
      ? notes 
      : notes.filter(note => note.folder === selectedFolder)
    
    if (notesToDelete.length === 0) return
    
    confirm({
      title: 'Delete All Notes',
      message: `Are you sure you want to delete all ${notesToDelete.length} notes${selectedFolder !== 'All notes' ? ` in "${selectedFolder}"` : ''}? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete All',
      onConfirm: () => {
        if (selectedFolder === 'All notes') {
          // Delete all notes
          setNotes([])
        } else {
          // Delete notes in current folder only
          setNotes(prev => prev.filter(note => note.folder !== selectedFolder))
        }
        setSelectedNote(null)
        warning('Notes deleted', `${notesToDelete.length} notes have been permanently deleted.`)
      }
    })
  }

  const handleNoteSelect = (note: Note) => {
    console.log('Selecting note:', note.title)
    setSelectedNote(note)
  }

  const handleFolderSelect = (folder: string) => {
    console.log('Selecting folder:', folder)
    setSelectedFolder(folder)
    // Clear selected note when changing folders to avoid confusion
    setSelectedNote(null)
  }

  const handleAddFolder = () => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      name: 'New Folder',
      order: folders.length,
      color: '#3b82f6'
    }
    setFolders(prev => [...prev, newFolder])
  }

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    if (folderId === 'all-notes') return // Prevent deleting "All notes"
    
    // Check how many notes are in this folder
    const folderToDelete = folders.find(f => f.id === folderId)
    const notesInFolder = notes.filter(note => note.folder === folderToDelete?.name)
    
    confirm({
      title: 'Delete Folder',
      message: `Are you sure you want to delete "${folderName}"? ${notesInFolder.length > 0 ? `All ${notesInFolder.length} notes in this folder will be moved to "My notes".` : 'This folder is empty.'}`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: () => {
        setFolders(prev => prev.filter(folder => folder.id !== folderId))
        
        // If we're deleting the currently selected folder, switch to "All notes"
        if (folderToDelete && selectedFolder === folderToDelete.name) {
          setSelectedFolder('All notes')
          setSelectedNote(null)
        }
        
        // Move notes from deleted folder to "My notes"
        setNotes(prev => prev.map(note => 
          note.folder === folderToDelete?.name 
            ? { ...note, folder: 'My notes' }
            : note
        ))
        
        // Only show notification if folder had notes
        if (notesInFolder.length > 0) {
          warning('Folder deleted', `"${folderName}" deleted. ${notesInFolder.length} notes moved to "My notes".`)
        }
      }
    })
  }

  const handleRenameFolder = (folderId: string, newName: string) => {
    const oldFolder = folders.find(f => f.id === folderId)
    if (!oldFolder) return
    
    setFolders(prev => prev.map(folder => 
      folder.id === folderId 
        ? { ...folder, name: newName }
        : folder
    ))
    
    // Update notes that belong to this folder
    setNotes(prev => prev.map(note => 
      note.folder === oldFolder.name 
        ? { ...note, folder: newName }
        : note
    ))
    
    // Update selected folder if it's the one being renamed
    if (selectedFolder === oldFolder.name) {
      setSelectedFolder(newName)
    }
  }

  const handleReorderFolders = (startIndex: number, endIndex: number) => {
    if (startIndex === 0 || endIndex === 0) return // Can't move "All notes"
    
    const newFolders = [...folders]
    const [removed] = newFolders.splice(startIndex, 1)
    newFolders.splice(endIndex, 0, removed)
    
    // Update order
    newFolders.forEach((folder, index) => {
      folder.order = index
    })
    
    setFolders(newFolders)
  }

  const handleUpdateFolderColor = (folderId: string, color: string) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId 
        ? { ...folder, color }
        : folder
    ))
  }

  const handleDeleteTemplate = (template: TradeJournalingTemplate) => {
    // Show custom confirmation dialog
    confirm({
      title: 'Delete Template',
      message: `Are you sure you want to delete the template "${template.name}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Template',
      cancelText: 'Cancel',
      onConfirm: () => {
        // Actually remove the template from the templates array
        setTemplates((prevTemplates: TradeJournalingTemplate[]) => 
          prevTemplates.filter((t: TradeJournalingTemplate) => t.id !== template.id)
        )
        success(`Template "${template.name}" has been deleted successfully!`)
      }
    })
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-hidden px-6 pb-6 pt-6 bg-gray-50 dark:bg-[#1C1C1C]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="h-full flex flex-col bg-white dark:bg-[#171717] rounded-xl overflow-hidden shadow-lg"
          >
            {/* Top Search Bar */}
            <NotebookTopSearch />
            
            <div className="flex flex-1 overflow-hidden">
              {/* Left Sidebar with right spacing */}
              <div className="pr-4 border-r border-gray-200 dark:border-[#404040]">
                <NotebookSidebar 
                  selectedFolder={selectedFolder}
                  folders={folders}
                  onFolderSelect={handleFolderSelect}
                  onAddFolder={handleAddFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onRenameFolder={handleRenameFolder}
                  onReorderFolders={handleReorderFolders}
                  onUpdateFolderColor={handleUpdateFolderColor}
                />
              </div>
              
              {/* Middle Panel */}
              <NotebookMiddlePanel 
                selectedFolder={selectedFolder}
                selectedNote={selectedNote}
                notes={notes}
                onNoteSelect={handleNoteSelect}
                onCreateNote={handleCreateNote}
                onCreateNoteFromTemplate={handleCreateNoteFromTemplate}
                onQuickApplyTemplate={handleQuickApplyTemplate}
                onDeleteNote={handleDeleteNote}
                onUpdateNote={handleUpdateNote}
                onReorderNotes={handleReorderNotes}
                onDeleteAllNotes={handleDeleteAllNotes}
                onDeleteTemplate={handleDeleteTemplate}
                templates={templates}
              />
              
              {/* Right Editor Panel */}
              <NotebookEditor 
                note={selectedNote} 
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
              />
            </div>
          </motion.div>
        </main>
      </div>
      
      {/* Confirmation Modal */}
      <ConfirmationModal />
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  )
}