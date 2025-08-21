import { useState, useEffect } from 'react'
import TagDataService, { TagCategory } from '@/services/tag-data.service'

export function useTagData() {
  const [categories, setCategories] = useState<TagCategory[]>([])
  const [tags, setTags] = useState<{ [categoryId: string]: string[] }>({})

  useEffect(() => {
    // Initial load
    setCategories(TagDataService.getCategories())
    setTags(TagDataService.getAllTags())

    // Subscribe to changes
    const unsubscribe = TagDataService.subscribe(() => {
      setCategories(TagDataService.getCategories())
      setTags(TagDataService.getAllTags())
    })

    return unsubscribe
  }, [])

  return {
    categories,
    tags,
    addCategory: (category: Omit<TagCategory, 'id'> & { id?: string }) => TagDataService.addCategory(category),
    addTag: (categoryId: string, tag: string) => TagDataService.addTag(categoryId, tag),
    removeTag: (categoryId: string, tag: string) => TagDataService.removeTag(categoryId, tag),
    updateCategory: (categoryId: string, updates: Partial<TagCategory>) => TagDataService.updateCategory(categoryId, updates),
    removeCategory: (categoryId: string) => TagDataService.removeCategory(categoryId),
    getCategory: (categoryId: string) => TagDataService.getCategory(categoryId),
    getTags: (categoryId: string) => TagDataService.getTags(categoryId)
  }
}