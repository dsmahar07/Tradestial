"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import * as echarts from "echarts/core";
import {
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  LegendComponent,
} from "echarts/components";
import { RadarChart } from "echarts/charts";
import { SVGRenderer } from "echarts/renderers";
import type {
  TitleComponentOption,
  TooltipComponentOption,
  VisualMapComponentOption,
  LegendComponentOption,
} from "echarts/components";
import type { RadarSeriesOption } from "echarts/charts";

echarts.use([
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  LegendComponent,
  RadarChart,
  SVGRenderer,
]);

type EChartsOption = echarts.ComposeOption<
  | TitleComponentOption
  | TooltipComponentOption
  | VisualMapComponentOption
  | LegendComponentOption
  | RadarSeriesOption
>;

const timeRanges = ['Today', 'This Week', 'This Month', 'All Time']
const viewModes = ['Overlapped', 'Separated', 'Animated']

const AdvanceRadar: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('This Month')
  const [selectedViewMode, setSelectedViewMode] = useState('Overlapped')
  const [isDarkMode, setIsDarkMode] = useState(false)

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
    
    const chart = echarts.init(chartRef.current, null, {
      renderer: "svg",
    });

    const updateChart = () => {
      const option: EChartsOption = {
        backgroundColor: 'transparent',
        tooltip: { 
          trigger: "item",
          backgroundColor: isDarkMode ? '#171717' : '#ffffff',
          borderColor: isDarkMode ? '#2a2a2a' : '#e5e7eb',
          textStyle: {
            color: isDarkMode ? '#ffffff' : '#374151'
          }
        },
        legend: {
          type: "scroll",
          bottom: 10,
          data: Array.from({ length: 28 }, (_, i) => String(2001 + i)),
          textStyle: {
            color: isDarkMode ? '#d1d5db' : '#6b7280'
          }
        },
        visualMap: {
          top: "middle",
          right: 10,
          inRange: { color: ["red", "yellow"] },
          calculable: true,
          textStyle: {
            color: isDarkMode ? '#d1d5db' : '#6b7280'
          }
        },
        radar: {
          indicator: [
            { text: "Consistency", max: 400 },
            { text: "Win Rate", max: 400 },
            { text: "Profit Factor", max: 400 },
            { text: "Avg Win", max: 400 },
            { text: "Avg Loss", max: 400 },
          ],
          name: {
            textStyle: {
              color: isDarkMode ? '#d1d5db' : '#6b7280',
              fontSize: 12
            }
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
                ['rgba(55, 65, 81, 0.1)', 'rgba(75, 85, 99, 0.1)'] : 
                ['rgba(250, 250, 250, 0.1)', 'rgba(200, 200, 200, 0.1)']
            }
          },
          axisLine: {
            lineStyle: {
              color: isDarkMode ? '#374151' : '#e5e7eb'
            }
          }
        },
        series: Array.from({ length: 28 }, (_, i) => ({
          type: "radar",
          symbol: "none",
          lineStyle: { width: 1 },
          emphasis: { areaStyle: { color: "rgba(0,250,0,0.3)" } },
          data: [
            {
              value: [
                (40 - (i + 1)) * 10,
                (38 - (i + 1)) * 4 + 60,
                (i + 1) * 5 + 10,
                (i + 1) * 9,
                ((i + 1) * (i + 1)) / 2,
              ],
              name: String(2001 + i),
            },
          ],
        })),
      };

      chart.setOption(option);
    };

    updateChart();

    // resize handler
    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, []);

  // Separate effect for updating chart when dependencies change
  useEffect(() => {
    if (chartRef.current) {
      const chart = echarts.getInstanceByDom(chartRef.current);
      if (chart) {
        const option: EChartsOption = {
          backgroundColor: 'transparent',
          tooltip: { 
            trigger: "item",
            backgroundColor: isDarkMode ? '#171717' : '#ffffff',
            borderColor: isDarkMode ? '#2a2a2a' : '#e5e7eb',
            textStyle: {
              color: isDarkMode ? '#ffffff' : '#374151'
            }
          },
          legend: {
            type: "scroll",
            bottom: 10,
            data: Array.from({ length: 28 }, (_, i) => String(2001 + i)),
            textStyle: {
              color: isDarkMode ? '#d1d5db' : '#6b7280'
            }
          },
          visualMap: {
            top: "middle",
            right: 10,
            inRange: { color: ["red", "yellow"] },
            calculable: true,
            textStyle: {
              color: isDarkMode ? '#d1d5db' : '#6b7280'
            }
          },
          radar: {
            indicator: [
              { text: "Consistency", max: 400 },
              { text: "Win Rate", max: 400 },
              { text: "Profit Factor", max: 400 },
              { text: "Avg Win", max: 400 },
              { text: "Avg Loss", max: 400 },
            ],
            name: {
              textStyle: {
                color: isDarkMode ? '#d1d5db' : '#6b7280',
                fontSize: 12
              }
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
                  ['rgba(55, 65, 81, 0.1)', 'rgba(75, 85, 99, 0.1)'] : 
                  ['rgba(250, 250, 250, 0.1)', 'rgba(200, 200, 200, 0.1)']
              }
            },
            axisLine: {
              lineStyle: {
                color: isDarkMode ? '#374151' : '#e5e7eb'
              }
            }
          }
        };

        chart.setOption(option);
      }
    }
  }, [isDarkMode, selectedTimeRange, selectedViewMode]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="focus:outline-none"
    >
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 text-gray-900 dark:text-white relative focus:outline-none w-full" style={{ height: '385px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance Radar
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm"
                >
                  <span>{selectedViewMode}</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {viewModes.map((mode) => (
                  <DropdownMenuItem
                    key={mode}
                    onClick={() => setSelectedViewMode(mode)}
                    className={selectedViewMode === mode ? 'bg-gray-100 dark:bg-gray-800' : ''}
                  >
                    {mode}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm"
                >
                  <span>{selectedTimeRange}</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {timeRanges.map((range) => (
                  <DropdownMenuItem
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={selectedTimeRange === range ? 'bg-gray-100 dark:bg-gray-800' : ''}
                  >
                    {range}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ECharts Radar Chart */}
        <div className="h-72">
          <div ref={chartRef} style={{ width: "100%", height: "100%" }} />
        </div>
      </div>
    </motion.div>
  );
};

export default AdvanceRadar;