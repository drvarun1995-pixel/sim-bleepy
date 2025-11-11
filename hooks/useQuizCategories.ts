import { useState, useEffect } from 'react'

interface Category {
  id: string
  name: string
  description: string | null
  order_index: number
  is_active: boolean
}

export function useQuizCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/quiz/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      // Filter only active categories and sort by order_index
      const activeCategories = (data.categories || [])
        .filter((cat: Category) => cat.is_active)
        .sort((a: Category, b: Category) => a.order_index - b.order_index)
      setCategories(activeCategories)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError(error instanceof Error ? error.message : 'Failed to load categories')
      // Fallback to empty array if API fails
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  return { categories, loading, error, refetch: fetchCategories }
}

