'use client';

import { useState, useEffect, useRef } from 'react';
import { useFormContext, useController } from 'react-hook-form';
import { FiAlertCircle, FiTag, FiChevronDown } from 'react-icons/fi';
import { CATEGORY_OPTIONS } from '../constants';

export default function CategorySelector() {
  const { control } = useFormContext(); // get control from context
  const { field, fieldState } = useController({
    control,
    name: 'category',
    rules: { required: 'Branch is required' },
    defaultValue: CATEGORY_OPTIONS[1]?.value || '',
  });

  const selectedCategory = field.value;
  const errors = fieldState.error;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const filteredCategories = CATEGORY_OPTIONS.filter(cat =>
    cat.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel =
    CATEGORY_OPTIONS.find(c => c.value === selectedCategory)?.label ||
    'Select Branch';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
        <FiTag className="mr-1.5 h-4 w-4 text-primary-500" />
        Branch
      </h2>

      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          className={`w-full flex items-center justify-between px-3 py-2 border rounded text-sm ${
            errors ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <span className="text-gray-700">{selectedLabel}</span>
          <FiChevronDown className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute left-0 right-0 mt-2 border rounded bg-white shadow-lg z-10 max-h-60 overflow-hidden">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border-b outline-none"
            />
            <div className="max-h-48 overflow-y-auto">
              {filteredCategories.length > 0 ? (
                filteredCategories.map(cat => (
                  <div
                    key={cat.value}
                    onClick={() => {
                      field.onChange(cat.value);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                      selectedCategory === cat.value ? 'bg-primary-50' : ''
                    }`}
                  >
                    {cat.label}
                  </div>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-gray-500">No results found</p>
              )}
            </div>
          </div>
        )}
      </div>

      {errors && (
        <p className="text-xs text-red-600 flex items-center mt-1">
          <FiAlertCircle className="h-3 w-3 mr-1" />
          {errors.message}
        </p>
      )}
    </div>
  );
}