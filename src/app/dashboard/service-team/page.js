// app/dashboard/service-team/page.js
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import { useSocket } from '@/app/context/SocketContext'
import { useToast } from '@/app/context/ToastContext'
import DashboardLayout from '@/app/components/layouts/DashboardLayout'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'
import ErrorBoundary from '@/app/components/common/ErrorBoundary'
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiUser,
  FiCalendar,
  FiTag,
  FiMessageSquare,
  FiSend,
  FiThumbsUp,
  FiThumbsDown,
  FiExternalLink,
  FiEye,
  FiRefreshCw,
  FiTrendingUp,
  FiInbox,
  FiCheckSquare,
  FiBarChart2,
  FiFilter,
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiTool,
  FiBriefcase,
  FiUserPlus,
  FiCheck
} from 'react-icons/fi'
import { formatDistanceToNow, format } from 'date-fns'

function ServiceTeamDashboardContent() {
    const router = useRouter()
   
  const { user, loading: authLoading } = useAuth()
  const { socket, connected, joinTicket, leaveTicket } = useSocket()
  const toast = useToast()
  

  // State for tickets
  const [pendingAcceptance, setPendingAcceptance] = useState([])
  const [inProgressTickets, setInProgressTickets] = useState([])
  const [resolvedTickets, setResolvedTickets] = useState([])

  // Loading states
  const [loading, setLoading] = useState({
    pending: true,
    inProgress: true,
    resolved: true,
    stats: true
  })

  // Stats state
  const [stats, setStats] = useState({
    pendingAcceptance: 0,
    inProgress: 0,
    resolvedThisMonth: 0,
    totalResolved: 0,
    averageCompletionTime: '0h',
    byCategory: {
      HR: { total: 0, resolved: 0 },
      IT: { total: 0, resolved: 0 },
      TECHNICAL: { total: 0, resolved: 0 }
    },
    byPriority: {
      LOW: { total: 0, resolved: 0 },
      MEDIUM: { total: 0, resolved: 0 },
      HIGH: { total: 0, resolved: 0 },
      CRITICAL: { total: 0, resolved: 0 }
    }
  })

  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    priority: '',
    dateRange: 'all',
    search: ''
  })

  const [showFilters, setShowFilters] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [serviceDecision, setServiceDecision] = useState(null) // 'accept' or 'reject'
  const [serviceResponse, setServiceResponse] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Pagination (if needed, you can expand later)
  const [pagination, setPagination] = useState({
    pendingPage: 1,
    inProgressPage: 1,
    resolvedPage: 1,
    limit: 10
  })


  
  // Set up socket listeners for service team
  useEffect(() => {
    if (socket && connected) {
      console.log('Setting up service team socket listeners')

      // Listen for new assignments
      socket.on('new-ticket-assigned', (data) => {
        console.log('New ticket assigned:', data)
        toast.success('New ticket assigned to you')
        fetchPendingAcceptance()
      })

      // Listen for ticket updates
     socket.on('ticket-updated', (ticket) => {
  console.log('Ticket updated:', ticket);
  if (ticket?.assignedToId === user?.id) {
    fetchAllData();
  }
});

      return () => {
        socket.off('new-ticket-assigned')
        socket.off('ticket-updated')
      }
    }
  }, [socket, connected, user?.id])

  // Fetch data on mount and when filters change
  useEffect(() => {
    if (user?.id) {
      fetchAllData()
    }
  }, [user?.id, filters.category, filters.priority, filters.dateRange, filters.search])

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchPendingAcceptance(),
        fetchInProgressTickets(),
        fetchResolvedTickets(),
        fetchStats()
      ])
    } catch (error) {
      console.error('Error fetching all data:', error)
      toast.error('Failed to load some data')
    }
  }

  const fetchPendingAcceptance = async () => {
    if (!user?.id) return
    try {
      setLoading(prev => ({ ...prev, pending: true }))
      const queryParams = new URLSearchParams({
        assignedToId: user.id,
        status: 'PENDING_SERVICE_ACCEPTANCE',
        limit: '50',
        ...(filters.category && { category: filters.category }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && { search: filters.search })
      })

      const res = await fetch(`/api/tickets?${queryParams}`)
      const data = await res.json()

      if (res.ok) {
        setPendingAcceptance(data.tickets || [])
        // Join each ticket room for real-time updates
        data.tickets?.forEach(ticket => joinTicket(ticket.id))
      } else {
        throw new Error(data.message || 'Failed to fetch pending acceptance')
      }
    } catch (error) {
      console.error('Error fetching pending acceptance:', error)
      toast.error('Failed to fetch pending acceptance')
    } finally {
      setLoading(prev => ({ ...prev, pending: false }))
    }
  }

  const fetchInProgressTickets = async () => {
    if (!user?.id) return
    try {
      setLoading(prev => ({ ...prev, inProgress: true }))
      const queryParams = new URLSearchParams({
        assignedToId: user.id,
        status: 'SERVICE_IN_PROGRESS',
        limit: '50',
        ...(filters.category && { category: filters.category }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && { search: filters.search })
      })

      const res = await fetch(`/api/tickets?${queryParams}`)
      const data = await res.json()

      if (res.ok) {
        setInProgressTickets(data.tickets || [])
        data.tickets?.forEach(ticket => joinTicket(ticket.id))
      } else {
        throw new Error(data.message || 'Failed to fetch in-progress tickets')
      }
    } catch (error) {
      console.error('Error fetching in-progress tickets:', error)
    } finally {
      setLoading(prev => ({ ...prev, inProgress: false }))
    }
  }

  const fetchResolvedTickets = async () => {
    if (!user?.id) return
    try {
      setLoading(prev => ({ ...prev, resolved: true }))
      const queryParams = new URLSearchParams({
        assignedToId: user.id,
        status: 'SERVICE_RESOLVED',
        limit: '20',
        sort: 'desc'
      })

      const res = await fetch(`/api/tickets/service-history?${queryParams}`)
      const data = await res.json()

      if (res.ok) {
        setResolvedTickets(data.tickets || [])
      }
    } catch (error) {
      console.error('Error fetching resolved tickets:', error)
    } finally {
      setLoading(prev => ({ ...prev, resolved: false }))
    }
  }

  const fetchStats = async () => {
    if (!user?.id) return
    try {
      setLoading(prev => ({ ...prev, stats: true }))
      const res = await fetch(`/api/tickets/service-stats?userId=${user.id}`)
      const data = await res.json()

      if (res.ok) {
        setStats(data.stats || {})
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(prev => ({ ...prev, stats: false }))
    }
  }

  // Handle accept/reject
  // Handle accept/reject
const handleServiceResponse = async (ticketId, action) => {
  if (action === 'reject' && !serviceResponse.trim()) {
    toast.error('Please provide a reason for rejection');
    return;
  }

  setSubmitting(true);
  try {
    const response = await fetch(`/api/public/tickets/${ticketId}/service-team-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action, // 'accept' or 'reject'
        review: serviceResponse || (action === 'accept' ? 'Accepted by service team' : '')
      }),
      credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to respond');

    // Emit socket event (optional – your backend may already emit)
    if (socket && connected) {
     socket.emit('service-team-action-completed', {
  ticket: data.ticket,
  action: action, // 'accept' or 'reject'
  userId: user.id
});
    }

    // Update local state
    setPendingAcceptance(prev => prev.filter(t => t.id !== ticketId));
    if (action === 'accept') {
      setInProgressTickets(prev => [data.ticket, ...prev].slice(0, 50));
    }

    fetchStats();
    setSelectedTicket(null);
    setServiceDecision(null);
    setServiceResponse('');
    toast.success(action === 'accept' ? 'Ticket accepted' : 'Ticket rejected');
  } catch (error) {
    console.error('Error responding to ticket:', error);
    toast.error(error.message);
  } finally {
    setSubmitting(false);
  }
};

  // Handle work update (progress note or resolve)
  // Handle work update (progress note or resolve)
const handleWorkUpdate = async (ticketId, workType) => {
  if (!serviceResponse.trim()) {
    toast.error('Please add work details');
    return;
  }

  setSubmitting(true);
  try {
    const response = await fetch(`/api/public/tickets/${ticketId}/service-work-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workType: workType === 'resolve' ? 'resolve' : 'progress', // ensure correct value
        details: serviceResponse
      }),
      credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update work');

    // Emit socket event
    if (socket && connected) {
  socket.emit('service-team-action-completed', {
    ticket: data.ticket,
    action: workType === 'resolve' ? 'RESOLVED' : 'PROGRESS_NOTE', // 'accept' or 'reject'
    userId: user.id
  });
}

    // Update local state
    if (workType === 'resolve') {
      setInProgressTickets(prev => prev.filter(t => t.id !== ticketId));
      setResolvedTickets(prev => [data.ticket, ...prev].slice(0, 20));
    } else {
      // progress note – update the ticket in the list to reflect any changes
      setInProgressTickets(prev =>
        prev.map(t => (t.id === ticketId ? data.ticket : t))
      );
    }

    fetchStats();
    setSelectedTicket(null);
    setServiceResponse('');
    toast.success('Work update recorded');
  } catch (error) {
    console.error('Error updating work:', error);
    toast.error(error.message);
  } finally {
    setSubmitting(false);
  }
};

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING_SERVICE_ACCEPTANCE':
        return <FiUserPlus className="h-5 w-5 text-indigo-500" />
      case 'SERVICE_IN_PROGRESS':
        return <FiTool className="h-5 w-5 text-blue-500" />
      case 'RESOLVED':
        return <FiCheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <FiAlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      'PENDING_SERVICE_ACCEPTANCE': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'SERVICE_IN_PROGRESS': 'bg-blue-100 text-blue-800 border-blue-200',
      'RESOLVED': 'bg-green-100 text-green-800 border-green-200',
      'REJECTED_BY_MD': 'bg-red-100 text-red-800 border-red-200',
      'REJECTED_BY_SERVICE': 'bg-red-100 text-red-800 border-red-200',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace(/_/g, ' ')}
      </span>
    )
  }

  const getPriorityBadge = (priority) => {
    const styles = {
      'CRITICAL': 'bg-red-100 text-red-800 border-red-200',
      'HIGH': 'bg-orange-100 text-orange-800 border-orange-200',
      'MEDIUM': 'bg-blue-100 text-blue-800 border-blue-200',
      'LOW': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[priority] || styles.LOW}`}>
        {priority}
      </span>
    )
  }

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
    </div>
  )

  const ProgressBar = ({ label, value, total, color }) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0
    return (
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600">{label}</span>
          <span className="text-gray-900 font-medium">{value} ({percentage}%)</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    )
  }

  // Loading state
  if (loading.pending && loading.inProgress && loading.stats && pendingAcceptance.length === 0 && inProgressTickets.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="large" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Connection Status */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center mb-2">
                <h1 className="text-2xl font-bold mr-3">Service Team Dashboard</h1>
                {connected ? (
                  <span className="flex items-center text-xs bg-green-500 px-2 py-1 rounded-full">
                    <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                    Live
                  </span>
                ) : (
                  <span className="flex items-center text-xs bg-gray-500 px-2 py-1 rounded-full">
                    <span className="w-2 h-2 bg-gray-300 rounded-full mr-1"></span>
                    Offline
                  </span>
                )}
              </div>
              <p className="text-indigo-100">
                Welcome back, {user?.name}. Manage your assigned tickets and track your progress.
              </p>
            </div>
            <div className="bg-white/10 p-3 rounded-lg">
              <FiTool className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pending Acceptance"
            value={stats.pendingAcceptance || pendingAcceptance.length}
            icon={FiUserPlus}
            color="bg-indigo-600"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress || inProgressTickets.length}
            icon={FiTool}
            color="bg-blue-600"
          />
          <StatCard
            title="Resolved (Month)"
            value={stats.resolvedThisMonth || 0}
            icon={FiCheckCircle}
            color="bg-green-600"
          />
          <StatCard
            title="Total Resolved"
            value={stats.totalResolved || 0}
            icon={FiBarChart2}
            color="bg-purple-600"
            subtext={`Avg time: ${stats.averageCompletionTime}`}
          />
        </div>

        

        {/* Pending Acceptance Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Your Acceptance
              {pendingAcceptance.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({pendingAcceptance.length} tickets)
                </span>
              )}
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <FiFilter className="mr-1" />
              Filters
              <FiChevronDown className={`ml-1 transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="input-field text-sm"
                >
                  <option value="">All Categories</option>
                  <option value="HR">HR</option>
                  <option value="IT">IT</option>
                  <option value="TECHNICAL">Technical</option>
                </select>

                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="input-field text-sm"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>

                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="input-field text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>

                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="input-field pl-10 text-sm w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pending Acceptance List */}
          {loading.pending ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : pendingAcceptance.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {pendingAcceptance.map((ticket) => (
                <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors">
                  {selectedTicket === ticket.id ? (
                    // Acceptance Form
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{ticket.title}</h3>
                          <p className="text-sm text-gray-500">#{ticket.ticketNumber}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTicket(null)
                            setServiceDecision(null)
                            setServiceResponse('')
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <FiXCircle className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Ticket Preview */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-bold text-gray-700 line-clamp-3">{ticket.requestServiceType}</p>
                        <p className="text-sm mt-6 text-gray-700 line-clamp-3">{ticket.description}</p>
                        

                        {ticket.reviews?.length > 0 && (
                          <div className="mt-3 p-3 bg-white rounded-lg">
                            <p className="text-xs font-medium text-gray-500 mb-1">Admin Instructions:</p>
                            <p className="text-sm text-gray-700">{ticket.reviews[0].content}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Created By</p>
                            <p className="font-medium">{ticket.createdBy?.name}</p>
                            <p className="text-xs text-gray-500">{ticket.createdBy?.department}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Branch</p>
                            <p className="font-medium mb-2">{user.branch || "Not Specified"}</p>
                            {getPriorityBadge(ticket.priority)}
                          </div>
                        </div>
                      </div>

                      {!serviceDecision ? (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => setServiceDecision('accept')}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                          >
                            <FiThumbsUp className="mr-2" />
                            Accept
                          </button>
                          <button
                            onClick={() => setServiceDecision('reject')}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                          >
                            <FiThumbsDown className="mr-2" />
                            Reject
                          </button>
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                          >
                            <FiEye className="mr-2" />
                            View Full
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {serviceDecision === 'reject' && (
                            <textarea
                              value={serviceResponse}
                              onChange={(e) => setServiceResponse(e.target.value)}
                              placeholder="Please provide reason for rejection..."
                              className="input-field w-full"
                              rows="3"
                            />
                          )}
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleServiceResponse(ticket.id, serviceDecision)}
                              disabled={submitting}
                              className={`flex-1 px-4 py-2 rounded-lg text-white ${
                                serviceDecision === 'accept'
                                  ? 'bg-green-600 hover:bg-green-700'
                                  : 'bg-red-600 hover:bg-red-700'
                              } disabled:opacity-50 flex items-center justify-center`}
                            >
                              {submitting ? (
                                <LoadingSpinner size="small" />
                              ) : (
                                <>
                                  {serviceDecision === 'accept' ? <FiThumbsUp className="mr-2" /> : <FiThumbsDown className="mr-2" />}
                                  Confirm {serviceDecision === 'accept' ? 'Acceptance' : 'Rejection'}
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => setServiceDecision(null)}
                              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                              Back
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Ticket Summary
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {getStatusIcon(ticket.status)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-sm font-medium text-gray-900">{ticket.title}</h3>
                            {getPriorityBadge(ticket.priority)}
                            <span className="text-xs text-gray-400">#{ticket.ticketNumber}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{ticket.category}</span>
                            <span>•</span>
                            <span>By: {ticket.createdBy?.name}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedTicket(ticket.id)}
                        className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                      >
                        Review
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <FiCheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Assignments</h3>
              <p className="text-gray-500">You have no tickets waiting for your acceptance.</p>
            </div>
          )}
        </div>

        {/* In Progress Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              In Progress
              {inProgressTickets.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({inProgressTickets.length} tickets)
                </span>
              )}
            </h2>
          </div>

          {loading.inProgress ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : inProgressTickets.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {inProgressTickets.map((ticket) => (
                <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors">
                  {selectedTicket === ticket.id ? (
                    // Work Update Form
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{ticket.title}</h3>
                          <p className="text-sm text-gray-500">#{ticket.ticketNumber}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTicket(null)
                            setServiceResponse('')
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <FiXCircle className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        
                        <p className="text-sm text-gray-700 line-clamp-3">{ticket.description}</p>
                        

                        <div className="mt-3 flex space-x-4 text-sm">
                          <span className="text-xs text-gray-500">Status: {getStatusBadge(ticket?.status)}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <textarea
                          value={serviceResponse}
                          onChange={(e) => setServiceResponse(e.target.value)}
                          placeholder="Add a progress note or resolution details..."
                          className="input-field w-full"
                          rows="3"
                        />

                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleWorkUpdate(ticket.id, 'progress')}
                            disabled={submitting || !serviceResponse.trim()}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                          >
                            {submitting ? <LoadingSpinner size="small" /> : (
                              <>
                                <FiRefreshCw className="mr-2" />
                                Add Progress Note
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleWorkUpdate(ticket.id, 'resolve')}
                            disabled={submitting || !serviceResponse.trim()}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                          >
                            {submitting ? <LoadingSpinner size="small" /> : (
                              <>
                                <FiCheckCircle className="mr-2" />
                                Mark Resolved
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex justify-end">
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                          >
                            View full details <FiExternalLink className="ml-1" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Ticket Summary
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {getStatusIcon(ticket.status)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-sm font-medium text-gray-900">{ticket.title}</h3>
                            {getPriorityBadge(ticket.priority)}
                            <span className="text-xs text-gray-400">#{ticket.ticketNumber}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{ticket.category}</span>
                            <span>•</span>
                            <span>By: {ticket.createdBy?.name}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedTicket(ticket.id)}
                        className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                      >
                        Update
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <FiTool className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Work in Progress</h3>
              <p className="text-gray-500">You don't have any active tickets at the moment.</p>
            </div>
          )}
        </div>

        {/* Recently Resolved */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center">
              <FiCheckCircle className="mr-2 text-green-500" />
              Recently Resolved
            </h3>
          </div>
          {loading.resolved ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : resolvedTickets.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {resolvedTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="block px-6 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
                      <p className="text-xs text-gray-500">#{ticket.ticketNumber} • {ticket.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(ticket.closedAt || ticket.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No resolved tickets yet
            </div>
          )}
        </div>

        {/* View All Link */}
        <div className="flex justify-end">
          <Link
            href="/tickets?assignedToMe=true"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center"
          >
            View all my tickets
            <FiExternalLink className="ml-1" />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function ServiceTeamDashboard() {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
            <FiAlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-500 mb-4 max-w-md">
              {error?.message || "We're having trouble loading the service team dashboard."}
            </p>
            <button
              onClick={resetError}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <FiRefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        </DashboardLayout>
      )}
    >
      <ServiceTeamDashboardContent />
    </ErrorBoundary>
  )
}