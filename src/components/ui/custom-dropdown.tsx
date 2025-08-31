'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Option {
  value: string | number
  label: string
}

interface CustomDropdownProps {
  value: string | number
  onChange: (value: string | number) => void
  options: Option[]
  className?: string
  variant?: 'default' | 'glass'
}

export function CustomDropdown({ value, onChange, options, className, variant = 'default' }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(option => option.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  const buttonClasses = cn(
    'relative w-full h-9 text-left transition-colors focus:outline-none',
    variant === 'glass'
      ? 'px-3 pr-8 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur ring-1 ring-black/10 dark:ring-white/10 text-neutral-900 dark:text-neutral-100 hover:bg-white/80 dark:hover:bg-white/15 focus:ring-2 focus:ring-[#3559E9]/40'
      : 'px-3 pr-8 bg-white dark:bg-[#0f0f0f] border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 text-sm hover:border-gray-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400'
  )

  const menuClasses = cn(
    'absolute z-50 w-full mt-1 max-h-60 overflow-auto',
    variant === 'glass'
      ? 'bg-white/80 dark:bg-[#0B0B0B]/70 backdrop-blur ring-1 ring-black/10 dark:ring-white/10 rounded-xl shadow-xl'
      : 'bg-white dark:bg-[#0f0f0f] border border-gray-300 dark:border-gray-600 rounded-md shadow-lg'
  )

  const itemClasses = (isSelected: boolean) =>
    cn(
      'relative w-full px-3 py-2 text-left text-sm transition-colors',
      variant === 'glass'
        ? isSelected
          ? 'bg-[#3559E9]/10 text-[#3559E9]'
          : 'text-neutral-900 dark:text-neutral-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
        : isSelected
          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
          : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
    )

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClasses}
      >
        <span className="block truncate text-sm">
          {selectedOption?.label || value}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown
            className={cn(
              'h-4 w-4 text-neutral-500 dark:text-neutral-400 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </span>
      </button>

      {isOpen && (
        <div className={menuClasses}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={itemClasses(value === option.value)}
            >
              <span className="block truncate pr-6">{option.label}</span>
              {value === option.value && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Check className={cn('h-4 w-4', variant === 'glass' ? 'text-[#3559E9]' : 'text-blue-600 dark:text-blue-400')} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}