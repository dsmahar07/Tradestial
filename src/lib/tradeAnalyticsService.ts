import type { TradeRecord } from '@/components/modals/ImportTradesModal'

type EquityPoint = {
  date: string
  fullDate: string
  pnl: number
  pnlFormatted: string
  equity?: number
  equityFormatted?: string
}

export function prepareEquityCurveData(
  trades: TradeRecord[],
  startingBalance: number = 0
): EquityPoint[] {
  if (!Array.isArray(trades) || trades.length === 0) return []

  const sorted = [...trades].sort((a, b) => {
    const da = new Date(a.date as any).getTime()
    const db = new Date(b.date as any).getTime()
    return da - db
  })

  let cumulative = 0
  const points: EquityPoint[] = []

  for (const t of sorted) {
    const d = new Date(t.date as any)
    const pnl = typeof t.pnl === 'number' && isFinite(t.pnl) ? t.pnl : 0
    cumulative += pnl
    const equity = startingBalance + cumulative
    points.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      fullDate: d.toISOString().split('T')[0],
      pnl: Number(cumulative.toFixed(2)),
      pnlFormatted: formatCurrency(cumulative),
      equity,
      equityFormatted: formatCurrency(equity),
    })
  }

  return points
}

function formatCurrency(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}



