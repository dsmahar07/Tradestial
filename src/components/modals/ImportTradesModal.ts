// Lightweight stubs to satisfy compile-time imports.
// Replace with real implementations when integrating data sources.

export type TradeRecord = {
  date: string | Date
  pnl: number
  [key: string]: unknown
}

export function getImportedTrades(): TradeRecord[] {
  return []
}

export function subscribeToTradeUpdates(
  callback: (trades: TradeRecord[]) => void
): () => void {
  // No-op subscription; returns unsubscribe
  return () => {}
}

export function getAccountStartingBalance(): number {
  return 0
}



