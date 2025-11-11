'use client'

import { useState, useEffect } from 'react'
import { Tag, Plus, Edit, Trash2, BookOpen, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface Category {
  id: string
  name: string
  description: string | null
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function GameCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newCategory.trim()) return

    try {
      setSaving(true)
      setError(null)
      const response = await fetch('/api/quiz/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategory.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add category')
      }

      const data = await response.json()
      setCategories([...categories, data.category])
      setNewCategory('')
    } catch (error) {
      console.error('Error adding category:', error)
      setError(error instanceof Error ? error.message : 'Failed to add category')
      alert(error instanceof Error ? error.message : 'Failed to add category')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setEditValue(category.name)
  }

  const handleSave = async (categoryId: string) => {
    if (!editValue.trim()) {
      setEditingId(null)
      return
    }

    try {
      setSaving(true)
      setError(null)
      const response = await fetch(`/api/quiz/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editValue.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update category')
      }

      const data = await response.json()
      setCategories(categories.map((cat) => (cat.id === categoryId ? data.category : cat)))
      setEditingId(null)
      setEditValue('')
    } catch (error) {
      console.error('Error updating category:', error)
      setError(error instanceof Error ? error.message : 'Failed to update category')
      alert(error instanceof Error ? error.message : 'Failed to update category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      const response = await fetch(`/api/quiz/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete category')
      }

      setCategories(categories.filter((cat) => cat.id !== categoryId))
    } catch (error) {
      console.error('Error deleting category:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete category')
      alert(error instanceof Error ? error.message : 'Failed to delete category')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Game Categories
          </h1>
          <p className="text-gray-600 mt-2">Manage question categories for the quiz game</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BookOpen className="w-4 h-4" />
          <span>{categories.length} categories</span>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {/* Add Category */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200"
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" />
          Add New Category
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !saving && handleAdd()}
            placeholder="Enter category name..."
            disabled={saving}
            className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newCategory.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add
          </button>
        </div>
      </motion.div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300"
        >
          <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-semibold">No categories yet</p>
          <p className="text-gray-500 text-sm mt-2">Add your first category to get started</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.05 }}
              className="bg-white p-5 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all group"
            >
              {editingId === category.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !saving) {
                        handleSave(category.id)
                      } else if (e.key === 'Escape') {
                        setEditingId(null)
                        setEditValue('')
                      }
                    }}
                    disabled={saving}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(category.id)}
                      disabled={saving}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null)
                        setEditValue('')
                      }}
                      disabled={saving}
                      className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Tag className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-800 block">{category.name}</span>
                      {!category.is_active && (
                        <span className="text-xs text-gray-500">Inactive</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(category)}
                      disabled={saving}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
                      disabled={saving}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
