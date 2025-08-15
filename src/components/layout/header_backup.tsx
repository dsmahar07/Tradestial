'use client'

import { ThemeToggle } from "@/components/ui"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"
import { usePathname } from 'next/navigation'

export function DashboardHeader() {
  const pathname = usePathname()
  
  const getPageInfo = () => {
    switch (pathname) {
      case '/notes':
        return {
          title: 'Note',
          description: 'Your trading journal and notes'
        }
      case '/progress-tracker':
        return {
          title: 'Progress Tracker',
          description: 'Track your trading progress and milestones'
        }
      case '/daily-journal':
        return {
          title: 'Daily Journal',
          description: 'Your daily trading reflections and insights'
        }
      case '/dashboard':
      default:
        return {
          title: 'Dashboard',
          description: "Here's your analytic details"
        }
    }
  }

  const { title, description } = getPageInfo()

  return (
    <header className="bg-gray-50 dark:bg-[#1C1C1C] text-gray-900 dark:text-white px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{description}</p>
        </div>
        
        <div className="flex items-center justify-end space-x-3">
          <Link href="/daily-journal">
            <Button 
              size="sm"
              className="relative bg-[#693EE0] hover:bg-[#5929d1] text-white border-none shadow-sm overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none"
            >
              <span className="relative z-10">Journal</span>
            </Button>
          </Link>
          <Button 
            size="sm"
            className="relative bg-[#3559E9] hover:bg-[#2947d1] text-white border-none shadow-sm overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none"
          >
            <Zap className="w-4 h-4 mr-2 relative z-10" />
            <span className="relative z-10">Sync</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}