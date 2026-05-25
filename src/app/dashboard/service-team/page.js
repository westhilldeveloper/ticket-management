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

  const [pendingAcceptance, setPendingAcceptance] = useState([])
  const [inProgressTickets, setInProgressTickets] = useState([])
  const [resolvedTickets, setResolvedTickets] = useState([])

  const [loading, setLoading] = useState({
    pending: true,
    inProgress: true,
    resolved: true,
    stats: true
  })

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

  const [filters, setFilters] = useState({
    category: '',
    priority: '',
    dateRange: 'all',
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [serviceDecision, setServiceDecision] = useState(null)
  const [serviceResponse, setServiceResponse] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [pagination, setPagination] = useState({
    pendingPage: 1,
    inProgressPage: 1,
    resolvedPage: 1,
    limit: 10
  })

  useEffect(() => {
    if (socket && connected) {
      socket.on('new-ticket-assigned', (data) => {
        toast.success('New ticket assigned to you')
        fetchPendingAcceptance()
      })
      socket.on('ticket-updated', (ticket) => {
        if (ticket?.assignedToId === user?.id) fetchAllData()
      })
      return () => {
        socket.off('new-ticket-assigned')
        socket.off('ticket-updated')
      }
    }
  }, [socket, connected, user?.id])

  useEffect(() => {
    if (user?.id) fetchAllData()
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
      console.error(error)
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
        data.tickets?.forEach(ticket => joinTicket(ticket.id))
      }
    } catch (error) {
      console.error(error)
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
      }
    } catch (error) {
      console.error(error)
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
      if (res.ok) setResolvedTickets(data.tickets || [])
    } catch (error) {
      console.error(error)
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
      if (res.ok) setStats(data.stats || {})
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(prev => ({ ...prev, stats: false }))
    }
  }

  const handleServiceResponse = async (ticketId, action) => {
    if (action === 'reject' && !serviceResponse.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(`/api/public/tickets/${ticketId}/service-team-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          review: serviceResponse || (action === 'accept' ? 'Accepted by service team' : '')
        }),
        credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to respond')
      if (socket && connected) {
        socket.emit('service-team-action-completed', { ticket: data.ticket, action, userId: user.id })
      }
      setPendingAcceptance(prev => prev.filter(t => t.id !== ticketId))
      if (action === 'accept') setInProgressTickets(prev => [data.ticket, ...prev].slice(0, 50))
      fetchStats()
      setSelectedTicket(null)
      setServiceDecision(null)
      setServiceResponse('')
      toast.success(action === 'accept' ? 'Ticket accepted' : 'Ticket rejected')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleWorkUpdate = async (ticketId, workType) => {
    if (!serviceResponse.trim()) {
      toast.error('Please add work details')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(`/api/public/tickets/${ticketId}/service-work-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workType: workType === 'resolve' ? 'resolve' : 'progress',
          details: serviceResponse
        }),
        credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to update work')
      if (socket && connected) {
        socket.emit('service-team-action-completed', {
          ticket: data.ticket,
          action: workType === 'resolve' ? 'RESOLVED' : 'PROGRESS_NOTE',
          userId: user.id
        })
      }
      if (workType === 'resolve') {
        setInProgressTickets(prev => prev.filter(t => t.id !== ticketId))
        setResolvedTickets(prev => [data.ticket, ...prev].slice(0, 20))
      } else {
        setInProgressTickets(prev => prev.map(t => (t.id === ticketId ? data.ticket : t)))
      }
      fetchStats()
      setSelectedTicket(null)
      setServiceResponse('')
      toast.success('Work update recorded')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status) => {
    const size = "w-3.5 h-3.5"
    switch (status) {
      case 'PENDING_SERVICE_ACCEPTANCE': return <FiUserPlus className={`${size} text-indigo-500`} />
      case 'SERVICE_IN_PROGRESS': return <FiTool className={`${size} text-blue-500`} />
      case 'RESOLVED': return <FiCheckCircle className={`${size} text-green-500`} />
      default: return <FiAlertCircle className={`${size} text-gray-500`} />
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
    return <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{status?.replace(/_/g, ' ')}</span>
  }

  const getPriorityBadge = (priority) => {
    const styles = {
      'CRITICAL': 'bg-red-100 text-red-800 border-red-200',
      'HIGH': 'bg-orange-100 text-orange-800 border-orange-200',
      'MEDIUM': 'bg-blue-100 text-blue-800 border-blue-200',
      'LOW': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${styles[priority] || styles.LOW}`}>{priority}</span>
  }

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-2 hover:shadow transition-shadow">
      <div className="flex items-center justify-between mb-1">
        <div className={`p-1 rounded ${color}`}><Icon className="w-3.5 h-3.5 text-white" /></div>
      </div>
      <p className="text-[10px] text-gray-500 mb-0.5">{title}</p>
      <p className="text-sm font-bold text-gray-800">{value}</p>
      {subtext && <p className="text-[10px] text-gray-400 mt-0.5">{subtext}</p>}
    </div>
  )

  if (loading.pending && loading.inProgress && loading.stats && pendingAcceptance.length === 0 && inProgressTickets.length === 0) {
    return (<DashboardLayout><div className="flex justify-center items-center h-48"><LoadingSpinner size="small" /></div></DashboardLayout>)
  }

  return (
    <DashboardLayout>
      <div className="space-y-3 p-2">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded shadow-sm p-2 text-white">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-xs font-bold">Service Team Dashboard</h1>
                {connected ? <span className="text-[10px] bg-green-500 px-1.5 py-0.5 rounded-full">Live</span> : <span className="text-[10px] bg-gray-500 px-1.5 py-0.5 rounded-full">Offline</span>}
              </div>
              <p className="text-[10px] text-indigo-100">Welcome back, {user?.name}. Manage your assigned tickets.</p>
            </div>
            <div className="bg-white/10 p-1.5 rounded"><FiTool className="w-4 h-4 text-white" /></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard title="Pending Acceptance" value={stats.pendingAcceptance || pendingAcceptance.length} icon={FiUserPlus} color="bg-indigo-600" />
          <StatCard title="In Progress" value={stats.inProgress || inProgressTickets.length} icon={FiTool} color="bg-blue-600" />
          <StatCard title="Resolved (Month)" value={stats.resolvedThisMonth || 0} icon={FiCheckCircle} color="bg-green-600" />
          <StatCard title="Total Resolved" value={stats.totalResolved || 0} icon={FiBarChart2} color="bg-purple-600" subtext={`Avg: ${stats.averageCompletionTime}`} />
        </div>

        {/* Pending Acceptance Section */}
        <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-2 py-1.5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-[10px] font-semibold text-gray-700">Pending Acceptance <span className="text-gray-400">({pendingAcceptance.length})</span></h2>
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-0.5 text-[10px] text-gray-500"><FiFilter className="w-3 h-3" />Filter <FiChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} /></button>
          </div>
          {showFilters && (
            <div className="px-2 py-1.5 bg-gray-50 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-4 gap-1">
              <select value={filters.category} onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))} className="text-[10px] border rounded px-1 py-0.5"><option value="">All Categories</option><option value="HR">HR</option><option value="IT">IT</option><option value="TECHNICAL">Technical</option></select>
              <select value={filters.priority} onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))} className="text-[10px] border rounded px-1 py-0.5"><option value="">All Priorities</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select>
              <select value={filters.dateRange} onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))} className="text-[10px] border rounded px-1 py-0.5"><option value="all">All Time</option><option value="today">Today</option><option value="week">Week</option><option value="month">Month</option></select>
              <div className="relative"><FiSearch className="absolute left-1 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" /><input type="text" placeholder="Search..." value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} className="pl-5 py-0.5 text-[10px] border rounded w-full" /></div>
            </div>
          )}
          {loading.pending ? <div className="flex justify-center py-4"><LoadingSpinner size="small" /></div> : pendingAcceptance.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {pendingAcceptance.map(ticket => (
                <div key={ticket.id} className="p-2 hover:bg-gray-50">
                  {selectedTicket === ticket.id ? (
                    <div className="space-y-2">
                      <div className="flex justify-between"><div><h3 className="text-[10px] font-semibold">{ticket.title}</h3><p className="text-[10px] text-gray-500">#{ticket.ticketNumber}</p></div><button onClick={() => { setSelectedTicket(null); setServiceDecision(null); setServiceResponse('') }}><FiXCircle className="w-3.5 h-3.5 text-gray-400" /></button></div>
                      <div className="bg-gray-50 p-2 rounded text-[10px]"><p className="font-bold">{ticket.requestServiceType}</p><p className="mt-1">{ticket.description}</p>{ticket.reviews?.[0] && <div className="mt-1 p-1 bg-white rounded"><span className="text-gray-500">Admin:</span> {ticket.reviews[0].content}</div>}</div>
                      {!serviceDecision ? (
                        <div className="flex gap-1.5">
  <button
    onClick={() => setServiceDecision('accept')}
    className="flex-1 bg-green-600 text-white text-[10px] py-1 rounded flex items-center justify-center gap-0.5"
  >
    <FiThumbsUp className="w-3 h-3" /> Accept
  </button>
  <button
    onClick={() => setServiceDecision('reject')}
    className="flex-1 bg-red-600 text-white text-[10px] py-1 rounded flex items-center justify-center gap-0.5"
  >
    <FiThumbsDown className="w-3 h-3" /> Reject
  </button>
  <Link
    href={`/tickets/${ticket.id}`}
    className="flex-1 border rounded text-[10px] py-1 flex items-center justify-center gap-0.5 text-white bg-blue-500 hover:bg-blue-700"
  >
    <FiEye className="w-3 h-3" /> View
  </Link>
</div>
                      ) : (
                        <div className="space-y-1.5">
                          {serviceDecision === 'reject' && <textarea value={serviceResponse} onChange={e => setServiceResponse(e.target.value)} placeholder="Reason for rejection..." className="w-full text-[10px] p-1 border rounded" rows="2" />}
                          <div className="flex gap-2">
  {/* Confirm Button */}
  <button
    onClick={() => handleServiceResponse(ticket.id, serviceDecision)}
    disabled={submitting}
    className={`flex-1 py-1.5 text-[10px] rounded text-white transition-colors ${
      serviceDecision === 'accept' 
        ? 'bg-green-600 hover:bg-green-700' 
        : 'bg-red-600 hover:bg-red-700'
    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1`}
  >
    {submitting ? (
      <LoadingSpinner size="small" />
    ) : (
      `Confirm ${serviceDecision === 'accept' ? 'Acceptance' : 'Rejection'}`
    )}
  </button>

  {/* Back Button */}
  <button
    onClick={() => setServiceDecision(null)}
    className="flex-1 py-1.5 border rounded  text-[10px] font-bold text-gray-700 bg-white border border-blue-400 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
  >
    Back
  </button>
</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 flex-1"><div className="flex-shrink-0">{getStatusIcon(ticket.status)}</div><div><div className="flex items-center gap-1"><h3 className="text-[10px] font-medium">{ticket.title}</h3>{getPriorityBadge(ticket.priority)}<span className="text-[10px] text-gray-400">#{ticket.ticketNumber}</span></div><div className="flex gap-2 text-[10px] text-gray-500"><span>{ticket.category}</span><span>•</span><span>By {ticket.createdBy?.name}</span><span>•</span><span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span></div></div></div>
                      <button onClick={() => setSelectedTicket(ticket.id)} className="px-2 py-0.5 bg-primary-600 text-white rounded text-[10px]">Review</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <div className="py-4 text-center text-[10px] text-gray-400"><FiCheckCircle className="mx-auto w-5 h-5 text-green-400 mb-1" />No pending assignments</div>}
        </div>

        {/* In Progress Section */}
        <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-2 py-1.5 border-b border-gray-100"><h2 className="text-[10px] font-semibold text-gray-700">In Progress ({inProgressTickets.length})</h2></div>
          {loading.inProgress ? <div className="flex justify-center py-4"><LoadingSpinner size="small" /></div> : inProgressTickets.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {inProgressTickets.map(ticket => (
                <div key={ticket.id} className="p-2 hover:bg-gray-50">
                  {selectedTicket === ticket.id ? (
                    <div className="space-y-2">
                      <div className="flex justify-between"><div><h3 className="text-[10px] font-semibold">{ticket.title}</h3><p className="text-[10px] text-gray-500">#{ticket.ticketNumber}</p></div><button onClick={() => { setSelectedTicket(null); setServiceResponse('') }}><FiXCircle className="w-3.5 h-3.5 text-gray-400" /></button></div>
                      <div className="bg-gray-50 p-2 rounded text-[10px]"><p>{ticket.description}</p><div className="mt-1">{getStatusBadge(ticket.status)}</div></div>
                      <textarea value={serviceResponse} onChange={e => setServiceResponse(e.target.value)} placeholder="Add progress note or resolution details..." className="w-full text-[10px] p-1 border rounded" rows="2" />
                      <div className="flex gap-1.5"><button onClick={() => handleWorkUpdate(ticket.id, 'progress')} disabled={submitting || !serviceResponse.trim()} className="flex-1 bg-blue-600 text-white text-[10px] py-1 rounded">Add Note</button><button onClick={() => handleWorkUpdate(ticket.id, 'resolve')} disabled={submitting || !serviceResponse.trim()} className="flex-1 bg-green-600 text-white text-[10px] py-1 rounded">Resolve</button></div>
                      <Link href={`/tickets/${ticket.id}`} className="text-[10px] text-primary-600">View full details →</Link>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 flex-1"><div>{getStatusIcon(ticket.status)}</div><div><div className="flex items-center gap-1"><h3 className="text-[10px] font-medium">{ticket.title}</h3>{getPriorityBadge(ticket.priority)}<span className="text-[10px] text-gray-400">#{ticket.ticketNumber}</span></div><div className="flex gap-2 text-[10px] text-gray-500"><span>{ticket.category}</span><span>•</span><span>By {ticket.createdBy?.name}</span><span>•</span><span>Updated {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}</span></div></div></div>
                      <button onClick={() => setSelectedTicket(ticket.id)} className="px-2 py-0.5 bg-primary-600 text-white rounded text-[10px]">Update</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <div className="py-4 text-center text-[10px] text-gray-400"><FiTool className="mx-auto w-5 h-5 text-gray-300 mb-1" />No active tickets</div>}
        </div>

        {/* Recently Resolved */}
        <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-2 py-1.5 border-b border-gray-100"><h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1"><FiCheckCircle className="w-3 h-3 text-green-500" /> Recently Resolved</h3></div>
          {loading.resolved ? <div className="flex justify-center py-3"><LoadingSpinner size="small" /></div> : resolvedTickets.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {resolvedTickets.map(ticket => (
                <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block px-2 py-1.5 hover:bg-gray-50">
                  <div className="flex justify-between items-center"><div><p className="text-[10px] font-medium">{ticket.title}</p><p className="text-[10px] text-gray-400">#{ticket.ticketNumber} • {ticket.category}</p></div><p className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(ticket.closedAt || ticket.updatedAt), { addSuffix: true })}</p></div>
                </Link>
              ))}
            </div>
          ) : <div className="py-3 text-center text-[10px] text-gray-400">No resolved tickets yet</div>}
        </div>

        <div className="flex justify-end"><Link href="/tickets?assignedToMe=true" className="text-[10px] text-primary-600 hover:underline">View all my tickets →</Link></div>
      </div>
    </DashboardLayout>
  )
}

export default function ServiceTeamDashboard() {
  return (
    <ErrorBoundary fallback={({ error, resetError }) => (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-3">
          <FiAlertCircle className="h-6 w-6 text-red-500 mb-1" />
          <h3 className="text-xs font-medium text-gray-800 mb-1">Something went wrong</h3>
          <p className="text-[10px] text-gray-500 mb-2">{error?.message || 'Unable to load service team dashboard.'}</p>
          <button onClick={resetError} className="px-2 py-0.5 bg-primary-600 text-white rounded text-[10px]">Retry</button>
        </div>
      </DashboardLayout>
    )}>
      <ServiceTeamDashboardContent />
    </ErrorBoundary>
  )
}