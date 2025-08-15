'use client'

import * as React from 'react'
import { Dialog as HeadlessDialog, DialogPanel, DialogBackdrop } from '@headlessui/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

const DialogContext = React.createContext<{ onClose: () => void } | null>(null)

const Dialog = ({ open, onClose, children }: DialogProps) => (
  <HeadlessDialog open={open} onClose={onClose} className="relative z-50">
    <DialogContext.Provider value={{ onClose }}>
      {children}
    </DialogContext.Provider>
  </HeadlessDialog>
)

const DialogTrigger = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props}>{children}</button>
)

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <>
    <DialogBackdrop
      transition
      className="fixed inset-0 bg-black/30 data-[enter]:opacity-100 data-[leave]:opacity-0 data-[enter]:duration-250 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
    />

    <div className="fixed inset-0 overflow-y-auto overflow-x-visible">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <DialogPanel
          transition
          ref={ref}
          className={cn(
            'relative w-full max-w-md transform-gpu will-change-transform overflow-visible rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl data-[enter]:scale-100 data-[enter]:opacity-100 data-[leave]:opacity-0 data-[leave]:scale-95 data-[enter]:duration-250 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in',
            className
          )}
          {...props}
        >
          {children}
        </DialogPanel>
      </div>
    </div>
  </>
))
DialogContent.displayName = 'DialogContent'

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <HeadlessDialog.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
DialogTitle.displayName = 'DialogTitle'

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <HeadlessDialog.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
DialogDescription.displayName = 'DialogDescription'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
)
DialogFooter.displayName = 'DialogFooter'

const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <DialogContext.Consumer>
    {(ctx) => (
      <button
        ref={ref}
        onClick={(e) => {
          props.onClick?.(e)
          ctx?.onClose()
        }}
        className={cn(
          'absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none ring-0 focus:ring-0 focus:ring-offset-0 disabled:pointer-events-none',
          className
        )}
        {...props}
      >
        {children || <X className="h-4 w-4" />}
        <span className="sr-only">Close</span>
      </button>
    )}
  </DialogContext.Consumer>
))
DialogClose.displayName = 'DialogClose'

// Convenience wrapper that manages its own state
interface SimpleDialogProps {
  trigger: React.ReactNode
  children: React.ReactNode | ((utils: { close: () => void }) => React.ReactNode)
  className?: string
}

const SimpleDialog = ({ trigger, children, className }: SimpleDialogProps) => {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {trigger}
      </div>
      
      {isOpen ? (
        <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
          <DialogContent className={className}>
            {typeof children === 'function' ? (children({ close: () => setIsOpen(false) })) : children}
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  SimpleDialog,
}