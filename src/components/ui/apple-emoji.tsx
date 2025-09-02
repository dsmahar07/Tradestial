'use client'

interface AppleEmojiProps {
  emoji: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizePixels = {
  sm: 20,
  md: 32, 
  lg: 48,
  xl: 64
}

// Convert emoji to Unicode codepoint for Apple emoji CDN
function emojiToCodepoint(emoji: string): string {
  const codePoint = emoji.codePointAt(0)
  if (!codePoint) return '1f600' // fallback to grinning face
  return codePoint.toString(16).toLowerCase()
}

export function AppleEmoji({ emoji, className = '', size = 'md' }: AppleEmojiProps) {
  const codepoint = emojiToCodepoint(emoji)
  const pixelSize = sizePixels[size]
  
  // Using Apple's official emoji CDN
  const appleEmojiUrl = `https://em-content.zobj.net/source/apple/391/${codepoint}.png`
  
  return (
    <img 
      src={appleEmojiUrl}
      alt={emoji}
      width={pixelSize}
      height={pixelSize}
      className={`inline-block ${className}`}
      style={{
        imageRendering: 'crisp-edges',
        objectFit: 'contain'
      }}
      onError={(e) => {
        // Fallback to system emoji if image fails to load
        const target = e.target as HTMLImageElement
        target.style.display = 'none'
        const fallback = document.createElement('span')
        fallback.textContent = emoji
        fallback.style.fontSize = `${pixelSize}px`
        fallback.style.lineHeight = '1'
        target.parentNode?.insertBefore(fallback, target)
      }}
    />
  )
}
