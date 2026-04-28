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
  const [isSaving, setIsSaving] = useState(false); // 👈 new state for add form
  const [formData, setFormData] = useState({
    name: '',
    categoryName: 'ADMIN',
    type: 'REQUEST',
    sortOrder: 0
  });
  const toast = useToast();
 
  // Fetch all item types and categories
  const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const itemsRes = await fetch('/api/admin/item-types');
    if (!itemsRes.ok) throw new Error(`HTTP ${itemsRes.status}`);
    const itemsData = await itemsRes.json();
   
    // Ensure array
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
    setItems([]);   // fallback to empty array
    setCategories([]);
  } finally {
    setLoading(false);
  }
}, [toast]);
console.log("categories=====>",categories)
 console.log("itemdata===>", items);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add new item type
  console.log("form data====>",formData)
  const handleAdd = async (e) => {
    e.preventDefault();
    if (isSaving) return; // prevent double submission

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

  // Update item type
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

  // Toggle active status
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

  // Hard delete
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
          <FiLoader className="animate-spin h-8 w-8 text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Item Types</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure items and services for each category (IT, Admin, HR)
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <FiPlus /> Add New
          </button>
        </div>

        {/* Add Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Add Item / Service</h2>
              <form onSubmit={handleAdd}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    className="w-full px-3 py-2 border rounded"
                    value={formData.categoryName}
                    onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select
                    className="w-full px-3 py-2 border rounded"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="REQUEST">Request (item)</option>
                    <option value="SERVICE">Service</option>
                  </select>
                </div>
                {/* <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Sort Order</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div> */}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <FiLoader className="animate-spin h-4 w-4" />
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

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sort</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        defaultValue={item.name}
                        className="border rounded px-2 py-1"
                        onBlur={(e) => handleUpdate(item.id, { name: e.target.value })}
                        autoFocus
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.type === 'REQUEST' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {item.type === 'REQUEST' ? 'Request' : 'Service'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sortOrder}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(item.id, item.isActive)}
                      className={`px-2 py-1 rounded-full text-xs ${
                        item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => setEditingId(item.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <FiEdit2 className="inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FiTrash2 className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}