// src/app/tickets/new/components/MainCategorySelector.js
import { useState, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { FiAlertCircle, FiGrid, FiRefreshCw } from 'react-icons/fi';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

// Default icons for categories (you can expand or make dynamic later)
const getCategoryIcon = (name) => {
  const icons = {
    IT: '💻',
    ADMIN: '📋',
    HR: '👥',
    FINANCE: '💰',
    OPERATIONS: '⚙️',
    SALES: '📈',
    MARKETING: '📢',
    CHITS: '💵'
  };
  return icons[name] || '📁';
};

export default function MainCategorySelector() {
  const { register, formState: { errors } } = useFormContext();
  const selected = useWatch({ name: 'mainCategory', defaultValue: '' });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/dynamic-categories?includeInactive=false', {
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to load categories');
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <FiGrid className="mr-1.5 h-4 w-4 text-primary-500" />
          Main Category <span className="text-red-500 ml-1">*</span>
        </h2>
        <div className="flex justify-center py-6">
          <LoadingSpinner size="small" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <FiGrid className="mr-1.5 h-4 w-4 text-primary-500" />
          Main Category <span className="text-red-500 ml-1">*</span>
        </h2>
        <div className="text-center py-4">
          <p className="text-red-600 text-sm mb-2">{error}</p>
          <button
            onClick={fetchCategories}
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
          >
            <FiRefreshCw className="mr-1 h-3 w-3" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <FiGrid className="mr-1.5 h-4 w-4 text-primary-500" />
          Main Category <span className="text-red-500 ml-1">*</span>
        </h2>
        <div className="text-center py-4 text-gray-500 text-sm">
          No categories available. Please contact administrator.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
        <FiGrid className="mr-1.5 h-4 w-4 text-primary-500" />
        Main Category <span className="text-red-500 ml-1">*</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {categories.map((cat) => (
          <label
            key={cat.id}
            className={`flex flex-col items-center p-2 border rounded cursor-pointer transition-colors ${
              selected === cat.name
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              value={cat.name}
              checked={selected === cat.name}
              {...register('mainCategory', { required: 'Main category is required' })}
              className="sr-only"
            />
            <span className="text-2xl">{getCategoryIcon(cat.name)}</span>
            <span className="text-sm font-medium mt-1">{cat.name}</span>
            <span className="text-xs text-gray-500 text-center">{cat.description || 'No description'}</span>
          </label>
        ))}
      </div>
      {errors.mainCategory && (
        <p className="mt-1 text-xs text-red-600 flex items-center">
          <FiAlertCircle className="h-3 w-3 mr-1" />
          {errors.mainCategory.message}
        </p>
      )}
    </div>
  );
}