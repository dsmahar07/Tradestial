import { themeColors } from '@/config/theme'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'white' | 'gray' | 'success' | 'danger'
  className?: string
  text?: string
  centered?: boolean
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2', 
  lg: 'w-12 h-12 border-2',
  xl: 'w-16 h-16 border-4'
} as const

const colorClasses = {
  primary: 'border-gray-300 border-t-blue-500',
  white: 'border-white/30 border-t-white',
  gray: 'border-gray-300 border-t-gray-600',
  success: 'border-gray-300 border-t-green-500',
  danger: 'border-gray-300 border-t-red-500'
} as const

export function LoadingSpinner({ 
  size = 'md',
  color = 'primary',
  className = '',
  text,
  centered = false
}: LoadingSpinnerProps) {
  const spinnerClasses = [
    sizeClasses[size],
    colorClasses[color],
    'rounded-full animate-spin'
  ].join(' ')

  const content = (
    <div className={`flex ${text ? 'flex-col items-center space-y-2' : 'items-center justify-center'} ${className}`}>
      <div className={spinnerClasses}></div>
      {text && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
      )}
    </div>
  )

  if (centered) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          {content}
        </div>
      </div>
    )
  }

  return content
}

/**
 * Page-level loading component for full page states
 */
export function PageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <LoadingSpinner 
      size="lg" 
      text={text}
      centered
      className="min-h-[400px]"
    />
  )
}

/**
 * Inline loading spinner for buttons and small areas
 */
export function InlineLoading({ 
  text,
  size = 'sm',
  className = ''
}: Pick<LoadingSpinnerProps, 'text' | 'size' | 'className'>) {
  return (
    <LoadingSpinner 
      size={size}
      text={text}
      className={`inline-flex ${className}`}
    />
  )
}