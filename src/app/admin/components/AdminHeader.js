// components/AdminHeader.js 
import { FiDownload, FiRefreshCw } from 'react-icons/fi';

export default function AdminHeader({
  userName,
  timeRange,
  onTimeRangeChange,
  onExport,
  onRefresh,
  isConnected,
  requestServiceType,
  onRequestServiceTypeChange,
  isRefreshing = false,
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, {userName}. Here’s what’s happening with your system.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Request/Service Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1 shadow-sm">
          {['', 'REQUEST', 'SERVICE'].map((type) => (
            <button
              key={type || 'all'}
              onClick={() => onRequestServiceTypeChange(type)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                requestServiceType === type
                  ? 'bg-white text-primary-600 shadow-sm ring-1 ring-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              {type === '' ? 'All' : type === 'REQUEST' ? 'Requests' : 'Services'}
            </button>
          ))}
        </div>

        {/* Export Button */}
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all text-sm font-medium shadow-sm"
          title="Export report"
        >
          <FiDownload className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Refresh Button with Spinner */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-primary-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh dashboard"
          aria-label="Refresh"
        >
          <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Connection Status */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-full border border-gray-200 text-xs">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-gray-600 font-medium">{isConnected ? 'Live' : 'Connecting...'}</span>
        </div>
      </div>
    </div>
  );
}