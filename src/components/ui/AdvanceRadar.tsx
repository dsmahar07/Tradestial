"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from 'framer-motion'
import * as echarts from 'echarts';
import { DataStore } from '@/services/data-store.service'
import { formatCurrencyValue } from '@/lib/utils'

type EChartsOption = echarts.EChartsOption;

const AdvanceRadar: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [dataVersion, setDataVersion] = useState(0)
  const [hasData, setHasData] = useState(() => DataStore.getAllTrades().length > 0)

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
    if (!hasData) return; // no data => do not init chart
    
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
        backgroundColor: isDarkMode ? '#171717' : '#ffffff',
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
                color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                  { offset: 0, color: 'rgba(53, 89, 233, 0.82)' },
                  { offset: 1, color: 'rgba(53, 89, 233, 0.50)' }
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
            backgroundColor: isDarkMode ? '#171717' : '#ffffff',
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
  }, [isDarkMode, dataVersion, hasData]);

  // Subscribe to data changes so chart updates when imports occur
  useEffect(() => {
    const unsubscribe = DataStore.subscribe(() => {
      setDataVersion(v => v + 1)
      setHasData(DataStore.getAllTrades().length > 0)
    })
    return () => unsubscribe()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="focus:outline-none"
    >
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 text-gray-900 dark:text-white relative focus:outline-none w-full" style={{ height: '385px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance Radar
            </h3>
          </div>
        </div>

        {hasData ? (
          // ECharts Radar Chart
          <div className="h-80">
            <div ref={chartRef} style={{ width: "100%", height: "100%" }} />
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