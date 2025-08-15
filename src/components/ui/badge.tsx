'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeRootProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'solid' | 'outline'
  color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'gray'
  size?: 'small' | 'medium' | 'large'
}

const Root = React.forwardRef<HTMLDivElement, BadgeRootProps>(
  ({ className, variant = 'solid', color = 'blue', size = 'medium', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full font-medium",
          {
            // Size variants
            "px-2 py-0.5 text-xs": size === 'small',
            "px-2.5 py-0.5 text-sm": size === 'medium',
            "px-3 py-1 text-sm": size === 'large',
            
            // Color and variant combinations
            "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400": 
              color === 'green' && variant === 'light',
            "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400": 
              color === 'blue' && variant === 'light',
            "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400": 
              color === 'red' && variant === 'light',
            "bg-green-500 text-white": color === 'green' && variant === 'solid',
            "bg-blue-500 text-white": color === 'blue' && variant === 'solid',
            "bg-red-500 text-white": color === 'red' && variant === 'solid',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Root.displayName = 'Badge'

export { Root }