import { useState, useRef, useCallback } from 'react'
import { Note } from '@/app/notes/page'

/**
 * Custom hook to manage editor state
 */
export const useEditorState = (note: Note | null) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState('')
  const [content, setContent] = useState(note?.content || '')
  const [isEditing, setIsEditing] = useState(true)
  const [fontSize, setFontSize] = useState('15px')
  const [fontFamily, setFontFamily] = useState('Inter')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  
  // Refs
  const editorRef = useRef<HTMLDivElement>(null)
  const isSettingUpEdit = useRef(false)
  const previousNoteId = useRef<string | null>(null)

  // Picker states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showRangePicker, setShowRangePicker] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [imagePickerPosition, setImagePickerPosition] = useState({ top: 0, left: 0 })
  const [imageSearchQuery, setImageSearchQuery] = useState('')
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null)

  // Modal states
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState<string>('')
  const [isAnonymousShare, setIsAnonymousShare] = useState(false)
  const [showTagInput, setShowTagInput] = useState(false)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)

  // Date management
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ 
    from: undefined, 
    to: undefined 
  })


  const resetState = useCallback(() => {
    setIsEditingTitle(false)
    setTempTitle('')
    setIsEditing(false)
    setShowEmojiPicker(false)
    setShowDatePicker(false)
    setShowRangePicker(false)
    setShowImagePicker(false)
    setShowShareModal(false)
    setShowTagInput(false)
    setShowTemplateEditor(false)
    setShowTemplatePicker(false)
    setImageSearchQuery('')
    setMentionStartPos(null)
  }, [])

  return {
    // Basic editor state
    isEditingTitle,
    setIsEditingTitle,
    tempTitle,
    setTempTitle,
    content,
    setContent,
    isEditing,
    setIsEditing,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    lastSaved,
    setLastSaved,
    showStats,
    setShowStats,
    statsOpen,
    setStatsOpen,
    
    // Refs
    editorRef,
    isSettingUpEdit,
    previousNoteId,
    
    // Picker states
    showEmojiPicker,
    setShowEmojiPicker,
    showDatePicker,
    setShowDatePicker,
    showRangePicker,
    setShowRangePicker,
    showImagePicker,
    setShowImagePicker,
    imagePickerPosition,
    setImagePickerPosition,
    imageSearchQuery,
    setImageSearchQuery,
    mentionStartPos,
    setMentionStartPos,
    
    // Modal states
    showShareModal,
    setShowShareModal,
    shareUrl,
    setShareUrl,
    isAnonymousShare,
    setIsAnonymousShare,
    showTagInput,
    setShowTagInput,
    showTemplateEditor,
    setShowTemplateEditor,
    showTemplatePicker,
    setShowTemplatePicker,
    
    // Date management
    calendarDate,
    setCalendarDate,
    dateRange,
    setDateRange,
    
    // Methods
    resetState
  }
}
