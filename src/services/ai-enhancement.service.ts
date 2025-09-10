import { logger } from '@/lib/logger'

/**
 * AI Text Enhancement Service using Kimi K2 via OpenRouter
 * Free alternative to OpenAI for professional writing enhancement
 */

export interface EnhancementOptions {
  type: 'professional' | 'grammar' | 'clarity' | 'trading-review' | 'summarize'
  context?: 'trade-journal' | 'general'
}

export interface EnhancementResult {
  enhancedText: string
  changes: string[]
  confidence: number
}

class AIEnhancementService {
  /**
   * Enhance text using Kimi K2 AI via API route
   */
  async enhanceText(
    originalText: string, 
    options: EnhancementOptions = { type: 'professional' }
  ): Promise<EnhancementResult> {
    if (!originalText || !originalText.trim()) {
      throw new Error('Text content is required')
    }

    try {
      const response = await fetch('/api/ai-enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: originalText,
          type: options.type,
          context: options.context || 'trade-journal'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'AI enhancement failed')
      }

      const result = await response.json()
      return result

    } catch (error) {
      logger.error('AI Enhancement error:', error)
      throw error
    }
  }

}

export const aiEnhancementService = new AIEnhancementService()
