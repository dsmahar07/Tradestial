'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/hooks/use-theme'
import { usePageTitle } from '@/hooks/use-page-title'
import Link from 'next/link'

export default function DebugThemePage() {
  usePageTitle('Debug Theme')
  const { theme, setTheme } = useTheme()
  const [localStorageValue, setLocalStorageValue] = useState<string | null>(null)
  const [documentClass, setDocumentClass] = useState<string>('')

  useEffect(() => {
    // Check localStorage value
    const stored = localStorage.getItem('tradtrace-ui-theme')
    setLocalStorageValue(stored)
    
    // Check document class
    const classes = document.documentElement.classList
    setDocumentClass(Array.from(classes).join(', '))
  }, [theme])

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Theme Debug Page</h1>
      
      <div className="space-y-4 mb-8">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Current Theme State</h2>
          <p>Theme from useTheme: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{theme}</code></p>
          <p>localStorage value: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{localStorageValue}</code></p>
          <p>Document classes: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{documentClass}</code></p>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Test Theme Changes</h2>
          <div className="space-x-2">
            <button 
              onClick={() => setTheme('light')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Set Light
            </button>
            <button 
              onClick={() => setTheme('dark')}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
              Set Dark
            </button>
            <button 
              onClick={() => setTheme('system')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Set System
            </button>
          </div>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Clear Storage</h2>
          <button 
            onClick={() => {
              localStorage.removeItem('tradtrace-ui-theme')
              window.location.reload()
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear localStorage & Reload
          </button>
        </div>
      </div>

      <div className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Visual Test</h2>
        <p className="mb-2">This text should change color with theme:</p>
        <div className="p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded">
          <p className="text-gray-900 dark:text-white">Sample text in current theme</p>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-blue-500 hover:underline">← Back to Home</Link>
      </div>
    </div>
  )
}