"use client"

import * as React from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SelectOption = { label: string; value: string }

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  buttonClassName?: string
  menuClassName?: string
  itemClassName?: string
  id?: string
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className,
  buttonClassName,
  menuClassName,
  itemClassName,
  id,
}: CustomSelectProps) {
  const selected = options.find(o => o.value === value)

  return (
    <div className={cn('relative inline-block text-left', className)}>
      <Listbox value={value} onChange={onChange}>
        {({ open }) => (
          <>
            <Listbox.Button
              id={id}
              className={cn(
                'w-56 inline-flex items-center justify-between gap-2 rounded-md border text-sm px-3 py-2',
                'bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-100',
                'transition-colors hover:bg-gray-50/70 dark:hover:bg-[#171717]',
                // Remove default outlines on focus as requested
                'focus:outline-none focus:ring-0 focus:ring-offset-0',
                buttonClassName,
              )}
            >
              <span className={cn('truncate', !selected && 'text-gray-500 dark:text-gray-400')}>
                {selected ? selected.label : placeholder}
              </span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </Listbox.Button>

            <Transition
              show={open}
              enter="transition ease-out duration-100"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-75"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Listbox.Options
                className={cn(
                  'absolute z-50 mt-2 w-56 max-h-60 overflow-auto rounded-md border shadow-lg',
                  'bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-[#2a2a2a]',
                  'focus:outline-none',
                  menuClassName,
                )}
              >
                {options.map(opt => (
                  <Listbox.Option
                    key={opt.value}
                    value={opt.value}
                    className={({ active, selected }) =>
                      cn(
                        'relative cursor-pointer select-none px-3 py-2 text-sm flex items-center justify-between',
                        'text-gray-900 dark:text-gray-100',
                        active && 'bg-gray-50 dark:bg-[#171717]',
                        selected && 'font-medium',
                        itemClassName,
                      )
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className="truncate">{opt.label}</span>
                        {selected ? <Check className="h-4 w-4 text-[#3559E9]" /> : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </>
        )}
      </Listbox>
    </div>
  )
}
