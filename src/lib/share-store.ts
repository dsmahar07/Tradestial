// Server-side sharing system using localStorage as a simple database
// In production, this would use a real database like PostgreSQL or MongoDB

export interface SharedNoteData {
  id: string
  noteId: string
  title: string
  content: string
  tags: string[]
  color?: string
  createdAt: string
  updatedAt: string
  sharedAt: string
  isAnonymous: boolean
  sharedBy?: {
    name: string
    initials?: string
  }
  tradingData?: {
    netPnl?: number
    isProfit?: boolean
    stats?: any
    chartData?: Array<{ time: string; value: number }>
    trades?: any[]
    date?: string
  }
}

class ShareStore {
  private storageKey = 'tradestial_shared_notes'

  // Generate a short, URL-safe share ID
  private generateShareId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Store a shared note and return the share ID
  shareNote(noteData: Omit<SharedNoteData, 'id' | 'sharedAt'>): string {
    const shareId = this.generateShareId()
    const sharedNote: SharedNoteData = {
      ...noteData,
      id: shareId,
      sharedAt: new Date().toISOString()
    }

    // Get existing shared notes
    const existingShares = this.getAllSharedNotes()
    
    // Add new share
    existingShares[shareId] = sharedNote
    
    // Save to storage
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(existingShares))
    }

    return shareId
  }

  // Retrieve a shared note by ID
  getSharedNote(shareId: string): SharedNoteData | null {
    const allShares = this.getAllSharedNotes()
    return allShares[shareId] || null
  }

  // Stop sharing a note
  stopSharing(shareId: string): boolean {
    const allShares = this.getAllSharedNotes()
    if (allShares[shareId]) {
      delete allShares[shareId]
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(allShares))
      }
      return true
    }
    return false
  }

  // Get all shared notes (private method)
  private getAllSharedNotes(): Record<string, SharedNoteData> {
    if (typeof window === 'undefined') return {}
    
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('Error reading shared notes:', error)
      return {}
    }
  }

  // Find share ID by note ID (for checking if note is already shared)
  findShareByNoteId(noteId: string): string | null {
    const allShares = this.getAllSharedNotes()
    for (const [shareId, sharedNote] of Object.entries(allShares)) {
      if (sharedNote.noteId === noteId) {
        return shareId
      }
    }
    return null
  }

  // Update an existing shared note
  updateSharedNote(shareId: string, updates: Partial<SharedNoteData>): boolean {
    const allShares = this.getAllSharedNotes()
    if (allShares[shareId]) {
      allShares[shareId] = { ...allShares[shareId], ...updates }
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(allShares))
      }
      return true
    }
    return false
  }
}

export const shareStore = new ShareStore()
