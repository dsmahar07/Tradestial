import { useState, useEffect } from 'react'
import TradeMetadataService, { TradeMetadata } from '@/services/trade-metadata.service'

export function useTradeMetadata() {
  const [metadata, setMetadata] = useState<Record<string, TradeMetadata>>({})

  useEffect(() => {
    // Subscribe to metadata changes
    const unsubscribe = TradeMetadataService.subscribe((data) => {
      setMetadata({ ...data }) // Force new object reference
    })

    return unsubscribe
  }, [])

  const getTradeMetadata = (tradeId: string): TradeMetadata | null => {
    return metadata[tradeId] || null
  }

  const setTradeRating = (tradeId: string, rating: number) => {
    TradeMetadataService.setTradeRating(tradeId, rating)
  }

  const setTradeLevels = (tradeId: string, profitTarget: string, stopLoss: string) => {
    TradeMetadataService.setTradeLevels(tradeId, profitTarget, stopLoss)
  }

  const addTradeTag = (tradeId: string, tag: string, category: 'tags' | 'customTags' | 'mistakes' = 'tags') => {
    TradeMetadataService.addTradeTag(tradeId, tag, category)
  }

  const removeTradeTag = (tradeId: string, tag: string, category: 'tags' | 'customTags' | 'mistakes' = 'tags') => {
    TradeMetadataService.removeTradeTag(tradeId, tag, category)
  }

  const setTradeNotes = (tradeId: string, notes: string, type: 'notes' | 'executionNotes' = 'notes') => {
    TradeMetadataService.setTradeNotes(tradeId, notes, type)
  }

  const setTradeMetadata = (tradeId: string, data: Partial<TradeMetadata>) => {
    TradeMetadataService.setTradeMetadata(tradeId, data)
  }

  return {
    metadata,
    getTradeMetadata,
    setTradeRating,
    setTradeLevels,
    addTradeTag,
    removeTradeTag,
    setTradeNotes,
    setTradeMetadata
  }
}