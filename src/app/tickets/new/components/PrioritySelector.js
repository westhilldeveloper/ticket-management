import { useFormContext } from 'react-hook-form';
import { FiAlertCircle, FiBarChart2 } from 'react-icons/fi';
import { PRIORITY_OPTIONS } from '../constants';

export default function PrioritySelector() {
  const { register, formState: { errors }, watch } = useFormContext();
  const selectedPriority = watch('priority');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
        <FiBarChart2 className="mr-1.5 h-4 w-4 text-primary-500" />
        Priority
      </h2>
      
      <div className="space-y-2">
        {PRIORITY_OPTIONS.map((priority) => (
          <label
            key={priority.value}
            className={`flex items-center p-2 border rounded cursor-pointer transition-colors ${
              selectedPriority === priority.value
                ? priority.color
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              value={priority.value}
              {...register('priority', { required: 'Priority is required' })}
              className="sr-only"
            />
            <span className="mr-2 text-xs font-mono">{priority.badge}</span>
            <div className="flex-1">
              <p className="text-xs font-medium">{priority.label}</p>
              <p className="text-xs text-gray-500">{priority.description}</p>
            </div>
          </label>
        ))}
        {errors.priority && (
          <p className="text-xs text-red-600 flex items-center mt-1">
            <FiAlertCircle className="h-3 w-3 mr-1" />
            {errors.priority.message}
          </p>
        )}
      </div>
    </div>
  );
}