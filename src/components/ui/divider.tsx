'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const DIVIDER_ROOT_NAME = 'DividerRoot';

interface DividerRootProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'line-spacing'
}

const Root = React.forwardRef<HTMLDivElement, DividerRootProps>(
  ({ className, variant = 'line', ...props }, ref) => {
    return (
      <div
        ref={ref}
        role='separator'
        className={cn(
          'w-full',
          {
            'h-px bg-gray-200 dark:bg-gray-700': variant === 'line',
            'h-1 relative before:absolute before:left-0 before:top-1/2 before:h-px before:w-full before:-translate-y-1/2 before:bg-gray-200 dark:before:bg-gray-700': variant === 'line-spacing',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Root.displayName = DIVIDER_ROOT_NAME;

export { Root }