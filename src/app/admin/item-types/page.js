'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import { useToast } from '@/app/context/ToastContext';
import { FiPlus, FiEdit2, FiTrash2, FiLoader } from 'react-icons/fi';

export default function ManageItemTypes() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    categoryName: 'ADMIN',
    type: 'REQUEST',
    sortOrder: 0
  });
  const [filters, setFilters] = useState({
    category: 'ALL',
    type: 'ALL'
  });
  const toast = useToast();

  // Fetch all item types and categories
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const itemsRes = await fetch('/api/admin/item-types');
      if (!itemsRes.ok) throw new Error(`HTTP ${itemsRes.status}`);
      const itemsData = await itemsRes.json();
      const itemsArray = Array.isArray(itemsData) ? itemsData : (itemsData.items || []);
      setItems(itemsArray);

      const catsRes = await fetch('/api/dynamic-categories');
      if (!catsRes.ok) throw new Error(`HTTP ${catsRes.status}`);
      const catsData = await catsRes.json();
      const catsArray = Array.isArray(catsData) ? catsData : (catsData.categories || []);
      setCategories(catsArray);
    } catch (error) {
      console.log('Error fetching data:', error);
      toast.error('Failed to load data');
      setItems([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute filtered and grouped data
  const filteredItems = items.filter(item => {
    const categoryMatch = filters.category === 'ALL' || item.category?.name === filters.category;
    const typeMatch = filters.type === 'ALL' || item.type === filters.type;
    return categoryMatch && typeMatch;
  });

  // Group by category name
  const groupedItems = filteredItems.reduce((acc, item) => {
    const catName = item.category?.name || 'Uncategorized';
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(item);
    return acc;
  }, {});

  // Sort groups by category name
  const sortedGroupKeys = Object.keys(groupedItems).sort();

  const handleAdd = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/item-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success('Item type added successfully');
        setShowAddForm(false);
        setFormData({ name: '', categoryName: 'ADMIN', type: 'REQUEST', sortOrder: 0 });
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to add item type');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (id, updatedData) => {
    try {
      const res = await fetch(`/api/admin/item-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        toast.success('Item type updated');
        setEditingId(null);
        fetchData();
      } else {
        toast.error('Update failed');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      const res = await fetch(`/api/admin/item-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      });
      if (res.ok) {
        toast.success(`Item ${!currentActive ? 'activated' : 'deactivated'}`);
        fetchData();
      } else {
        toast.error('Operation failed');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/item-types/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        toast.success('Item type deleted');
        fetchData();
      } else {
        toast.error('Delete failed');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <FiLoader className="animate-spin h-6 w-6 text-gray-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-5 max-w-[1400px] mx-auto text-sm">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-800 tracking-tight">Manage Item Types</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure items and services for each category (IT, Admin, HR)
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            <FiPlus className="w-3.5 h-3.5" /> Add New
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className='border p-2 rounded-md'>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select
                className="w-full rounded-md border-gray-300 text-xs py-1.5 px-2 focus:ring-gray-400 focus:border-gray-400"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="ALL">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className='border p-2 rounded-md'>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                className="w-full rounded-md border-gray-300 text-xs py-1.5 px-2 focus:ring-gray-400 focus:border-gray-400"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="ALL">All Types</option>
                <option value="REQUEST">Request</option>
                <option value="SERVICE">Service</option>
              </select>
            </div>
          </div>
        </div>

        {/* Add Form Modal (unchanged) */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-5 w-full max-w-md border border-gray-200 shadow-lg">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Add Item / Service</h2>
              <form onSubmit={handleAdd}>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                  <input
  type="text"
  required
  className="w-full rounded-md border border-gray-300 text-xs py-1.5 px-2 focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
  value={formData.name}
  onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
/>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                  <select
                    className="w-full rounded-md border border-gray-300 text-xs py-1.5 px-2 focus:ring-none focus:border-gray-400"
                    value={formData.categoryName}
                    onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
                  <select
                    className="w-full rounded-md border border-gray-300 text-xs py-1.5 px-2 focus:ring-none focus:border-gray-400"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="REQUEST">Request (item)</option>
                    <option value="SERVICE">Service</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <FiLoader className="animate-spin h-3.5 w-3.5" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Grouped Items Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {sortedGroupKeys.length === 0 ? (
            <div className="px-3 py-6 text-center text-gray-400 text-xs">
              No items match the current filters.
            </div>
          ) : (
            sortedGroupKeys.map(categoryName => (
              <div key={categoryName}>
                {/* Category Header */}
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">{categoryName}</h3>
                </div>
                {/* Table for this category */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 text-xs">
                    <thead className="bg-white text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Name</th>
                        <th className="px-3 py-2 text-left font-medium">Type</th>
                        <th className="px-3 py-2 text-left font-medium">Sort</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                        <th className="px-3 py-2 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {groupedItems[categoryName].map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-800">
                            {editingId === item.id ? (
                              <input
                                type="text"
                                defaultValue={item.name}
                                className="rounded border-gray-300 text-xs py-1 px-2 w-full"
                                onBlur={(e) => handleUpdate(item.id, { name: e.target.value })}
                                autoFocus
                              />
                            ) : (
                              item.name
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              item.type === 'REQUEST' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                            }`}>
                              {item.type === 'REQUEST' ? 'Request' : 'Service'}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-500">{item.sortOrder}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleActive(item.id, item.isActive)}
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                item.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {item.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap space-x-2">
                            <button
                              onClick={() => setEditingId(item.id)}
                              className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              <FiEdit2 className="inline w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-gray-500 hover:text-red-600 transition-colors"
                            >
                              <FiTrash2 className="inline w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}