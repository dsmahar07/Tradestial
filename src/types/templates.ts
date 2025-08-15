export interface TemplateField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'time' | 'checkbox' | 'currency'
  placeholder?: string
  required?: boolean
  options?: string[] // For select type
  defaultValue?: string | number | boolean
}

export interface TradeJournalingTemplate {
  id: string
  name: string
  description: string
  icon: string
  color: string
  category: 'daily' | 'trade' | 'analysis' | 'review' | 'custom'
  fields: TemplateField[]
  isCustomizable: boolean
  tags: string[]
}

export interface TemplateInstance {
  templateId: string
  customFields?: TemplateField[]
  fieldValues: Record<string, any>
}

// Extend the Note interface to include template information
export interface TemplateNote {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  folder: string
  tags: string[]
  color?: string
  template?: TemplateInstance
}