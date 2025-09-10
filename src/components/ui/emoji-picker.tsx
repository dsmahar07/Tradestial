'use client'

import { logger } from '@/lib/logger'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmojiPickerProps {
  isOpen: boolean
  onClose: () => void
  onEmojiSelect: (emoji: string) => void
  className?: string
  anchorEl?: HTMLElement | null
}

// Emoji categories with iOS-style organization
const emojiCategories = {
  'Smileys & People': {
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇',
      '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪',
      '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒',
      '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
      '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟',
      '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢',
      '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬',
      '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'
    ]
  },
  'Animals & Nature': {
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷',
      '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥',
      '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞',
      '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑',
      '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆',
      '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄',
      '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈',
      '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡'
    ]
  },
  'Food & Drink': {
    icon: '🍎',
    emojis: [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭',
      '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕',
      '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳',
      '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓',
      '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲',
      '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢',
      '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿',
      '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🫖', '🍵', '🧃', '🥤', '🧋'
    ]
  },
  'Activities': {
    icon: '⚽',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸',
      '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋',
      '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️‍♀️', '🏋️', '🏋️‍♂️',
      '🤼‍♀️', '🤼', '🤼‍♂️', '🤸‍♀️', '🤸', '🤸‍♂️', '⛹️‍♀️', '⛹️', '⛹️‍♂️',
      '🤺', '🤾‍♀️', '🤾', '🤾‍♂️', '🏌️‍♀️', '🏌️', '🏌️‍♂️', '🏇', '🧘‍♀️', '🧘',
      '🧘‍♂️', '🏄‍♀️', '🏄', '🏄‍♂️', '🏊‍♀️', '🏊', '🏊‍♂️', '🤽‍♀️', '🤽', '🤽‍♂️',
      '🚣‍♀️', '🚣', '🚣‍♂️', '🧗‍♀️', '🧗', '🧗‍♂️', '🚵‍♀️', '🚵', '🚵‍♂️',
      '🚴‍♀️', '🚴', '🚴‍♂️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️'
    ]
  },
  'Travel & Places': {
    icon: '🚗',
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛',
      '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼', '🚁', '🛸', '✈️', '🛩️', '🛫', '🛬',
      '🪂', '💺', '🚀', '🛰️', '🚉', '🚊', '🚝', '🚞', '🚋', '🚃', '🚋', '🚞', '🚝',
      '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺',
      '🛰️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽',
      '🚧', '🚨', '🚥', '🚦', '🛑', '🚏', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️',
      '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻',
      '🏕️', '⛺', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤'
    ]
  },
  'Objects': {
    icon: '💡',
    emojis: [
      '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽',
      '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟',
      '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳',
      '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶',
      '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️',
      '🪓', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪',
      '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️',
      '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪'
    ]
  },
  'Symbols': {
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞',
      '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯',
      '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
      '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸',
      '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲',
      '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫',
      '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓',
      '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️'
    ]
  },
  'Flags': {
    icon: '🏁',
    emojis: [
      '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇦🇨', '🇦🇩',
      '🇦🇪', '🇦🇫', '🇦🇬', '🇦🇮', '🇦🇱', '🇦🇲', '🇦🇴', '🇦🇶', '🇦🇷', '🇦🇸',
      '🇦🇹', '🇦🇺', '🇦🇼', '🇦🇽', '🇦🇿', '🇧🇦', '🇧🇧', '🇧🇩', '🇧🇪', '🇧🇫',
      '🇧🇬', '🇧🇭', '🇧🇮', '🇧🇯', '🇧🇱', '🇧🇲', '🇧🇳', '🇧🇴', '🇧🇶', '🇧🇷',
      '🇧🇸', '🇧🇹', '🇧🇻', '🇧🇼', '🇧🇾', '🇧🇿', '🇨🇦', '🇨🇨', '🇨🇩', '🇨🇫',
      '🇨🇬', '🇨🇭', '🇨🇮', '🇨🇰', '🇨🇱', '🇨🇲', '🇨🇳', '🇨🇴', '🇨🇵', '🇨🇷',
      '🇨🇺', '🇨🇻', '🇨🇼', '🇨🇽', '🇨🇾', '🇨🇿', '🇩🇪', '🇩🇬', '🇩🇯', '🇩🇰',
      '🇩🇲', '🇩🇴', '🇩🇿', '🇪🇦', '🇪🇨', '🇪🇪', '🇪🇬', '🇪🇭', '🇪🇷', '🇪🇸'
    ]
  }
}

