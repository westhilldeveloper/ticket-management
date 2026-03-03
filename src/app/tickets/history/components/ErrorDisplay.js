import Link from 'next/link'
import { FiWifiOff, FiServer, FiLock, FiAlertCircle } from 'react-icons/fi'
import { ErrorTypes } from '../utils/constants'

export const ErrorDisplay = ({ error, onRetry, loading }) => {
  const getIcon = () => {
    switch (error.type) {
      case ErrorTypes.NETWORK:
        return <FiWifiOff className="h-4 w-4 text-red-500" />
      case ErrorTypes.SERVER:
        return <FiServer className="h-4 w-4 text-red-500" />
      case ErrorTypes.AUTH:
        return <FiLock className="h-4 w-4 text-amber-500" />
      default:
        return <FiAlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getBgColor = () => {
    switch (error.type) {
      case ErrorTypes.AUTH:
        return 'bg-amber-50'
      default:
        return 'bg-red-50'
    }
  }

  return (
    <div className="bg-white rounded border border-gray-200 p-5">
      <div className="text-center max-w-sm mx-auto">
        <div className={`${getBgColor()} rounded-full p-3 mx-auto w-10 h-10 flex items-center justify-center mb-3`}>
          {getIcon()}
        </div>
        
        <h3 className="text-xs font-medium text-gray-900 mb-1">
          {error.message || 'Unable to load history'}
        </h3>
        
        {error.details && (
          <p className="text-[9px] text-gray-500 mb-4">
            {error.details}
          </p>
        )}
        
        <div className="flex justify-center space-x-2">
          <button
            onClick={onRetry}
            disabled={loading}
            className="px-3 py-1.5 bg-blue-600 text-white text-[9px] rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Try Again'}
          </button>
          
          <Link
            href="/dashboard"
            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-[9px] rounded hover:bg-gray-200 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}