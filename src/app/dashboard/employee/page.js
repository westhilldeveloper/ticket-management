'use client'

import { useState, useEffect, useCallback } from 'react'
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
  FiTrendingUp,
  FiInbox,
  FiArrowRight,
  FiRefreshCw,
  FiXCircle,
  FiInfo,
  FiUser,
  FiBriefcase
} from 'react-icons/fi'
import { formatDistanceToNow, format } from 'date-fns'
import { useSocket } from '@/app/context/SocketContext'
import toast from 'react-hot-toast'

function EmployeeDashboardContent() {
  const { user, isLoading: authLoading } = useAuth()
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    completed: 0,
    resolved: 0,
    closed: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivities, setRecentActivities] = useState([])
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [networkStatus, setNetworkStatus] = useState('online')
  const { socket } = useSocket();


  useEffect(() => {
  if (socket) {
    console.log('Socket connected in employee dashboard:', socket.id);
    socket.on('connect', () => console.log('Socket connected'));
    socket.on('disconnect', () => console.log('Socket disconnected'));
  }
}, [socket]);

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
      fetchDashboardData()
    }
  }, [authLoading, user, retryCount])

  const fetchDashboardData = useCallback(async () => {
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

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const ticketsRes = await fetch('/api/tickets?limit=15', {
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
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
          // use default
        }
        
        if (ticketsRes.status === 401) {
          throw { message: 'Your session has expired. Please log in again.', code: 'SESSION_EXPIRED', type: 'error' }
        } else if (ticketsRes.status === 403) {
          throw { message: 'You do not have permission to view tickets.', code: 'FORBIDDEN', type: 'error' }
        } else if (ticketsRes.status === 429) {
          throw { message: 'Too many requests. Please wait a moment and try again.', code: 'RATE_LIMITED', type: 'warning' }
        } else if (ticketsRes.status >= 500) {
          throw { message: 'Server error. Our team has been notified.', code: 'SERVER_ERROR', type: 'error' }
        }
        
        throw { message: errorMessage, status: ticketsRes.status, code: errorCode, type: 'error' }
      }
      
      const ticketsText = await ticketsRes.text()
      if (!ticketsText) {
        throw { message: 'Empty response from server', code: 'EMPTY_RESPONSE', type: 'error' }
      }
      
      let ticketsData
      try {
        ticketsData = JSON.parse(ticketsText)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        throw { message: 'Invalid data format received from server', code: 'PARSE_ERROR', type: 'error' }
      }
      
      if (!ticketsData || typeof ticketsData !== 'object') {
        throw { message: 'Invalid data structure received', code: 'INVALID_DATA', type: 'error' }
      }

      const ticketsArray = Array.isArray(ticketsData.tickets) ? ticketsData.tickets : []
      setTickets(ticketsArray)
      
      // Calculate stats with proper status categorization
      const stats = ticketsArray.reduce((acc, ticket) => {
        if (!ticket || typeof ticket !== 'object') return acc
        
        acc.total++
        const status = ticket.status
        
        // Categorize statuses
        if (['OPEN', 'PENDING_MD_APPROVAL', 'PENDING_THIRD_PARTY', 'REJECTED_BY_MD','REJECTED_BY_SERVICE', 'PENDING_SERVICE_ACCEPTANCE'].includes(status)) {
          acc.open++
        } else if (['IN_PROGRESS', 'SERVICE_IN_PROGRESS'].includes(status)) {
          acc.inProgress++
        } else if (['RESOLVED', 'CLOSED', 'SERVICE_RESOLVED'].includes(status)) {
          acc.completed++
        }
        
        // Keep resolved/closed counts for potential future use
        if (status === 'RESOLVED' || status === 'SERVICE_RESOLVED') acc.resolved++
        if (status === 'CLOSED') acc.closed++
        
        return acc
      }, { total: 0, open: 0, inProgress: 0, completed: 0, resolved: 0, closed: 0 })
      
      setStats(stats)

      // Fetch recent activities (non-critical)
      try {
        const historyRes = await fetch('/api/tickets/history?limit=10', { signal: controller.signal })
        if (historyRes.ok) {
          const historyText = await historyRes.text()
          if (historyText) {
            const historyData = JSON.parse(historyText)
            setRecentActivities(Array.isArray(historyData.history) ? historyData.history : [])
          }
        }
      } catch (historyError) {
        console.warn('Failed to fetch activity history:', historyError.message)
        setRecentActivities([])
      }
      
    } catch (error) {
      console.error('Dashboard data fetch error:', error)
      
      if (error.name === 'AbortError' || error.code === 'TIMEOUT') {
        setError({
          message: 'Request timed out. Please check your connection and try again.',
          code: 'TIMEOUT',
          type: 'warning'
        })
      } else if (error.code === 'UNAUTHENTICATED') {
        setError({
          message: 'Please log in to view your dashboard',
          code: 'UNAUTHENTICATED',
          type: 'info',
          action: 'login'
        })
      } else {
        setError({
          message: error.message || 'Failed to load dashboard data',
          code: error.code || 'UNKNOWN_ERROR',
          type: error.type || 'error',
          status: error.status,
          action: error.action
        })
      }
      
      // Fallback data
      setTickets([])
      setRecentActivities([])
      setStats({ total: 0, open: 0, inProgress: 0, completed: 0, resolved: 0, closed: 0 })
    } finally {
      setLoading(false)
    }
  }, [user, retryCount, networkStatus])

  // Socket event for new tickets
  useEffect(() => {
  if (!socket) return;

  const handleNewTicket = (newTicket) => {
    toast.success(`New ticket #${newTicket.ticketNumber} created`);
    fetchDashboardData();
  };

 const handleTicketUpdated = (updatedTicket) => {
  console.log('ticket-updated received in employee dashboard:', updatedTicket);
  fetchDashboardData();
};

  socket.on('new-ticket', handleNewTicket);
  socket.on('ticket-updated', handleTicketUpdated);

  return () => {
    socket.off('new-ticket', handleNewTicket);
    socket.off('ticket-updated', handleTicketUpdated);
  };
}, [socket, fetchDashboardData]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  const handleDismissError = () => {
    setError(null)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPEN':
        return <FiAlertCircle className="h-4 w-4 text-amber-500" aria-hidden="true" />
      case 'IN_PROGRESS':
        return <FiClock className="h-4 w-4 text-blue-500" aria-hidden="true" />
      case 'RESOLVED':
        return <FiCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
      case 'CLOSED':
        return <FiCheck className="h-4 w-4 text-gray-400" aria-hidden="true" />
      default:
        return <FiAlertCircle className="h-4 w-4 text-gray-400" aria-hidden="true" />
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      OPEN: 'bg-amber-50 text-amber-700 border-amber-200',
      IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
      RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      CLOSED: 'bg-gray-50 text-gray-700 border-gray-200'
    }

    const displayStatus = status?.replace('_', ' ') || 'Unknown'

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.CLOSED}`}>
        {displayStatus}
      </span>
    )
  }

  const getPriorityBadge = (priority) => {
    if (!priority) return null
    
    const styles = {
      URGENT: 'bg-red-50 text-red-700 border-red-200',
      HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
      MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
      LOW: 'bg-gray-50 text-gray-700 border-gray-200'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[priority] || styles.LOW}`}>
        {priority}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently'
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Recently'
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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <FiUser className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
        <p className="text-gray-500 mb-6">Please log in to view your dashboard</p>
        <Link 
          href="/login" 
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Go to Login
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
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

      {error && (
        <ErrorAlert 
          error={error} 
          onRetry={handleRetry} 
          onDismiss={handleDismissError}
        />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={FiCheck}
          color="bg-emerald-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            href="/tickets/new"
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <FiPlus className="h-4 w-4 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">New Ticket</span>
            </div>
            <FiArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </Link>
          
          <Link
            href="/tickets"
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-200 rounded-lg">
                <FiEye className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">View All</span>
            </div>
            <FiArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </Link>
          
          <Link
            href="/tickets/history"
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-200 rounded-lg">
                <FiCalendar className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">History</span>
            </div>
            <FiArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Recent Tickets
          </h2>
        </div>
        
        {tickets.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {getStatusIcon(ticket.status)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {ticket.title || 'Untitled Ticket'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          #{ticket.ticketNumber || ticket.id?.slice(0, 8) || 'N/A'}
                        </span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          {ticket.category || 'General'}
                        </span>
                        {ticket.priority && (
                          <>
                            <span className="text-xs text-gray-300">•</span>
                            {getPriorityBadge(ticket.priority)}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 ml-4">
                    {getStatusBadge(ticket.status)}
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(ticket.createdAt)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <FiInbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No tickets yet</p>
            <Link
              href="/tickets/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiPlus className="h-4 w-4 mr-2" />
              Create your first ticket
            </Link>
          </div>
        )}
        
        {tickets.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <Link
              href="/tickets"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded"
            >
              View all tickets
              <FiArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {recentActivities.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Recent Activity
            </h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-3">
                <div className="flex items-start space-x-3">
                  <FiInfo className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{activity.description || 'Activity'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function EmployeeDashboard() {
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
              {error?.message || 'We\'re having trouble loading your dashboard.'}
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
                href="/"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Go to Home
              </Link>
            </div>
          </div>
        )}
      >
        <EmployeeDashboardContent />
      </ErrorBoundary>
    </DashboardLayout>
  )
}