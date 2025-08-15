'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image, Video, FileText, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type FileWithPreview = {
  file: File
  preview: string
  id: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
}

interface FileUploadProps {
  onUpload?: (files: FileWithPreview[]) => void
  onClose?: () => void
  acceptedTypes?: string[]
  maxFileSize?: number // in MB
  maxFiles?: number
}

export function FileUpload({
  onUpload,
  onClose,
  acceptedTypes = ['image/*', 'video/*'],
  maxFileSize = 50,
  maxFiles = 10
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [category, setCategory] = useState('Trading Setup')
  const [tags, setTags] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categories = [
    'Trading Setup',
    'Trade Analysis', 
    'Educational',
    'Market News',
    'Strategy Documentation',
    'Portfolio Screenshots'
  ]

  const createFilePreview = useCallback((file: File): FileWithPreview => {
    const preview = URL.createObjectURL(file)
    return {
      file,
      preview,
      id: Math.random().toString(36).substring(7),
      progress: 0,
      status: 'uploading'
    }
  }, [])

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: FileWithPreview[] = []
    
    Array.from(fileList).forEach(file => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxFileSize}MB.`)
        return
      }

      // Check file type
      const isValidType = acceptedTypes.some(type => {
        if (type === 'image/*') return file.type.startsWith('image/')
        if (type === 'video/*') return file.type.startsWith('video/')
        return file.type === type
      })

      if (!isValidType) {
        alert(`File ${file.name} is not a supported type.`)
        return
      }

      newFiles.push(createFilePreview(file))
    })

    if (files.length + newFiles.length > maxFiles) {
      alert(`Cannot upload more than ${maxFiles} files at once.`)
      return
    }

    setFiles(prev => [...prev, ...newFiles])

    // Simulate upload progress
    newFiles.forEach(fileWithPreview => {
      simulateUpload(fileWithPreview.id)
    })
  }, [files.length, maxFileSize, maxFiles, acceptedTypes, createFilePreview])

  const simulateUpload = (fileId: string) => {
    const interval = setInterval(() => {
      setFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          const newProgress = Math.min(file.progress + Math.random() * 30, 100)
          const newStatus = newProgress === 100 ? 'completed' : 'uploading'
          
          if (newProgress === 100) {
            clearInterval(interval)
          }
          
          return { ...file, progress: newProgress, status: newStatus }
        }
        return file
      }))
    }, 500)
  }

  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = e.dataTransfer.files
    handleFiles(droppedFiles)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const handleUpload = () => {
    if (files.length === 0) return
    
    const completedFiles = files.filter(f => f.status === 'completed')
    if (completedFiles.length === 0) {
      alert('Please wait for files to finish uploading.')
      return
    }

    // Add metadata to files
    const filesWithMetadata = completedFiles.map(f => ({
      ...f,
      category,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }))

    onUpload?.(filesWithMetadata)
    onClose?.()
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-6 h-6" />
    if (file.type.startsWith('video/')) return <Video className="w-6 h-6" />
    return <FileText className="w-6 h-6" />
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Upload Media
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Drop Zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drop files here or click to upload
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Supports images and videos up to {maxFileSize}MB each
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Maximum {maxFiles} files • {acceptedTypes.join(', ')}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleInputChange}
            className="hidden"
          />

          {/* File List */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6"
              >
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Uploaded Files ({files.length})
                </h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {files.map(fileWithPreview => (
                    <motion.div
                      key={fileWithPreview.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      {/* File Icon */}
                      <div className="text-gray-500 dark:text-gray-400">
                        {getFileIcon(fileWithPreview.file)}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {fileWithPreview.file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(fileWithPreview.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      {/* Progress */}
                      <div className="flex items-center space-x-2">
                        {fileWithPreview.status === 'uploading' && (
                          <div className="w-16">
                            <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${fileWithPreview.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {fileWithPreview.status === 'completed' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        
                        <button
                          onClick={() => removeFile(fileWithPreview.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Metadata */}
          {files.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="trading, setup, analysis"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {files.filter(f => f.status === 'completed').length} of {files.length} files ready
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || files.every(f => f.status !== 'completed')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Upload {files.filter(f => f.status === 'completed').length} Files
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}