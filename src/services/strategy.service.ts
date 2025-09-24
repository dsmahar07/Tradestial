export interface StrategySummary {
  id: string
  name: string
  description?: string
}

export function getStrategies(): StrategySummary[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem('tradestial:strategies')
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item: any) => item && item.id)
      .map((item: any) => ({
        id: String(item.id),
        name: item.name || 'Unnamed Strategy',
        description: item.description || undefined
      }))
  } catch (error) {
    console.warn('[strategy.service] Failed to read strategies:', error)
    return []
  }
}
