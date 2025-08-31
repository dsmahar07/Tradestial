// Tag Data Service - Handles tag and category management across the app

export interface TagCategory {
  id: string
  name: string
  color: string
}

export interface TagData {
  categories: TagCategory[]
  tags: {
    [categoryId: string]: string[]
  }
}

class TagDataService {
  private static instance: TagDataService
  private data: TagData = {
    categories: [
      { id: 'mistakes', name: 'Mistakes', color: '#ef4444' },
      { id: 'custom', name: 'Custom Tags', color: '#10b981' },
      { id: 'reviewed', name: 'Review Status', color: '#22c55e' }
    ],
    tags: {
      mistakes: [],
      custom: [],
      reviewed: ['Reviewed', 'Not Reviewed']
    }
  }
  
  private listeners: Set<() => void> = new Set()

  public static getInstance(): TagDataService {
    if (!TagDataService.instance) {
      TagDataService.instance = new TagDataService()
    }
    return TagDataService.instance
  }

  // Subscribe to data changes
  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  // Notify all listeners of data changes
  private notify(): void {
    this.listeners.forEach(callback => callback())
  }

  // Get all categories
  public getCategories(): TagCategory[] {
    return [...this.data.categories]
  }

  // Get tags for a specific category
  public getTags(categoryId: string): string[] {
    return [...(this.data.tags[categoryId] || [])]
  }

  // Get all tags data
  public getAllTags(): { [categoryId: string]: string[] } {
    return { ...this.data.tags }
  }

  // Add a new category
  public addCategory(category: Omit<TagCategory, 'id'> & { id?: string }): TagCategory {
    const newCategory: TagCategory = {
      id: category.id || category.name.toLowerCase().replace(/\s+/g, '-'),
      name: category.name,
      color: category.color
    }

    // Check if category already exists
    const exists = this.data.categories.find(cat => cat.id === newCategory.id)
    if (exists) {
      return exists
    }

    this.data.categories.push(newCategory)
    this.data.tags[newCategory.id] = []
    this.notify()
    return newCategory
  }

  // Add a tag to a category
  public addTag(categoryId: string, tag: string): void {
    if (!this.data.tags[categoryId]) {
      this.data.tags[categoryId] = []
    }
    
    if (!this.data.tags[categoryId].includes(tag)) {
      this.data.tags[categoryId].push(tag)
      this.notify()
    }
  }

  // Remove a tag from a category
  public removeTag(categoryId: string, tag: string): void {
    if (this.data.tags[categoryId]) {
      this.data.tags[categoryId] = this.data.tags[categoryId].filter(t => t !== tag)
      this.notify()
    }
  }

  // Update category
  public updateCategory(categoryId: string, updates: Partial<TagCategory>): void {
    const categoryIndex = this.data.categories.findIndex(cat => cat.id === categoryId)
    if (categoryIndex !== -1) {
      this.data.categories[categoryIndex] = { ...this.data.categories[categoryIndex], ...updates }
      this.notify()
    }
  }

  // Remove category
  public removeCategory(categoryId: string): void {
    this.data.categories = this.data.categories.filter(cat => cat.id !== categoryId)
    delete this.data.tags[categoryId]
    this.notify()
  }

  // Get category by id
  public getCategory(categoryId: string): TagCategory | undefined {
    return this.data.categories.find(cat => cat.id === categoryId)
  }
}

export default TagDataService.getInstance()