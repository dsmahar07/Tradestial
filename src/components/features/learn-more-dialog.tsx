'use client'

import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/optimized'
import { Code2, Zap, Star, Heart } from 'lucide-react'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { APP_CONFIG } from '@/constants'
import { useState } from 'react'

export function LearnMoreDialog() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" size="lg" onClick={() => setIsOpen(true)}>
        Learn More
      </Button>
      
      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">Welcome to {APP_CONFIG.name}</DialogTitle>
            <DialogDescription>
              This project includes all the modern tools you need for building exceptional web applications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Code2 className="h-5 w-5 text-primary" />
              <span>Next.js 15 with App Router & TypeScript</span>
            </div>
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span>Tailwind CSS with design system</span>
            </div>
            <div className="flex items-center space-x-3">
              <Star className="h-5 w-5 text-purple-500" />
              <span>Headless UI components with animations</span>
            </div>
            <div className="flex items-center space-x-3">
              <Heart className="h-5 w-5 text-red-500" />
              <span>Framer Motion for smooth animations</span>
            </div>
            <div className="flex items-center space-x-3">
              <SparklesIcon className="h-5 w-5 text-primary" />
              <span>Lucide React & Heroicons icon libraries</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}