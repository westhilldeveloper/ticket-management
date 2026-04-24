'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useSocket } from '@/app/context/SocketContext';
import { useToast } from '@/app/context/ToastContext';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
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
  FiBarChart2,
  FiGrid,
  FiList,
} from 'react-icons/fi';
import { formatDistanceToNow, format } from 'date-fns';

export default function TicketListPage() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const toast = useToast();
  const router = useRouter();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    pending: 0,
    resolved: 0,
    closed: 0,
  });

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
    limit: 10,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const branchOptions = [
  'ENATHU', 'POOVATTOOR', 'KODUMON', 'HARIPAD', 'THRIPPUNITHURA', 
  'CHETTIKULANGARA', 'MUTHUKULAM', 'KARUNAGAPALLY', 'CHETTIKULANGARA MAIN', 
  'KULATHUPUZHA', 'MULAKKUZHA', 'KATTANAM', 'KUMBANAD', 'RANNI', 'VAIKOM', 
  'ALAPPUZHA', 'PALLIKATHODU', 'PUTHOOR', 'PATHANAMTHITTA', 'MANNAR', 
  'PRAVINKODU', 'KOTTARAKKARA', 'ANCHAL', 'THRIPPUNITHURA TOWN', 
  'MUVATTUPUZHA', 'KOTHAMANGALAM', 'THOPPUMPODY', 'PATHANAPURAM', 
  'MATTANCHERRY', 'ATHANI', 'KECHERY', 'VADANAPALLI', 'KALMANDAPAM'
];

  // Fetch tickets with current filters and sorting
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
      params.append('page', filters.page);
      params.append('limit', filters.limit);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await fetch(`/api/tickets?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to fetch tickets');

      setTickets(data.tickets || []);
      setPagination(
        data.pagination || {
          total: 0,
          pages: 0,
          page: filters.page,
          limit: filters.limit,
        }
      );
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err.message);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder, toast]);

  // Fetch stats (reuse admin stats endpoint with all data)
  const fetchStats = useCallback(async () => {
  try {
    const response = await fetch('/api/tickets/stats', { credentials: 'include' });
    if (response.ok) {
      const data = await response.json();
      console.log("data stats====>",data)
      setStats(data.stats || {
        total: 0,
        open: 0,
        pending: 0,
        resolved: 0,
        closed: 0,
      });
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
}, []);

  // Initial load and when filters/sort change
  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [fetchTickets, fetchStats]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleNewTicket = (newTicket) => {
      // Check if the new ticket matches current filters (basic check)
      const matchesFilters =
        (!filters.status || newTicket.status === filters.status) &&
        (!filters.category || newTicket.category === filters.category) &&
        (!filters.priority || newTicket.priority === filters.priority) &&
        (!filters.search ||
          newTicket.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          newTicket.ticketNumber.toLowerCase().includes(filters.search.toLowerCase()));

      if (matchesFilters && filters.page === 1) {
        setTickets((prev) => [newTicket, ...prev].slice(0, filters.limit));
      }
      fetchStats(); // update stats in background
      toast.info(`New ticket #${newTicket.ticketNumber} created`);
    };

    const handleTicketUpdate = (updatedTicket) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
      );
      fetchStats();
    };

    socket.on('new-ticket', handleNewTicket);
    socket.on('ticket-updated', handleTicketUpdate);

    return () => {
      socket.off('new-ticket', handleNewTicket);
      socket.off('ticket-updated', handleTicketUpdate);
    };
  }, [socket, filters, fetchStats, toast]);

  // Helper functions
  const handleSearch = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleSelectTicket = (ticketId) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId) ? prev.filter((id) => id !== ticketId) : [...prev, ticketId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTickets.length === tickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(tickets.map((t) => t.id));
    }
  };

  const exportTickets = async () => {
    try {
      const response = await fetch('/api/tickets/export', { credentials: 'include' });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Tickets exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export tickets');
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      OPEN: <FiAlertCircle className="h-5 w-5 text-yellow-500" />,
      PENDING_MD_APPROVAL: <FiClock className="h-5 w-5 text-purple-500" />,
      PENDING_THIRD_PARTY: <FiExternalLink className="h-5 w-5 text-orange-500" />,
      IN_PROGRESS: <FiRefreshCw className="h-5 w-5 text-blue-500" />,
      APPROVED_BY_MD: <FiThumbsUp className="h-5 w-5 text-green-500" />,
      REJECTED_BY_MD: <FiThumbsDown className="h-5 w-5 text-red-500" />,
      REJECTED_BY_SERVICE: <FiThumbsDown className="h-5 w-5 text-red-500" />,
      RESOLVED: <FiCheckCircle className="h-5 w-5 text-green-500" />,
      CLOSED: <FiCheckCircle className="h-5 w-5 text-gray-500" />,
    };
    return icons[status] || <FiClock className="h-5 w-5 text-gray-500" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      OPEN: 'bg-yellow-100 text-yellow-800',
      PENDING_MD_APPROVAL: 'bg-purple-100 text-purple-800',
      PENDING_THIRD_PARTY: 'bg-orange-100 text-orange-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      APPROVED_BY_MD: 'bg-green-100 text-green-800',
      REJECTED_BY_MD: 'bg-red-100 text-red-800',
      REJECTED_BY_SERVICE: 'bg-red-100 text-red-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'bg-blue-100 text-blue-800',
      MEDIUM: 'bg-green-100 text-green-800',
      HIGH: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading && tickets.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      </DashboardLayout>
    );
  }

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Tickets</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and track all support tickets</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportTickets}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm text-sm font-medium"
            >
              <FiDownload className="w-4 h-4" />
              Export
            </button>
            <Link
              href="/tickets/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm text-sm font-medium"
            >
              <FiPlusCircle className="w-4 h-4" />
              New Ticket
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total" value={stats.total} icon={FiBarChart2} color="bg-gray-100 text-gray-600" />
          <StatCard label="Open" value={stats.open} icon={FiAlertCircle} color="bg-yellow-100 text-yellow-600" />
          <StatCard label="Pending" value={stats.pending} icon={FiClock} color="bg-purple-100 text-purple-600" />
          <StatCard label="Resolved" value={stats.resolved} icon={FiCheckCircle} color="bg-green-100 text-green-600" />
          <StatCard label="Closed" value={stats.closed} icon={FiCheckCircle} color="bg-gray-100 text-gray-600" />
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <FiList className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <FiGrid className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiFilter className="w-5 h-5" />
              <span className="text-sm font-medium">Filters</span>
              {(filters.status || filters.category || filters.priority) && (
                <span className="bg-primary-100 text-primary-600 text-xs px-2 py-0.5 rounded-full">Active</span>
              )}
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Search by title, description, or ticket number..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
              Search
            </button>
          </form>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Status</option>
                  <option value="OPEN">Open</option>
                  <option value="PENDING_MD_APPROVAL">Pending MD Approval</option>
                  <option value="PENDING_THIRD_PARTY">Pending Third Party</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="APPROVED_BY_MD">Approved by MD</option>
                  <option value="REJECTED_BY_MD">Rejected by MD</option>
                  <option value="REJECTED_BY_SERVICE">Rejected by Service</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
  <label className="block text-xs font-medium text-gray-700 mb-1">Branch</label>
  <select
    value={filters.category}
    onChange={(e) => handleFilterChange('category', e.target.value)}
    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
  >
    <option value="">All Branches</option>
    {branchOptions.map(branch => (
      <option key={branch} value={branch}>{branch}</option>
    ))}
  </select>
