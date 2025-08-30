// TV (TailwindCSS Variants) - A utility for creating variant-based className strings
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface VariantProps<T> {
  [key: string]: unknown
}

export interface TVConfig {
  slots?: Record<string, string | string[]>
  variants?: Record<string, Record<string, unknown>>
  compoundVariants?: Array<{
    [key: string]: unknown
    class?: Record<string, string | string[]> | string | string[]
  }>
  defaultVariants?: Record<string, unknown>
}

export function tv(config: TVConfig) {
  const { slots = {}, variants = {}, compoundVariants = [], defaultVariants = {} } = config

  return (props?: Record<string, any>) => {
    const mergedProps = { ...defaultVariants, ...props }
    
    if (typeof slots === 'object' && Object.keys(slots).length > 0) {
      // Multi-slot variant
      const result: Record<string, (options?: { class?: string }) => string> = {}
      
      Object.keys(slots).forEach(slotName => {
        result[slotName] = (options?: { class?: string }) => {
          // Start with base slot classes
          const baseClasses = slots[slotName]
          const classes = Array.isArray(baseClasses) ? [...baseClasses] : [baseClasses]
          
          // Apply variant classes for this slot
          Object.keys(mergedProps).forEach(variantKey => {
            const variantValue = mergedProps[variantKey]
            if (variantValue && variants[variantKey] && variants[variantKey][variantValue]) {
              const variantClasses = variants[variantKey][variantValue]
              if (typeof variantClasses === 'object' && (variantClasses as any)[slotName]) {
                const slotClasses = Array.isArray((variantClasses as any)[slotName]) 
                  ? (variantClasses as any)[slotName] 
                  : [(variantClasses as any)[slotName]]
                classes.push(...slotClasses)
              }
            }
          })
          
          // Apply compound variants for this slot
          compoundVariants.forEach(compoundVariant => {
            const { class: compoundClass, ...conditions } = compoundVariant
            const matches = Object.keys(conditions).every(key => {
              const condition = conditions[key]
              const propValue = mergedProps[key]
              return Array.isArray(condition) ? condition.includes(propValue) : condition === propValue
            })
            
            if (matches && compoundClass) {
              if (typeof compoundClass === 'object' && (compoundClass as any)[slotName]) {
                const slotClasses = Array.isArray((compoundClass as any)[slotName]) 
                  ? (compoundClass as any)[slotName] 
                  : [(compoundClass as any)[slotName]]
                classes.push(...slotClasses)
              }
            }
          })
          
          return twMerge(clsx(classes.flat(), options?.class))
        }
      })
      
      return result
    } else {
      // Single class variant (fallback)
      return (options?: { class?: string }) => {
        const classes: string[] = []
        
        // Apply variant classes
        Object.keys(mergedProps).forEach(variantKey => {
          const variantValue = mergedProps[variantKey]
          if (variantValue && variants[variantKey] && variants[variantKey][variantValue]) {
            const variantClasses = variants[variantKey][variantValue]
            const classArray = Array.isArray(variantClasses) ? variantClasses : [variantClasses]
            classes.push(...classArray)
          }
        })
        
        return twMerge(clsx(classes, options?.class))
      }
    }
  }
}

