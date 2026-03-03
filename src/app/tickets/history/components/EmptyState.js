import { FiClock } from 'react-icons/fi'

export const EmptyState = ({ hasFilters, onClearFilters }) => {
  return (
    <div className="bg-white rounded border border-gray-200 p-6 text-center">
      <div className="bg-gray-50 rounded-full p-2 mx-auto w-8 h-8 flex items-center justify-center mb-2">
        <FiClock className="h-3 w-3 text-gray-400" />
      </div>
      <h3 className="text-[10px] font-medium text-gray-900 mb-0.5">No history found</h3>
      <p className="text-[8px] text-gray-500 mb-3 max-w-sm mx-auto">
        {hasFilters
          ? 'No activity matches your filters'
          : 'No ticket activity yet'}
      </p>
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="text-[8px] text-blue-600 hover:text-blue-700"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}