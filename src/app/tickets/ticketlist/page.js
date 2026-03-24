'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import { useSocket } from '@/app/context/SocketContext'
import { useToast } from '@/app/context/ToastContext'
import DashboardLayout from '@/app/components/layouts/DashboardLayout'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'
import {
  FiPlusCircle,
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiDownload,
  FiCalendar,
  FiTag,
  FiUser,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiThumbsUp,
  FiThumbsDown,
  FiExternalLink,
  FiEye,
  FiBarChart2
} from 'react-icons/fi'
import { formatDistanceToNow, format, subDays } from 'date-fns'

export default function TicketListPage() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const toast = useToast()
  const router = useRouter()

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    pending: 0,
    resolved: 0,
    closed: 0
  })
  
  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    assignedTo: '',
    page: 1,
    limit: 10
  })
  
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  })
  
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
  const [selectedTickets, setSelectedTickets] = useState([])
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    fetchTickets()
    fetchStats()
  }, [filters.status, filters.category, filters.priority, filters.page, sortBy, sortOrder])

  useEffect(() => {
    if (socket) {
      socket.on('ticket-updated', handleTicketUpdate)
      socket.on('new-ticket', handleNewTicket)
      
      return () => {
        socket.off('ticket-updated', handleTicketUpdate)
        socket.off('new-ticket', handleNewTicket)
      }
    }
  }, [socket])

  const handleTicketUpdate = (updatedTicket) => {
    setTickets(prev => 
      prev.map(ticket => 
        ticket.id === updatedTicket.id ? updatedTicket : ticket
      )
    )
    fetchStats() // Refresh stats
  }

  const handleNewTicket = (newTicket) => {
    setTickets(prev => [newTicket, ...prev])
    fetchStats() // Refresh stats
    toast.info('New ticket created')
  }

  const fetchTickets = async () => {
    try {
      setLoading(true)
      
      // Build query string
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.category) params.append('category', filters.category)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.search) params.append('search', filters.search)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      if (filters.assignedTo) params.append('assignedTo', filters.assignedTo)
      params.append('page', filters.page)
      params.append('limit', filters.limit)
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)

      const response = await fetch(`/api/tickets?${params.toString()}`, {
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch tickets')
      }

      setTickets(data.tickets || [])
      setPagination(data.pagination || {
        total: 0,
        pages: 0,
        page: filters.page,
        limit: filters.limit
      })
    } catch (error) {
      console.error('Error fetching tickets:', error)
      setError(error.message)
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/tickets/stats', {
        credentials: 'include'
      })
      const data = await response.json()

      if (response.ok) {
        setStats(data.stats || {
          total: 0,
          open: 0,
          pending: 0,
          resolved: 0,
          closed: 0
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setFilters(prev => ({ ...prev, page: 1 }))
    fetchTickets()
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const handleSelectTicket = (ticketId) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    )
  }

  const handleSelectAll = () => {
    if (selectedTickets.length === tickets.length) {
      setSelectedTickets([])
    } else {
      setSelectedTickets(tickets.map(t => t.id))
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedTickets.length === 0) {
      toast.error('No tickets selected')
      return
    }

    if (!confirm(`Are you sure you want to ${action} ${selectedTickets.length} tickets?`)) {
      return
    }

    try {
      const response = await fetch('/api/tickets/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          ticketIds: selectedTickets
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Bulk action failed')
      }

      toast.success(`${selectedTickets.length} tickets updated`)
      setSelectedTickets([])
      fetchTickets()
      fetchStats()
    } catch (error) {
      console.error('Error in bulk action:', error)
      toast.error(error.message)
    }
  }

  const exportTickets = async () => {
    try {
      const response = await fetch('/api/tickets/export', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tickets-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Tickets exported successfully')
    } catch (error) {
      console.error('Error exporting tickets:', error)
      toast.error('Failed to export tickets')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPEN':
        return <FiAlertCircle className="h-5 w-5 text-yellow-500" />
      case 'PENDING_MD_APPROVAL':
        return <FiClock className="h-5 w-5 text-purple-500" />
      case 'PENDING_THIRD_PARTY':
        return <FiExternalLink className="h-5 w-5 text-orange-500" />
      case 'IN_PROGRESS':
        return <FiRefreshCw className="h-5 w-5 text-blue-500" />
      case 'APPROVED_BY_MD':
        return <FiThumbsUp className="h-5 w-5 text-green-500" />
      case 'REJECTED_BY_MD':
        return <FiThumbsDown className="h-5 w-5 text-red-500" />
      case 'RESOLVED':
        return <FiCheckCircle className="h-5 w-5 text-green-500" />
      case 'CLOSED':
        return <FiCheckCircle className="h-5 w-5 text-gray-500" />
      default:
        return <FiClock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'OPEN': 'bg-yellow-100 text-yellow-800',
      'PENDING_MD_APPROVAL': 'bg-purple-100 text-purple-800',
      'PENDING_THIRD_PARTY': 'bg-orange-100 text-orange-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'APPROVED_BY_MD': 'bg-green-100 text-green-800',
      'REJECTED_BY_MD': 'bg-red-100 text-red-800',
      'RESOLVED': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'bg-blue-100 text-blue-800',
      'MEDIUM': 'bg-green-100 text-green-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-red-100 text-red-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  if (loading && tickets.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      </DashboardLayout>
    )
  }

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
            <p className="text-gray-600 mt-1">
              Manage and track all support tickets
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportTickets}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              title="Export to CSV"
            >
              <FiDownload className="mr-2" />
              Export
            </button>
            <Link
              href="/tickets/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <FiPlusCircle className="mr-2" />
              New Ticket
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            label="Total"
            value={stats.total}
            icon={FiBarChart2}
            color="bg-gray-100 text-gray-600"
          />
          <StatCard
            label="Open"
            value={stats.open}
            icon={FiAlertCircle}
            color="bg-yellow-100 text-yellow-600"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={FiClock}
            color="bg-purple-100 text-purple-600"
          />
          <StatCard
            label="Resolved"
            value={stats.resolved}
            icon={FiCheckCircle}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            label="Closed"
            value={stats.closed}
            icon={FiCheckCircle}
            color="bg-gray-100 text-gray-600"
          />
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3h10a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm0 8h10a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 012-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3h2a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm8 0h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5a2 2 0 012-2zM5 11h2a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 012-2zm8 0h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2a2 2 0 012-2z" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <FiFilter className="h-5 w-5" />
              <span>Filters</span>
              {(filters.status || filters.category || filters.priority) && (
                <span className="bg-primary-100 text-primary-600 text-xs px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex space-x-2">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by title, description, or ticket number..."
                className="input-field pl-10"
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
            >
              Search
            </button>
          </form>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Status</option>
                  <option value="OPEN">Open</option>
                  <option value="PENDING_MD_APPROVAL">Pending MD Approval</option>
                  <option value="PENDING_THIRD_PARTY">Pending Third Party</option>
                  <option value="IN_PROGRESS">In Progress</option>
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
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="input-field"
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
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Clear Filters */}
              <div className="md:col-span-3 lg:col-span-5 flex justify-end">
                <button
                  onClick={() => {
                    setFilters({
                      status: '',
                      category: '',
                      priority: '',
                      search: '',
                      dateFrom: '',
                      dateTo: '',
                      assignedTo: '',
                      page: 1,
                      limit: 10
                    })
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedTickets.length > 0 && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center justify-between">
            <span className="text-primary-700">
              {selectedTickets.length} ticket{selectedTickets.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              {isAdmin && (
                <>
                  <button
                    onClick={() => handleBulkAction('assign')}
                    className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
                  >
                    Assign
                  </button>
                  <button
                    onClick={() => handleBulkAction('status')}
                    className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
                  >
                    Update Status
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedTickets([])}
                className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Tickets Display */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <FiXCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Tickets</h3>
            <p className="text-red-600">{error}</p>
          </div>
        ) : tickets.length > 0 ? (
          <>
            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedTickets.length === tickets.length}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort('ticketNumber')}
                      >
                        Ticket #
                        {sortBy === 'ticketNumber' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort('title')}
                      >
                        Title
                        {sortBy === 'title' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort('createdAt')}
                      >
                        Created
                        {sortBy === 'createdAt' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tickets.map((ticket) => (
                      <tr 
                        key={ticket.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/send-ticket/${ticket.id}`)}
                      >
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedTickets.includes(ticket.id)}
                            onChange={() => handleSelectTicket(ticket.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ticket.ticketNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate">
                            {ticket.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ticket.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <FiEye className="h-5 w-5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/tickets/${ticket.id}`)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(ticket.status)}
                          <span className="text-sm font-medium text-gray-900">
                            {ticket.ticketNumber}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedTickets.includes(ticket.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleSelectTicket(ticket.id)
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {ticket.title}
                      </h3>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {ticket.description}
                      </p>

                      <div className="flex items-center justify-between mb-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <FiUser className="mr-1 h-3 w-3" />
                          {ticket.createdBy?.name || 'Unknown'}
                        </div>
                        <div className="flex items-center">
                          <FiClock className="mr-1 h-3 w-3" />
                          {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                        </div>
                      </div>

                      {ticket.assignedTo && (
                        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                          Assigned to: {ticket.assignedTo.name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                      let pageNum
                      if (pagination.pages <= 5) {
                        pageNum = i + 1
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1
                      } else if (pagination.page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i
                      } else {
                        pageNum = pagination.page - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 border rounded-md text-sm font-medium ${
                            pagination.page === pageNum
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-500 mb-6">
              {filters.search || filters.status || filters.category || filters.priority
                ? 'Try adjusting your filters'
                : 'Create your first ticket to get started'}
            </p>
            <Link
              href="/tickets/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <FiPlusCircle className="mr-2" />
              Create New Ticket
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}