</div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end items-end lg:col-span-5">
                <button
                  onClick={() =>
                    setFilters({
                      status: '',
                      category: '',
                      priority: '',
                      search: '',
                      dateFrom: '',
                      dateTo: '',
                      assignedTo: '',
                      page: 1,
                      limit: 10,
                    })
                  }
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tickets Display */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <FiXCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Tickets</h3>
            <p className="text-red-600">{error}</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-500 mb-6">
              {filters.search || filters.status || filters.category || filters.priority
                ? 'Try adjusting your filters'
                : 'Create your first ticket to get started'}
            </p>
            <Link
              href="/tickets/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <FiPlusCircle className="w-4 h-4" />
              Create New Ticket
            </Link>
          </div>
        ) : (
          <>
            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
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
                          onClick={() => handleSort('ticketNumber')}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        >
                          Ticket #
                          {sortBy === 'ticketNumber' && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </th>
                        <th
                          onClick={() => handleSort('title')}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        >
                          Title
                          {sortBy === 'title' && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th
                          onClick={() => handleSort('createdAt')}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        >
                          Created
                          {sortBy === 'createdAt' && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
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
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{ticket.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/tickets/${ticket.id}`}
                              className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1"
                            >
                              <FiEye className="w-4 h-4" />
                              <span className="sr-only">View</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                    onClick={() => router.push(`/tickets/${ticket.id}`)}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(ticket.status)}
                          <span className="text-sm font-medium text-gray-900">{ticket.ticketNumber}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedTickets.includes(ticket.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectTicket(ticket.id);
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{ticket.title}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{ticket.description}</p>
                      <div className="flex items-center justify-between mb-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <FiUser className="w-3 h-3" />
                          {ticket.createdBy?.name || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) pageNum = i + 1;
                    else if (pagination.page <= 3) pageNum = i + 1;
                    else if (pagination.page >= pagination.pages - 2) pageNum = pagination.pages - 4 + i;
                    else pageNum = pagination.page - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 border rounded-lg text-sm font-medium ${
                          pagination.page === pageNum
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// Stat Card Component (reusable, modern)
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}