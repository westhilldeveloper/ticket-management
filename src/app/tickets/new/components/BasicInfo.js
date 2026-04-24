// src/app/tickets/new/components/BasicInfo.js

import { useFormContext } from 'react-hook-form';
import { FiAlertCircle, FiHelpCircle } from 'react-icons/fi';

export default function BasicInfo() {
  const { register, formState: { errors }, watch } = useFormContext();
  // const title = watch('title');
  const description = watch('description');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
        <FiHelpCircle className="mr-1.5 h-4 w-4 text-primary-500" />
        Basic Information
      </h2>
      
      {/* Title */}
      {/* <div className="mb-3">
        <label htmlFor="title" className="block text-xs font-medium text-gray-600 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          {...register('title', { 
            required: 'Title is required',
            minLength: { value: 5, message: 'Min 5 characters' },
            maxLength: { value: 100, message: 'Max 100 characters' }
          })}
          className={`w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Unable to access email"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-600 flex items-center">
            <FiAlertCircle className="h-3 w-3 mr-1" />
            {errors.title.message}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          {title?.length || 0}/100
        </p>
      </div> */}

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-xs font-medium text-gray-600 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          {...register('description', { 
            required: 'Description is required',
            minLength: { value: 10, message: 'Min 10 characters' }
          })}
          rows={4}
          className={`w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Describe your issue in detail..."
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600 flex items-center">
            <FiAlertCircle className="h-3 w-3 mr-1" />
            {errors.description.message}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          {description?.length || 0}/5000
        </p>
      </div>
    </div>
  );
}