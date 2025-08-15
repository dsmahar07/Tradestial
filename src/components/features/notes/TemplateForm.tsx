'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { TradeJournalingTemplate, TemplateField, TemplateInstance } from '@/types/templates'
import { Plus, Minus, Save, X, Settings, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { validationMessages, getFieldValidationMessage } from '@/config/validation-messages'

interface TemplateFormProps {
  template: TradeJournalingTemplate
  instance?: TemplateInstance
  onSave: (templateInstance: TemplateInstance, generatedContent: string) => void
  onCancel?: () => void
}

export function TemplateForm({ template, instance, onSave, onCancel }: TemplateFormProps) {
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({})
  const [customFields, setCustomFields] = useState<TemplateField[]>([])
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize field values with defaults
  useEffect(() => {
    const initialValues: Record<string, any> = {}
    
    // Set default values from template
    template.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        initialValues[field.id] = field.defaultValue
      }
    })
    
    // Override with instance values if editing
    if (instance) {
      Object.assign(initialValues, instance.fieldValues)
      setCustomFields(instance.customFields || [])
    }
    
    setFieldValues(initialValues)
  }, [template, instance])

  const handleFieldChange = (fieldId: string, value: any) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }))
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }))
    }
  }

  const addCustomField = () => {
    const newField: TemplateField = {
      id: `custom-${Date.now()}`,
      label: 'Custom Field',
      type: 'text',
      placeholder: 'Enter value...',
      required: false
    }
    setCustomFields(prev => [...prev, newField])
  }

  const removeCustomField = (fieldId: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== fieldId))
    setFieldValues(prev => {
      const newValues = { ...prev }
      delete newValues[fieldId]
      return newValues
    })
  }

  const updateCustomField = (fieldId: string, updates: Partial<TemplateField>) => {
    setCustomFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    // Validate required fields
    const allFields = [...template.fields, ...customFields]
    allFields.forEach(field => {
      if (field.required && (!fieldValues[field.id] || fieldValues[field.id] === '')) {
        newErrors[field.id] = getFieldValidationMessage(field.label, 'required')
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateContent = (): string => {
    const allFields = [...template.fields, ...customFields]
    let content = `# ${template.name}\n\n`
    
    // Add template description
    content += `*${template.description}*\n\n---\n\n`
    
    allFields.forEach(field => {
      const value = fieldValues[field.id]
      if (value !== undefined && value !== '' && value !== null) {
        content += `## ${field.label}\n`
        
        if (field.type === 'textarea') {
          content += `${value}\n\n`
        } else if (field.type === 'checkbox') {
          content += `${value ? '✅ Yes' : '❌ No'}\n\n`
        } else if (field.type === 'currency') {
          const formattedValue = typeof value === 'number' ? value.toFixed(2) : parseFloat(value || '0').toFixed(2)
          content += `$${formattedValue}\n\n`
        } else if (field.type === 'select') {
          content += `**${value}**\n\n`
        } else if (field.type === 'date') {
          const date = new Date(value)
          content += `${date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}\n\n`
        } else if (field.type === 'time') {
          content += `${value}\n\n`
        } else {
          content += `${value}\n\n`
        }
      }
    })
    
    // Add footer with generation info
    content += `---\n\n*Generated from ${template.name} template on ${new Date().toLocaleDateString('en-US')}*`
    
    return content
  }

  const handleSave = () => {
    if (!validateForm()) {
      return
    }
    
    const templateInstance: TemplateInstance = {
      templateId: template.id,
      customFields: customFields.length > 0 ? customFields : undefined,
      fieldValues
    }
    
    const generatedContent = generateContent()
    onSave(templateInstance, generatedContent)
  }

  const renderField = (field: TemplateField, isCustom = false) => {
    const value = fieldValues[field.id] || ''
    const hasError = !!errors[field.id]

    return (
      <motion.div
        key={field.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "space-y-2 p-3 rounded-lg",
          isCustom ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" : "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
        )}
      >
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {isCustom && isCustomizing && (
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateCustomField(field.id, { 
                  label: prompt('Enter field label:', field.label) || field.label 
                })}
              >
                <Edit3 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeCustomField(field.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Minus className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {field.type === 'text' && (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
              hasError ? "border-red-500" : "border-gray-300 dark:border-gray-600",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            )}
          />
        )}

        {field.type === 'textarea' && (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none",
              hasError ? "border-red-500" : "border-gray-300 dark:border-gray-600",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            )}
          />
        )}

        {field.type === 'number' && (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
              hasError ? "border-red-500" : "border-gray-300 dark:border-gray-600",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            )}
          />
        )}

        {field.type === 'currency' && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
              placeholder={field.placeholder}
              className={cn(
                "w-full pl-6 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                hasError ? "border-red-500" : "border-gray-300 dark:border-gray-600",
                "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              )}
            />
          </div>
        )}

        {field.type === 'select' && (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
              hasError ? "border-red-500" : "border-gray-300 dark:border-gray-600",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            )}
          >
            <option value="">{field.placeholder || 'Select an option'}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )}

        {field.type === 'date' && (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
              hasError ? "border-red-500" : "border-gray-300 dark:border-gray-600",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            )}
          />
        )}

        {field.type === 'time' && (
          <input
            type="time"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
              hasError ? "border-red-500" : "border-gray-300 dark:border-gray-600",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            )}
          />
        )}

        {field.type === 'checkbox' && (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {field.placeholder || 'Check if applicable'}
            </span>
          </label>
        )}

        {hasError && (
          <p className="text-sm text-red-500">{errors[field.id]}</p>
        )}
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div 
            className="flex items-center justify-center w-10 h-10 rounded-lg text-xl"
            style={{ backgroundColor: template.color + '20', color: template.color }}
          >
            {template.icon}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{template.name}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
          </div>
        </div>
        
        {template.isCustomizable && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={cn(
              "transition-colors",
              isCustomizing && "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
            )}
          >
            <Settings className="w-4 h-4 mr-2" />
            Customize
          </Button>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {template.fields.map(field => renderField(field))}
        
        {customFields.map(field => renderField(field, true))}
        
        {isCustomizing && (
          <Button
            variant="outline"
            onClick={addCustomField}
            className="w-full border-dashed border-2 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Field
          </Button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Save Note
        </Button>
      </div>
    </div>
  )
}