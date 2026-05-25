// src/app/tickets/new/components/MainCategorySelector.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { FiAlertCircle, FiGrid, FiRefreshCw, FiCheck, FiFolder } from 'react-icons/fi';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

// Map categories to GIFs (unchanged)
const getCategoryImageSrc = (name) => {
  const imageMap = {
    IT: '/images/it.gif',
    ADMIN: '/images/admin.gif',
    HR: '/images/hr.gif',
    FINANCE: '/images/finance.gif',
    OPERATIONS: '/images/operations.gif',
    SALES: '/images/sales.gif',
    SUPPORT: '/images/suprt.gif',
    SECURITY: '/images/security.gif',
    CHITS: '/images/chits.gif',
  };
  return imageMap[name] || '/images/folder.gif';
};

// European palette – muted, elegant pink/grey tones
const getSelectedBgClass = (isSelected) => {
  if (!isSelected) return 'bg-white';
  return 'bg-pink-50/50'; // very soft, 50% opacity pink
};

export default function MainCategorySelector() {
  const { register, formState: { errors }, setValue } = useFormContext();
  const selected = useWatch({ name: 'mainCategory', defaultValue: '' });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const itemRefs = useRef([]);

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
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (name) => {
    setImageErrors(prev => ({ ...prev, [name]: true }));
  };

  const handleKeyDown = useCallback((e, idx, catName) => {
    const total = categories.length;
    let nextIdx = idx;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIdx = (idx + 1) % total;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIdx = (idx - 1 + total) % total;
        break;
      case ' ':
      case 'Space':
      case 'Enter':
        e.preventDefault();
        setValue('mainCategory', catName, { shouldValidate: true });
        break;
      default:
        return;
    }
    setFocusedIndex(nextIdx);
    itemRefs.current[nextIdx]?.focus();
  }, [categories, setValue]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="medium" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-6">
          <FiAlertCircle className="mx-auto h-10 w-10 text-red-500 mb-3" />
          <p className="text-red-600 text-sm mb-3">{error}</p>
          <button
            onClick={fetchCategories}
            className="text-sm text-pink-600 hover:text-pink-700 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-6 text-gray-500">
          <FiFolder className="mx-auto h-12 w-12 text-gray-300 mb-2" />
          <p>No departments available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header – European style: clear, no decorative corners */}
      <div className="px-6 pt-6 pb-3 border-b shadow-md border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-pink-100 flex items-center justify-center text-pink-600">
            <FiGrid className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Main Department <span className="text-pink-500 text-sm">*</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select the department responsible for your request
            </p>
          </div>
        </div>
      </div>

      {/* Radio group – clean grid, subtle cards */}
      <div className="p-6">
        <div
          role="radiogroup"
          aria-label="Departments"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {categories.map((cat, idx) => {
            const isSelected = selected === cat.name;
            const hasError = imageErrors[cat.name];
            const imageSrc = getCategoryImageSrc(cat.name);

            return (
              <div
                key={cat.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={focusedIndex === idx ? 0 : -1}
                ref={el => (itemRefs.current[idx] = el)}
                onClick={() => setValue('mainCategory', cat.name, { shouldValidate: true })}
                onKeyDown={e => handleKeyDown(e, idx, cat.name)}
                onFocus={() => setFocusedIndex(idx)}
                className={`
                  relative cursor-pointer rounded-lg border p-4 transition-all duration-150
                  ${getSelectedBgClass(isSelected)}
                  ${isSelected
                    ? 'border-pink-300 ring-1 ring-pink-300'
                    : 'border-gray-200 hover:border-pink-200 hover:bg-gray-50'
                  }
                  focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-1
                `}
              >
                <div className="flex flex-col items-center text-center">
                  {/* Image */}
                  <div className="w-16 h-16 mb-2 flex items-center justify-center">
                    {!hasError ? (
                      <img
                        src={imageSrc}
                        alt=""
                        className="max-w-full max-h-full object-contain"
                        onError={() => handleImageError(cat.name)}
                      />
                    ) : (
                      <FiFolder className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  {/* Name */}
                  <span className="text-sm font-medium text-gray-800">{cat.name}</span>

                  {/* Optional description */}
                  {cat.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-[140px]">
                      {cat.description}
                    </p>
                  )}

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <FiCheck className="w-4 h-4 text-pink-600" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error messaging */}
        {errors.mainCategory && (
          <div className="mt-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-md border border-red-100">
            <FiAlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{errors.mainCategory.message}</span>
          </div>
        )}

        {/* Keyboard hint – European accessibility */}
        {/* <p className="text-xs text-gray-400 mt-4 text-center">
          Use arrow keys to move, Enter or Space to select
        </p> */}
      </div>
    </div>
  );
}