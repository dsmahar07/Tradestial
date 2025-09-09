'use client'

import React, { memo } from 'react'
import { cn } from '@/lib/utils'
import { ChartType } from '@/types/performance'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Settings2, Palette, BarChart3 } from 'lucide-react'

interface ChartCustomizationPanelProps {
  allMetrics: string[]
  chartTypes: Record<string, ChartType>
  chartColors: Record<string, string>
  availableColors: string[]
  onChartTypeChange: (metric: string, type: ChartType) => void
  onColorChange: (metric: string, color: string) => void
  onResetToDefault: () => void
  getChartType: (metric: string) => ChartType
  getChartColor: (metric: string, index: number) => string
  getDisplayMetricName: (metric: string) => string
}

const ChartCustomizationPanelComponent = ({
  allMetrics,
  chartTypes,
  chartColors,
  availableColors,
  onChartTypeChange,
  onColorChange,
  onResetToDefault,
  getChartType,
  getChartColor,
  getDisplayMetricName
}: ChartCustomizationPanelProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="h-9 w-9 p-0 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <Settings2 className="h-4 w-4" />
          <span className="sr-only">Chart customization options</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-80 max-h-[500px] overflow-y-auto" 
        align="start"
        side="bottom"
      >
        <DropdownMenuLabel className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="h-4 w-4" />
          Chart Customization
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <div className="p-2 space-y-4">
          {allMetrics.map((metric, index) => (
            <div key={metric} className="space-y-3 p-3 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
              {/* Metric Name with Badge */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs font-medium max-w-[200px] truncate">
                  {getDisplayMetricName(metric)}
                </Badge>
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0" 
                  style={{ backgroundColor: getChartColor(metric, index) }}
                  title={`Current color: ${getChartColor(metric, index)}`}
                />
              </div>
              
              {/* Color Picker Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <Palette className="h-3 w-3" />
                  Color
                </div>
                <div className="grid grid-cols-8 gap-1.5">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => onColorChange(metric, color)}
                      className={cn(
                        "w-6 h-6 rounded-md border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                        getChartColor(metric, index) === color 
                          ? "border-gray-900 dark:border-gray-100 scale-110 shadow-md" 
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-400"
                      )}
                      style={{ backgroundColor: color }}
                      title={`Set color to ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Chart Type Selector */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <BarChart3 className="h-3 w-3" />
                  Chart Type
                </div>
                <Select
                  value={getChartType(metric)}
                  onValueChange={(value: ChartType) => onChartTypeChange(metric, value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Area" className="text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500/20 border border-blue-500 rounded-sm" />
                        Area Chart
                      </div>
                    </SelectItem>
                    <SelectItem value="Line" className="text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-blue-500 rounded-full" />
                        Line Chart
                      </div>
                    </SelectItem>
                    <SelectItem value="Column" className="text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-3 bg-blue-500 rounded-sm" />
                        Column Chart
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onResetToDefault}
          className="text-sm text-blue-600 dark:text-blue-400 focus:text-blue-700 dark:focus:text-blue-300 cursor-pointer"
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Reset to Default
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const ChartCustomizationPanel = memo(ChartCustomizationPanelComponent)
