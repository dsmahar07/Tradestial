'use client'

import { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface TradeModelProps {
  trade: any
}

export function TradeModel({ trade }: TradeModelProps) {
  const [selectedModel, setSelectedModel] = useState(trade.model || 'ICT 2022 Model')

  return (
    <div className="p-6">
      <div className="max-w-md">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Add a Model to your trade and track what works
          </h3>
        </div>

        <div className="relative">
          <button className="w-full flex items-center justify-between px-4 py-3 bg-[#6366f1] hover:bg-[#5856eb] text-white rounded-md font-medium">
            <div className="flex items-center">
              <span className="mr-2">😊</span>
              <span>Add Model</span>
            </div>
            <ChevronDownIcon className="w-4 h-4" />
          </button>
        </div>

        {selectedModel && (
          <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
            <div className="flex items-center">
              <span className="mr-2">😊</span>
              <span className="font-medium text-orange-800 dark:text-orange-200">
                {selectedModel}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}