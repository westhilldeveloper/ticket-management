'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { useToast } from '@/app/context/ToastContext'
import DashboardLayout from '@/app/components/layouts/DashboardLayout'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiAlertCircle,
  FiArrowUp,
  FiArrowDown,
  FiSave
} from 'react-icons/fi'

export default function ManageCategoriesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: 0,
    isActive: true
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetchCategories(true)
    }
  }, [user])

  const fetchCategories = async (includeInactive = true) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/dynamic-categories?includeInactive=${includeInactive}`, {
        credentials: 'include'
      })
      const data = await res.json()
      if (res.ok) {
        setCategories(data.categories || [])
      } else {
        toast.error(data.message || 'Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Error loading categories')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        description: category.description || '',
        sortOrder: category.sortOrder,
        isActive: category.isActive
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: '',
        description: '',
        sortOrder: categories.length,
        isActive: true
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setFormData({ name: '', description: '', sortOrder: 0, isActive: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Category name is required')
      return
    }

    setSubmitting(true)
    try {
      const url = editingCategory
        ? `/api/dynamic-categories/${editingCategory.id}`
        : '/api/dynamic-categories'
      const method = editingCategory ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Operation failed')

      toast.success(editingCategory ? 'Category updated' : 'Category created')
      handleCloseModal()
      fetchCategories(true)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (category) => {
    if (!confirm(`Delete category "${category.name}"? This cannot be undone if no tickets use it.`)) return
    try {
      const res = await fetch(`/api/dynamic-categories/${category.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success('Category deleted')
      fetchCategories(true)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleToggleStatus = async (category) => {
    try {
      const res = await fetch(`/api/dynamic-categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...category, isActive: !category.isActive }),
        credentials: 'include'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success(`Category ${category.isActive ? 'deactivated' : 'activated'}`)
      fetchCategories(true)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleReorder = async (id, direction) => {
    const currentIndex = categories.findIndex(c => c.id === id)
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= categories.length) return

    const newCategories = [...categories]
    const temp = newCategories[currentIndex].sortOrder
    newCategories[currentIndex].sortOrder = newCategories[newIndex].sortOrder
    newCategories[newIndex].sortOrder = temp

    setCategories(newCategories)

    try {
      await Promise.all([
        fetch(`/api/dynamic-categories/${newCategories[currentIndex].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: newCategories[currentIndex].sortOrder }),
          credentials: 'include'
        }),
        fetch(`/api/dynamic-categories/${newCategories[newIndex].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: newCategories[newIndex].sortOrder }),
          credentials: 'include'
        })
      ])
      toast.success('Order updated')
    } catch (error) {
      toast.error('Failed to update order, refreshing...')
      fetchCategories(true)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-48">
          <LoadingSpinner size="small" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-3 p-3 md:p-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Manage Categories</h1>
            <p className="text-[10px] text-gray-500 mt-0.5">Create and manage ticket main categories (e.g., IT, HR, Finance)</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-1 px-2 py-1 bg-primary-600 text-white rounded text-[10px] font-medium hover:bg-primary-700"
          >
            <FiPlus className="w-3 h-3" />
            Add Category
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-[10px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium text-gray-500 uppercase">Sort</th>
                <th className="px-2 py-1.5 text-left font-medium text-gray-500 uppercase">Name</th>
                <th className="px-2 py-1.5 text-left font-medium text-gray-500 uppercase">Description</th>
                <th className="px-2 py-1.5 text-left font-medium text-gray-500 uppercase">Status</th>
                <th className="px-2 py-1.5 text-right font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat, idx) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-2 py-1 whitespace-nowrap">
                    <div className="flex space-x-0.5">
                      <button
                        onClick={() => handleReorder(cat.id, 'up')}
                        disabled={idx === 0}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <FiArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleReorder(cat.id, 'down')}
                        disabled={idx === categories.length - 1}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <FiArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap">
                    <div className="font-medium text-gray-900 text-[10px]">{cat.name}</div>
                  </td>
                  <td className="px-2 py-1">
                    <div className="text-gray-500 max-w-xs truncate text-[9px]">{cat.description || '—'}</div>
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap">
                    {cat.isActive ? (
                      <span className="px-1.5 py-0.5 text-[8px] font-medium rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[8px] font-medium rounded-full bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-1.5">
                      <button
                        onClick={() => handleOpenModal(cat)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(cat)}
                        className={cat.isActive ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}
                        title={cat.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {cat.isActive ? <FiXCircle className="w-3.5 h-3.5" /> : <FiCheckCircle className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-2 py-6 text-center text-gray-400 text-[9px]">
                    No categories defined. Click "Add Category" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Compact Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-40 overflow-y-auto h-full w-full z-50">
            <div className="relative top-16 mx-auto p-3 border w-full max-w-sm shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-800">
                  {editingCategory ? 'Edit Category' : 'New Category'}
                </h3>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <FiXCircle className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-2">
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                    className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded focus:outline-none focus:border-primary-300"
                    required
                    placeholder="e.g., Finance, Operations"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="2"
                    className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded"
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded"
                  />
                  <p className="text-[8px] text-gray-400 mt-0.5">Lower numbers appear first</p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-1.5 block text-[10px] text-gray-700">
                    Active (visible in dropdowns)
                  </label>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={handleCloseModal} className="px-2 py-1 border border-gray-200 rounded text-[9px] text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-2 py-1 bg-primary-600 text-white rounded text-[9px] font-medium hover:bg-primary-700 disabled:opacity-50">
                    {submitting ? <LoadingSpinner size="small" /> : (editingCategory ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}