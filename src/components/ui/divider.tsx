'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface DividerRootProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'line-spacing' | 'dashed'
  orientation?: 'horizontal' | 'vertical'
}

const Root = React.forwardRef<HTMLDivElement, DividerRootProps>(
  ({ className, variant = 'line', orientation = 'horizontal', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          {
            // Horizontal orientation
            "h-px w-full bg-gray-200 dark:bg-gray-800": orientation === 'horizontal' && variant === 'line',
            "my-2 h-px w-full bg-gray-200 dark:bg-gray-800": orientation === 'horizontal' && variant === 'line-spacing',
            "h-px w-full border-t border-dashed border-gray-200 dark:border-gray-800": orientation === 'horizontal' && variant === 'dashed',
            
            // Vertical orientation
            "w-px h-full bg-gray-200 dark:bg-gray-800": orientation === 'vertical' && variant === 'line',
            "mx-2 w-px h-full bg-gray-200 dark:bg-gray-800": orientation === 'vertical' && variant === 'line-spacing',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Root.displayName = 'Divider'

export { Root }