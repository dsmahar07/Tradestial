/**
 * Utility to clear analytics cache and force data reload
 * Use this after fixing date parsing issues to ensure fresh calculations
 */

import { AnalyticsCacheService } from '@/services/analytics-cache.service'
import { ReactiveAnalyticsService } from '@/services/reactive-analytics.service'

export async function clearAllCacheAndReload(): Promise<void> {
  console.log('Clearing all analytics cache...')
  
  // Clear analytics cache
  AnalyticsCacheService.clear()
  
  // Reset reactive analytics
  const analytics = ReactiveAnalyticsService.getInstance()
  await analytics.reset()
  
  // Clear browser storage if any
  if (typeof window !== 'undefined') {
    localStorage.removeItem('trades')
    localStorage.removeItem('analytics-cache')
    sessionStorage.clear()
  }
  
  console.log('Cache cleared successfully. Please re-import your CSV data.')
}

export function addCacheClearButton(): void {
  if (typeof window === 'undefined') return
  
  // Add a button to the page for easy cache clearing during development
  const button = document.createElement('button')
  button.textContent = 'Clear Analytics Cache'
  button.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 9999;
    background: #ff4444;
    color: white;
    padding: 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  `
  
  button.onclick = () => {
    clearAllCacheAndReload()
    alert('Cache cleared! Please refresh and re-import your CSV.')
  }
  
  document.body.appendChild(button)
}