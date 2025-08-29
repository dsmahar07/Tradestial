'use client'

import React, { useEffect, useRef, memo } from 'react'

interface TradingViewEconomicCalendarProps {
  width?: number
  height?: number
  colorTheme?: 'light' | 'dark'
  isTransparent?: boolean
  locale?: string
  countryFilter?: string
  importanceFilter?: string
}

function TradingViewEconomicCalendar({
  width = 400,
  height = 550,
  colorTheme = 'light',
  isTransparent = false,
  locale = 'en',
  countryFilter = 'ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu',
  importanceFilter = '-1,0,1'
}: TradingViewEconomicCalendarProps) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js'
    script.type = 'text/javascript'
    script.async = true
    // Use textContent to avoid innerHTML
    script.textContent = JSON.stringify({
      colorTheme,
      isTransparent,
      locale,
      countryFilter,
      importanceFilter,
      width,
      height
    })

    // Clear any existing content safely
    container.current.textContent = ''
    container.current.appendChild(script)

    return () => {
      if (container.current) {
        container.current.textContent = ''
      }
    }
  }, [colorTheme, isTransparent, locale, countryFilter, importanceFilter, width, height])

  return (
    <div 
      className="tradingview-widget-container w-full bg-white rounded-lg overflow-hidden" 
      ref={container}
      style={{ pointerEvents: 'auto' }}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="tradingview-widget-container__widget"></div>
      <div className="tradingview-widget-copyright mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        <a 
          href="https://www.tradingview.com/economic-calendar/" 
          rel="noopener nofollow" 
          target="_blank"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Economic calendar by TradingView
        </a>
      </div>
    </div>
  )
}

export default memo(TradingViewEconomicCalendar)
