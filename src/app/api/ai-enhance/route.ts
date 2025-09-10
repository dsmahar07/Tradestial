import { logger } from '@/lib/logger'

import { NextRequest, NextResponse } from 'next/server'

interface EnhancementRequest {
  text: string
  type: 'professional' | 'grammar' | 'clarity' | 'trading-review' | 'summarize'
  context?: 'trade-journal' | 'general'
}

export async function POST(request: NextRequest) {
  try {
    const { text, type, context = 'trade-journal' }: EnhancementRequest = await request.json()

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      )
    }

    const prompt = buildPrompt(text, { type, context })

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tradestial.com',
        'X-Title': 'Tradestial AI Enhancement'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-maverick',
        messages: [
          {
            role: 'system',
            content: 'You are a professional writing assistant specializing in trading journal enhancement. You format text using markdown for better readability. Use **bold** for important points, *italics* for emphasis, ==highlights== for key insights, bullet points for lists, and proper headings. Always return ONLY the enhanced formatted text without explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 8352
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      logger.error('OpenRouter API error:', response.status, errorData)
      return NextResponse.json(
        { error: `AI service error: ${response.status} - ${errorData}` },
        { status: 503 }
      )
    }

    const data = await response.json()
    const enhancedText = data.choices?.[0]?.message?.content || text

    return NextResponse.json({
      enhancedText,
      changes: [], // Could be enhanced to detect changes
      confidence: 0.9
    })

  } catch (error) {
    logger.error('AI Enhancement API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function buildPrompt(text: string, options: { type: string; context?: string }): string {
  const contextPrefix = options.context === 'trade-journal' 
    ? 'This is content from a trading journal. '
    : ''

  const typeInstructions = {
    professional: 'Rewrite this text to be more professional, clear, and well-structured. Use **bold** for key points, *italics* for emphasis, and proper organization with bullet points or headings where appropriate. Format using markdown.',
    grammar: 'Fix all grammar, spelling, and punctuation errors. Use **bold** to highlight corrected key terms and *italics* for emphasis where needed. Format using markdown.',
    clarity: 'Improve clarity and readability by simplifying complex sentences. Use **bold** for main points, bullet points for lists, and ==highlights== for key insights. Format using markdown.',
    'trading-review': 'Enhance this trading review professionally. Use **bold** for trade outcomes, *italics* for emotions/psychology, ==highlights== for key lessons, and bullet points for action items. Format using markdown.',
    summarize: 'Create a well-organized summary with **bold** headings for main topics, bullet points for key details, and ==highlights== for critical insights. Format using markdown.'
  }

  return `${contextPrefix}${typeInstructions[options.type as keyof typeof typeInstructions]}

IMPORTANT: Respond with ONLY the enhanced/corrected text. Do not include any explanations, alternatives, or additional commentary.

Original text:
${text}

Enhanced text:`
}
