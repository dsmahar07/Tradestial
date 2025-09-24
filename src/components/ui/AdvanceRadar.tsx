"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from 'framer-motion'
import * as echarts from 'echarts';
import { DataStore } from '@/services/data-store.service'
import { formatCurrencyValue } from '@/lib/utils'
import { useHydrated } from '@/hooks/use-hydrated'
import { Info } from 'lucide-react'
import * as RadixTooltip from '@radix-ui/react-tooltip'

type EChartsOption = echarts.EChartsOption;

const AdvanceRadar: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [dataVersion, setDataVersion] = useState(0)
  // Start with a stable default for SSR; update after mount to avoid mismatch
  const [hasData, setHasData] = useState(false)
  const hydrated = useHydrated()

  const calculateOverallScore = () => {
    const trades = DataStore.getAllTrades()
    const m = DataStore.calculateMetrics(trades)
    
    const winRate = (m.winRate || 0) / 100
    const profitFactor = Math.min((m.profitFactor || 0) / 4, 1)
    const avgWinAmount = m.avgWinAmount || 0
    const avgLossAmount = Math.abs(m.avgLossAmount) || 0
    const avgWinLoss = avgLossAmount > 0 ? Math.min(avgWinAmount / avgLossAmount, 3) / 3 : 0
    // Derive recovery factor from available metrics: netCumulativePnl / maxDrawdown (capped, normalized to 0..1)
    const dd = m.maxDrawdown || 0
    const rfRaw = dd > 0 ? (m.netCumulativePnl || 0) / dd : 0
    const recoveryFactor = Math.min(Math.max(rfRaw, 0), 2) / 2 // clamp 0..2 then normalize to 0..1
    const maxDrawdown = m.maxDrawdown || 0
    const totalTurnover = (m.totalWinAmount || 0) + (m.totalLossAmount || 0)
    const drawdownScore = totalTurnover > 0 ? Math.max(0, 1 - (maxDrawdown / totalTurnover)) : 0
    const consistency = Math.min((m.profitabilityIndex || (winRate)) || 0, 1)
    
    const score = (winRate * 0.2 + profitFactor * 0.2 + avgWinLoss * 0.15 + recoveryFactor * 0.15 + drawdownScore * 0.15 + consistency * 0.15) * 100
    return Math.round(score * 10) / 10
  }

  // Map score (0..100) to a gradient color from red -> yellow -> green
  const getScoreColor = (score: number) => {
    const s = Math.max(0, Math.min(100, score))
    // Interpolate: 0..50 red -> yellow, 50..100 yellow -> green
    const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t)
    const hex = (n: number) => n.toString(16).padStart(2, '0')
    if (s <= 50) {
      const t = s / 50 // 0..1 from red (239,68,68) to yellow (245,158,11)
      const r = lerp(239, 245, t)
      const g = lerp(68, 158, t)
      const b = lerp(68, 11, t)
      return `#${hex(r)}${hex(g)}${hex(b)}`
    } else {
      const t = (s - 50) / 50 // 0..1 from yellow (245,158,11) to green (34,197,94)
      const r = lerp(245, 34, t)
      const g = lerp(158, 197, t)
      const b = lerp(11, 94, t)
      return `#${hex(r)}${hex(g)}${hex(b)}`
    }
  }

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
    
    checkTheme()
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!chartRef.current) return;
    if (!(hydrated && hasData)) return; // wait until hydrated & data present
    
    // Use SVG renderer for sharper text/lines and better scaling behavior
    var myChart = echarts.init(chartRef.current, null, {
      renderer: 'svg'
    });
    var option: EChartsOption;

    const computeRadarValues = () => {
      const trades = DataStore.getAllTrades()
      const m = DataStore.calculateMetrics(trades)

      const consistencyPct = Math.round(((m.profitabilityIndex || (m.winRate / 100)) || 0) * 100)
      const winRatePct = m.winRate || 0
      const profitFactor = m.profitFactor || 0
      const avgWinAmount = m.avgWinAmount || 0
      const avgLossAmount = m.avgLossAmount || 0
      const riskReward = m.riskRewardRatio || (avgLossAmount > 0 ? avgWinAmount / avgLossAmount : 0)
      const totalTurnover = (m.totalWinAmount || 0) + (m.totalLossAmount || 0)
      const maxDrawdown = m.maxDrawdown || 0

      // Indicator maxima: [6500, 16000, 30000, 38000, 52000, 25000]
      const consistencyVal = Math.min(6500, Math.max(0, (consistencyPct / 100) * 6500))
      // Treat 65% win rate as full scale to emphasize high win rates
      const winRateVal = Math.min(16000, Math.max(0, (winRatePct / 65) * 16000))
      const profitFactorCapped = Math.min(profitFactor, 4) // cap at 4
      const profitFactorVal = Math.min(30000, Math.max(0, (profitFactorCapped / 4) * 30000))
      const riskRewardCapped = Math.min(riskReward, 3)
      const riskMgmtVal = Math.min(38000, Math.max(0, (riskRewardCapped / 3) * 38000))
      const winLossRatio = avgLossAmount > 0 ? avgWinAmount / avgLossAmount : 0
      const winLossCapped = Math.min(winLossRatio, 3)
      const avgWinLossVal = Math.min(52000, Math.max(0, (winLossCapped / 3) * 52000))
      // Drawdown score: lower drawdown => higher score. Use turnover as scale; if unavailable, degrade gracefully.
      const ddScale = Math.max(totalTurnover, 1)
      const ddRatio = Math.min(maxDrawdown / ddScale, 1) // 0..1
      const ddScore = (1 - ddRatio) * 25000
      const maxDrawdownVal = Math.min(25000, Math.max(0, ddScore))

      return [
        consistencyVal,
        winRateVal,
        profitFactorVal,
        riskMgmtVal,
        avgWinLossVal,
        maxDrawdownVal
      ]
    }


    // Prepare overlay point data for per-indicator tooltip
    const indicatorNames = ['Consistency', 'Win Rate', 'Profit Factor', 'Risk Management', 'Avg Win/Loss', 'Max Drawdown']
    const valuesForPoints = computeRadarValues()
    const indicatorPointsData = indicatorNames.map((name, idx) => ({
      name,
      // Keep only one dimension value; hide others using null so only one symbol renders and no center artifact
      value: valuesForPoints.map((v, i) => (i === idx ? v : null)) as any
    }))

    option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove|click',
        confine: true,
        backgroundColor: isDarkMode ? '#0f0f0f' : '#ffffff',
        borderColor: isDarkMode ? '#2a2a2a' : '#e5e7eb',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#374151'
        },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params
          const dimIndex = typeof p?.dimensionIndex === 'number' ? p.dimensionIndex : null
          if (dimIndex === null) return '' // only show tooltip on dots

          const trades = DataStore.getAllTrades()
          const m = DataStore.calculateMetrics(trades)
          const consistencyBase = (m.profitabilityIndex ?? (m.winRate / 100))
          const consistencyPct = Math.round((consistencyBase || 0) * 100)
          const winRatePct = m.winRate || 0
          const profitFactor = m.profitFactor || 0
          const avgWinAmount = m.avgWinAmount || 0
          const avgLossAmount = m.avgLossAmount || 0
          const riskReward = m.riskRewardRatio || (avgLossAmount > 0 ? avgWinAmount / avgLossAmount : 0)
          const maxDrawdown = m.maxDrawdown || 0

          const indicatorNames = ['Consistency', 'Win Rate', 'Profit Factor', 'Risk Management', 'Avg Win/Loss', 'Max Drawdown']
          const indicatorName = indicatorNames[dimIndex] || ''

          let valueHtml = ''
          switch (dimIndex) {
            case 0:
              valueHtml = `<b>${consistencyPct}%</b>`
              break
            case 1:
              valueHtml = `<b>${winRatePct.toFixed(1)}%</b>`
              break
            case 2:
              valueHtml = `<b>${profitFactor.toFixed(2)}</b>`
              break
            case 3:
              valueHtml = `<b>RR ${Number.isFinite(riskReward) ? riskReward.toFixed(2) : '—'}</b>`
              break
            case 4:
              valueHtml = `<b>${formatCurrencyValue(avgWinAmount)} / ${formatCurrencyValue(Math.abs(avgLossAmount))}</b>`
              break
            case 5:
              valueHtml = `<b>${formatCurrencyValue(maxDrawdown)}</b>`
              break
            default:
              valueHtml = ''
          }
          return indicatorName ? `<div>${indicatorName}: ${valueHtml}</div>` : ''
        }
      },
      radar: {
        // shape: 'circle',
        indicator: [
          { name: 'Consistency', max: 6500 },
          { name: 'Win Rate', max: 16000 },
          { name: 'Profit Factor', max: 30000 },
          { name: 'Risk Management', max: 38000 },
          { name: 'Avg Win/Loss', max: 52000 },
          { name: 'Max Drawdown', max: 25000 }
        ],
        axisName: {
          color: isDarkMode ? 'rgba(209, 213, 219, 0.7)' : 'rgba(75, 85, 99, 0.6)',
          fontSize: 12,
          fontWeight: 500,
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"'
        },
        splitLine: {
          lineStyle: {
            color: isDarkMode ? '#374151' : '#e5e7eb'
          }
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: isDarkMode ? 
              ['rgba(55, 65, 81, 0.05)', 'rgba(75, 85, 99, 0.05)'] : 
              ['rgba(250, 250, 250, 0.05)', 'rgba(200, 200, 200, 0.05)']
          }
        },
        axisLine: {
          lineStyle: {
            color: isDarkMode ? '#374151' : '#e5e7eb'
          }
        }
      },
      series: [
        {
          name: 'Performance',
          type: 'radar',
          tooltip: { show: false },
          data: [
            {
              value: computeRadarValues(),
              name: 'Current Performance',
              lineStyle: {
                width: 0,
                color: 'transparent'
              },
              areaStyle: { 
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: 'rgba(79, 125, 255, 0.6)' },
                  { offset: 0.5, color: 'rgba(139, 92, 246, 0.6)' },
                  { offset: 1, color: 'rgba(246, 181, 30, 0.6)' }
                ])
              },
              symbol: 'circle',
              symbolSize: 6,
              itemStyle: {
                color: '#ffffff',
                borderColor: '#3559E9',
                borderWidth: 2
              }
            }
          ]
        },
        // Overlay series: one symbol per indicator to enable per-dot tooltips
        {
          name: 'Indicator Points',
          type: 'radar',
          data: indicatorPointsData,
          lineStyle: { width: 0 },
          areaStyle: { opacity: 0 },
          symbol: 'circle',
          symbolSize: 12, // larger invisible hit area for easier hover
          itemStyle: {
            color: 'rgba(0,0,0,0)',
            borderColor: 'rgba(0,0,0,0)',
            borderWidth: 0
          },
          zlevel: 3,
          z: 3,
          tooltip: {
            show: true,
            backgroundColor: isDarkMode ? '#0f0f0f' : '#ffffff',
            borderColor: isDarkMode ? '#2a2a2a' : '#e5e7eb',
            textStyle: { color: isDarkMode ? '#ffffff' : '#374151' },
            formatter: (p: any) => {
              const trades = DataStore.getAllTrades()
              const m = DataStore.calculateMetrics(trades)
              const consistencyBase = (m.profitabilityIndex ?? (m.winRate / 100))
              const consistencyPct = Math.round((consistencyBase || 0) * 100)
              const winRatePct = m.winRate || 0
              const profitFactor = m.profitFactor || 0
              const avgWinAmount = m.avgWinAmount || 0
              const avgLossAmount = m.avgLossAmount || 0
              const riskReward = m.riskRewardRatio || (avgLossAmount > 0 ? avgWinAmount / avgLossAmount : 0)
              const maxDrawdown = m.maxDrawdown || 0

              const name = p?.name || ''
              let valueHtml = ''
              switch (name) {
                case 'Consistency':
                  valueHtml = `<b>${consistencyPct}%</b>`; break
                case 'Win Rate':
                  valueHtml = `<b>${winRatePct.toFixed(1)}%</b>`; break
                case 'Profit Factor':
                  valueHtml = `<b>${profitFactor.toFixed(2)}</b>`; break
                case 'Risk Management':
                  valueHtml = `<b>RR ${Number.isFinite(riskReward) ? riskReward.toFixed(2) : '—'}</b>`; break
                case 'Avg Win/Loss':
                  valueHtml = `<b>${formatCurrencyValue(avgWinAmount)} / ${formatCurrencyValue(Math.abs(avgLossAmount))}</b>`; break
                case 'Max Drawdown':
                  valueHtml = `<b>${formatCurrencyValue(maxDrawdown)}</b>`; break
                default:
                  valueHtml = ''
              }
              return name ? `<div>${name}: ${valueHtml}</div>` : ''
            }
          }
        }
      ]
    };

    if (option) {
      // notMerge: true ensures we replace series structure (needed after adding overlay points series)
      myChart.setOption(option, true);
    }

    // Window resize + element resize provide crisp re-layout without blurriness
    const handleResize = () => myChart.resize();
    window.addEventListener("resize", handleResize);
    const ro = new ResizeObserver(() => myChart.resize());
    ro.observe(chartRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      ro.disconnect();
      myChart.dispose();
    };
  }, [isDarkMode, dataVersion, hasData, hydrated]);

  // After mount, set initial data presence and subscribe to updates
  useEffect(() => {
    if (!hydrated) return
    // Set current data presence
    setHasData(DataStore.getAllTrades().length > 0)
    const unsubscribe = DataStore.subscribe(() => {
      setDataVersion(v => v + 1)
      setHasData(DataStore.getAllTrades().length > 0)
    })
    return () => unsubscribe()
  }, [hydrated])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="focus:outline-none"
    >
      <div className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-2 text-gray-900 dark:text-white relative focus:outline-none w-full" style={{ height: '480px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance Radar
            </h3>
            <RadixTooltip.Provider>
              <RadixTooltip.Root>
                <RadixTooltip.Trigger asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <Info size={16} />
                  </button>
                </RadixTooltip.Trigger>
                <RadixTooltip.Portal>
                  <RadixTooltip.Content
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-sm max-w-xs z-50"
                    sideOffset={5}
                  >
                    Multi-dimensional performance analysis showing six key trading metrics: consistency, win rate, profit factor, risk management, average win/loss ratio, and maximum drawdown. Each axis represents a different performance aspect, with the filled area showing your current trading strength across all dimensions.
                    <RadixTooltip.Arrow className="fill-white dark:fill-gray-800" />
                  </RadixTooltip.Content>
                </RadixTooltip.Portal>
              </RadixTooltip.Root>
            </RadixTooltip.Provider>
          </div>
        </div>
        
        {/* Header Divider */}
        <div className="-mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a] mb-4"></div>

      {hydrated && hasData ? (
        <div className="flex flex-col" style={{ height: 'calc(100% - 60px)' }}>
          {/* ECharts Radar Chart */}
          <div className="flex-1" style={{ maxHeight: '295px' }}>
            <div ref={chartRef} style={{ width: "100%", height: "100%" }} />
          </div>
          {/* Score + Progress (single row) */}
          <div className="px-2 pb-1 mt-4">
            {(() => {
              const overall = Math.max(0, Math.min(100, calculateOverallScore()))
              // Prevent visual clipping at the edges while keeping value accurate
              const markerPos = Math.min(99, Math.max(1, overall))
              const scoreColor = getScoreColor(overall)
              return (
                <div className="flex items-center gap-4">
                  {/* Left: label + value */}
                  <div className="min-w-[140px] overflow-hidden">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Score</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white leading-none">{overall}</div>
                  </div>

                  {/* Vertical separator */}
                  <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>

                  {/* Right: gradient progress with marker and ticks */}
                  <div className="relative flex-1">
                    {/* Track */}
                    <div className="relative h-2 rounded-full bg-gray-200 dark:bg-neutral-800">
                      {/* Dynamic gradient fill up to score */}
                      <div
                        className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E]"
                        style={{ width: `${markerPos}%` }}
                      />
                      {/* Checkpoint dividers - always on top, aligned to text below */}
                      {[20, 40, 60, 80].map(checkpoint => (
                        <div
                          key={checkpoint}
                          className="absolute top-0 h-2 w-px bg-white dark:bg-gray-700 z-20"
                          style={{ left: `calc(${checkpoint}% - 0.5px)` }}
                        />
                      ))}
                      {/* Marker */}
                      <span
                        aria-label="score-marker"
                        className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 block h-3 w-3 rounded-full border-2 bg-white"
                        style={{ left: `${markerPos}%`, borderColor: '#693EE0' }}
                      />
                    </div>
                    {/* ticks */}
                    <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                      <span>0</span>
                      <span>20</span>
                      <span>40</span>
                      <span>60</span>
                      <span>80</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      ) : (
        // Idle empty state
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">No symbol data available</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Import your CSV to see symbol performance</div>
          </div>
        </div>
      )}
      </div>
    </motion.div>
  );
};

export default AdvanceRadar;