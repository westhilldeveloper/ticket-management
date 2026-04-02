// src/app/tickets/new/components/DynamicItemSelector.js
import { useFormContext, useWatch } from 'react-hook-form';
import { useEffect } from 'react';
import { FiAlertCircle } from 'react-icons/fi';

const ITEM_OPTIONS = {
  IT: {
    REQUEST: ['Laptop', 'Printer', 'Monitor', 'Keyboard', 'Mouse', 'Software License'],
    SERVICE: ['Repair', 'Maintenance', 'Virus Removal', 'Data Recovery', 'Network Setup'],
  },
  ADMIN: {
    REQUEST: ['Pen', 'Register Book', 'Notepad', 'Stapler', 'Whiteboard Marker', 'Purchase Request'],
    SERVICE: ['Furniture Repair', 'AC Maintenance', 'Plumbing', 'Electrical Repair'],
  },
  HR: {
    REQUEST: ['Employee ID Card', 'Uniform', 'Training Material', 'Welcome Kit'],
    SERVICE: ['Leave Application', 'Payroll Correction', 'Recruitment Support', 'Policy Clarification'],
  },
};

export default function DynamicItemSelector() {
  const { register, formState: { errors }, setValue, getValues } = useFormContext();
  const mainCategory = useWatch({ name: 'mainCategory' });
  const requestServiceType = useWatch({ name: 'requestServiceType' });
  
  const options = (mainCategory && requestServiceType) 
    ? ITEM_OPTIONS[mainCategory]?.[requestServiceType] || []
    : [];

  // Reset itemType when dependencies change, but after render
  useEffect(() => {
    const currentItemType = getValues('itemType');
    if (currentItemType && options.length > 0 && !options.includes(currentItemType)) {
      setValue('itemType', '');
    } else if (options.length === 0 && currentItemType) {
      setValue('itemType', '');
    }
  }, [mainCategory, requestServiceType, options, setValue, getValues]);

  if (!mainCategory || !requestServiceType) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-sm font-medium text-gray-700 mb-3">
        {requestServiceType === 'REQUEST' ? 'Select Item' : 'Select Service Type'}
        <span className="text-red-500 ml-1">*</span>
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <label key={opt} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value={opt}
              {...register('itemType', { required: `Please select a ${requestServiceType === 'REQUEST' ? 'item' : 'service type'}` })}
              className="mr-2"
            />
            <span className="text-sm">{opt}</span>
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