'use client'

import React, { Component, ReactNode } from 'react'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React Error Boundary caught error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                Something went wrong
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We apologize for the inconvenience. Please try refreshing the page.
              </p>
              {process.env.NODE_ENV !== 'production' && this.state.error && (
                <div className="text-xs text-left bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-3 mb-4 overflow-auto max-h-48">
                  <div className="font-semibold mb-1">Error:</div>
                  <pre className="whitespace-pre-wrap break-words">{this.state.error.message}</pre>
                  {this.state.error.stack && (
                    <>
                      <div className="font-semibold mt-3 mb-1">Stack:</div>
                      <pre className="whitespace-pre text-[10px] leading-[14px]">{this.state.error.stack}</pre>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
