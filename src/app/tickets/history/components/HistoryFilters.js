import { FiSearch } from 'react-icons/fi'
import { FILTER_OPTIONS } from '../utils/constants'

export const HistoryFilters = ({ 
  filters, 
  onFilterChange, 
  onClear, 
  onApply,
  users,
  isAdmin,
  categories 
}) => {
  const hasActiveFilters = Object.values(filters).some(v => v !== 'ALL' && v !== '')

  return (
    <div className="mt-3 pt-3 border-t border-gray-100" id="filter-panel">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {/* Search */}
        <div className="col-span-1 lg:col-span-2">
          <label className="block text-[7px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">
            Search
          </label>
          <div className="relative">
            <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-2.5 w-2.5" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              placeholder="Ticket #, title..."
              className="w-full pl-6 pr-2 py-1 text-[9px] border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              maxLength={100}
            />
          </div>
        </div>

        {/* Action Type */}
        <div>
          <label className="block text-[7px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">
            Action
          </label>
          <select
            value={filters.actionType}
            onChange={(e) => onFilterChange('actionType', e.target.value)}
            className="w-full px-2 py-1 text-[9px] border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {FILTER_OPTIONS.actionTypes.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[7px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full px-2 py-1 text-[9px] border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-[7px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">
            Date
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange('dateRange', e.target.value)}
            className="w-full px-2 py-1 text-[9px] border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {FILTER_OPTIONS.dateRanges.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* User Filter - Admin only */}
        {isAdmin && (
          <div>
            <label className="block text-[7px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">
              User
            </label>
            <select
              value={filters.userId}
              onChange={(e) => onFilterChange('userId', e.target.value)}
              className="w-full px-2 py-1 text-[9px] border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All users</option>
              {users.slice(0, 20).map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filter actions */}
      <div className="flex justify-end space-x-2 mt-2">
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="px-2 py-0.5 text-[8px] text-gray-600 hover:text-gray-800"
          >
            Clear
          </button>
        )}
        <button
          onClick={onApply}
          className="px-2 py-0.5 bg-blue-600 text-white text-[8px] rounded hover:bg-blue-700"
        >
          Apply
        </button>
      </div>
    </div>
  )
}