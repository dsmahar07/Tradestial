'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { defaultTemplates, TradeJournalingTemplate, generateQuickTemplateContent } from '@/lib/templates'
import { Plus, Search, Filter, Settings, X, Trash2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TemplateSelectorProps {
  onTemplateSelect: (template: TradeJournalingTemplate) => void
  onQuickApplyTemplate: (template: TradeJournalingTemplate, content: string) => void
  onCreateBlankNote: () => void
  onDeleteTemplate?: (template: TradeJournalingTemplate) => void
  templates?: TradeJournalingTemplate[]
  children?: React.ReactNode
  // Controlled dialog support
  open?: boolean
  onOpenChange?: (open: boolean) => void
  // If false, do not render inline trigger wrapper around children
  useInlineTrigger?: boolean
}

const categoryIcons = {
  daily: '📅',
  trade: '💹',
  analysis: '📊',
  review: '🔍',
  custom: '⚙️'
}

const categoryColors = {
  daily: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  trade: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  analysis: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
  review: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
  custom: 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300'
}

export function TemplateSelector({ onTemplateSelect, onQuickApplyTemplate, onCreateBlankNote, onDeleteTemplate, templates = defaultTemplates, children, open, onOpenChange, useInlineTrigger = true }: TemplateSelectorProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof open === 'boolean'
  const isOpen = isControlled ? !!open : internalOpen
  const setOpen = (next: boolean) => {
    if (onOpenChange) onOpenChange(next)
    if (!isControlled) setInternalOpen(next)
  }
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')


  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const categories = ['all', 'daily', 'trade', 'analysis', 'review', 'custom']

  const handleTemplateSelect = (template: TradeJournalingTemplate) => {
    onTemplateSelect(template)
    setOpen(false)
    setSearchQuery('')
    setSelectedCategory('all')
  }

  const handleBlankNote = () => {
    onCreateBlankNote()
    setOpen(false)
  }

  const handleQuickApply = (template: TradeJournalingTemplate) => {
    const content = generateQuickTemplateContent(template)
    onQuickApplyTemplate(template, content)
    setOpen(false)
    setSearchQuery('')
    setSelectedCategory('all')
  }

  const handleDeleteTemplate = (template: TradeJournalingTemplate) => {
    if (onDeleteTemplate) {
      onDeleteTemplate(template)
    }
  }

  return (
    <>
      {useInlineTrigger && children ? (
        <div onClick={() => setOpen(true)}>
          {children}
        </div>
      ) : null}
      <Dialog open={isOpen} onClose={() => setOpen(false)}>
              <DialogContent className="w-full max-w-6xl h-[85vh] overflow-hidden p-0 bg-white dark:bg-[#171717] border border-gray-200 dark:border-gray-700">
        <DialogHeader className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#171717]">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">Choose a Template</DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Click <span className="text-blue-600 dark:text-blue-400 font-medium">⚡ Quick Apply</span> for instant templates, or use the settings icon to configure first
          </p>
        </DialogHeader>
        
        <div className="flex flex-col h-full p-6 pt-4 bg-white dark:bg-[#171717]">
          {/* Search and Filter Bar */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 min-w-[140px] justify-between"
                  >
                    <span>
                      {selectedCategory === 'all' ? 'All Categories' :
                       selectedCategory === 'daily' ? 'Daily' :
                       selectedCategory === 'trade' ? 'Trade Analysis' :
                       selectedCategory === 'analysis' ? 'Market Analysis' :
                       selectedCategory === 'review' ? 'Reviews' :
                       selectedCategory === 'custom' ? 'Custom' : 'All Categories'}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-600">
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory('all')}
                    className={`hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 ${selectedCategory === 'all' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                  >
                    All Categories
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory('daily')}
                    className={`hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 ${selectedCategory === 'daily' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                  >
                    Daily
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory('trade')}
                    className={`hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 ${selectedCategory === 'trade' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                  >
                    Trade Analysis
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory('analysis')}
                    className={`hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 ${selectedCategory === 'analysis' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                  >
                    Market Analysis
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory('review')}
                    className={`hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 ${selectedCategory === 'review' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                  >
                    Reviews
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory('custom')}
                    className={`hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 ${selectedCategory === 'custom' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                  >
                    Custom
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto pr-2 bg-white dark:bg-[#171717]">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
              {/* Blank Note Option */}
              <div
                className="h-64 p-4 bg-white dark:bg-[#1f1f1f] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer flex flex-col hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                onClick={handleBlankNote}
              >
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-lg mb-3">
                  <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-base">Blank Note</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">Start with a blank note and add your own content</p>
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>Custom content</span>
                </div>
              </div>

              {/* Template Cards */}
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="relative h-64 p-4 bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-600 flex flex-col hover:shadow-lg dark:hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div 
                      className="flex items-center justify-center w-12 h-12 rounded-lg text-2xl bg-gray-100 dark:bg-gray-700"
                    >
                      <span className="text-gray-600 dark:text-gray-300">{template.icon}</span>
                    </div>
                    
                    <div className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {categoryIcons[template.category as keyof typeof categoryIcons]} {template.category}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-base leading-tight">{template.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1 overflow-hidden leading-5">{template.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-3 min-h-[24px]">
                    {template.tags.slice(0, 2).map((tag) => (
                      <span 
                        key={tag}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                    {template.tags.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded">
                        +{template.tags.length - 2}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span>{template.fields.length} fields</span>
                    {template.isCustomizable && (
                      <div className="flex items-center">
                        <Settings className="w-3 h-3 mr-1" />
                        <span>Custom</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs py-1.5"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickApply(template)
                      }}
                    >
                      ⚡ Quick Apply
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="px-3 text-xs py-1.5 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTemplateSelect(template)
                      }}
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="px-3 text-xs py-1.5 border-red-300 hover:bg-red-50 dark:border-red-600 dark:hover:bg-red-900/20 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTemplate(template)
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-[#171717]">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <Search className="w-16 h-16 mx-auto mb-2" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No templates found</h3>
                <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </>
  )
}