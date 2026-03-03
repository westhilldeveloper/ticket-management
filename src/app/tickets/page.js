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
  FiPrinter,
  FiMail,
  FiMessageSquare,
  FiTag,
  FiTrendingUp,
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
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  
  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    search: ''
  })
  
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTickets, setSelectedTickets] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    pendingMD: 0,
    pendingThirdParty: 0,
    resolved: 0,
    closed: 0,
    critical: 0
  })

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online')
    const handleOffline = () => setNetworkStatus('offline')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && user) {
      fetchTickets()
    }
  }, [authLoading, user, retryCount, filters, pagination.page])

  const fetchTickets = async () => {
    // Check network status first
    if (networkStatus === 'offline') {
      setError({
        message: 'You are currently offline. Please check your internet connection.',
        code: 'OFFLINE',
        type: 'warning'
      })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      if (!user) {
        throw {
          message: 'User not authenticated',
          code: 'UNAUTHENTICATED',
          type: 'error'
        }
      }

      // Build query params
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.category && { category: filters.category }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && { search: filters.search })
      })

      // Fetch tickets with timeout and abort controller
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const ticketsRes = await fetch(`/api/tickets?${queryParams}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!ticketsRes.ok) {
        let errorMessage = 'Failed to fetch tickets'
        let errorCode = 'TICKETS_FETCH_ERROR'
        
        try {
          const errorData = await ticketsRes.json()
          errorMessage = errorData.message || errorMessage
          errorCode = errorData.code || errorCode
        } catch {
          // Use default error message
        }
        
        // Handle specific HTTP status codes
        if (ticketsRes.status === 401) {
          throw {
            message: 'Your session has expired. Please log in again.',
            code: 'SESSION_EXPIRED',
            type: 'error'
          }
        } else if (ticketsRes.status === 403) {
          throw {
            message: 'You do not have permission to view tickets.',
            code: 'FORBIDDEN',
            type: 'error'
          }
        } else if (ticketsRes.status === 429) {
          throw {
            message: 'Too many requests. Please wait a moment and try again.',
            code: 'RATE_LIMITED',
            type: 'warning'
          }
        } else if (ticketsRes.status >= 500) {
          throw {
            message: 'Server error. Our team has been notified.',
            code: 'SERVER_ERROR',
            type: 'error'
          }
        }
        
        throw {
          message: errorMessage,
          status: ticketsRes.status,
          code: errorCode,
          type: 'error'
        }
      }
      
      const ticketsText = await ticketsRes.text()
      if (!ticketsText) {
        throw {
          message: 'Empty response from server',
          code: 'EMPTY_RESPONSE',
          type: 'error'
        }
      }
      
      let ticketsData
      try {
        ticketsData = JSON.parse(ticketsText)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        throw {
          message: 'Invalid data format received from server',
          code: 'PARSE_ERROR',
          type: 'error'
        }
      }
      
      // Validate tickets data structure
      if (!ticketsData || typeof ticketsData !== 'object') {
        throw {
          message: 'Invalid data structure received',
          code: 'INVALID_DATA',
          type: 'error'
        }
      }

      const ticketsArray = Array.isArray(ticketsData.tickets) ? ticketsData.tickets : []
      setTickets(ticketsArray)
      
      // Set pagination
      if (ticketsData.pagination) {
        setPagination(ticketsData.pagination)
      }
      
      // Calculate stats
      const stats = ticketsArray.reduce((acc, ticket) => {
        if (!ticket || typeof ticket !== 'object') return acc
        
        acc.total++
        if (ticket.status === 'OPEN') acc.open++
        else if (ticket.status === 'IN_PROGRESS') acc.inProgress++
        else if (ticket.status === 'PENDING_MD_APPROVAL') acc.pendingMD++
        else if (ticket.status === 'PENDING_THIRD_PARTY') acc.pendingThirdParty++
        else if (ticket.status === 'RESOLVED') acc.resolved++
        else if (ticket.status === 'CLOSED') acc.closed++
        
        if (ticket.priority === 'CRITICAL') acc.critical++
        
        return acc
      }, { 
        total: 0, 
        open: 0, 
        inProgress: 0, 
        pendingMD: 0,
        pendingThirdParty: 0,
        resolved: 0, 
        closed: 0,
        critical: 0 
      })
      
      setStats(stats)
      
    } catch (error) {
      console.error('Tickets fetch error:', error)
      
      // Handle different error types
      if (error.name === 'AbortError' || error.code === 'TIMEOUT') {
        setError({
          message: 'Request timed out. Please check your connection and try again.',
          code: 'TIMEOUT',
          type: 'warning'
        })
      } else if (error.code === 'UNAUTHENTICATED') {
        setError({
          message: 'Please log in to view tickets',
          code: 'UNAUTHENTICATED',
          type: 'info',
          action: 'login'
        })
      } else {
        setError({
          message: error.message || 'Failed to load tickets',
          code: error.code || 'UNKNOWN_ERROR',
          type: error.type || 'error',
          status: error.status,
          action: error.action
        })
      }
      
      // Set fallback data
      setTickets([])
      setStats({
        total: 0,
        open: 0,
        inProgress: 0,
        pendingMD: 0,
        pendingThirdParty: 0,
        resolved: 0,
        closed: 0,
        critical: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  const handleDismissError = () => {
    setError(null)
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page on filter change
  }

  const handleClearFilters = () => {
    setFilters({
      status: '',
      category: '',
      priority: '',
      search: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTickets([])
    } else {
      setSelectedTickets(tickets.map(t => t.id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectTicket = (ticketId) => {
    if (selectedTickets.includes(ticketId)) {
      setSelectedTickets(prev => prev.filter(id => id !== ticketId))
      setSelectAll(false)
    } else {
      setSelectedTickets(prev => [...prev, ticketId])
      if (selectedTickets.length + 1 === tickets.length) {
        setSelectAll(true)
      }
    }
  }

  const handleBulkAction = async (action) => {
    // Implement bulk actions (e.g., assign, change status, export)
    console.log('Bulk action:', action, selectedTickets)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPEN':
        return <FiAlertCircle className="h-4 w-4 text-amber-500" aria-hidden="true" />
      case 'IN_PROGRESS':
        return <FiClock className="h-4 w-4 text-blue-500" aria-hidden="true" />
      case 'PENDING_MD_APPROVAL':
        return <FiAward className="h-4 w-4 text-purple-500" aria-hidden="true" />
      case 'PENDING_THIRD_PARTY':
        return <FiUsers className="h-4 w-4 text-indigo-500" aria-hidden="true" />
      case 'RESOLVED':
        return <FiCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
      case 'CLOSED':
        return <FiCheck className="h-4 w-4 text-gray-400" aria-hidden="true" />
      case 'APPROVED_BY_MD':
        return <FiAward className="h-4 w-4 text-green-500" aria-hidden="true" />
      case 'REJECTED_BY_MD':
        return <FiXCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
      default:
        return <FiAlertCircle className="h-4 w-4 text-gray-400" aria-hidden="true" />
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
      'RESOLVED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'CLOSED': 'bg-gray-50 text-gray-700 border-gray-200'
    }

    const displayStatus = status?.replace(/_/g, ' ') || 'Unknown'

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.CLOSED}`}>
        {displayStatus}
      </span>
    )
  }

  const getPriorityBadge = (priority) => {
    if (!priority) return null
    
    const styles = {
      'CRITICAL': 'bg-red-50 text-red-700 border-red-200',
      'HIGH': 'bg-orange-50 text-orange-700 border-orange-200',
      'MEDIUM': 'bg-blue-50 text-blue-700 border-blue-200',
      'LOW': 'bg-gray-50 text-gray-700 border-gray-200'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[priority] || styles.LOW}`}>
        {priority}
      </span>
    )
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'HR':
        return <FiUsers className="h-4 w-4" />
      case 'IT':
        return <FiBriefcase className="h-4 w-4" />
      case 'TECHNICAL':
        return <FiTag className="h-4 w-4" />
      default:
        return <FiInfo className="h-4 w-4" />
    }
  }

  const getRoleBadge = (role) => {
    const styles = {
      'SUPER_ADMIN': 'bg-purple-50 text-purple-700 border-purple-200',
      'MD': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'ADMIN': 'bg-blue-50 text-blue-700 border-blue-200',
      'EMPLOYEE': 'bg-gray-50 text-gray-700 border-gray-200'
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[role] || styles.EMPLOYEE}`}>
        {role?.replace('_', ' ') || 'Employee'}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    } catch {
      return 'Invalid date'
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, trend }) => {
    const displayValue = typeof value === 'number' ? value : 0
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">{displayValue}</p>
            {trend && (
              <p className={`text-xs mt-2 ${trend.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
        </div>
      </div>
    )
  }

  const ErrorAlert = ({ error, onRetry, onDismiss }) => {
    const getIcon = () => {
      switch (error.type) {
        case 'warning':
          return <FiAlertCircle className="h-5 w-5 text-amber-500" />
        case 'info':
          return <FiInfo className="h-5 w-5 text-blue-500" />
        default:
          return <FiXCircle className="h-5 w-5 text-red-500" />
      }
    }

    const getBgColor = () => {
      switch (error.type) {
        case 'warning':
          return 'bg-amber-50 border-amber-200'
        case 'info':
          return 'bg-blue-50 border-blue-200'
        default:
          return 'bg-red-50 border-red-200'
      }
    }

    const getTextColor = () => {
      switch (error.type) {
        case 'warning':
          return 'text-amber-800'
        case 'info':
          return 'text-blue-800'
        default:
          return 'text-red-800'
      }
    }

    const getButtonColor = () => {
      switch (error.type) {
        case 'warning':
          return 'text-amber-800 bg-amber-100 hover:bg-amber-200 focus:ring-amber-500'
        case 'info':
          return 'text-blue-800 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500'
        default:
          return 'text-red-800 bg-red-100 hover:bg-red-200 focus:ring-red-500'
      }
    }

    return (
      <div className={`${getBgColor()} border rounded-lg p-4`} role="alert">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${getTextColor()}`}>
              {error.type === 'warning' ? 'Warning' : error.type === 'info' ? 'Information' : 'Error'}
            </h3>
            <div className={`mt-2 text-sm ${error.type === 'warning' ? 'text-amber-700' : error.type === 'info' ? 'text-blue-700' : 'text-red-700'}`}>
              <p>{error.message}</p>
              {error.code && (
                <p className="text-xs mt-1 opacity-75">Error code: {error.code}</p>
              )}
            </div>
            <div className="mt-4 flex space-x-3">
              {error.action !== 'login' && (
                <button
                  onClick={onRetry}
                  className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${getButtonColor()} focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
                >
                  <FiRefreshCw className="h-4 w-4 mr-1.5" />
                  Try Again
                </button>
              )}
              {error.action === 'login' ? (
                <Link
                  href="/login"
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  Go to Login
                </Link>
              ) : (
                <button
                  onClick={onDismiss}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  // Not authenticated state
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <FiUser className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
        <p className="text-gray-500 mb-6">Please log in to view tickets</p>
        <Link 
          href="/login" 
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Go to Login
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Network Status Warning */}
      {networkStatus === 'offline' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <FiAlertCircle className="h-5 w-5 text-amber-500 mr-3" />
            <p className="text-sm text-amber-700">
              You are currently offline. Some features may be unavailable.
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <ErrorAlert 
          error={error} 
          onRetry={handleRetry} 
          onDismiss={handleDismissError}
        />
      )}

      {/* Header Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Tickets</h1>
            <p className="text-gray-300 text-sm flex items-center">
              <FiBriefcase className="h-4 w-4 mr-1.5" />
              {user?.role === 'EMPLOYEE' 
                ? 'View and manage your tickets' 
                : user?.role === 'ADMIN'
                ? 'Manage all tickets and assignments'
                : user?.role === 'MD'
                ? 'Review and approve tickets'
                : 'Full system access and control'
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="bg-white/10 px-3 py-1.5 rounded-lg text-sm flex items-center">
              <FiUser className="h-4 w-4 mr-2" />
              {user?.name}
            </span>
            {getRoleBadge(user?.role)}
          </div>
        </div>
      </div>

      {/* Stats Cards - Show different stats based on role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Tickets"
          value={stats.total}
          icon={FiInbox}
          color="bg-gray-800"
        />
        <StatCard
          title="Open"
          value={stats.open}
          icon={FiAlertCircle}
          color="bg-amber-500"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={FiClock}
          color="bg-blue-500"
        />
        {(user?.role === 'MD' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
          <StatCard
            title="Pending MD"
            value={stats.pendingMD}
            icon={FiAward}
            color="bg-purple-500"
          />
        )}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
          <StatCard
            title="Third Party"
            value={stats.pendingThirdParty}
            icon={FiUsers}
            color="bg-indigo-500"
          />
        )}
        <StatCard
          title="Completed"
          value={stats.resolved + stats.closed}
          icon={FiCheck}
          color="bg-emerald-500"
        />
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MD') && (
          <StatCard
            title="Critical"
            value={stats.critical}
            icon={FiAlertCircle}
            color="bg-red-500"
          />
        )}
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showFilters 
                  ? 'bg-primary-50 text-primary-700 border-primary-200' 
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              } border`}
            >
              <FiFilter className="h-4 w-4 mr-2" />
              Filters
              <FiChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Search Bar */}
            <div className="relative flex-1 sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search tickets..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {/* Bulk Actions */}
            {selectedTickets.length > 0 && (
              <div className="flex items-center space-x-2 mr-2">
                <span className="text-sm text-gray-500">
                  {selectedTickets.length} selected
                </span>
                <button
                  onClick={() => handleBulkAction('export')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Export selected"
                >
                  <FiDownload className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleBulkAction('email')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Email selected"
                >
                  <FiMail className="h-4 w-4" />
                </button>
              </div>
            )}

            <Link
              href="/tickets/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              <FiPlus className="h-4 w-4 mr-2" />
              New Ticket
            </Link>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="PENDING_MD_APPROVAL">Pending MD Approval</option>
                  <option value="PENDING_THIRD_PARTY">Pending Third Party</option>
                  <option value="APPROVED_BY_MD">Approved by MD</option>
                  <option value="REJECTED_BY_MD">Rejected by MD</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="HR">HR</option>
                  <option value="IT">IT</option>
                  <option value="TECHNICAL">Technical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={filters.priority}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : tickets.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket #
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    {user?.role !== 'EMPLOYEE' && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                    )}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'MD') && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                    )}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedTickets.includes(ticket.id)}
                          onChange={() => handleSelectTicket(ticket.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-primary-600">
                          {ticket.ticketNumber || `#${ticket.id?.slice(0, 8)}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {getStatusIcon(ticket.status)}
                          <span className="ml-2 text-sm text-gray-900 font-medium">
                            {ticket.title || 'Untitled Ticket'}
                          </span>
                        </div>
                      </td>
                      {user?.role !== 'EMPLOYEE' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <FiUser className="h-4 w-4 text-gray-500" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {ticket.createdBy?.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {ticket.createdBy?.department || 'No department'}
                              </p>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          {getCategoryIcon(ticket.category)}
                          <span className="ml-1.5">{ticket.category || 'General'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(ticket.priority)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(ticket.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div title={formatDateTime(ticket.createdAt)}>
                          {formatDate(ticket.createdAt)}
                        </div>
                      </td>
                      {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'MD') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {ticket.assignedTo ? (
                            <div className="flex items-center">
                              <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <FiUser className="h-3 w-3 text-gray-500" />
                              </div>
                              <span className="ml-2 text-sm text-gray-900">
                                {ticket.assignedTo.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Unassigned</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                        >
                          <FiEye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <FiChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {[...Array(pagination.pages)].map((_, i) => {
                        const pageNum = i + 1
                        if (
                          pageNum === 1 ||
                          pageNum === pagination.pages ||
                          (pageNum >= pagination.page - 2 && pageNum <= pagination.page + 2)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                pageNum === pagination.page
                                  ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        } else if (pageNum === pagination.page - 3 || pageNum === pagination.page + 3) {
                          return (
                            <span
                              key={pageNum}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                            >
                              ...
                            </span>
                          )
                        }
                        return null
                      })}
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <FiChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="px-6 py-12 text-center">
            <FiInbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No tickets found</p>
            <p className="text-sm text-gray-400 mb-6">
              {filters.status || filters.category || filters.priority || filters.search
                ? 'Try adjusting your filters'
                : 'Get started by creating your first ticket'}
            </p>
            {(filters.status || filters.category || filters.priority || filters.search) ? (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <FiRefreshCw className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            ) : (
              <Link
                href="/tickets/new"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                <FiPlus className="h-4 w-4 mr-2" />
                Create your first ticket
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Main export with DashboardLayout and ErrorBoundary wrapper
export default function TicketsPage() {
  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={({ error, resetError }) => (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
            <FiAlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-500 mb-4 max-w-md">
              {error?.message || 'We\'re having trouble loading the tickets page.'}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={resetError}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiRefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}
      >
        <TicketsPageContent />
      </ErrorBoundary>
    </DashboardLayout>
  )
}