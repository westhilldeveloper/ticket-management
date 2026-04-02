// src/app/tickets/new/components/MainCategorySelector.js
import { useFormContext, useWatch } from 'react-hook-form';
import { FiAlertCircle, FiGrid } from 'react-icons/fi';

const MAIN_CATEGORIES = [
  { value: 'IT', label: 'IT', icon: '💻', description: 'Hardware, software, network' },
  { value: 'ADMIN', label: 'Admin', icon: '📋', description: 'Office supplies, purchase requests' },
  { value: 'HR', label: 'HR', icon: '👥', description: 'Leave, payroll, recruitment' },
];

export default function MainCategorySelector() {
  const { register, watch, formState: { errors } } = useFormContext();
  const selected = useWatch({ name: 'mainCategory', defaultValue: '' });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
        <FiGrid className="mr-1.5 h-4 w-4 text-primary-500" />
        Main Category <span className="text-red-500 ml-1">*</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {MAIN_CATEGORIES.map((cat) => (
          <label
            key={cat.value}
            className={`flex flex-col items-center p-2 border rounded cursor-pointer transition-colors ${
              selected === cat.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              value={cat.value}
              checked={selected === cat.value}
              {...register('mainCategory', { required: 'Main category is required' })}
              className="sr-only"
            />
            <span className="text-2xl">{cat.icon}</span>
            <span className="text-sm font-medium mt-1">{cat.label}</span>
            <span className="text-xs text-gray-500 text-center">{cat.description}</span>
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