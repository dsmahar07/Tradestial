'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  rightIcon?: React.ReactNode
}

export function CleanSelect({ className, rightIcon, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          'appearance-none w-full h-9 rounded-md bg-white dark:bg-[#171717] text-gray-900 dark:text-gray-100 px-3 pr-8 border border-gray-300 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors shadow-sm',
          className
        )}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-500 dark:text-gray-400">
        {rightIcon || <ChevronDown className="w-4 h-4" />}
      </div>
    </div>
  )
}


