'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface DropdownContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const DropdownContext = React.createContext<DropdownContextType | undefined>(undefined)

const useDropdown = () => {
  const context = React.useContext(DropdownContext)
  if (!context) {
    throw new Error('Dropdown components must be used within a Dropdown.Root')
  }
  return context
}

interface RootProps {
  children: React.ReactNode
}

export const Root: React.FC<RootProps> = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-dropdown]')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen])

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative" data-dropdown>
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

interface TriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

export const Trigger: React.FC<TriggerProps> = ({ children, asChild }) => {
  const { isOpen, setIsOpen } = useDropdown()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      'data-state': isOpen ? 'open' : 'closed'
    } as any)
  }

  return (
    <button
      onClick={handleClick}
      data-state={isOpen ? 'open' : 'closed'}
      className="outline-none"
    >
      {children}
    </button>
  )
}

interface ContentProps {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

export const Content: React.FC<ContentProps> = ({ children, align = 'start', className }) => {
  const { isOpen } = useDropdown()

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-950 shadow-md dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
        align === 'start' && "left-0",
        align === 'center' && "left-1/2 -translate-x-1/2",
        align === 'end' && "right-0",
        "top-full mt-2",
        className
      )}
    >
      {children}
    </div>
  )
}

interface ItemProps {
  children: React.ReactNode
  onSelect?: (event: React.MouseEvent) => void
  className?: string
}

export const Item: React.FC<ItemProps> = ({ children, onSelect, className }) => {
  const { setIsOpen } = useDropdown()

  const handleClick = (event: React.MouseEvent) => {
    onSelect?.(event)
    if (!event.defaultPrevented) {
      setIsOpen(false)
    }
  }

  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50",
        className
      )}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}

interface GroupProps {
  children: React.ReactNode
  className?: string
}

export const Group: React.FC<GroupProps> = ({ children, className }) => {
  return (
    <div className={cn("overflow-hidden p-1 text-gray-950 dark:text-gray-50", className)}>
      {children}
    </div>
  )
}

interface ItemIconProps {
  as?: React.ComponentType<any>
  className?: string
}

export const ItemIcon: React.FC<ItemIconProps> = ({ as: Component = 'div', className }) => {
  return <Component className={cn("mr-2 h-4 w-4", className)} />
}