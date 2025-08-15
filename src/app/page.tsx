'use client'

import { usePageTitle } from '@/hooks/use-page-title'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { YearlyCalendar } from '@/components/ui/yearly-calendar'
import { TrendingUp, BarChart3, Calendar, PieChart, Activity, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Home() {
  usePageTitle('Dashboard')
  
  const quickStats = [
    { label: 'Total P&L', value: '$4,667', change: '+12.5%', positive: true, icon: DollarSign },
    { label: 'Win Rate', value: '85%', change: '+5.2%', positive: true, icon: TrendingUp },
    { label: 'Total Trades', value: '2', change: '0%', positive: null, icon: BarChart3 },
    { label: 'Active Days', value: '1', change: '0%', positive: null, icon: Activity },
  ]

  const navigationCards = [
    { title: 'Analytics', description: 'View detailed trading analytics and performance metrics', href: '/analytics', icon: BarChart3 },
    { title: 'Daily Journal', description: 'Track your daily trading activities and notes', href: '/daily-journal', icon: Calendar },
    { title: 'Statistics', description: 'Comprehensive trading statistics and reports', href: '/statistics', icon: PieChart },
    { title: 'Dashboard', description: 'Main trading dashboard with live data', href: '/dashboard', icon: Activity },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Trading Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's your trading overview for 2025.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className={cn(
                      "text-xs font-medium",
                      stat.positive === true && "text-green-600 dark:text-green-400",
                      stat.positive === false && "text-red-600 dark:text-red-400",
                      stat.positive === null && "text-gray-500 dark:text-gray-400"
                    )}>
                      {stat.change}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <stat.icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Yearly Calendar */}
        <YearlyCalendar />

        {/* Navigation Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Quick Navigation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {navigationCards.map((card, index) => (
              <Card key={index} className="hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors duration-200">
                      <card.icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                    <CardTitle className="text-lg font-semibold">{card.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Successful Trade</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">August 2025 - 2 trades completed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600 dark:text-green-400">+$4,667</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">85% win rate</p>
                </div>
              </div>
              
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  Start trading to see more activity here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}