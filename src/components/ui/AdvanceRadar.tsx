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

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, null, {
      renderer: "svg",
    });

    const option: EChartsOption = {
      tooltip: { trigger: "item" },
      legend: {
        type: "scroll",
        bottom: 10,
        data: Array.from({ length: 28 }, (_, i) => String(2001 + i)),
      },
      visualMap: {
        top: "middle",
        right: 10,
        inRange: { color: ["red", "yellow"] },
        calculable: true,
      },
      radar: {
        indicator: [
          { text: "IE8-", max: 400 },
          { text: "IE9+", max: 400 },
          { text: "Safari", max: 400 },
          { text: "Firefox", max: 400 },
          { text: "Chrome", max: 400 },
        ],
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

    // resize handler
    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, []);

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
                  className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm"
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
                  className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm"
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