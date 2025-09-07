import { useMemo } from 'react'
import { ChartDataWithMetrics } from '@/types/performance'

interface UseChartAxisOptions {
  chartData: ChartDataWithMetrics[]
  primaryMetric: string
  additionalMetrics: string[]
  isRMultipleMetric: (metric: string) => boolean
}

interface AxisAssignment {
  assignment: Record<string, 'left' | 'right'>
  leftAxisMetrics: string[]
  rightAxisMetrics: string[]
}

interface YAxisDomains {
  left: [number, number]
  right: [number, number]
}

interface GridLineValues {
  left: number[]
  right: number[]
}

export function useChartAxis({
  chartData,
  primaryMetric,
  additionalMetrics,
  isRMultipleMetric
}: UseChartAxisOptions) {
  // Smart axis assignment based on metric compatibility and scale
  const axisAssignment = useMemo((): AxisAssignment => {
    const assignment: Record<string, 'left' | 'right'> = {}
    const leftAxisMetrics: string[] = []
    const rightAxisMetrics: string[] = []
    
    // Always assign primary metric to left axis
    assignment[primaryMetric] = 'left'
    leftAxisMetrics.push(primaryMetric)
    
    // For additional metrics, determine best axis based on scale compatibility
    additionalMetrics.forEach(metric => {
      const primaryValues = chartData.map(p => p[primaryMetric] as number).filter(v => isFinite(v))
      const metricValues = chartData.map(p => p[metric] as number).filter(v => isFinite(v))
      
      if (primaryValues.length === 0 || metricValues.length === 0) {
        assignment[metric] = 'right'
        rightAxisMetrics.push(metric)
        return
      }
      
      const primaryMagnitude = Math.max(Math.abs(Math.max(...primaryValues)), Math.abs(Math.min(...primaryValues)))
      const metricMagnitude = Math.max(Math.abs(Math.max(...metricValues)), Math.abs(Math.min(...metricValues)))
      
      // Check scale compatibility (within 2 orders of magnitude)
      const magnitudeRatio = primaryMagnitude > 0 && metricMagnitude > 0 
        ? Math.max(primaryMagnitude, metricMagnitude) / Math.min(primaryMagnitude, metricMagnitude)
        : Infinity
      
      // Assign to left axis if scales are compatible and left axis has space
      if (magnitudeRatio < 100 && leftAxisMetrics.length < 2) {
        assignment[metric] = 'left'
        leftAxisMetrics.push(metric)
      } else {
        assignment[metric] = 'right'
        rightAxisMetrics.push(metric)
      }
    })
    
    return { assignment, leftAxisMetrics, rightAxisMetrics }
  }, [chartData, primaryMetric, additionalMetrics])

  // Calculate dynamic Y-axis domains with improved scaling
  const yAxisDomains = useMemo((): YAxisDomains => {
    const calculateSmartDomain = (metrics: string[], fallbackDomain: [number, number] = [0, 100]): [number, number] => {
      if (metrics.length === 0) return fallbackDomain
      
      const allValues = chartData.flatMap(point => 
        metrics.map(metric => point[metric] as number).filter(val => isFinite(val))
      )
      
      if (allValues.length === 0) return fallbackDomain
      
      const min = Math.min(...allValues)
      const max = Math.max(...allValues)
      
      // Handle flat lines
      if (min === max) {
        if (min === 0) return [-1, 1]
        const absValue = Math.abs(min)
        return [min - absValue * 0.1, max + absValue * 0.1]
      }
      
      const range = max - min
      let paddingPercent = 0.1
      
      // Determine padding based on metric types
      const hasPercentageMetric = metrics.some(m => 
        m.toLowerCase().includes('win%') || m.toLowerCase().includes('rate') || m.toLowerCase().includes('percent')
      )
      const hasCountMetric = metrics.some(m => 
        m.toLowerCase().includes('count') || m.toLowerCase().includes('# of')
      )
      const hasRMultiple = metrics.some(m => isRMultipleMetric(m))
      
      if (hasPercentageMetric) {
        return [Math.max(0, min - range * 0.05), Math.min(100, max + range * 0.05)]
      }
      
      if (hasCountMetric && min >= 0) {
        return [0, max + range * 0.1]
      }
      
      if (hasRMultiple) {
        paddingPercent = 0.15
      }
      
      if (range < 1) {
        paddingPercent = 0.2
      }
      
      const padding = range * paddingPercent
      return [min - padding, max + padding]
    }
    
    return {
      left: calculateSmartDomain(axisAssignment.leftAxisMetrics),
      right: calculateSmartDomain(axisAssignment.rightAxisMetrics, [0, 100])
    }
  }, [chartData, axisAssignment, isRMultipleMetric])

  // Generate clean grid lines based on Y-axis domains with nice numbers
  const gridLineValues = useMemo((): GridLineValues => {
    const generateNiceTicks = (domain: [number, number], tickCount: number = 5): number[] => {
      const [min, max] = domain
      const range = max - min
      
      if (range === 0) return [min]
      
      // Calculate nice step size
      const roughStep = range / (tickCount - 1)
      const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)))
      const normalizedStep = roughStep / magnitude
      
      let niceStep
      if (normalizedStep <= 1) niceStep = 1
      else if (normalizedStep <= 2) niceStep = 2
      else if (normalizedStep <= 5) niceStep = 5
      else niceStep = 10
      
      const step = niceStep * magnitude
      
      // Generate ticks starting from a nice number
      const niceMin = Math.floor(min / step) * step
      const niceMax = Math.ceil(max / step) * step
      
      const ticks = []
      for (let tick = niceMin; tick <= niceMax; tick += step) {
        if (tick >= min && tick <= max) {
          ticks.push(Math.round(tick * 1000) / 1000) // Round to avoid floating point issues
        }
      }
      
      return ticks.length > 0 ? ticks : [min, max]
    }

    return {
      left: generateNiceTicks(yAxisDomains.left),
      right: axisAssignment.rightAxisMetrics.length > 0 ? generateNiceTicks(yAxisDomains.right) : []
    }
  }, [yAxisDomains, axisAssignment.rightAxisMetrics])

  return {
    axisAssignment,
    yAxisDomains,
    gridLineValues
  }
}
