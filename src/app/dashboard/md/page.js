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
  FiAward,
  FiUser,
  FiTag,
  FiCalendar,
  FiMessageSquare
} from 'react-icons/fi'
import { formatDistanceToNow, format } from 'date-fns'
import Image from 'next/image'

function MDDashboardContent() {
  const { user } = useAuth()
  const { socket, connected, joinTicket, leaveTicket } = useSocket()
  const toast = useToast()

  const [pendingApprovals, setPendingApprovals] = useState([])
  const [approvedTickets, setApprovedTickets] = useState([])
  const [rejectedTickets, setRejectedTickets] = useState([])
  
  const [loading, setLoading] = useState({
    pending: true,
    approved: true,
    rejected: true,
    stats: true
  })
  
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    approvedThisMonth: 0,
    rejectedThisMonth: 0,
    approvalRate: 0,
    averageResponseTime: '0h',
    byCategory: {},
    byPriority: {}
  })

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
  const [mdComment, setMdComment] = useState('')
  const [mdRejectReason, setMdRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (socket && connected) {
      socket.on('new-ticket-for-md', () => {
        toast.success('New ticket requires your approval')
        fetchPendingApprovals()
      })
      socket.on('ticket-updated', (ticket) => {
        if (ticket?.mdApproval) {
          toast.info(`Ticket #${ticket.ticketNumber} updated`)
          fetchAllData()
        }
      })
      return () => {
        socket.off('new-ticket-for-md')
        socket.off('ticket-updated')
      }
    }
  }, [socket, connected])

  useEffect(() => {
    fetchAllData()
  }, [filters.category, filters.priority, filters.dateRange])

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchPendingApprovals(),
        fetchApprovedTickets(),
        fetchRejectedTickets(),
        fetchStats()
      ])
    } catch (error) {
      console.error(error)
    }
  }

  const fetchPendingApprovals = async () => {
    try {
      setLoading(prev => ({ ...prev, pending: true }))
      const params = new URLSearchParams({
        status: 'PENDING_MD_APPROVAL',
        limit: '50',
        ...(filters.category && { category: filters.category }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && { search: filters.search })
      })
      const res = await fetch(`/api/tickets?${params}`)
      const data = await res.json()
      if (res.ok) {
        setPendingApprovals(data.tickets || [])
        data.tickets?.forEach(t => joinTicket(t.id))
      }
    } catch (error) {
      toast.error('Failed to fetch pending approvals')
    } finally {
      setLoading(prev => ({ ...prev, pending: false }))
    }
  }

  const fetchApprovedTickets = async () => {
    try {
      setLoading(prev => ({ ...prev, approved: true }))
      const res = await fetch('/api/tickets/md-history?mdApproval=APPROVED&limit=20')
      const data = await res.json()
      if (res.ok) setApprovedTickets(data.tickets || [])
    } finally {
      setLoading(prev => ({ ...prev, approved: false }))
    }
  }

  const fetchRejectedTickets = async () => {
    try {
      setLoading(prev => ({ ...prev, rejected: true }))
      const res = await fetch('/api/tickets/md-history?mdApproval=REJECTED&limit=20')
      const data = await res.json()
      if (res.ok) setRejectedTickets(data.tickets || [])
    } finally {
      setLoading(prev => ({ ...prev, rejected: false }))
    }
  }

  const fetchStats = async () => {
    try {
      setLoading(prev => ({ ...prev, stats: true }))
      const res = await fetch('/api/tickets/md-stats')
      const data = await res.json()
      if (res.ok) setStats(data.stats || {})
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
        ...(approved ? { mdApprovalComment: mdComment.trim() || undefined, mdApprovedAt: new Date() }
                    : { mdRejectReason: mdRejectReason.trim(), mdRejectedAt: new Date() })
      }
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      if (socket && connected) {
        socket.emit('md-decision-completed', { ticket: data.ticket, action: approved ? 'APPROVED' : 'REJECTED', userId: user.id })
      }
      setPendingApprovals(prev => prev.filter(t => t.id !== ticketId))
      if (approved) setApprovedTickets(prev => [data.ticket, ...prev].slice(0,20))
      else setRejectedTickets(prev => [data.ticket, ...prev].slice(0,20))
      fetchStats()
      setSelectedTicket(null)
      setMdDecision(null)
      setMdComment('')
      setMdRejectReason('')
      toast.success(approved ? 'Ticket approved' : 'Ticket rejected')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      PENDING_MD_APPROVAL: 'bg-amber-100 text-amber-800 border-amber-200',
      APPROVED_BY_MD: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      REJECTED_BY_MD: 'bg-rose-100 text-rose-800 border-rose-200'
    }
    const s = styles[status] || 'bg-gray-100 text-gray-800'
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-small border ${s}`}>{status?.replace(/_/g, ' ')}</span>
  }

  const getPriorityBadge = (priority) => {
    const styles = {
      CRITICAL: 'bg-red-100 text-red-800 border-red-200',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
      MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200',
      LOW: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    const s = styles[priority] || styles.LOW
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-small border ${s}`}>{priority}</span>
  }

 const StatCard = ({
  title,
  value,
  icon: Icon,
  imageSrc, 
  color,
  trend,
  subtext
}) => (
  <div className="relative overflow-hidden bg-gray-200 rounded-2xl   transition-all duration-300 p-5 group">

    {/* Hide border in bitten area */}
    <div className="absolute -top-[1px] -right-[1px] w-28 h-28 bg-white rounded-bl-[110px] z-[1]" />

    {/* Decorative top-right split */}
    <div className="absolute flex justify-center items-center top-0 right-0 w-24 h-24 bg-pink-600 rounded-bl-[100px] z-[2]" >
      <div className={`p-1 flex justify-center items-center rounded-full w-10 h-10 bg-white shadow-md`}>
          {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            width={32}
            height={32}
            className="object-contain"
          />
        ) : (
          <Icon className="h-5 w-5 text-pink-600" />
        )}
        </div>
      </div>

    {/* Content */}
    <div className="relative z-10">

      {/* Header */}
      <div className="flex items-start justify-between">

        {/* Trend */}
        {trend && (
          <div
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              trend.positive
                ? 'bg-green-50 text-green-600'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}%
          </div>
        )}
      </div>

      {/* Body */}
      <div className="mt-6">
        <p className="text-sm font-bold text-gray-500 mb-1">
          {title}
        </p>

        <h3 className="text-3xl font-bold tracking-tight text-gray-900">
          {value}
        </h3>

        {subtext && (
          <p className="text-xs text-gray-400 mt-2">
            {subtext}
          </p>
        )}
      </div>
    </div>

    {/* Hover glow */}
    <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  </div>
)

  if (loading.pending && loading.stats && pendingApprovals.length === 0) {
    return <DashboardLayout><div className="flex justify-center items-center h-64"><LoadingSpinner size="large" /></div></DashboardLayout>
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
       <div className="relative bg-gradient-to-r from-purple-800 via-pink-500 to-pink-600   overflow-hidden">
 
  
  {/* Content */}
  <div className="relative z-10 px-6 py-5 flex flex-wrap justify-between items-center">
    <div>
      <div className="absolute -top-[1px] -right-[1px] w-28 h-28 bg-white rounded-bl-[110px] z-[1]" />

    {/* Decorative top-right split */}
    <div className="absolute flex justify-center items-center top-0 right-0 w-22 h-23 bg-gray-200 rounded-bl-[100px] z-[2]" >
      <FiAward className="h-6 w-6 text-white" />
    </div>
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-bold text-white">MD Dashboard</h1>
        {connected ? (
          <span className="inline-flex items-center gap-1.5 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full shadow-sm">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>Live
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full shadow-sm">
            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>Offline
          </span>
        )}
      </div>
      <p className="text-indigo-100 text-sm">Welcome back, {user?.name}. Review tickets requiring your approval.</p>
    </div>
    <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
      <FiAward className="h-6 w-6 text-white" />
    </div>
  </div>
  
</div>

        

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Pending " value={stats.pending || pendingApprovals.length}  imageSrc="/images/pending.gif" color="bg-amber-600" />
          <StatCard title="Approved" value={stats.approved || 0} imageSrc="/images/approved.gif" color="bg-emerald-600" subtext={`${stats.approvedThisMonth || 0} this month`} />
          <StatCard title="Rejected" value={stats.rejected || 0} imageSrc="/images/rejection.gif" color="bg-rose-600" subtext={`${stats.rejectedThisMonth || 0} this month`} />
          <StatCard title="Approval Rate" value={`${stats.approvalRate || 0}%`}  imageSrc="/images/rate.gif" color="bg-blue-600" />
        </div>

        {/* Pending Approvals Section */}
        <div className=" relative bg-white rounded-xl  overflow-hidden shadow-sm">
           {/* <div className="absolute flex justify-center items-center top-0 right-0 w-22 h-23 bg-white rounded-bl-[100px] z-[2]" ></div> */}
         
          <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
            <h2 className="text-sm font-semibold text-pink-600">Pending Your Approval <span className="text-sm font-normal text-gray-500">({pendingApprovals.length})</span></h2>
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"><FiFilter /> Filters <FiChevronDown className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} /></button>
          </div>
          {showFilters && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <select value={filters.category} onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))} className="input-field text-sm"><option value="">All Categories</option><option value="HR">HR</option><option value="IT">IT</option><option value="TECHNICAL">Technical</option></select>
                <select value={filters.priority} onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))} className="input-field text-sm"><option value="">All Priorities</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select>
                <select value={filters.dateRange} onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))} className="input-field text-sm"><option value="all">All Time</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option></select>
                <div className="relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search tickets..." value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} className="input-field pl-9 text-sm w-full" /></div>
              </div>
            </div>
          )}
          {loading.pending ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : pendingApprovals.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {pendingApprovals.map(ticket => (
                <div key={ticket.id} className="p-5 hover:bg-gray-50 transition">
                  {selectedTicket === ticket.id ? (
                    <div className="space-y-5">
                      <div className="flex justify-between">
                        <div><h3 className="text-[14px]  font-bold text-gray-800">{ticket.title}</h3><p className="text-xs text-gray-500">#{ticket.ticketNumber}</p></div>
                        <button onClick={() => { setSelectedTicket(null); setMdDecision(null); setMdComment(''); setMdRejectReason(''); }} className="text-red-400 hover:text-gray-600"><FiXCircle className="w-5 h-5" /></button>
                      </div>
                      <div className="bg-gray-200 shadow-md p-4 rounded-md space-y-3">
                        <p className="text-sm text-gray-700">{ticket.description}</p>
                        {ticket.reviews?.[0] && <div className="bg-pink-600 border border-gray-600 shadow-md p-3 rounded"><p className="text-xs font-small font-bold text-gray-200">Admin Review:</p><p className="text-sm text-gray-100">{ticket.reviews[0].content}</p></div>}
                        <div className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-xs text-gray-500">Created By</p><p className="font-small">{ticket.createdBy?.name}</p><p className="text-xs text-gray-500">{ticket.createdBy?.department}</p></div><div><p className="text-xs text-gray-500">Category / Priority</p><p className="font-small">{ticket.category}</p>{getPriorityBadge(ticket.priority)}</div></div>
                      </div>
                      {!mdDecision ? (
                        <div className="flex gap-3">
                          <button onClick={() => setMdDecision('approve')} className="flex-1 bg-emerald-600 text-white shadow-md px-4 py-2 rounded-md hover:bg-emerald-700 flex items-center justify-center gap-2"><FiThumbsUp /> Approve</button>
                          <button onClick={() => setMdDecision('reject')} className="flex-1 bg-pink-600 text-white shadow-md px-4 py-2 rounded-md hover:bg-pink-700 flex items-center justify-center gap-2"><FiThumbsDown /> Reject</button>
                          <Link href={`/tickets/${ticket.id}`} className="flex-1 border border-gray-300 rounded-md shadow-md flex items-center justify-center gap-2 text-gray-700 bg-gray-200 hover:bg-gray-50"><FiEye /> View Full</Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {mdDecision === 'reject' ? (
                            <textarea value={mdRejectReason} onChange={e => setMdRejectReason(e.target.value)} placeholder="Reason for rejection..." className="input-field w-full text-sm" rows="3" />
                          ) : (
                            <textarea value={mdComment} onChange={e => setMdComment(e.target.value)} placeholder="Optional approval comment..." className="input-field w-full text-sm" rows="2" />
                          )}
                         <div className="flex gap-3">
  <button
    onClick={() => handleMDDecision(ticket.id, mdDecision === 'approve')}
    disabled={submitting}
    className={`flex-1 py-2 rounded-lg text-white flex items-center justify-center gap-2 ${
      mdDecision === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-pink-600 hover:bg-pink-700'
    }`}
  >
    {submitting ? <LoadingSpinner size="small" /> : <><FiThumbsUp /> Confirm {mdDecision === 'approve' ? 'Approval' : 'Rejection'}</>}
  </button>
  <button
    onClick={() => setMdDecision(null)}
    className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 flex items-center justify-center gap-2"
  >
    Back
  </button>
</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-between items-center gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-0.5">{ticket.status === 'PENDING_MD_APPROVAL' ? <Image
            src='/images/pending.gif'
            alt='pending'
            width={32}
            height={32}
            className="object-contain"
          /> : <FiAlertCircle className="w-5 h-5 text-gray-400" />}</div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1"><h3 className="text-sm font-small font-bold text-gray-800">{ticket.title}</h3>{getPriorityBadge(ticket.priority)}<span className="text-xs text-gray-400">#{ticket.ticketNumber}</span></div>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500"><span>{ticket.category}</span><span>•</span><span>By {ticket.createdBy?.name}</span><span>•</span><span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span></div>
                        </div>
                      </div>
                      <button onClick={() => setSelectedTicket(ticket.id)} className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm">Review</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center"><FiCheckCircle className="mx-auto w-12 h-12 text-emerald-400 mb-3" /><h3 className="text-sm font-small text-gray-700">All caught up!</h3><p className="text-sm text-gray-500">No tickets pending your approval.</p></div>
          )}
        </div>

        {/* Recent History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50"><h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2"><FiThumbsUp className="text-emerald-500" /> Recently Approved</h3></div>
            {loading.approved ? <div className="flex justify-center py-8"><LoadingSpinner size="small" /></div> : approvedTickets.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {approvedTickets.map(t => (
                  <Link key={t.id} href={`/tickets/${t.id}`} className="block px-5 py-3 hover:bg-gray-50">
                    <div className="flex justify-between"><div><p className="text-sm font-small text-gray-800">{t.title}</p><p className="text-xs text-gray-500">#{t.ticketNumber} • {t.category}</p></div><p className="text-xs text-gray-400">{formatDistanceToNow(new Date(t.mdApprovedAt || t.updatedAt), { addSuffix: true })}</p></div>
                    {t.mdApprovalComment && <p className="text-xs text-emerald-600 mt-1">💬 {t.mdApprovalComment}</p>}
                  </Link>
                ))}
              </div>
            ) : <div className="px-5 py-8 text-center text-sm text-gray-400">No approved tickets yet</div>}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50"><h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2"><FiThumbsDown className="text-rose-500" /> Recently Rejected</h3></div>
            {loading.rejected ? <div className="flex justify-center py-8"><LoadingSpinner size="small" /></div> : rejectedTickets.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {rejectedTickets.map(t => (
                  <Link key={t.id} href={`/tickets/${t.id}`} className="block px-5 py-3 hover:bg-gray-50">
                    <div className="flex justify-between"><div><p className="text-sm font-small text-gray-800">{t.title}</p><p className="text-xs text-gray-500">#{t.ticketNumber} • {t.category}</p></div><p className="text-xs text-gray-400">{formatDistanceToNow(new Date(t.mdRejectedAt || t.updatedAt), { addSuffix: true })}</p></div>
                    {t.mdRejectReason && <p className="text-xs text-rose-600 mt-1">❌ {t.mdRejectReason}</p>}
                  </Link>
                ))}
              </div>
            ) : <div className="px-5 py-8 text-center text-sm text-gray-400">No rejected tickets yet</div>}
          </div>
        </div>

        <div className="flex justify-end"><Link href="/tickets?status=PENDING_MD_APPROVAL" className="text-sm text-indigo-600 hover:text-indigo-700 font-small inline-flex items-center gap-1">View all pending approvals <FiExternalLink /></Link></div>
      </div>
    </DashboardLayout>
  )
}

export default function MDDashboard() {
  return (
    <ErrorBoundary fallback={({ error, resetError }) => (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
          <FiAlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-sm font-small text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-4 max-w-md">{error?.message || "Unable to load MD dashboard."}</p>
          <button onClick={resetError} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><FiRefreshCw /> Try Again</button>
        </div>
      </DashboardLayout>
    )}>
      <MDDashboardContent />
    </ErrorBoundary>
  )
}