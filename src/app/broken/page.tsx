'use client'

import { useState } from 'react'
import { ArrowLeft, X, Play, Check } from 'lucide-react'
import { usePageTitle } from '@/hooks/use-page-title'

export default function BrokenPage() {
  usePageTitle('Add Trades')
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-5 py-5 mb-16 relative flex items-center justify-between">
        <button className="p-1">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 top-3 text-center">
          <div className="mx-auto w-64 h-1.5 bg-purple-600 rounded-full mb-3" />
          <div className="text-base md:text-lg text-[#636A9D] font-semibold">Add Trades</div>
          <div className="text-3xl md:text-4xl font-semibold text-gray-900">Upload file</div>
        </div>
        <button className="p-1">
          <X className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 px-5 pb-14">
        {/* Left Side - Upload */}
        <div className="pt-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-[#636A9D]">Upload your file</h2>
              <span className="px-3 py-1.5 bg-blue-700 text-white text-sm rounded-full font-medium">
                Takes less than 2 min
              </span>
            </div>

            {/* Time zone */}
            <div className="space-y-2">
              <div className="flex items-center space-x-1">
                <label className="text-sm font-medium text-[#636A9D]">Time zone</label>
                <div className="w-3 h-3 rounded-full bg-gray-400 flex items-center justify-center">
                  <span className="text-white text-xs">i</span>
                </div>
              </div>
              <select className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white">
                <option>(GMT-04:00) US/Eastern</option>
              </select>
              <p className="text-xs text-gray-500">
                Please select the file time zone. Note that if you want to see data in the application in a 
                different time zone please update it in your <span className="text-blue-600 underline">settings</span>
              </p>
            </div>

            {/* Warning */}
            <div className="flex items-start space-x-2 p-3 bg-orange-50 rounded">
              <div className="w-5 h-5 rounded bg-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">!</span>
              </div>
              <p className="text-sm text-orange-800">
                This import has limitations. Please review the details by clicking on 
                this message. You'll find crucial information that may impact your 
                import.
              </p>
            </div>

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center bg-white ${isDragOver ? 'border-purple-500 bg-purple-50' : 'border-gray-300'}`}
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-[#636A9D] font-medium mb-4">
                Drag and drop file and upload from your computer
              </p>
              <input type="file" accept=".csv" className="hidden" id="file-upload" />
              <label htmlFor="file-upload">
                <button className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">
                  Upload file
                </button>
              </label>
            </div>
          </div>
        </div>

        {/* Right Side - Tradovate */}
        <div className="pt-2 lg:border-l lg:border-gray-200 lg:pl-10">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 text-blue-500">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900">Tradovate</h2>
          </div>

          <div className="space-y-4">
            {/* Supported Asset Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Supported Asset Types:</h4>
              <div className="flex flex-wrap gap-3">
                {/* Unsupported */}
                <div className="flex items-center text-xs font-medium text-gray-500">
                  <span className="mr-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 bg-white">
                    <X className="w-3 h-3 text-[#FB3748]" />
                  </span>
                  <span>Stocks</span>
                </div>
                {/* Supported */}
                <div className="flex items-center text-xs font-semibold text-gray-900">
                  <span className="mr-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full border border-blue-200 bg-white">
                    <Check className="w-3 h-3 text-[#2547D0]" />
                  </span>
                  <span>Futures</span>
                </div>
                {/* Unsupported */}
                <div className="flex items-center text-xs font-medium text-gray-500">
                  <span className="mr-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 bg-white">
                    <X className="w-3 h-3 text-[#FB3748]" />
                  </span>
                  <span>Options</span>
                </div>
                <div className="flex items-center text-xs font-medium text-gray-500">
                  <span className="mr-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 bg-white">
                    <X className="w-3 h-3 text-[#FB3748]" />
                  </span>
                  <span>Forex</span>
                </div>
                <div className="flex items-center text-xs font-medium text-gray-500">
                  <span className="mr-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 bg-white">
                    <X className="w-3 h-3 text-[#FB3748]" />
                  </span>
                  <span>Crypto</span>
                </div>
                <div className="flex items-center text-xs font-medium text-gray-500">
                  <span className="mr-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 bg-white">
                    <X className="w-3 h-3 text-[#FB3748]" />
                  </span>
                  <span>CFD</span>
                </div>
              </div>
            </div>

            {/* Integration Guide */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">How to import trades from Tradovate</h4>
                <button className="flex items-center text-xs text-blue-600">
                  Integration Guide
                  <div className="ml-1 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">?</span>
                  </div>
                </button>
              </div>
              <p className="text-sm text-[#636A9D] font-semibold mb-3">
                To import data from Tradovate, follow these steps:
              </p>

              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <p className="text-sm text-[#636A9D] font-semibold">
                    In Tradovate, click on the Account tab, then choose the account to 
                    export trades for.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <p className="text-sm text-[#636A9D] font-semibold">
                    Click the settings icon next to the account to open the settings for that 
                    account.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <p className="text-sm text-[#636A9D] font-semibold">
                    Click the Orders tab.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                  <p className="text-sm text-[#636A9D] font-semibold">
                    Enter the dates you wish to export, and click Go.
                  </p>
                </div>
              </div>

              <button className="text-xs text-blue-600 mt-2">
                Expand whole instructions ▼
              </button>
            </div>

            {/* Video */}
            <div className="relative bg-black/90 rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5">
              <div className="aspect-video flex items-center justify-center">
                <button className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                </button>
              </div>
              <div className="absolute top-2 left-2 text-white text-xs bg-black bg-opacity-50 px-1 py-0.5 rounded flex items-center space-x-2">
                <span>⏱ 3 min</span>
                <span>👁 9.97K views</span>
              </div>
              <div className="absolute bottom-2 right-2 text-white text-xs bg-black bg-opacity-50 px-1 py-0.5 rounded">
                1.2×
              </div>
              <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-50 px-1 py-0.5 rounded">
                3 min / 2 min 45 sec
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}