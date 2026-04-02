// src/app/tickets/new/components/RequestServiceSelector.js
import { useFormContext } from 'react-hook-form';
import { FiAlertCircle, FiTool, FiShoppingCart } from 'react-icons/fi';

export default function RequestServiceSelector() {
  const { register, watch, formState: { errors } } = useFormContext();
  const selected = watch('requestServiceType');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
        Request or Service <span className="text-red-500 ml-1">*</span>
      </h2>
      <div className="flex gap-3">
        <label
          className={`flex-1 flex items-center justify-center gap-2 p-2 border rounded cursor-pointer ${
            selected === 'REQUEST' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
          }`}
        >
          <input
            type="radio"
            value="REQUEST"
            {...register('requestServiceType', { required: 'Please select Request or Service' })}
            className="sr-only"
          />
          <FiShoppingCart className="h-4 w-4" />
          <span className="text-sm">Request (new item)</span>
        </label>
        <label
          className={`flex-1 flex items-center justify-center gap-2 p-2 border rounded cursor-pointer ${
            selected === 'SERVICE' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
          }`}
        >
          <input
            type="radio"
            value="SERVICE"
            {...register('requestServiceType', { required: true })}
            className="sr-only"
          />
          <FiTool className="h-4 w-4" />
          <span className="text-sm">Service (repair/maintenance)</span>
        </label>
      </div>
      {errors.requestServiceType && (
        <p className="mt-1 text-xs text-red-600 flex items-center">
          <FiAlertCircle className="h-3 w-3 mr-1" />
          {errors.requestServiceType.message}
        </p>
      )}
    </div>
  );
}