'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  className?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
}

const Tooltip = ({ children, content, className, side = 'top', sideOffset = 4 }: TooltipProps) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const triggerRef = React.useRef<HTMLDivElement>(null)

  const showTooltip = () => setIsVisible(true)
  const hideTooltip = () => setIsVisible(false)

  React.useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      let x = 0
      let y = 0

      switch (side) {
        case 'top':
          x = rect.left + rect.width / 2
          y = rect.top - sideOffset
          break
        case 'right':
          x = rect.right + sideOffset
          y = rect.top + rect.height / 2
          break
        case 'bottom':
          x = rect.left + rect.width / 2
          y = rect.bottom + sideOffset
          break
        case 'left':
          x = rect.left - sideOffset
          y = rect.top + rect.height / 2
          break
      }

      setPosition({ x, y })
    }
  }, [isVisible, side, sideOffset])

  const getTooltipClasses = () => {
    const baseClasses = 'absolute z-[9999] px-3 py-1.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg pointer-events-none transform transition-all duration-200'
    
    switch (side) {
      case 'top':
        return cn(baseClasses, '-translate-x-1/2 -translate-y-full', className)
      case 'right':
        return cn(baseClasses, '-translate-y-1/2 translate-x-0', className)
      case 'bottom':
        return cn(baseClasses, '-translate-x-1/2 translate-y-0', className)
      case 'left':
        return cn(baseClasses, '-translate-y-1/2 -translate-x-full', className)
      default:
        return cn(baseClasses, className)
    }
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && typeof window !== 'undefined' &&
        createPortal(
          <div
            className={getTooltipClasses()}
            style={{
              left: position.x,
              top: position.y,
            }}
          >
            {content}
            {/* Arrow */}
            <div
              className={cn(
                'absolute w-2 h-2 bg-white dark:bg-gray-800 border-l border-b border-gray-200 dark:border-gray-700 transform rotate-45',
                side === 'top' && 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2',
                side === 'right' && 'right-full top-1/2 translate-x-1/2 -translate-y-1/2',
                side === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2',
                side === 'left' && 'left-full top-1/2 -translate-x-1/2 -translate-y-1/2'
              )}
            />
          </div>,
          document.body
        )
      }
    </>
  )
}

// Alternative simpler components for compatibility
const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>
const TooltipTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>
const TooltipContent = ({ children }: { children: React.ReactNode }) => <>{children}</>

export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent }