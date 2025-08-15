'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader } from './card'
import { Button } from './button'
import { MoreHorizontal, TrendingUp, DollarSign, Calendar, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'

const data = [
  { month: 'Jan', value: 8, color: '#3B82F6' },
  { month: 'Feb', value: 12, color: '#8B5CF6' },
  { month: 'Mar', value: 10, color: '#06B6D4' },
  { month: 'Apr', value: 16, color: '#10B981' },
  { month: 'May', value: 14, color: '#F59E0B' },
  { month: 'Jun', value: 11, color: '#EF4444' },
]

export const RevenueChart = React.memo(function RevenueChart() {
  return (
    <div>
      <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 text-white backdrop-blur-sm transition-all duration-300 relative overflow-hidden group">
        {/* Background gradient effect */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-600/10 blur-3xl opacity-50 group-hover:opacity-70 transition-opacity" />
        
        <CardHeader className="flex flex-row items-center justify-between pb-4 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-300">Revenue</h3>
                <div className="flex items-center space-x-1 mt-1">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-400">Real-time</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                $16,400
              </span>
              <div className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg">
                <TrendingUp className="h-3 w-3" />
                <span>+5.4%</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-sm"></div>
                <span className="text-gray-400">Revenue</span>
                <span className="text-white font-medium">$12.4K</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-sm"></div>
                <span className="text-gray-400">Profit</span>
                <span className="text-white font-medium">$4.0K</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-gray-700/50 border-gray-600/50 text-white hover:bg-gray-600/50 hover:border-blue-500/50 shadow-sm backdrop-blur-sm"
                  >
                    Last 6 months
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="bg-gray-800 border-gray-600 shadow-lg min-w-[140px]"
                >
                  <DropdownMenuItem className="text-white hover:bg-gray-700 cursor-pointer">
                    Last 6 months
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-gray-700 cursor-pointer">
                    Last 3 months
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-gray-700 cursor-pointer">
                    This year
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis hide />
                <Bar 
                  dataKey="value" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-3 gap-6 mt-6 pt-4 border-t border-gray-700/50">
            <div className="text-center">
              <div className="text-lg font-bold text-white">$8.2K</div>
              <div className="text-xs text-gray-400">Average</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">$16K</div>
              <div className="text-xs text-gray-400">Highest</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-400">$4.1K</div>
              <div className="text-xs text-gray-400">Lowest</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})