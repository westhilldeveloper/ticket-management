'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/app/components/layouts/DashboardLayout'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'
import ErrorBoundary from '@/app/components/common/ErrorBoundary'
import { useAuth } from '@/app/context/AuthContext'
import { useToast } from '@/app/context/ToastContext'
import { 
  FiClock, 
  FiAlertCircle, 
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiMessageCircle,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi'
import { format } from 'date-fns'

// Helper: format date in European style (dd/MM/yyyy HH:mm)
const formatDate = (dateString) => {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '—'
    return format(date, 'dd/MM/yyyy HH:mm')
  } catch {
    return '—'
  }
}

// Action icons mapping
const actionConfig = {
  CREATE: { icon: FiCheckCircle, color: 'text-emerald-600', label: 'Created' },
  UPDATE: { icon: FiRefreshCw, color: 'text-blue-600', label: 'Updated' },
  STATUS_CHANGE: { icon: FiRefreshCw, color: 'text-purple-600', label: 'Status change' },
  COMMENT: { icon: FiMessageCircle, color: 'text-indigo-600', label: 'Commented' },
  ASSIGN: { icon: FiUser, color: 'text-amber-600', label: 'Assigned' },
  RESOLVE: { icon: FiCheckCircle, color: 'text-emerald-600', label: 'Resolved' },
  CLOSE: { icon: FiXCircle, color: 'text-gray-500', label: 'Closed' },
  default: { icon: FiClock, color: 'text-gray-400', label: 'Activity' }
}

function HistoryContent() {
  const { user, isLoading: authLoading } = useAuth()
  const toast = useToast()

  // State
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loadingMore, setLoadingMore] = useState(false)

  // Fetch history
  const fetchHistory = useCallback(async (isLoadMore = false) => {
    const page = isLoadMore ? pagination.page + 1 : 1
    try {
      if (isLoadMore) setLoadingMore(true)
      else setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      })
      if (search.trim()) params.append('search', search.trim())
      if (actionFilter !== 'ALL') params.append('action', actionFilter)
      if (dateFilter !== 'ALL') params.append('dateRange', dateFilter)

      const res = await fetch(`/api/tickets/history?${params}`, { credentials: 'include' })
      if (!res.ok) throw new Error(`Error ${res.status}`)

      const data = await res.json()
      const newHistory = data.history || []

      if (isLoadMore) {
        setHistory(prev => [...prev, ...newHistory])
      } else {
        setHistory(newHistory)
      }

      setPagination({
        page: data.pagination?.page || page,
        limit: pagination.limit,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1
      })
    } catch (err) {
      setError(err.message)
      toast.error('Failed to load history')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [search, actionFilter, dateFilter, pagination.limit, toast])

  // Initial load & filter changes
  useEffect(() => {
    if (user) fetchHistory()
  }, [user, search, actionFilter, dateFilter])

  // Load more handler
  const loadMore = () => {
    if (pagination.page < pagination.totalPages && !loadingMore) {
      fetchHistory(true)
    }
  }

  // Reset filters
  const resetFilters = () => {
    setSearch('')
    setActionFilter('ALL')
    setDateFilter('ALL')
  }

  // Role check
  const canViewAll = user && ['SUPER_ADMIN', 'MD', 'ADMIN'].includes(user.role)

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner size="small" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Please log in to view history.</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Activity History</h1>
          <p className="text-sm text-gray-500 mt-1">Track all ticket activity</p>
        </div>

        {/* Filters bar – clean and simple */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ticket title or number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 text-sm"
              />
            </div>

            {/* Action filter */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-400"
            >
              <option value="ALL">All actions</option>
              <option value="CREATE">Created</option>
              <option value="COMMENT">Comments</option>
              <option value="STATUS_CHANGE">Status changes</option>
              <option value="ASSIGN">Assignments</option>
              <option value="RESOLVE">Resolved</option>
              <option value="CLOSE">Closed</option>
            </select>

            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-400"
            >
              <option value="ALL">All time</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">Last 7 days</option>
              <option value="MONTH">Last 30 days</option>
            </select>

            {/* Reset button */}
            {(search || actionFilter !== 'ALL' || dateFilter !== 'ALL') && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* History list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="small" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <FiAlertCircle className="mx-auto h-6 w-6 text-red-500 mb-2" />
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => fetchHistory()}
              className="mt-3 text-sm text-red-700 underline"
            >
              Try again
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <FiClock className="mx-auto h-8 w-8 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No activity found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* List of activities */}
            <div className="space-y-3">
              {history.map((item) => {
                const action = actionConfig[item.action] || actionConfig.default
                const ActionIcon = action.icon
                return (
                  <div
  key={item.id}
  className="bg-white border border-gray-100 rounded-lg p-2 hover:shadow-sm transition-shadow relative overflow-hidden"
  style={{
    backgroundImage: `url('/images/papertxr.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }}
>
  {/* Optional: semi‑transparent overlay to improve text contrast */}
  <div className="absolute inset-0 bg-white/70 pointer-events-none"></div>
  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <ActionIcon className={`h-5 w-5 ${action.color}`} />
                        </div>
                        <div>
                          <Link
                            href={`/tickets/${item.ticket?.id}`}
                             className="inline-block text-sm font-medium text-gray-800 border border-black shadow-sm rounded px-1.5 py-0.5 hover:bg-black/5 transition-colors"
                          >
                            {item.ticket?.title || 'Untitled ticket'}
                          </Link>
                          <p className="text-xs shadow-sm px-2 text-gray-500 mt-1">
                            {action.label}
                            {item.ticket?.ticketNumber && (
                              <span className="ml-1 text-gray-400">
                                · #{item.ticket.ticketNumber}
                              </span>
                            )}
                          </p>
                          {item.description && (
                            <p className="text-xs shadow-sm text-gray-600 mt-2 max-w-2xl">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-xs text-gray-400">
                        <time dateTime={item.createdAt}  style={{ textShadow: '0 0 2px rgba(0,0,0,0.3)' }}>
                          {formatDate(item.createdAt)}
                        </time>
                        {item.createdBy && (
                          <span className="flex items-center gap-1" style={{ textShadow: '0 0 2px rgba(0,0,0,0.3)' }}>
                            <FiUser className="h-3 w-3"  />
                            {item.createdBy.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  </div>
                )
              })}
            </div>
            

            {/* Pagination – simple load more button */}
            {pagination.page < pagination.totalPages && (
              <div className="text-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <>Load more</>
                  )}
                </button>
              </div>
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