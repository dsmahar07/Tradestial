'use client'

import * as React from 'react'
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import * as FancyButton from '@/components/ui/fancy-button'
import { StialChat } from '@/components/ui/stial-chat'

interface AskStialProps {
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function AskStial({ onClick, className, disabled = false }: AskStialProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      setIsChatOpen(true)
    }
  }

  const handleCloseChat = () => {
    setIsChatOpen(false)
  }

  return (
    <>
      <FancyButton.Root
        variant="neutral"
        size="small"
        onClick={handleClick}
        disabled={disabled}
        className={className}
      >
        <FancyButton.Icon as={Sparkles} />
        <span className="bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">
          Ask Stial
        </span>
      </FancyButton.Root>
      <StialChat isOpen={isChatOpen} onClose={handleCloseChat} />
    </>
  )
}
