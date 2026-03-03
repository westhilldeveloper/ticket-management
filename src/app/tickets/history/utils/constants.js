import { 
  FiCheckCircle, FiActivity, FiRefreshCw, FiMessageCircle,
  FiUser, FiXCircle, FiShield, FiUsers, FiAward, FiClock
} from 'react-icons/fi'

// Error types
export const ErrorTypes = {
  NETWORK: 'network',
  AUTH: 'authentication',
  PERMISSION: 'permission',
  SERVER: 'server',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown'
}

// Action icons and styles
export const ACTION_ICONS = {
  CREATE: { icon: FiCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Created' },
  UPDATE: { icon: FiActivity, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Updated' },
  STATUS_CHANGE: { icon: FiRefreshCw, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Status' },
  COMMENT: { icon: FiMessageCircle, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Comment' },
  ASSIGN: { icon: FiUser, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Assigned' },
  RESOLVE: { icon: FiCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Resolved' },
  CLOSE: { icon: FiXCircle, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Closed' }
}

// Role badges
export const ROLE_BADGES = {
  SUPER_ADMIN: { bg: 'bg-purple-50', text: 'text-purple-700', icon: FiShield, label: 'Super Admin' },
  ADMIN: { bg: 'bg-blue-50', text: 'text-blue-700', icon: FiUsers, label: 'Admin' },
  MD: { bg: 'bg-amber-50', text: 'text-amber-700', icon: FiAward, label: 'MD' },
  EMPLOYEE: { bg: 'bg-gray-50', text: 'text-gray-700', icon: FiUser, label: 'Employee' }
}

// Category badges
export const CATEGORY_BADGES = {
  HR: { bg: 'bg-pink-50', text: 'text-pink-700', label: 'HR' },
  IT: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'IT' },
  TECHNICAL: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Technical' }
}

// Filter options
export const FILTER_OPTIONS = {
  actionTypes: [
    { value: 'ALL', label: 'All actions' },
    { value: 'CREATE', label: 'Created' },
    { value: 'UPDATE', label: 'Updated' },
    { value: 'STATUS_CHANGE', label: 'Status' },
    { value: 'COMMENT', label: 'Comments' },
    { value: 'ASSIGN', label: 'Assignments' }
  ],
  dateRanges: [
    { value: 'ALL', label: 'All time' },
    { value: 'TODAY', label: 'Today' },
    { value: 'WEEK', label: 'This week' },
    { value: 'MONTH', label: 'This month' },
    { value: 'YEAR', label: 'This year' }
  ],
  categories: ['HR', 'IT', 'TECHNICAL']
}

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100
}

// Cache settings
export const CACHE_TTL = 30000 // 30 seconds
export const REQUEST_TIMEOUT = 15000 // 15 seconds
export const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]