const recentEmojis = ['😀', '❤️', '😂', '🔥', '👍', '💯', '🎉', '✨']

// Helper function to convert emoji to codepoint for Apple emoji images
function getEmojiCodepoint(emoji: string): string {
  const codePoint = emoji.codePointAt(0)
  if (!codePoint) return '1f600' // fallback to grinning face
  return codePoint.toString(16).toLowerCase().padStart(4, '0')
}

// Apple Emoji Component - More robust version
function AppleEmoji({ emoji, className = "w-5 h-5" }: { emoji: string; className?: string }) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)
  
  useEffect(() => {
    // Reset states when emoji changes
    setHasError(false)
    setImageSrc(null)
    
    // Handle compound emojis (with variation selectors)
    const getEmojiCodepoints = (emoji: string): string[] => {
      const codepoints = []
      for (let i = 0; i < emoji.length; ) {
        const codepoint = emoji.codePointAt(i)
        if (codepoint) {
          // Skip variation selectors (U+FE0F) as they're usually not needed for image URLs
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
    if (codepoints.length === 0) {
      setHasError(true)
      return
    }
    
    // Generate different codepoint formats
    const primaryCodepoint = codepoints[0]
    const primaryPadded = primaryCodepoint.padStart(4, '0')
    const joinedCodepoints = codepoints.join('-')
    const joinedPadded = codepoints.map(cp => cp.padStart(4, '0')).join('-')
    
    // Try multiple URL formats with different codepoint representations
    const urls = [
      // Apple emoji with single codepoint (most common)
      `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64/${primaryPadded}.png`,
      `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64/${primaryCodepoint}.png`,
      // Apple emoji with joined codepoints (for compound emojis)
      `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64/${joinedPadded}.png`,
      `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64/${joinedCodepoints}.png`,
      // Twemoji fallbacks
      `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${primaryCodepoint}.png`,
      `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${joinedCodepoints}.png`,
      `https://twemoji.maxcdn.com/v/14.0.2/72x72/${primaryCodepoint}.png`
    ]
    
    // Try loading each URL
    const tryLoadImage = async (urlIndex: number = 0): Promise<void> => {
      if (urlIndex >= urls.length) {
        setHasError(true)
        return
      }
      
      const url = urls[urlIndex]
      const img = new Image()
      
      img.onload = () => {
        setImageSrc(url)
        setHasError(false)
      }
      
      img.onerror = () => {
        if (urlIndex === 0) {
          logger.debug(`🚨 Emoji ${emoji} failed to load from primary source. Codepoints: [${codepoints.join(', ')}]. Trying alternatives...`)
        }
        if (urlIndex === urls.length - 1) {
          logger.warn(`❌ All sources failed for emoji: ${emoji}. Will use system emoji fallback.`)
        }
        tryLoadImage(urlIndex + 1)
      }
      
      img.src = url
    }
    
    tryLoadImage()
  }, [emoji])
  
  // If we have a successful image source, show it
  if (imageSrc && !hasError) {
    return (
      <img
        src={imageSrc}
        alt={emoji}
        className={cn(className, "select-none object-contain")}
        draggable={false}
        onError={() => setHasError(true)}
      />
    )
  }
  
  // Fallback to system emoji - try to force iOS-like appearance
  return (
    <span 
      className={cn(className, "inline-flex items-center justify-center select-none")}
      style={{ 
        fontSize: '18px', 
        lineHeight: 1,
        fontFamily: '"Apple Color Emoji", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji"',
        textRendering: 'optimizeLegibility',
        fontFeatureSettings: '"liga" 1',
        filter: 'saturate(1.1) contrast(1.05)', // Slightly enhance colors to match iOS style
      }}
    >
      {emoji}
    </span>
  )
}

export function EmojiPicker({ isOpen, onClose, onEmojiSelect, className, anchorEl }: EmojiPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState('Smileys & People')
  const [searchQuery, setSearchQuery] = useState('')
  const [recentlyUsed, setRecentlyUsed] = useState(recentEmojis)
  const pickerRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji)
    
    // Add to recently used (avoid duplicates)
    setRecentlyUsed(prev => {
      const filtered = prev.filter(e => e !== emoji)
      return [emoji, ...filtered].slice(0, 8)
    })
    
    onClose()
  }

  // Emoji to keywords mapping for search
  const emojiKeywords: { [key: string]: string[] } = {
    '😀': ['grinning', 'face', 'smile', 'happy'],
    '😃': ['grinning', 'face', 'happy', 'smile', 'joy'],
    '😄': ['grinning', 'face', 'happy', 'smile', 'joy', 'laugh'],
    '😁': ['beaming', 'face', 'happy', 'smile', 'joy'],
    '😆': ['grinning', 'squinting', 'face', 'happy', 'smile', 'laugh'],
    '😅': ['grinning', 'face', 'sweat', 'smile', 'happy'],
    '🤣': ['face', 'floor', 'laugh', 'lol'],
    '😂': ['face', 'joy', 'laugh', 'tear'],
    '🙂': ['slightly', 'smiling', 'face'],
    '🙃': ['upside', 'down', 'face'],
    '😉': ['winking', 'face'],
    '😊': ['smiling', 'face', 'blush'],
    '😇': ['smiling', 'face', 'halo'],
    '🥰': ['smiling', 'face', 'hearts', 'love'],
    '😍': ['smiling', 'face', 'heart', 'eyes', 'love'],
    '🤩': ['star', 'struck', 'eyes'],
    '😘': ['face', 'kiss', 'heart'],
    '😗': ['kissing', 'face'],
    '☺️': ['smiling', 'face'],
    '😚': ['kissing', 'face', 'closed', 'eyes'],
    '😙': ['kissing', 'face', 'smiling', 'eyes'],
    '❤️': ['red', 'heart', 'love'],
    '🧡': ['orange', 'heart', 'love'],
    '💛': ['yellow', 'heart', 'love'],
    '💚': ['green', 'heart', 'love'],
    '💙': ['blue', 'heart', 'love'],
    '💜': ['purple', 'heart', 'love'],
    '🖤': ['black', 'heart', 'love'],
    '🤍': ['white', 'heart', 'love'],
    '🤎': ['brown', 'heart', 'love'],
    '💔': ['broken', 'heart', 'love'],
    '🔥': ['fire', 'flame', 'hot'],
    '✨': ['sparkles', 'stars'],
    '⭐': ['star'],
    '🌟': ['glowing', 'star'],
    '💯': ['hundred', 'points', 'perfect'],
    '💥': ['collision', 'bang'],
    '💫': ['dizzy', 'star'],
    '💦': ['sweat', 'droplets', 'water'],
    '💨': ['dashing', 'away', 'wind'],
    '🎉': ['party', 'popper', 'celebration'],
    '🎊': ['confetti', 'ball', 'celebration'],
    '🎈': ['balloon', 'party'],
    '🎁': ['wrapped', 'gift', 'present'],
    '🏆': ['trophy', 'award', 'winner'],
    '🥇': ['gold', 'medal', 'first', 'winner'],
    '🥈': ['silver', 'medal', 'second'],
    '🥉': ['bronze', 'medal', 'third'],
    '👍': ['thumbs', 'up', 'like', 'good'],
    '👎': ['thumbs', 'down', 'dislike', 'bad'],
    '👌': ['ok', 'hand', 'fingers'],
    '✌️': ['victory', 'hand', 'peace'],
    '🤞': ['crossed', 'fingers', 'luck'],
    '🤟': ['love', 'you', 'gesture'],
    '🤘': ['sign', 'horns', 'rock'],
    '🤙': ['call', 'me', 'hand'],
    '👈': ['backhand', 'index', 'pointing', 'left'],
    '👉': ['backhand', 'index', 'pointing', 'right'],
    '👆': ['backhand', 'index', 'pointing', 'up'],
    '👇': ['backhand', 'index', 'pointing', 'down'],
    '☝️': ['index', 'pointing', 'up'],
    '✋': ['raised', 'hand', 'stop'],
    '🤚': ['raised', 'back', 'hand'],
    '🖐️': ['hand', 'fingers', 'splayed'],
    '🖖': ['vulcan', 'salute', 'spock'],
    '👋': ['waving', 'hand', 'hello', 'goodbye'],
    '🤛': ['left', 'facing', 'fist'],
    '🤜': ['right', 'facing', 'fist'],
    '✊': ['raised', 'fist'],
    '👊': ['oncoming', 'fist', 'punch'],
    '🙌': ['raising', 'hands', 'praise'],
    '👏': ['clapping', 'hands', 'applause'],
    '🤝': ['handshake', 'agreement'],
    '🙏': ['folded', 'hands', 'pray', 'thanks'],
  }

  // Filter emojis based on search
  const getFilteredEmojis = () => {
    if (!searchQuery) return emojiCategories[selectedCategory as keyof typeof emojiCategories]?.emojis || []
    
    const query = searchQuery.toLowerCase().trim()
    const allEmojis = Object.values(emojiCategories).flatMap(cat => cat.emojis)
    
    return allEmojis.filter(emoji => {
      // Check if emoji has keywords
      const keywords = emojiKeywords[emoji] || []
      
      // Search in keywords
      return keywords.some(keyword => keyword.includes(query)) ||
             // Fallback: direct emoji match (for copy-paste)
             emoji.includes(query)
    })
  }

  const filteredEmojis = getFilteredEmojis()

  const panel = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={pickerRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={cn(
            `${anchorEl ? 'fixed' : 'absolute'} z-[99999] bg-white dark:bg-[#171717] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col`,
            "w-80 h-96",
            className
          )}
          style={anchorEl && coords ? { top: coords.top, left: coords.left } : { top: 'calc(100% + 8px)', right: '0' }}
        >
          {/* Header with search */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search emojis"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 border-none outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Recently used section */}
          {!searchQuery && recentlyUsed.length > 0 && (
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recently Used</span>
              </div>
              <div className="grid grid-cols-8 gap-1">
                {recentlyUsed.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiClick(emoji)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <AppleEmoji emoji={emoji} />
                  </button>
                ))}
              </div>
            </div>
          )}



          {/* Emoji grid */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-4">
              <div className="grid grid-cols-8 gap-1">
                {filteredEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiClick(emoji)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title={emoji}
                  >
                    <AppleEmoji emoji={emoji} />
                  </button>
                ))}
              </div>
              
              {filteredEmojis.length === 0 && searchQuery && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="mb-2 flex justify-center">
                    <AppleEmoji emoji="🔍" className="w-8 h-8" />
                  </div>
                  <p className="text-sm">No emojis found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // When anchored, compute viewport position and render in portal
  useEffect(() => {
    if (!isOpen || !anchorEl) { setCoords(null); return }
    const compute = () => {
      const rect = anchorEl.getBoundingClientRect()
      const width = 320 // w-80
      const height = 384 // h-96
      const margin = 8
      let top = rect.bottom + margin
      let left = rect.right - width
      // Flip vertically if not enough space below
      if (top + height > window.innerHeight - margin) {
        top = Math.max(margin, rect.top - height - margin)
      }
      // Clamp horizontally
      left = Math.min(Math.max(margin, left), window.innerWidth - width - margin)
      setCoords({ top, left })
    }
    compute()
    const onScroll = () => compute()
    window.addEventListener('resize', compute)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('resize', compute)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [isOpen, anchorEl])

  if (anchorEl) {
    return createPortal(panel, document.body)
  }

  return panel
}