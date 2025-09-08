/**
 * Emoji handling utilities for the editor
 */

export const getAppleEmojiHTML = (emoji: string): string => {
  // Handle compound emojis (with variation selectors) properly
  const getEmojiCodepoints = (emoji: string): string[] => {
    const codepoints = []
    for (let i = 0; i < emoji.length; ) {
      const codepoint = emoji.codePointAt(i)
      if (codepoint) {
        // Skip variation selectors (U+FE0F) for image URLs
        if (codepoint !== 0xFE0F) {
          codepoints.push(codepoint.toString(16).toLowerCase())
        }
        i += codepoint > 0xFFFF ? 2 : 1
      } else {
        i++
      }
    }
    return codepoints
  }

  const codepoints = getEmojiCodepoints(emoji)
  if (codepoints.length === 0) return emoji // fallback

  const primaryCodepoint = codepoints[0].padStart(4, '0')
  // No inline event handlers; safe src only
  return `<img src="https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64/${primaryCodepoint}.png" alt="${emoji}" class="inline-block w-5 h-5 align-text-bottom" style="display: inline-block; width: 20px; height: 20px; vertical-align: text-bottom; margin: 0 1px;" />`
}

export const isEmoji = (content: string): boolean => {
  const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/u
  return emojiRegex.test(content.trim())
}

export const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu

export const getRandomEmoji = (): string => {
  const emojis = ['😀', '😂', '😍', '🤔', '👍', '❤️', '🎉', '🔥', '💡', '✅', '❌', '⭐', '📝', '💼', '🚀']
  return emojis[Math.floor(Math.random() * emojis.length)]
}
