import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Safe currency formatter used across charts/UI
export function formatCurrencyValue(amount: number): string {
  if (typeof amount !== 'number' || !isFinite(amount)) return '$0'
  const sign = amount < 0 ? '-' : ''
  const abs = Math.abs(amount)
  return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

// Lightweight logger to avoid importing console directly
export const logger = {
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug(...args)
    }
  },
  error: (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.error(...args)
  },
}