// app/dashboard/md/page.js
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  FiThumbsUp,
  FiThumbsDown,
  FiExternalLink,
  FiEye,
  FiRefreshCw,
  FiBarChart2,
  FiFilter,
  FiSearch,
  FiChevronDown,
  FiAward
} from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'

function MDDashboardContent() {
  const { user } = useAuth()
  const { socket, connected, joinTicket, leaveTicket } = useSocket()
  const toast = useToast()

  // State for tickets
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [approvedTickets, setApprovedTickets] = useState([])
  const [rejectedTickets, setRejectedTickets] = useState([])
  
  // Loading states
  const [loading, setLoading] = useState({
    pending: true,
    approved: true,
    rejected: true,
    stats: true
  })
  
  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    approvedThisMonth: 0,
    rejectedThisMonth: 0,
    approvalRate: 0,
    averageResponseTime: '0h',
    byCategory: {
      HR: { total: 0, approved: 0, rejected: 0 },
      IT: { total: 0, approved: 0, rejected: 0 },
      TECHNICAL: { total: 0, approved: 0, rejected: 0 }
    },
    byPriority: {
      LOW: { total: 0, approved: 0, rejected: 0 },
      MEDIUM: { total: 0, approved: 0, rejected: 0 },
      HIGH: { total: 0, approved: 0, rejected: 0 },
      CRITICAL: { total: 0, approved: 0, rejected: 0 }
    }
  })

  // Filter states
  const [filters, setFilters] = useState({
    status: 'PENDING_MD_APPROVAL',
    category: '',
    priority: '',
    dateRange: 'all',
    search: ''
  })

  const [showFilters, setShowFilters] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [mdDecision, setMdDecision] = useState(null)
  const [mdComment, setMdComment] = useState('')      // for approval comment
  const [mdRejectReason, setMdRejectReason] = useState('') // for rejection reason
  const [submitting, setSubmitting] = useState(false)

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Set up socket listeners for MD
  useEffect(() => {
    if (socket && connected) {
      console.log('Setting up MD socket listeners')
      
      socket.on('new-ticket-for-md', (data) => {
        console.log('New ticket for MD:', data)
        toast.success('New ticket requires your approval')
        fetchPendingApprovals()
      })

      socket.on('ticket-updated', (data) => {
        console.log('Ticket updated:', data)
        if (data.ticket?.mdApproval) {
          toast.success(`Ticket #${data.ticketNumber} status updated`)
          fetchAllData()
        }
      })

      return () => {
        socket.off('new-ticket-for-md')
        socket.off('ticket-updated')
      }
    }
  }, [socket, connected])

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchAllData()
  }, [filters.category, filters.priority, filters.dateRange, pagination.page])

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchPendingApprovals(),
        fetchApprovedTickets(),
        fetchRejectedTickets(),
        fetchStats()
      ])
    } catch (error) {
      console.error('Error fetching all data:', error)
      toast.error('Failed to load some data')
    }
  }

  const fetchPendingApprovals = async () => {
    try {
      setLoading(prev => ({ ...prev, pending: true }))
      const queryParams = new URLSearchParams({
        status: 'PENDING_MD_APPROVAL',
        limit: '50',
        ...(filters.category && { category: filters.category }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && { search: filters.search })
      })

      const res = await fetch(`/api/tickets?${queryParams}`)
      const data = await res.json()
      
      if (res.ok) {
        setPendingApprovals(data.tickets || [])
        data.tickets?.forEach(ticket => {
          joinTicket(ticket.id)
        })
      } else {
        throw new Error(data.message || 'Failed to fetch pending approvals')
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error)
      toast.error('Failed to fetch pending approvals')
    } finally {
      setLoading(prev => ({ ...prev, pending: false }))
    }
  }

  const fetchApprovedTickets = async () => {
    try {
      setLoading(prev => ({ ...prev, approved: true }))
      const queryParams = new URLSearchParams({
        mdApproval: 'APPROVED',
        limit: '20',
        sort: 'desc'
      })

      const res = await fetch(`/api/tickets/md-history?${queryParams}`)
      const data = await res.json()
      
      if (res.ok) {
        setApprovedTickets(data.tickets || [])
      }
    } catch (error) {
      console.error('Error fetching approved tickets:', error)
    } finally {
      setLoading(prev => ({ ...prev, approved: false }))
    }
  }

  const fetchRejectedTickets = async () => {
    try {
      setLoading(prev => ({ ...prev, rejected: true }))
      const queryParams = new URLSearchParams({
        mdApproval: 'REJECTED',
        limit: '20',
        sort: 'desc'
      })

      const res = await fetch(`/api/tickets/md-history?${queryParams}`)
      const data = await res.json()
      
      if (res.ok) {
        setRejectedTickets(data.tickets || [])
      }
    } catch (error) {
      console.error('Error fetching rejected tickets:', error)
    } finally {
      setLoading(prev => ({ ...prev, rejected: false }))
    }
  }

  const fetchStats = async () => {
    try {
      setLoading(prev => ({ ...prev, stats: true }))
      const res = await fetch('/api/tickets/md-stats')
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

  const handleMDDecision = async (ticketId, approved) => {
    if (!approved && !mdRejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        status: approved ? 'APPROVED_BY_MD' : 'REJECTED_BY_MD',
        mdApproval: approved ? 'APPROVED' : 'REJECTED',
      }

      if (approved) {
        payload.mdApprovedAt = new Date()
        if (mdComment.trim()) {
          payload.mdApprovalComment = mdComment.trim()
        }
      } else {
        payload.mdRejectedAt = new Date()
        payload.mdRejectReason = mdRejectReason.trim()
      }

      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process decision')
      }

      // Emit socket event
      if (socket && connected) {
        socket.emit('ticket-updated', {
          ticketId: data.ticket.id,
          ticketNumber: data.ticket.ticketNumber,
          status: data.ticket.status,
          mdApproval: data.ticket.mdApproval
        })
      }

      // Update local state
      setPendingApprovals(prev => prev.filter(t => t.id !== ticketId))
      if (approved) {
        setApprovedTickets(prev => [data.ticket, ...prev].slice(0, 20))
      } else {
        setRejectedTickets(prev => [data.ticket, ...prev].slice(0, 20))
      }

      // Refresh stats
      fetchStats()
      
      setSelectedTicket(null)
      setMdDecision(null)
      setMdComment('')
      setMdRejectReason('')
      toast.success(approved ? 'Ticket approved successfully' : 'Ticket rejected')
    } catch (error) {
      console.error('Error processing MD decision:', error)
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING_MD_APPROVAL':
        return <FiClock className="h-5 w-5 text-purple-500" />
      case 'APPROVED_BY_MD':
        return <FiThumbsUp className="h-5 w-5 text-green-500" />
      case 'REJECTED_BY_MD':
        return <FiThumbsDown className="h-5 w-5 text-red-500" />
      default:
        return <FiAlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      'PENDING_MD_APPROVAL': 'bg-purple-100 text-purple-800 border-purple-200',
      'APPROVED_BY_MD': 'bg-green-100 text-green-800 border-green-200',
      'REJECTED_BY_MD': 'bg-red-100 text-red-800 border-red-200',
      'OPEN': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800 border-blue-200',
      'RESOLVED': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'CLOSED': 'bg-gray-100 text-gray-800 border-gray-200'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.CLOSED}`}>
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

  const StatCard = ({ title, value, icon: Icon, color, trend, subtext }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
    </div>
  )

  // Show loading state
  if (loading.pending && loading.stats && pendingApprovals.length === 0) {
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
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center mb-2">
                <h1 className="text-2xl font-bold mr-3">MD Dashboard</h1>
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
              <p className="text-purple-100">
                Welcome back, {user?.name}. Review and manage tickets requiring your approval.
              </p>
            </div>
            <div className="bg-white/10 p-3 rounded-lg">
              <FiAward className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pending Approval"
            value={stats.pending || pendingApprovals.length}
            icon={FiClock}
            color="bg-purple-600"
          />
          <StatCard
            title="Approved (Total)"
            value={stats.approved || 0}
            icon={FiThumbsUp}
            color="bg-green-600"
            subtext={`${stats.approvedThisMonth || 0} this month`}
          />
          <StatCard
            title="Rejected (Total)"
            value={stats.rejected || 0}
            icon={FiThumbsDown}
            color="bg-red-600"
            subtext={`${stats.rejectedThisMonth || 0} this month`}
          />
          <StatCard
            title="Approval Rate"
            value={`${stats.approvalRate || 0}%`}
            icon={FiBarChart2}
            color="bg-blue-600"
          />
        </div>

        {/* Pending Approvals Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Your Approval
              {pendingApprovals.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({pendingApprovals.length} tickets)
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

          {/* Pending Tickets List */}
          {loading.pending ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : pendingApprovals.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {pendingApprovals.map((ticket) => (
                <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors">
                  {selectedTicket === ticket.id ? (
                    // Approval Form
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{ticket.title}</h3>
                          <p className="text-sm text-gray-500">#{ticket.ticketNumber}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTicket(null)
                            setMdDecision(null)
                            setMdComment('')
                            setMdRejectReason('')
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <FiXCircle className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Ticket Preview */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 line-clamp-3">{ticket.description}</p>
                        
                        {ticket.reviews?.length > 0 && (
                          <div className="mt-3 p-3 bg-white rounded-lg">
                            <p className="text-xs font-medium text-gray-500 mb-1">Admin Review:</p>
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
                            <p className="text-xs text-gray-500">Category/Priority</p>
                            <p className="font-medium">{ticket.category}</p>
                            {getPriorityBadge(ticket.priority)}
                          </div>
                        </div>
                      </div>

                      {!mdDecision ? (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => setMdDecision('approve')}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                          >
                            <FiThumbsUp className="mr-2" />
                            Approve
                          </button>
                          <button
                            onClick={() => setMdDecision('reject')}
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
                          {mdDecision === 'reject' ? (
                            <textarea
                              value={mdRejectReason}
                              onChange={(e) => setMdRejectReason(e.target.value)}
                              placeholder="Please provide reason for rejection..."
                              className="input-field w-full"
                              rows="3"
                              required
                            />
                          ) : (
                            <textarea
                              value={mdComment}
                              onChange={(e) => setMdComment(e.target.value)}
                              placeholder="Optional: Add a comment for approval..."
                              className="input-field w-full"
                              rows="2"
                            />
                          )}
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleMDDecision(ticket.id, mdDecision === 'approve')}
                              disabled={submitting}
                              className={`flex-1 px-4 py-2 rounded-lg text-white ${
                                mdDecision === 'approve' 
                                  ? 'bg-green-600 hover:bg-green-700' 
                                  : 'bg-red-600 hover:bg-red-700'
                              } disabled:opacity-50 flex items-center justify-center`}
                            >
                              {submitting ? (
                                <LoadingSpinner size="small" />
                              ) : (
                                <>
                                  {mdDecision === 'approve' ? <FiThumbsUp className="mr-2" /> : <FiThumbsDown className="mr-2" />}
                                  Confirm {mdDecision === 'approve' ? 'Approval' : 'Rejection'}
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => setMdDecision(null)}
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-500">No tickets pending your approval at the moment.</p>
            </div>
          )}
        </div>

        {/* Recent History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recently Approved */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center">
                <FiThumbsUp className="mr-2 text-green-500" />
                Recently Approved
              </h3>
            </div>
            {loading.approved ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : approvedTickets.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {approvedTickets.map((ticket) => (
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
                          {formatDistanceToNow(new Date(ticket.mdApprovedAt || ticket.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {ticket.mdApprovalComment && (
                      <p className="text-xs text-green-600 mt-1 line-clamp-1">💬 {ticket.mdApprovalComment}</p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No approved tickets yet
              </div>
            )}
          </div>

          {/* Recently Rejected */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center">
                <FiThumbsDown className="mr-2 text-red-500" />
                Recently Rejected
              </h3>
            </div>
            {loading.rejected ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : rejectedTickets.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {rejectedTickets.map((ticket) => (
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
                          {formatDistanceToNow(new Date(ticket.mdRejectedAt || ticket.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {ticket.mdRejectReason && (
                      <p className="text-xs text-red-600 mt-1 line-clamp-1">❌ {ticket.mdRejectReason}</p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No rejected tickets yet
              </div>
            )}
          </div>
        </div>

        {/* View All Link */}
        <div className="flex justify-end">
          <Link
            href="/tickets?status=PENDING_MD_APPROVAL"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center"
          >
            View all tickets needing approval
            <FiExternalLink className="ml-1" />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}

// Main export with ErrorBoundary
export default function MDDashboard() {
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
              {error?.message || "We're having trouble loading the MD dashboard."}
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
      <MDDashboardContent />
    </ErrorBoundary>
  )
}