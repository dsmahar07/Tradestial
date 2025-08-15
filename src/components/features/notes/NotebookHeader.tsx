'use client'

import { ChevronLeft, Bell, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function NotebookHeader() {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      {/* Left side - Back button and title */}
      <div className="flex items-center space-x-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Notebook</h1>
      </div>

      {/* Right side - Account selector and notifications */}
      <div className="flex items-center space-x-3">
        {/* All Accounts Dropdown */}
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-white">A</span>
          </div>
          <span className="text-sm font-medium text-gray-700">All Accounts</span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </div>

        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-medium">1</span>
          </div>
        </Button>
      </div>
    </div>
  )
}