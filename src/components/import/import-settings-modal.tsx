'use client'

import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'
import { X, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TIMEZONE_REGIONS, getCurrentTimezone, formatTimezoneOffset } from '@/utils/timezones'

interface ImportSettingsModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (settings: ImportSettings) => void
  isProcessing?: boolean
}

export interface ImportSettings {
  preferredDateFormat: string
  timezoneOffsetMinutes: number
}

const dateFormats = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
]

export function ImportSettingsModal({ open, onClose, onConfirm, isProcessing = false }: ImportSettingsModalProps) {
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY')
  const [timezoneOffset, setTimezoneOffset] = useState(getCurrentTimezone().value)

  const selectedTimezone = Object.values(TIMEZONE_REGIONS)
    .flat()
    .find(tz => tz.value === timezoneOffset)

  const handleSubmit = () => {
    try {
      // Persist for downstream consumers (e.g., UI formatting of times)
      if (typeof window !== 'undefined') {
        localStorage.setItem('import:timezoneOffsetMinutes', String(timezoneOffset))
        localStorage.setItem('import:preferredDateFormat', dateFormat)
      }
    } catch {}
    onConfirm({
      preferredDateFormat: dateFormat,
      timezoneOffsetMinutes: timezoneOffset
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#171717] rounded-lg border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md p-6 z-50 font-sans">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              Import Settings
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            
            {/* Date Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Format
              </label>
              <Select.Root value={dateFormat} onValueChange={setDateFormat}>
                <Select.Trigger className="w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#171717] border border-gray-300 dark:border-[#2a2a2a] rounded-md text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between">
                  <Select.Value>{dateFormat}</Select.Value>
                  <Select.Icon>
                    <ChevronDown size={16} className="text-gray-500" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-md shadow-lg z-[100] min-w-[200px]">
                    <Select.Viewport className="p-1">
                      {dateFormats.map((format) => (
                        <Select.Item
                          key={format.value}
                          value={format.value}
                          className="px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none"
                        >
                          <Select.ItemText>{format.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timezone
              </label>
              <Select.Root value={String(timezoneOffset)} onValueChange={(value) => setTimezoneOffset(parseInt(value))}>
                <Select.Trigger className="w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#171717] border border-gray-300 dark:border-[#2a2a2a] rounded-md text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between">
                  <Select.Value>
                    {selectedTimezone ? selectedTimezone.label : 'Select timezone'}
                  </Select.Value>
                  <Select.Icon>
                    <ChevronDown size={16} className="text-gray-500" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-md shadow-lg z-[100] min-w-[250px] max-h-[300px] overflow-auto">
                    <Select.Viewport className="p-1">
                      {Object.entries(TIMEZONE_REGIONS).map(([regionName, timezones]) => (
                        <Select.Group key={regionName}>
                          <Select.Label className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                            {regionName}
                          </Select.Label>
                          {timezones.map((timezone) => (
                            <Select.Item
                              key={`${timezone.label}-${timezone.value}`}
                              value={String(timezone.value)}
                              className="px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none"
                            >
                              <Select.ItemText>
                                <div className="flex flex-col">
                                  <span className="font-medium">{timezone.label}</span>
                                  <span className="text-xs text-gray-500">
                                    {formatTimezoneOffset(timezone.value)}
                                  </span>
                                </div>
                              </Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Group>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessing ? 'Processing...' : 'Continue'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}