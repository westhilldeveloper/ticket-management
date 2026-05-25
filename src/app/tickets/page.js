// app/tickets/page.js
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/context/AuthContext'
import DashboardLayout from '@/app/components/layouts/DashboardLayout'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'
import ErrorBoundary from '@/app/components/common/ErrorBoundary'
import { 
  FiPlus, 
  FiClock, 
  FiCheck, 
  FiAlertCircle,
  FiEye,
  FiCalendar,
  FiArrowRight,
  FiRefreshCw,
  FiXCircle,
  FiInfo,
  FiUser,
  FiBriefcase,
  FiFilter,
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiMail,
  FiTag,
  FiInbox,
  FiUsers,
  FiAward,
  FiShield
} from 'react-icons/fi'
import { formatDistanceToNow, format } from 'date-fns'

function TicketsPageContent() {
  const { user, isLoading: authLoading } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [networkStatus, setNetworkStatus] = useState('online')
  
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', search: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTickets, setSelectedTickets] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [stats, setStats] = useState({
    total: 0, open: 0, inProgress: 0, pendingMD: 0, pendingThirdParty: 0, resolved: 0, closed: 0, critical: 0
  })

  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online')
    const handleOffline = () => setNetworkStatus('offline')
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline) }
  }, [])

  useEffect(() => {
    if (!authLoading && user) fetchTickets()
  }, [authLoading, user, retryCount, filters, pagination.page])

  const fetchTickets = async () => {
    if (networkStatus === 'offline') {
      setError({ message: 'You are offline. Please check your connection.', code: 'OFFLINE', type: 'warning' })
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      if (!user) throw { message: 'User not authenticated', code: 'UNAUTHENTICATED', type: 'error' }

      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.category && { category: filters.category }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && { search: filters.search })
      })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      const ticketsRes = await fetch(`/api/tickets?${queryParams}`, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!ticketsRes.ok) {
        if (ticketsRes.status === 401) throw { message: 'Session expired. Please log in again.', code: 'SESSION_EXPIRED', type: 'error', action: 'login' }
        if (ticketsRes.status === 403) throw { message: 'You do not have permission to view tickets.', code: 'FORBIDDEN', type: 'error' }
        if (ticketsRes.status === 429) throw { message: 'Too many requests. Please wait.', code: 'RATE_LIMITED', type: 'warning' }
        if (ticketsRes.status >= 500) throw { message: 'Server error. Our team has been notified.', code: 'SERVER_ERROR', type: 'error' }
        throw { message: 'Failed to fetch tickets', code: 'TICKETS_FETCH_ERROR', type: 'error' }
      }

      const ticketsData = await ticketsRes.json()
      const ticketsArray = Array.isArray(ticketsData.tickets) ? ticketsData.tickets : []
      setTickets(ticketsArray)
      if (ticketsData.pagination) setPagination(ticketsData.pagination)

      const statsCalc = ticketsArray.reduce((acc, ticket) => {
        if (!ticket) return acc
        acc.total++
        const status = ticket.status
        if (['OPEN', 'PENDING_MD_APPROVAL', 'PENDING_THIRD_PARTY', 'REJECTED_BY_MD','REJECTED_BY_SERVICE', 'PENDING_SERVICE_ACCEPTANCE'].includes(status)) acc.open++
        else if (['IN_PROGRESS', 'SERVICE_IN_PROGRESS'].includes(status)) acc.inProgress++
        else if (status === 'RESOLVED' || status === 'SERVICE_RESOLVED') acc.resolved++
        else if (status === 'CLOSED') acc.closed++
        if (status === 'PENDING_MD_APPROVAL') acc.pendingMD++
        if (status === 'PENDING_THIRD_PARTY') acc.pendingThirdParty++
        if (ticket.priority === 'CRITICAL') acc.critical++
        return acc
      }, { total: 0, open: 0, inProgress: 0, pendingMD: 0, pendingThirdParty: 0, resolved: 0, closed: 0, critical: 0 })
      setStats(statsCalc)
    } catch (error) {
      console.error('Tickets fetch error:', error)
      if (error.name === 'AbortError') setError({ message: 'Request timed out. Please try again.', code: 'TIMEOUT', type: 'warning' })
      else setError({ message: error.message || 'Failed to load tickets', code: error.code || 'UNKNOWN_ERROR', type: error.type || 'error', action: error.action })
      setTickets([])
    } finally { setLoading(false) }
  }

  const handleRetry = () => setRetryCount(prev => prev + 1)
  const handleDismissError = () => setError(null)
  const handleFilterChange = (e) => { setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })); setPagination(prev => ({ ...prev, page: 1 })) }
  const handleClearFilters = () => { setFilters({ status: '', category: '', priority: '', search: '' }); setPagination(prev => ({ ...prev, page: 1 })) }
  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= pagination.pages) setPagination(prev => ({ ...prev, page: newPage })) }
  const handleSelectAll = () => { if (selectAll) setSelectedTickets([]); else setSelectedTickets(tickets.map(t => t.id)); setSelectAll(!selectAll) }
  const handleSelectTicket = (ticketId) => { setSelectedTickets(prev => prev.includes(ticketId) ? prev.filter(id => id !== ticketId) : [...prev, ticketId]); setSelectAll(false) }
  const handleBulkAction = async (action) => { console.log('Bulk action:', action, selectedTickets) }

  const getStatusIcon = (status) => {
    const size = "w-3 h-3"
    switch (status) {
      case 'OPEN': return <FiAlertCircle className={`${size} text-amber-500`} />
      case 'IN_PROGRESS': return <FiClock className={`${size} text-blue-500`} />
      case 'PENDING_MD_APPROVAL': return <FiAward className={`${size} text-purple-500`} />
      case 'PENDING_THIRD_PARTY': return <FiUsers className={`${size} text-indigo-500`} />
      case 'RESOLVED': return <FiCheck className={`${size} text-emerald-500`} />
      case 'CLOSED': return <FiCheck className={`${size} text-gray-400`} />
      default: return <FiAlertCircle className={`${size} text-gray-400`} />
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      'OPEN': 'bg-amber-50 text-amber-700 border-amber-200',
      'IN_PROGRESS': 'bg-blue-50 text-blue-700 border-blue-200',
      'PENDING_MD_APPROVAL': 'bg-purple-50 text-purple-700 border-purple-200',
      'PENDING_THIRD_PARTY': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'APPROVED_BY_MD': 'bg-green-50 text-green-700 border-green-200',
      'REJECTED_BY_MD': 'bg-red-50 text-red-700 border-red-200',
      'REJECTED_BY_SERVICE': 'bg-red-50 text-red-700 border-red-200',
      'RESOLVED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'CLOSED': 'bg-gray-50 text-gray-700 border-gray-200'
    }
    const displayStatus = status?.replace(/_/g, ' ') || 'Unknown'
    return <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-medium border ${styles[status] || styles.CLOSED}`}>{displayStatus}</span>
  }

  const getPriorityBadge = (priority) => {
    if (!priority) return null
    const styles = {
      'CRITICAL': 'bg-red-50 text-red-700 border-red-200',
      'HIGH': 'bg-orange-50 text-orange-700 border-orange-200',
      'MEDIUM': 'bg-blue-50 text-blue-700 border-blue-200',
      'LOW': 'bg-gray-50 text-gray-700 border-gray-200'
    }
    return <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-medium border ${styles[priority] || styles.LOW}`}>{priority}</span>
  }

  const getRoleBadge = (role) => {
    const styles = {
      'SUPER_ADMIN': 'bg-purple-50 text-purple-700 border-purple-200',
      'MD': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'ADMIN': 'bg-blue-50 text-blue-700 border-blue-200',
      'EMPLOYEE': 'bg-gray-50 text-gray-700 border-gray-200'
    }
    return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-medium border ${styles[role] || styles.EMPLOYEE}`}>{role?.replace('_', ' ') || 'Employee'}</span>
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try { return formatDistanceToNow(new Date(dateString), { addSuffix: true }) } catch { return 'Recently' }
  }

  if (authLoading) return <div className="flex justify-center items-center min-h-[300px]"><LoadingSpinner size="small" /></div>
  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
      <FiUser className="h-8 w-8 text-gray-300 mb-2" />
      <h3 className="text-xs font-medium text-gray-700">Authentication Required</h3>
      <p className="text-[9px] text-gray-500 mb-3">Please log in to view tickets</p>
      <Link href="/login" className="px-2 py-1 text-[9px] bg-primary-600 text-white rounded">Login</Link>
    </div>
  )

  return (
    <div className="space-y-2 p-2">
      {/* Network & Error Alerts */}
      {networkStatus === 'offline' && <div className="bg-amber-50 border border-amber-200 rounded p-1.5 text-[9px] text-amber-700">You are offline. Some features may be unavailable.</div>}
      {error && <ErrorAlert error={error} onRetry={handleRetry} onDismiss={handleDismissError} />}

      {/* Header – Compact gradient */}
      <div className=" rounded-lg shadow-sm overflow-hidden">
        <div className="px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xs font-bold text-gray-600">Tickets</h1>
              <p className="text-[10px] text-primary-400 mt-0.5">
                {user?.role === 'EMPLOYEE' ? 'View and manage your tickets' : user?.role === 'ADMIN' ? 'Manage all tickets and assignments' : 'Review and approve tickets'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="bg-white/10 px-1.5 py-0.5 rounded text-[12px] text-blue-600 flex items-center gap-0.5"><FiUser className="w-2.5 h-2.5" />{user?.name?.split(' ')[0]}</span>
              {getRoleBadge(user?.role)}
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar – Compact */}
      <div className="bg-white rounded border border-gray-100 p-2">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium ${showFilters ? 'bg-primary-50 text-primary-700' : 'bg-gray-50 text-gray-700'} border`}>
            <FiFilter className="w-3 h-3" /> Filters <FiChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <div className="relative flex-1 max-w-xs">
            <FiSearch className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search tickets..." className="w-full pl-6 pr-2 py-0.5 text-[9px] border border-gray-200 rounded" />
          </div>
          {selectedTickets.length > 0 && (
            <div className="flex items-center gap-0.5 ml-auto">
              <span className="text-[8px] text-gray-500">{selectedTickets.length} selected</span>
              <button onClick={() => handleBulkAction('export')} className="p-0.5 text-gray-600 hover:bg-gray-100 rounded"><FiDownload className="w-3 h-3" /></button>
              <button onClick={() => handleBulkAction('email')} className="p-0.5 text-gray-600 hover:bg-gray-100 rounded"><FiMail className="w-3 h-3" /></button>
            </div>
          )}
          <Link href="/tickets/new" className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-primary-600 text-white rounded text-[9px] font-medium hover:bg-primary-700">
            <FiPlus className="w-3 h-3" /> New Ticket
          </Link>
        </div>

        {showFilters && (
          <div className="mt-2 pt-1 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
            <select name="status" value={filters.status} onChange={handleFilterChange} className="text-[9px] border border-gray-200 rounded px-1 py-0.5">
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_MD_APPROVAL">Pending MD</option>
              <option value="PENDING_THIRD_PARTY">Pending Third Party</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select name="category" value={filters.category} onChange={handleFilterChange} className="text-[9px] border border-gray-200 rounded px-1 py-0.5">
              <option value="">All Categories</option>
              <option value="HR">HR</option><option value="IT">IT</option><option value="TECHNICAL">Technical</option>
            </select>
            <select name="priority" value={filters.priority} onChange={handleFilterChange} className="text-[9px] border border-gray-200 rounded px-1 py-0.5">
              <option value="">All Priorities</option>
              <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
            </select>
            <button onClick={handleClearFilters} className="text-[8px] text-primary-600 text-left">Clear all</button>
          </div>
        )}
      </div>

      {/* Tickets Table – Compact */}
      <div className="bg-white rounded border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-6"><LoadingSpinner size="small" /></div>
        ) : tickets.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-[10px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium text-gray-500">#</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500">Title</th>
                    {user?.role !== 'EMPLOYEE' && <th className="px-2 py-1 text-left font-medium text-gray-500">Created By</th>}
                    <th className="px-2 py-1 text-left font-medium text-gray-500">Branch</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500">Priority</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500">Status</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500">Created</th>
                    {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'MD') && <th className="px-2 py-1 text-left font-medium text-gray-500">Assigned To</th>}
                    <th className="px-2 py-1 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1 whitespace-nowrap"><span className="font-mono text-primary-600 text-[11px]">{ticket.ticketNumber || ticket.id?.slice(0,6)}</span></td>
                      <td className="px-2 py-1"><div className="flex items-center gap-1">{getStatusIcon(ticket.status)}<span className="text-gray-800 truncate max-w-[200px]">{ticket.title || 'Untitled'}</span></div></td>
                      {user?.role !== 'EMPLOYEE' && <td className="px-2 py-1 whitespace-nowrap">{ticket.createdBy?.name || 'Unknown'}</td>}
                      <td className="px-2 py-1 whitespace-nowrap">{ticket.category || 'General'}</td>
                      <td className="px-2 py-1 whitespace-nowrap">{getPriorityBadge(ticket.priority)}</td>
                      <td className="px-2 py-1 whitespace-nowrap">{getStatusBadge(ticket.status)}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[8px]">{formatDate(ticket.createdAt)}</td>
                      {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'MD') && (
                        <td className="px-2 py-1 whitespace-nowrap">{ticket.assignedTo?.name || <span className="text-gray-400">Unassigned</span>}</td>
                      )}
                      <td className="px-2 py-1 text-right">
                        <Link href={`/tickets/${ticket.id}`} className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-0.5"><FiEye className="w-3 h-3" /> View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-2 py-1.5 bg-gray-50 border-t border-gray-100 flex justify-between text-[8px]">
                <span>{pagination.total} tickets</span>
                <div className="flex gap-1">
                  <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-1.5 border rounded disabled:opacity-40">Prev</button>
                  <span className="px-1">{pagination.page}/{pagination.pages}</span>
                  <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="px-1.5 border rounded disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-6 text-center">
            <FiInbox className="h-6 w-6 text-gray-300 mx-auto mb-1" />
            <p className="text-[9px] text-gray-500 mb-1">No tickets found</p>
            {(filters.status || filters.category || filters.priority || filters.search) ? (
              <button onClick={handleClearFilters} className="text-[8px] text-primary-600">Clear filters</button>
            ) : (
              <Link href="/tickets/new" className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-primary-600 text-white rounded text-[8px]">New Ticket</Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Error Alert Component (compact)
function ErrorAlert({ error, onRetry, onDismiss }) {
  const getIcon = () => {
    if (error.type === 'warning') return <FiAlertCircle className="h-3 w-3 text-amber-500" />
    if (error.type === 'info') return <FiInfo className="h-3 w-3 text-blue-500" />
    return <FiXCircle className="h-3 w-3 text-red-500" />
  }
  const bgColor = error.type === 'warning' ? 'bg-amber-50 border-amber-200' : error.type === 'info' ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
  return (
    <div className={`${bgColor} border rounded p-1.5 flex items-center justify-between gap-1`}>
      <div className="flex items-center gap-1">
        {getIcon()}
        <p className="text-[8px] text-gray-700">{error.message}</p>
      </div>
      <div className="flex gap-1">
        {error.action !== 'login' && <button onClick={onRetry} className="text-[7px] px-1 py-0.5 bg-white border rounded">Retry</button>}
        {error.action === 'login' ? <Link href="/login" className="text-[7px] px-1 py-0.5 bg-primary-600 text-white rounded">Login</Link> : <button onClick={onDismiss} className="text-[7px] px-1 py-0.5 text-gray-500">Dismiss</button>}
      </div>
    </div>
  )
}

// Main export
export default function TicketsPage() {
  return (
    <DashboardLayout>
      <ErrorBoundary fallback={({ error, resetError }) => (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-3">
          <FiAlertCircle className="h-6 w-6 text-red-500 mb-1" />
          <p className="text-[9px] text-gray-600 mb-2">{error?.message || 'Unable to load tickets.'}</p>
          <button onClick={resetError} className="px-2 py-0.5 text-[8px] bg-primary-600 text-white rounded">Retry</button>
        </div>
      )}>
        <TicketsPageContent />
      </ErrorBoundary>
    </DashboardLayout>
  )
}