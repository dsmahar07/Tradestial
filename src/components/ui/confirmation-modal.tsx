'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, XCircle, Info, X } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

export interface ConfirmationOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'success'
  onConfirm: () => void
  onCancel?: () => void
}

interface ConfirmationModalProps {
  isOpen: boolean
  options: ConfirmationOptions | null
  onClose: () => void
}

const typeConfig = {
  danger: {
    icon: XCircle,
    iconColor: 'text-red-500',
    confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
    borderColor: 'border-red-200'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-orange-500',
    confirmButton: 'bg-orange-600 hover:bg-orange-700 text-white',
    borderColor: 'border-orange-200'
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
    confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
    borderColor: 'border-blue-200'
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-500',
    confirmButton: 'bg-green-600 hover:bg-green-700 text-white',
    borderColor: 'border-green-200'
  }
}

export function ConfirmationModal({ isOpen, options, onClose }: ConfirmationModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !options) return null

  const config = typeConfig[options.type || 'info']
  const IconComponent = config.icon

  const handleConfirm = () => {
    options.onConfirm()
    onClose()
  }

  const handleCancel = () => {
    options.onCancel?.()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
            onClick={handleCancel}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className={cn(
               "relative bg-white dark:bg-[#1C1C1C] rounded-xl shadow-2xl border-2 p-6 max-w-md w-full mx-4 pointer-events-auto cursor-default",
               config.borderColor
             )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
                         <button
               onClick={handleCancel}
               className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer z-10"
             >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800">
              <IconComponent className={cn("w-6 h-6", config.iconColor)} />
            </div>

            {/* Content */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {options.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {options.message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
                             <Button
                 variant="outline"
                 onClick={handleCancel}
                 className="flex-1 border-gray-300 dark:border-gray-600 cursor-pointer"
               >
                {options.cancelText || 'Cancel'}
              </Button>
                             <Button
                 onClick={handleConfirm}
                 className={cn("flex-1 cursor-pointer", config.confirmButton)}
               >
                {options.confirmText || 'Confirm'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Hook for using confirmation modal
export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmationOptions | null>(null)

  const confirm = (confirmOptions: ConfirmationOptions) => {
    setOptions(confirmOptions)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setOptions(null)
  }

  return {
    confirm,
    ConfirmationModal: () => (
      <ConfirmationModal isOpen={isOpen} options={options} onClose={close} />
    )
  }
}