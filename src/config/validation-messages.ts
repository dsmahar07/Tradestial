/**
 * Centralized validation messages and form constants
 * Replaces hardcoded validation text throughout the application
 */

export interface ValidationMessages {
  required: {
    generic: string
    field: (fieldName: string) => string
    email: string
    password: string
    confirmPassword: string
  }
  invalid: {
    email: string
    password: string
    url: string
    number: string
    date: string
  }
  length: {
    min: (fieldName: string, min: number) => string
    max: (fieldName: string, max: number) => string
    exact: (fieldName: string, length: number) => string
  }
  match: {
    password: string
  }
  common: {
    pleaseWait: string
    processing: string
    saving: string
    loading: string
  }
}

/**
 * Default validation messages
 */
export const validationMessages: ValidationMessages = {
  required: {
    generic: 'This field is required',
    field: (fieldName: string) => `${fieldName} is required`,
    email: 'Email address is required',
    password: 'Password is required',
    confirmPassword: 'Please confirm your password'
  },
  invalid: {
    email: 'Please enter a valid email address',
    password: 'Password must be at least 8 characters long',
    url: 'Please enter a valid URL',
    number: 'Please enter a valid number',
    date: 'Please enter a valid date'
  },
  length: {
    min: (fieldName: string, min: number) => `${fieldName} must be at least ${min} characters long`,
    max: (fieldName: string, max: number) => `${fieldName} must not exceed ${max} characters`,
    exact: (fieldName: string, length: number) => `${fieldName} must be exactly ${length} characters`
  },
  match: {
    password: 'Passwords do not match'
  },
  common: {
    pleaseWait: 'Please wait...',
    processing: 'Processing...',
    saving: 'Saving...',
    loading: 'Loading...'
  }
}

/**
 * Form placeholder text constants
 */
export const placeholders = {
  text: {
    generic: 'Enter text...',
    search: 'Search...',
    name: 'Enter name...',
    title: 'Enter title...',
    description: 'Enter description...',
    notes: 'Enter some text...',
    tags: 'Enter tag name...',
    url: 'Enter URL...',
    email: 'Enter email address...'
  },
  trading: {
    symbol: 'Enter symbol (e.g., AAPL)',
    strategy: 'Enter strategy name...',
    rule: 'Enter trading rule (e.g., Price above VWAP)',
    model: 'Enter your model name (e.g., ICT 2024 Strategy)',
    notes: 'Enter trade notes...',
    tags: 'Enter trade tags...'
  },
  forms: {
    firstName: 'First name',
    lastName: 'Last name',
    company: 'Company name',
    phone: 'Phone number',
    message: 'Enter your message...'
  }
}

/**
 * Success messages
 */
export const successMessages = {
  save: 'Successfully saved!',
  create: 'Successfully created!',
  update: 'Successfully updated!',
  delete: 'Successfully deleted!',
  upload: 'Successfully uploaded!',
  import: 'Successfully imported!',
  export: 'Successfully exported!'
}

/**
 * Error messages
 */
export const errorMessages = {
  generic: 'An error occurred. Please try again.',
  network: 'Network error. Please check your connection.',
  server: 'Server error. Please try again later.',
  notFound: 'The requested item was not found.',
  unauthorized: 'You are not authorized to perform this action.',
  validation: 'Please check your input and try again.',
  upload: 'Failed to upload file. Please try again.',
  timeout: 'Request timed out. Please try again.'
}

/**
 * Helper function to get field validation message
 */
export const getFieldValidationMessage = (
  fieldName: string,
  type: 'required' | 'invalid' | 'minLength' | 'maxLength',
  options?: { min?: number; max?: number }
) => {
  switch (type) {
    case 'required':
      return validationMessages.required.field(fieldName)
    case 'invalid':
      return `Please enter a valid ${fieldName.toLowerCase()}`
    case 'minLength':
      return options?.min 
        ? validationMessages.length.min(fieldName, options.min)
        : `${fieldName} is too short`
    case 'maxLength':
      return options?.max 
        ? validationMessages.length.max(fieldName, options.max)
        : `${fieldName} is too long`
    default:
      return validationMessages.required.generic
  }
}