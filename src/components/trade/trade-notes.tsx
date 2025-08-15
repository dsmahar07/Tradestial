'use client'

import { useState } from 'react'

interface TradeNotesProps {
  trade: any
}

const templates = [
  'Intra-day Check-in',
  'Pre-Market Prep', 
  'Daily Game Plan',
  '+ Add template'
]

export function TradeNotes({ trade }: TradeNotesProps) {
  const [activeTab, setActiveTab] = useState('trade-note')

  return (
    <div className="flex flex-col h-full">
      {/* Notes Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#171717] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('trade-note')}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                activeTab === 'trade-note'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Trade note
            </button>
            <button
              onClick={() => setActiveTab('daily-journal')}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                activeTab === 'daily-journal'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Daily Journal
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Recently used templates</div>
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <button
                key={template}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {template}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">↶</button>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">↷</button>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">🎨</button>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">📝</button>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">T</button>
          <select className="text-sm border-none bg-transparent">
            <option>Arial</option>
          </select>
          <select className="text-sm border-none bg-transparent w-16">
            <option>15</option>
          </select>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded font-bold">B</button>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded italic">I</button>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded underline">U</button>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">🔗</button>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">A</button>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">🎨</button>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">≡</button>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">📎</button>
        </div>
      </div>

      {/* Notes Editor */}
      <div className="flex-1 p-4 bg-white dark:bg-[#171717]">
        <textarea
          placeholder="Write something or press '?' for commands"
          className="w-full h-full resize-none border-none outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
        />
      </div>
    </div>
  )
}