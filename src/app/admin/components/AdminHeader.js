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
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
      <div>
        <h1 className="text-base font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-[10px] text-gray-500 mt-0.5">
          Welcome back, {userName}. Here’s what’s happening.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {/* Request/Service Toggle */}
        <div className="flex items-center bg-gray-100 rounded p-0.5">
          {['', 'REQUEST', 'SERVICE'].map((type) => (
            <button
              key={type || 'all'}
              onClick={() => onRequestServiceTypeChange(type)}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-all ${
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
          className="inline-flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 text-[9px] font-medium shadow-sm"
          title="Export report"
        >
          <FiDownload className="w-4 h-5" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          title="Refresh dashboard"
        >
          <FiRefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Connection Status */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 rounded-full border border-gray-200">
          <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-[8px] text-gray-600 font-medium">{isConnected ? 'Live' : 'Connecting...'}</span>
        </div>
      </div>
    </div>
  );
}