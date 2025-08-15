export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface Trade {
  id: string
  symbol: string
  type: "buy" | "sell"
  quantity: number
  price: number
  timestamp: Date
  userId: string
}

export interface Portfolio {
  id: string
  userId: string
  totalValue: number
  trades: Trade[]
  createdAt: Date
  updatedAt: Date
}

export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
export type ButtonSize = "default" | "sm" | "lg" | "icon"

// Re-export dashboard types
export * from './dashboard'