import { FiClock, FiDownload, FiFilter, FiGrid, FiList } from 'react-icons/fi'
import { getRoleBadge } from '../utils/helpers'
import { formatMostActiveDay } from '../utils/dateUtils'
import { StatsSkeleton } from './LoadingSkeletons'

export const HistoryHeader = ({ 
  user, 
  stats, 
  loading, 
  viewMode, 
  onViewModeChange,
  onToggleFilters,
  onExport,
  showFilters,
  hasFilters,
  canExport,
  exportLoading,
  historyLength
}) => {
  const roleBadge = getRoleBadge(user?.role)

  return (
    <div className="bg-white rounded border border-gray-200 p-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-sm font-medium text-gray-900 flex items-center">
            <FiClock className="mr-1.5 text-blue-600 h-3.5 w-3.5" />
            History
          </h1>
          <p className="text-[9px] text-gray-500 mt-0.5 flex items-center flex-wrap gap-1">
            <span>Activity</span>
            <span className={`inline-flex items-center px-1 py-0.5 rounded text-[8px] font-medium ${roleBadge.bg} ${roleBadge.text}`}>
              {roleBadge.label}
            </span>
          </p>
        </div>
        
        <div className="flex items-center space-x-1.5 mt-2 sm:mt-0">
          {/* View mode toggle */}
          <div className="flex bg-gray-100 rounded p-0.5">
            <button
              onClick={() => onViewModeChange('timeline')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'timeline' 
                  ? 'bg-white shadow-sm text-gray-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Timeline"
            >
              <FiList className="h-3 w-3" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white shadow-sm text-gray-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid"
            >
              <FiGrid className="h-3 w-3" />
            </button>
          </div>

          <button
            onClick={onToggleFilters}
            className={`flex items-center px-2 py-1 text-[9px] rounded transition-colors ${
              showFilters || hasFilters
                ? 'bg-blue-50 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-expanded={showFilters}
            aria-label={showFilters ? 'Hide filters' : 'Show filters'}
          >
            <FiFilter className="mr-1 h-2.5 w-2.5" />
            Filters
            {hasFilters && (
              <span className="ml-1 h-1 w-1 rounded-full bg-blue-600" />
            )}
          </button>
          
          {canExport && (
            <button
              onClick={onExport}
              disabled={exportLoading || historyLength === 0}
              className="flex items-center px-2 py-1 bg-blue-600 text-white text-[9px] rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export CSV"
            >
              {exportLoading ? (
                <span className="h-2.5 w-2.5 animate-spin">⋯</span>
              ) : (
                <FiDownload className="mr-1 h-2.5 w-2.5" />
              )}
              Export
            </button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      {!loading && historyLength > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-3">
          <div className="bg-gray-50 rounded p-1.5">
            <p className="text-[7px] text-gray-500 uppercase tracking-wider">Actions</p>
            <p className="text-xs font-medium text-gray-900">{stats.totalActions}</p>
          </div>
          <div className="bg-gray-50 rounded p-1.5">
            <p className="text-[7px] text-gray-500 uppercase tracking-wider">Tickets</p>
            <p className="text-xs font-medium text-gray-900">{stats.uniqueTickets}</p>
          </div>
          <div className="bg-gray-50 rounded p-1.5">
            <p className="text-[7px] text-gray-500 uppercase tracking-wider">Peak</p>
            <p className="text-[9px] font-medium text-gray-900 truncate">
              {formatMostActiveDay(stats.mostActiveDay)}
            </p>
          </div>
          <div className="bg-gray-50 rounded p-1.5">
            <p className="text-[7px] text-gray-500 uppercase tracking-wider">Daily avg</p>
            <p className="text-xs font-medium text-gray-900">
              {stats.totalActions > 0 ? Math.round(stats.totalActions / 30) : 0}
            </p>
          </div>
        </div>
      ) : !loading && (
        <div className="mt-3" />
      )}

      {loading && <StatsSkeleton />}
    </div>
  )
}