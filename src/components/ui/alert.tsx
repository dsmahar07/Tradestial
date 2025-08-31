import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

// AlignUI-compatible API additions: Root, Icon, CloseIcon
type AlignStatus = 'success' | 'warning' | 'error' | 'information' | 'feature' | 'default'
type AlignVariant = 'filled' | 'soft'

const filledByStatus: Record<AlignStatus, string> = {
  success: 'bg-[#335CFF] text-white',
  warning: 'bg-amber-500 text-white',
  error: 'bg-red-500 text-white',
  information: 'bg-blue-500 text-white',
  feature: 'bg-violet-500 text-white',
  default: 'bg-gray-800 text-white',
}

const softContainer = 'bg-white text-gray-900 ring-1 ring-inset ring-gray-200 dark:bg-[#0f0f0f] dark:text-gray-100 dark:ring-[#2a2a2a]'

const baseContainer = 'relative w-full rounded-lg p-4 flex items-start gap-3'

const Root = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
  status?: AlignStatus
  variant?: AlignVariant
  size?: 'large' | 'medium'
}>(function AlignAlertRoot({ className, status = 'default', variant = 'soft', size = 'large', ...props }, ref) {
  const variantCls = variant === 'filled' ? filledByStatus[status] : softContainer
  const sizeCls = size === 'large' ? 'text-sm' : 'text-xs'
  return (
    <div ref={ref} role="alert" className={cn(baseContainer, variantCls, sizeCls, className)} {...props} />
  )
})

function Icon<T extends React.ElementType>({ as, className, ...rest }: { as?: T } & React.ComponentPropsWithoutRef<T> & { className?: string }) {
  const Component: any = as || 'div'
  return <Component className={cn('h-5 w-5 mt-0.5 shrink-0', className)} {...rest} />
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn('h-4 w-4', props.className)} aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export { Alert, AlertTitle, AlertDescription, Root, Icon, CloseIcon }