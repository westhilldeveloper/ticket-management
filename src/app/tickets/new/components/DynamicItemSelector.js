// src/app/tickets/new/components/DynamicItemSelector.js
'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { FiAlertCircle, FiLoader } from 'react-icons/fi';

export default function DynamicItemSelector() {
  const { register, formState: { errors }, setValue, getValues } = useFormContext();
  const mainCategory = useWatch({ name: 'mainCategory' });
  const requestServiceType = useWatch({ name: 'requestServiceType' });
  
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Fetch options whenever mainCategory or requestServiceType changes
  useEffect(() => {
    if (!mainCategory || !requestServiceType) {
      setOptions([]);
      return;
    }

    const fetchOptions = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(
          `/api/item-types?mainCategory=${encodeURIComponent(mainCategory)}&requestServiceType=${encodeURIComponent(requestServiceType)}`
        );
        if (!res.ok) throw new Error('Failed to load options');
        const data = await res.json();
        const items = data.items || [];
        setOptions(items);
        console.log("items====>", items)

        // Reset itemType if current value is no longer in the new options list
        const currentItemType = getValues('itemType');
        if (currentItemType && items.length > 0 && !items.some(item => item.name === currentItemType)) {
          setValue('itemType', '');
        } else if (items.length === 0 && currentItemType) {
          setValue('itemType', '');
        }
      } catch (err) {
        console.error(err);
        setFetchError(err.message);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [mainCategory, requestServiceType, setValue, getValues]);

  // Show nothing until both selections are made
  if (!mainCategory || !requestServiceType) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <FiLoader className="animate-spin mr-2" />
          Loading {requestServiceType === 'REQUEST' ? 'items' : 'services'}...
        </h2>
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-4">
        <p className="text-sm text-red-600">
          Failed to load options. Please refresh the page.
        </p>
      </div>
    );
  }

  // No options available
  if (options.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">
          {requestServiceType === 'REQUEST' ? 'Select Item' : 'Select Service Type'}
        </h2>
        <p className="text-sm text-gray-500">
          No options available for {mainCategory} - {requestServiceType}.
          Please contact admin to add some.
        </p>
      </div>
    );
  }

  // Render radio buttons from fetched options
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-sm font-medium text-gray-700 mb-3">
        {requestServiceType === 'REQUEST' ? 'Select Item' : 'Select Service Type'}
        <span className="text-red-500 ml-1">*</span>
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <label key={opt.id} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value={opt.name}
              {...register('itemType', { 
                required: `Please select a ${requestServiceType === 'REQUEST' ? 'item' : 'service type'}` 
              })}
              className="mr-2"
            />
            <span className="text-sm">{opt.name}</span>
          </label>
        ))}
      </div>
      {errors.itemType && (
        <p className="mt-1 text-xs text-red-600 flex items-center">
          <FiAlertCircle className="h-3 w-3 mr-1" />
          {errors.itemType.message}
        </p>
      )}
    </div>
  );
}