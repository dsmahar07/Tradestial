// Trade Metadata Service - Handles extended trade data like rating, profit target, stop loss, etc.
export interface TradeMetadata {
  tradeId: string
  rating: number
  profitTarget: string
  stopLoss: string
  notes?: string
  executionNotes?: string
  tags?: string[]
  customTags?: string[]
  mistakes?: string[]
  model?: string
  lastUpdated: Date
}

interface TradeMetadataData {
  [tradeId: string]: TradeMetadata
}

class TradeMetadataService {
  private static instance: TradeMetadataService
  private data: TradeMetadataData = {}
  private listeners: Set<(data: TradeMetadataData) => void> = new Set()
  private readonly STORAGE_KEY = 'tradestial-trade-metadata'

  public static getInstance(): TradeMetadataService {
    if (!TradeMetadataService.instance) {
      TradeMetadataService.instance = new TradeMetadataService()
      // Load existing data from localStorage
      TradeMetadataService.instance.loadFromStorage()
    }
    return TradeMetadataService.instance
  }

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const storedData = localStorage.getItem(this.STORAGE_KEY)
        if (storedData) {
          this.data = JSON.parse(storedData)
          // Convert date strings back to Date objects
          Object.values(this.data).forEach(metadata => {
            metadata.lastUpdated = new Date(metadata.lastUpdated)
          })
          console.log(`📚 TradeMetadataService - Loaded ${Object.keys(this.data).length} trade metadata entries from storage`)
        } else {
          console.log('📚 TradeMetadataService - No stored metadata found, starting with empty data')
          this.data = {}
        }
      } else {
        this.data = {}
      }
    } catch (error) {
      console.error('❌ TradeMetadataService - Error loading from localStorage:', error)
      this.data = {}
    }
    this.notify()
  }

  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data))
        console.log(`💾 TradeMetadataService - Saved ${Object.keys(this.data).length} trade metadata entries to storage`)
      }
    } catch (error) {
      console.error('❌ TradeMetadataService - Error saving to localStorage:', error)
    }
  }

  // Subscribe to metadata changes
  public subscribe(callback: (data: TradeMetadataData) => void): () => void {
    this.listeners.add(callback)
    // Immediately call with current data
    callback(this.data)
    return () => this.listeners.delete(callback)
  }

  // Notify all listeners of data changes and save to storage
  private notify(): void {
    this.listeners.forEach(callback => callback(this.data))
    // Save to localStorage whenever data changes (except on initial load)
    if (this.listeners.size > 0) {
      this.saveToStorage()
    }
  }

  // Get metadata for a specific trade
  public getTradeMetadata(tradeId: string): TradeMetadata | null {
    return this.data[tradeId] || null
  }

  // Get all trade metadata
  public getAllTradeMetadata(): TradeMetadataData {
    return { ...this.data }
  }

  // Set metadata for a specific trade
  public setTradeMetadata(tradeId: string, metadata: Partial<TradeMetadata>): void {
    if (!this.data[tradeId]) {
      this.data[tradeId] = {
        tradeId,
        rating: 0,
        profitTarget: '',
        stopLoss: '',
        lastUpdated: new Date()
      }
    }

    this.data[tradeId] = {
      ...this.data[tradeId],
      ...metadata,
      tradeId, // Ensure tradeId doesn't get overwritten
      lastUpdated: new Date()
    }

    this.notify()
  }

  // Update rating for a trade
  public setTradeRating(tradeId: string, rating: number): void {
    this.setTradeMetadata(tradeId, { rating })
  }

  // Update profit target and stop loss
  public setTradeLevels(tradeId: string, profitTarget: string, stopLoss: string): void {
    this.setTradeMetadata(tradeId, { profitTarget, stopLoss })
  }

  // Add tag to trade
  public addTradeTag(tradeId: string, tag: string, category: 'tags' | 'customTags' | 'mistakes' = 'tags'): void {
    const metadata = this.getTradeMetadata(tradeId)
    if (!metadata) {
      this.setTradeMetadata(tradeId, { [category]: [tag] })
      return
    }

    const currentTags = metadata[category] || []
    if (!currentTags.includes(tag)) {
      this.setTradeMetadata(tradeId, {
        [category]: [...currentTags, tag]
      })
    }
  }

  // Remove tag from trade
  public removeTradeTag(tradeId: string, tag: string, category: 'tags' | 'customTags' | 'mistakes' = 'tags'): void {
    const metadata = this.getTradeMetadata(tradeId)
    if (!metadata) return

    const currentTags = metadata[category] || []
    this.setTradeMetadata(tradeId, {
      [category]: currentTags.filter(t => t !== tag)
    })
  }

  // Set notes for a trade
  public setTradeNotes(tradeId: string, notes: string, type: 'notes' | 'executionNotes' = 'notes'): void {
    this.setTradeMetadata(tradeId, { [type]: notes })
  }

  // Clear all metadata
  public clearAllMetadata(): void {
    this.data = {}
    this.notify()
  }

  // Import metadata from external source
  public importMetadata(metadata: TradeMetadataData): void {
    this.data = { ...metadata }
    this.notify()
  }
}

export default TradeMetadataService.getInstance()