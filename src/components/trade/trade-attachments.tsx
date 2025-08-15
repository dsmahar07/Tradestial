'use client'

import { ArrowUpTrayIcon, FolderIcon } from '@heroicons/react/24/outline'

interface TradeAttachmentsProps {
  trade: any
}

export function TradeAttachments({ trade }: TradeAttachmentsProps) {
  return (
    <div className="p-6">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <FolderIcon className="w-8 h-8 text-gray-400" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Drag and drop here
        </h3>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Or
        </p>
        
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md">
          <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
          Browse Files
        </button>
      </div>
    </div>
  )
}