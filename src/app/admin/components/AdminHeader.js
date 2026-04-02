import { FiDownload, FiRefreshCw } from "react-icons/fi";

// AdminHeader.js
export default function AdminHeader({ 
  userName, 
  timeRange, 
  onTimeRangeChange, 
  onExport, 
  onRefresh,
  isConnected,
  requestServiceType,
  onRequestServiceTypeChange 
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {userName}. Here's what's happening with your system.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {/* Request/Service Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onRequestServiceTypeChange('')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              requestServiceType === '' 
                ? 'bg-white text-primary-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onRequestServiceTypeChange('REQUEST')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              requestServiceType === 'REQUEST' 
                ? 'bg-white text-primary-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Requests
          </button>
          <button
            onClick={() => onRequestServiceTypeChange('SERVICE')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              requestServiceType === 'SERVICE' 
                ? 'bg-white text-primary-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Services
          </button>
        </div>

        <button
          onClick={onExport}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          title="Export Report"
        >
          <FiDownload className="mr-2" />
          Export
        </button>
        
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          title="Refresh Data"
        >
          <FiRefreshCw className="mr-2" />
          Refresh
        </button>
      </div>

      {/* Connection Status */}
      <div className="flex items-center space-x-2 text-sm">
        <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
        <span className="text-gray-500">
          {isConnected ? 'Real-time updates active' : 'Connecting...'}
        </span>
      </div>
    </div>
  );
}