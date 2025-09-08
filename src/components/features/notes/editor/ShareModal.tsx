'use client'

import React from 'react'
import { Copy, CheckCircle, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  shareUrl: string
  isAnonymous: boolean
  onAnonymousChange: (value: boolean) => void
  onCopyLink: () => void
  tradingData?: any
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  isAnonymous,
  onAnonymousChange,
  onCopyLink,
  tradingData
}) => {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    onCopyLink()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Journal Entry</DialogTitle>
          <DialogDescription>
            Share this journal entry with others via a secure link
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Share URL */}
          <div className="space-y-2">
            <Label htmlFor="share-url" className="text-sm font-medium">
              Share Link
            </Label>
            <div className="flex items-center space-x-2">
              <input
                id="share-url"
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md"
              />
              <Button
                size="sm"
                onClick={handleCopy}
                className="min-w-[80px]"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Privacy Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Privacy Settings</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="anonymous-share" className="text-sm">
                  Anonymous Sharing
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Hide your account name when sharing
                </p>
              </div>
              <Switch
                checked={isAnonymous}
                onCheckedChange={onAnonymousChange}
              />
            </div>
          </div>

          {/* Trading Data Preview */}
          {tradingData && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Included Data</h4>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>✓ Journal content and notes</p>
                  {tradingData.stats && (
                    <>
                      <p>✓ Trading statistics ({tradingData.stats.totalTrades} trades)</p>
                      <p>✓ Performance chart</p>
                      <p>✓ P&L: ${tradingData.netPnl}</p>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>• Links expire after 30 days</p>
            <p>• You can revoke access at any time</p>
            <p>• Viewers cannot edit your journal</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
