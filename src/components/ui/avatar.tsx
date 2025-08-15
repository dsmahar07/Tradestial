'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface AvatarRootProps {
  children: React.ReactNode
  className?: string
  size?: string | number
}

interface AvatarImageProps {
  src?: string
  alt?: string
  className?: string
}

interface AvatarFallbackProps {
  children: React.ReactNode
  className?: string
}

interface AvatarIndicatorProps {
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'top-right' | 'bottom-right'
  className?: string
}

export const Root = forwardRef<HTMLDivElement, AvatarRootProps>(
  ({ children, className, size, ...props }, ref) => {
    const sizeClass = typeof size === 'number' ? `h-[${size}px] w-[${size}px]` : 
                     size === '40' ? 'h-10 w-10' : 'h-10 w-10'
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full",
          sizeClass,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Root.displayName = 'AvatarRoot'

export const Image = forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ src, alt, className, ...props }, ref) => {
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={cn(
          "aspect-square h-full w-full object-cover",
          className
        )}
        {...props}
      />
    )
  }
)
Image.displayName = 'AvatarImage'

export const Fallback = forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Fallback.displayName = 'AvatarFallback'

export const Indicator = forwardRef<HTMLDivElement, AvatarIndicatorProps>(
  ({ children, position = 'top-right', className, ...props }, ref) => {
    const positionClass = {
      'top': 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
      'bottom': 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
      'top-right': 'top-0 right-0 -translate-y-1/2 translate-x-1/2',
      'bottom-right': 'bottom-0 right-0 translate-y-1/2 translate-x-1/2'
    }[position]

    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-10",
          positionClass,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Indicator.displayName = 'AvatarIndicator'