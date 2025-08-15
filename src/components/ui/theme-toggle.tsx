'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
    const { theme, setTheme, mounted } = useTheme()

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        console.log('🎭 ThemeToggle: Switching from', theme, 'to', newTheme)
        setTheme(newTheme)
    }

    if (!mounted) {
        return (
            <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-gray-100 dark:hover:bg-gray-800/50"
                disabled
            >
                <Sun className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Loading theme...</span>
            </Button>
        )
    }

    return (
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="hover:bg-gray-100 dark:hover:bg-gray-800/50"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}

// Simple toggle version for sidebar
export function SimpleThemeToggle() {
    const { theme, setTheme, mounted } = useTheme()

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        console.log('🎭 SimpleThemeToggle: Switching from', theme, 'to', newTheme)
        setTheme(newTheme)
    }

    if (!mounted) {
        return (
            <button className="flex items-center space-x-3 w-full text-left opacity-50" disabled>
                <Sun className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Loading...</span>
            </button>
        )
    }

    const isDark = theme === 'dark'

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center space-x-3 w-full text-left"
        >
            {isDark ? (
                <Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
                <Sun className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
            <span className="text-sm text-gray-600 dark:text-gray-300">
                {isDark ? 'Dark Mode' : 'Light Mode'}
            </span>
            <div className="ml-auto">
                <div className="w-8 h-4 bg-gray-300 dark:bg-gray-700 rounded-full relative transition-colors">
                    <div
                        className={`w-3 h-3 bg-gray-900 dark:bg-white rounded-full absolute top-0.5 transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                    />
                </div>
            </div>
        </button>
    )
}