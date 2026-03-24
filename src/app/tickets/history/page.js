'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/app/components/layouts/DashboardLayout'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'
import ErrorBoundary from '@/app/components/common/ErrorBoundary'
import { useAuth } from '@/app/context/AuthContext'
import { useToast } from '@/app/context/ToastContext'
import { 
  FiClock, 
  FiAlertCircle, 
  FiCheckCircle,
  FiXCircle,
  FiFilter,
  FiUser,
  FiMessageCircle,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiDownload,
  FiActivity,
  FiFileText,
  FiUsers,
  FiShield,
  FiAward,
  FiTag,
  FiGrid,
  FiList,
  FiInfo,
  FiWifiOff,
  FiServer,
  FiLock,
  FiEye
} from 'react-icons/fi'
import { formatDistanceToNow, format, isValid } from 'date-fns'

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

// Error types
const ErrorTypes = {
  NETWORK: 'network', AUTH: 'authentication', PERMISSION: 'permission',
  SERVER: 'server', VALIDATION: 'validation', UNKNOWN: 'unknown'
}

// Action icons - ultra minimal
const ACTION_ICONS = {
  CREATE: { icon: FiCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'New' },
  UPDATE: { icon: FiActivity, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Edit' },
  STATUS_CHANGE: { icon: FiRefreshCw, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Status' },
  COMMENT: { icon: FiMessageCircle, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Comment' },
  ASSIGN: { icon: FiUser, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Assign' },
  RESOLVE: { icon: FiCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Resolve' },
  CLOSE: { icon: FiXCircle, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Close' }
}

// Role badges - minimal
const ROLE_BADGES = {
  SUPER_ADMIN: { bg: 'bg-purple-50', text: 'text-purple-700', icon: FiShield, label: 'SA' },
  ADMIN: { bg: 'bg-blue-50', text: 'text-blue-700', icon: FiUsers, label: 'AD' },
  MD: { bg: 'bg-amber-50', text: 'text-amber-700', icon: FiAward, label: 'MD' },
  EMPLOYEE: { bg: 'bg-gray-50', text: 'text-gray-700', icon: FiUser, label: 'EM' }
}

// Category badges
const CATEGORY_BADGES = {
  HR: { bg: 'bg-pink-50', text: 'text-pink-700', label: 'HR' },
  IT: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'IT' },
  TECHNICAL: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'TECH' }
}

// Ultra compact skeletons
const TimelineSkeleton = () => (
  <div className="space-y-1">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-white p-2 border-b border-gray-100 flex space-x-2">
        <div className="h-5 w-5 rounded-full bg-gray-200 animate-pulse" />
        <div className="flex-1 space-y-1">
          <div className="h-2.5 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-2 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
        <div className="h-2 w-12 bg-gray-200 rounded animate-pulse" />
      </div>
    ))}
  </div>
)

const GridSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
    {[...Array(15)].map((_, i) => (
      <div key={i} className="bg-white border border-gray-100 p-2 space-y-1.5">
        <div className="flex justify-between">
          <div className="h-4 w-4 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-2 w-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-2.5 bg-gray-200 rounded w-full animate-pulse" />
        <div className="h-2 bg-gray-200 rounded w-2/3 animate-pulse" />
        <div className="flex gap-0.5">
          <div className="h-3 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    ))}
  </div>
)

// Date utilities
const safeParseDate = (dateString) => {
  if (!dateString) return null
  try { const date = new Date(dateString); return isValid(date) ? date : null } 
  catch { return null }
}

function HistoryContent() {
  const { user, isLoading: authLoading } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const loadMoreRef = useRef()
  
  // State
  const [isClient, setIsClient] = useState(false)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState({ type: null, message: null })
  const [retryCount, setRetryCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  
  // Filters
  const [filters, setFilters] = useState({
    actionType: 'ALL', dateRange: 'ALL', search: '', userId: 'ALL', category: 'ALL'
  })
  const debouncedSearch = useDebounce(filters.search, 500)
  
  // Data
  const [users, setUsers] = useState([])
  const categories = ['HR', 'IT', 'TECHNICAL'] // Static categories
  
  // Pagination
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 })
  
  // UI
  const [showFilters, setShowFilters] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // Default to grid for multi-column

  // Role checks
  const isAdmin = useMemo(() => user && ['SUPER_ADMIN', 'ADMIN'].includes(user.role), [user])
  const canExport = useMemo(() => user && ['SUPER_ADMIN', 'ADMIN'].includes(user.role), [user])

  // Stats
  const stats = useMemo(() => {
    if (!history.length) return { totalActions: 0, uniqueTickets: 0, actionBreakdown: {} }
    return {
      totalActions: history.length,
      uniqueTickets: new Set(history.map(h => h.ticket?.id).filter(Boolean)).size,
      actionBreakdown: history.reduce((acc, item) => {
        if (item?.action) acc[item.action] = (acc[item.action] || 0) + 1
        return acc
      }, {})
    }
  }, [history])

  // Client-side flag
  useEffect(() => setIsClient(true), [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        document.querySelector('input[placeholder*="Search"]')?.focus()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setShowFilters(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Fetch users
  useEffect(() => {
    if (!isAdmin) return
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users?active=true&limit=100', { credentials: 'include' })
        if (res.ok) setUsers((await res.json()).users || [])
      } catch (err) { console.warn('Users fetch failed:', err) }
    }
    fetchUsers()
  }, [isAdmin])

  // Fetch history
  const fetchHistory = useCallback(async (isRetry = false, loadMore = false) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      if (loadMore) setLoadingMore(true); else setLoading(true)
      setError({ type: null, message: null })

      if (!user) throw { type: ErrorTypes.AUTH, message: 'Auth required' }

      const params = new URLSearchParams({
        page: (loadMore ? pagination.page + 1 : pagination.page).toString(),
        limit: pagination.limit.toString(),
      })
      if (filters.actionType !== 'ALL') params.append('action', filters.actionType)
      if (filters.dateRange !== 'ALL') params.append('dateRange', filters.dateRange)
      if (debouncedSearch?.trim()) params.append('search', debouncedSearch.trim())
      if (isAdmin && filters.userId !== 'ALL') params.append('userId', filters.userId)
      if (filters.category !== 'ALL') params.append('category', filters.category)

      const res = await fetch(`/api/tickets/history?${params}`, {
        credentials: 'include', signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        if (res.status === 401) throw { type: ErrorTypes.AUTH, message: 'Session expired' }
        if (res.status === 403) throw { type: ErrorTypes.PERMISSION, message: 'Access denied' }
        throw { type: ErrorTypes.SERVER, message: `Error ${res.status}` }
      }

      const data = await res.json()
      const newHistory = Array.isArray(data.history) ? data.history : []
      
      if (loadMore) {
        setHistory(prev => [...prev, ...newHistory])
        setHasMore(newHistory.length === pagination.limit)
      } else {
        setHistory(newHistory)
        setHasMore(newHistory.length === pagination.limit)
        setPagination(prev => ({ 
          ...prev, 
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1
        }))
      }

      if (loadMore) setPagination(prev => ({ ...prev, page: prev.page + 1 }))
      
      if (isRetry) toast.success('Loaded', { duration: 1000 })

    } catch (err) {
      if (err.name === 'AbortError') {
        setError({ type: ErrorTypes.NETWORK, message: 'Timeout' })
      } else if (err.type) {
        setError({ type: err.type, message: err.message })
        if (err.type === ErrorTypes.AUTH) {
          toast.error('Auth required')
          setTimeout(() => router.push('/login'), 1500)
        }
      } else {
        setError({ type: ErrorTypes.UNKNOWN, message: 'Error loading' })
      }
    } finally {
      if (loadMore) setLoadingMore(false); else setLoading(false)
      clearTimeout(timeoutId)
    }
  }, [pagination.page, pagination.limit, filters, debouncedSearch, isAdmin, user, router, toast])

  // Initial fetch
  useEffect(() => {
    if (isClient && user) fetchHistory()
  }, [isClient, user, debouncedSearch, filters.actionType, filters.dateRange, 
      filters.userId, filters.category, pagination.page])

  // Infinite scroll
  useEffect(() => {
    if (viewMode === 'grid' && hasMore && !loadingMore && !loading) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loadingMore) fetchHistory(false, true)
        },
        { threshold: 0.1, rootMargin: '50px' }
      )
      if (loadMoreRef.current) observer.observe(loadMoreRef.current)
      return () => observer.disconnect()
    }
  }, [viewMode, hasMore, loadingMore, loading, fetchHistory])

  // Filter handlers
  const handleFilterChange = (key, value) => {
    if (key === 'search' && value.length > 100) {
      toast.warning('Search too long', { duration: 1000 })
      return
    }
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
    setHasMore(true)
  }

  const clearFilters = () => {
    setFilters({ actionType: 'ALL', dateRange: 'ALL', search: '', userId: 'ALL', category: 'ALL' })
    setPagination(prev => ({ ...prev, page: 1 }))
    setHasMore(true)
    toast.info('Filters cleared', { duration: 1000 })
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    const delay = Math.min(1000 * Math.pow(2, retryCount), 8000)
    toast.info(`Retry ${retryCount + 1}`, { duration: 1000 })
    setTimeout(() => fetchHistory(true), delay)
  }

  // Date formatting
  const formatDate = useCallback((dateString) => {
    if (!dateString || !isClient) return { relative: '...', short: '...', full: '...' }
    try {
      const date = safeParseDate(dateString)
      if (!date) return { relative: 'Invalid', short: 'Invalid', full: 'Invalid' }
      return {
        relative: formatDistanceToNow(date, { addSuffix: true }),
        short: format(date, 'dd/MM/yy HH:mm'),
        full: format(date, 'PPpp')
      }
    } catch {
      return { relative: 'Invalid', short: 'Invalid', full: 'Invalid' }
    }
  }, [isClient])

  // Helpers
  const getActionInfo = useCallback((action) => 
    ACTION_ICONS[action] || { icon: FiActivity, color: 'text-gray-600', bg: 'bg-gray-50', label: action }
  , [])

  const getRoleBadge = useCallback((role) => ROLE_BADGES[role] || ROLE_BADGES.EMPLOYEE, [])
  const getCategoryBadge = useCallback((cat) => CATEGORY_BADGES[cat] || { bg: 'bg-gray-50', text: 'text-gray-700', label: cat }, [])

  const formatAction = useCallback((item) => {
    if (!item) return 'Unknown'
    const { action, ticket } = item
    const ref = ticket?.ticketNumber?.slice(-4) || ticket?.id?.slice(-4) || '?'
    switch (action) {
      case 'CREATE': return `Created #${ref}`
      case 'UPDATE': return 'Updated'
      case 'STATUS_CHANGE': return 'Status changed'
      case 'COMMENT': return 'Commented'
      case 'ASSIGN': return 'Assigned'
      case 'RESOLVE': return 'Resolved'
      case 'CLOSE': return 'Closed'
      default: return action?.toLowerCase() || 'Action'
    }
  }, [])

  // Loading states
  if (!isClient || authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="small" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <FiLock className="h-6 w-6 text-gray-300 mb-2" />
          <p className="text-xs text-gray-500 mb-3">Login required</p>
          <Link href="/login" className="text-[10px] bg-blue-600 text-white px-3 py-1.5 rounded">
            Login
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  // Error display
  const ErrorDisplay = () => (
    <div className="bg-white border border-gray-200 p-4 text-center">
      <div className={`inline-flex p-2 rounded-full mb-2 ${
        error.type === ErrorTypes.NETWORK ? 'bg-red-50' : 'bg-amber-50'
      }`}>
        {error.type === ErrorTypes.NETWORK ? 
          <FiWifiOff className="h-4 w-4 text-red-500" /> : 
          <FiAlertCircle className="h-4 w-4 text-amber-500" />
        }
      </div>
      <p className="text-xs text-gray-700 mb-2">{error.message}</p>
      <button onClick={handleRetry} className="text-[9px] bg-blue-600 text-white px-3 py-1 rounded">
        Retry
      </button>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-2 sm:px-3">
        {/* Ultra compact header */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10 py-1.5 px-2 mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-md font-medium text-gray-700">History</h1>
              <span className={`text-[8px] px-1 py-0.5 rounded ${getRoleBadge(user.role).bg} ${getRoleBadge(user.role).text}`}>
                {getRoleBadge(user.role).label}
              </span>
              {stats.totalActions > 0 && (
                <span className="text-[10px] text-gray-400">{stats.totalActions} items</span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              {/* View toggle */}
              <div className="flex bg-gray-100 rounded-sm p-0.5">
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`p-1 rounded-sm ${viewMode === 'timeline' ? 'bg-white shadow-sm' : ''}`}
                >
                  <FiList className="h-6 w-6 text-gray-600" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded-sm ${viewMode === 'grid' ? 'bg-white shadow-xs' : ''}`}
                >
                  <FiGrid className="h-6 w-6 text-gray-600" />
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1 rounded-sm ${showFilters ? 'bg-blue-50' : 'bg-gray-100'}`}
              >
                <FiFilter className="h-6 w-6 text-gray-600" />
              </button>
              
              {canExport && (
                <button
                  onClick={() => {}}
                  disabled={exportLoading || !history.length}
                  className="p-1 bg-gray-100 rounded-sm disabled:opacity-30"
                >
                  <FiDownload className="h-6 w-6 text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Search bar - always visible */}
          <div className="mt-1.5 relative">
            <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search tickets..."
              className="w-full pl-7 pr-2 py-1 text-[10px] border border-gray-100 rounded-sm focus:outline-none focus:border-blue-200"
            />
          </div>

          {/* Filters panel - compact */}
          {showFilters && (
            <div className="mt-2 pt-2 border-t border-gray-50 grid grid-cols-2 sm:grid-cols-4 gap-1">
              <select
                value={filters.actionType}
                onChange={(e) => handleFilterChange('actionType', e.target.value)}
                className="px-1 py-0.5 text-[10px] border border-gray-100 rounded-sm"
              >
                <option value="ALL">Action</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="COMMENT">Comment</option>
              </select>

              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-1 py-0.5 text-[10px] border border-gray-100 rounded-sm"
              >
                <option value="ALL">Category</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>

              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="px-1 py-0.5 text-[8px] border border-gray-100 rounded-sm"
              >
                <option value="ALL">Date</option>
                <option value="TODAY">Today</option>
                <option value="WEEK">Week</option>
                <option value="MONTH">Month</option>
              </select>

              {isAdmin && (
                <select
                  value={filters.userId}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                  className="px-1 py-0.5 text-[10px] border border-gray-100 rounded-sm"
                >
                  <option value="ALL">User</option>
                  {users.slice(0, 10).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              )}

              {(filters.actionType !== 'ALL' || filters.category !== 'ALL' || 
                filters.dateRange !== 'ALL' || filters.userId !== 'ALL' || filters.search) && (
                <button onClick={clearFilters} className="col-span-full text-[9px] text-gray-400 text-right">
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error.type && <ErrorDisplay />}

        {/* Content */}
        {loading ? (
          viewMode === 'timeline' ? <TimelineSkeleton /> : <GridSkeleton />
        ) : !history.length ? (
          <div className="bg-white py-8 text-center">
            <FiClock className="h-5 w-5 text-gray-200 mx-auto mb-2" />
            <p className="text-[9px] text-gray-300">No activity</p>
          </div>
        ) : (
          <>
            {viewMode === 'timeline' ? (
              /* Timeline - single column */
              <div className="space-y-0.5">
                {history.map((item) => {
                  const ActionIcon = getActionInfo(item.action).icon
                  const colorClass = getActionInfo(item.action).color
                  const bgClass = getActionInfo(item.action).bg
                  const formattedDate = formatDate(item.createdAt)
                  
                  return (
                    <div key={item.id} className="bg-white p-2 border-b border-gray-50 flex items-start space-x-2">
                      <div className={`h-10 w-10 rounded-full ${bgClass} flex items-center justify-center shrink-0`}>
                        <ActionIcon className={`h-2.5 w-2.5 ${colorClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <Link href={`/tickets/${item.ticket?.id}`} className="text-[10px] font-medium text-gray-700 truncate max-w-[150px]">
                            {item.ticket?.title || 'Ticket'}
                          </Link>
                          <span className="text-[9px] text-gray-300">{formattedDate.short}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">{formatAction(item)}</p>
                        <div className="flex items-center mt-1 text-[6px] text-gray-300">
                          <span>#{item.ticket?.ticketNumber?.slice(-4) || '?'}</span>
                          {item.createdBy && (
                            <>
                              <span className="mx-1">·</span>
                              <span>{item.createdBy.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Grid - multi-column (2-5 columns) */
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
                  {history.map((item) => {
                    const ActionIcon = getActionInfo(item.action).icon
                    const colorClass = getActionInfo(item.action).color
                    const bgClass = getActionInfo(item.action).bg
                    const formattedDate = formatDate(item.createdAt)
                    
                    return (
                      <div key={item.id} className="bg-white border border-gray-50 p-1.5 hover:border-gray-200 transition-colors">
                        <div className="flex items-start justify-between mb-1">
                          <div className={`h-6 w-6 rounded-full ${bgClass} flex items-center justify-center`}>
                            <ActionIcon className={`h-4 w-4 ${colorClass}`} />
                          </div>
                          <span className="text-[8px] text-gray-300">{formattedDate.short}</span>
                        </div>
                        
                        <Link href={`/tickets/${item.ticket?.id}`} className="block">
                          <h3 className="text-[9px] font-medium text-gray-700 line-clamp-2 mb-1 leading-tight">
                            {item.ticket?.title || 'Untitled'}
                          </h3>
                        </Link>
                        
                        <p className="text-[9px] text-gray-400 mb-1.5">{formatAction(item)}</p>
                        
                        <div className="flex flex-wrap gap-0.5 mb-1">
                          {item.ticket?.category && (
                            <span className={`px-1 py-px rounded text-[7px] font-medium ${getCategoryBadge(item.ticket.category).bg} ${getCategoryBadge(item.ticket.category).text}`}>
                              {getCategoryBadge(item.ticket.category).label}
                            </span>
                          )}
                          <span className={`px-1 py-px rounded text-[8px] font-medium ${bgClass} ${colorClass}`}>
                            {getActionInfo(item.action).label}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                          <div className="flex items-center space-x-0.5">
                            {item.createdBy ? (
                              <span className="text-[8px] text-gray-400 truncate max-w-[60px]">
                                {item.createdBy.name}
                              </span>
                            ) : (
                              <span className="text-[8px] text-gray-300">System</span>
                            )}
                          </div>
                          <span className="text-[8px] text-gray-300 font-mono">
                            #{item.ticket?.ticketNumber?.slice(-4) || item.ticket?.id?.slice(-4)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Infinite scroll sentinel */}
                {hasMore && (
                  <div ref={loadMoreRef} className="py-2 text-center">
                    {loadingMore ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <div className="h-6" />
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function HistoryPage() {
  return (
    <ErrorBoundary>
      <HistoryContent />
    </ErrorBoundary>
  )
}