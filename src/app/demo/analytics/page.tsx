'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { DynamicAnalyticsDemo } from '@/components/demo/dynamic-analytics-demo'
import { usePageTitle } from '@/hooks/use-page-title'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

export default function AnalyticsDemoPage() {
  usePageTitle('Dynamic Analytics Demo')

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#1C1C1C]">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Dynamic Analytics Demo
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Experience real-time analytics updates with intelligent caching and reactive data flow
                </p>
              </div>
            </div>

            {/* Instructions */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This demo shows our new dynamic analytics system in action. Import a CSV file from the 
                <strong> Import Data</strong> page to see charts and metrics update automatically. 
                Use the filter buttons below to see real-time recalculations.
              </AlertDescription>
            </Alert>

            {/* Demo Component */}
            <DynamicAnalyticsDemo />
          </div>
        </div>
      </div>
    </div>
  )
}