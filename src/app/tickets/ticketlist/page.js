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
    limit: 15, // increased default per page
  });

  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 15,
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

  // Fetch tickets (same logic, unchanged)
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
      setPagination(data.pagination || {
        total: 0,
        pages: 0,
        page: filters.page,
        limit: filters.limit,
      });
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err.message);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder, toast]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/tickets/stats', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
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

  // Initial load
  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [fetchTickets, fetchStats]);

  // Socket events (unchanged)
  useEffect(() => {
    if (!socket) return;

    const handleNewTicket = (newTicket) => {
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
      fetchStats();
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

  // Helper functions (unchanged)
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
      OPEN: <FiAlertCircle className="h-4 w-4 text-yellow-500" />,
      PENDING_MD_APPROVAL: <FiClock className="h-4 w-4 text-purple-500" />,
      PENDING_THIRD_PARTY: <FiExternalLink className="h-4 w-4 text-orange-500" />,
      IN_PROGRESS: <FiRefreshCw className="h-4 w-4 text-blue-500" />,
      APPROVED_BY_MD: <FiThumbsUp className="h-4 w-4 text-green-500" />,
      REJECTED_BY_MD: <FiThumbsDown className="h-4 w-4 text-red-500" />,
      REJECTED_BY_SERVICE: <FiThumbsDown className="h-4 w-4 text-red-500" />,
      RESOLVED: <FiCheckCircle className="h-4 w-4 text-green-500" />,
      CLOSED: <FiCheckCircle className="h-4 w-4 text-gray-500" />,
    };
    return icons[status] || <FiClock className="h-4 w-4 text-gray-500" />;
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
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner size="small" />
        </div>
      </DashboardLayout>
    );
  }

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role);

  return (
    <DashboardLayout>
      <div className="space-y-3 p-3 md:p-4">
        {/* Header - compact */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900">Tickets</h1>
            <p className="text-[10px] text-gray-500">Manage and track all support tickets</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportTickets}
              className="inline-flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-[10px] font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiDownload className="w-3 h-3" />
              Export
            </button>
            <Link
              href="/tickets/new"
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary-600 text-white rounded text-[10px] font-medium hover:bg-primary-700"
            >
              <FiPlusCircle className="w-3 h-3" />
              New Ticket
            </Link>
          </div>
        </div>

        {/* Stats Cards - compact */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <StatCardCompact label="Total" value={stats.total} icon={FiBarChart2} color="bg-gray-100 text-gray-600" />
          <StatCardCompact label="Open" value={stats.open} icon={FiAlertCircle} color="bg-yellow-100 text-yellow-600" />
          <StatCardCompact label="Pending" value={stats.pending} icon={FiClock} color="bg-purple-100 text-purple-600" />
          <StatCardCompact label="Resolved" value={stats.resolved} icon={FiCheckCircle} color="bg-green-100 text-green-600" />
          <StatCardCompact label="Closed" value={stats.closed} icon={FiCheckCircle} color="bg-gray-100 text-gray-600" />
        </div>

        {/* Search & Filter Bar - compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
              >
                <FiList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
              >
                <FiGrid className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-900"
            >
              <FiFilter className="w-3 h-3" />
              <span>Filters</span>
              {(filters.status || filters.category || filters.priority) && (
                <span className="bg-primary-100 text-primary-600 text-[9px] px-1 rounded-full">●</span>
              )}
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex gap-1">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Search tickets..."
                className="w-full pl-6 pr-2 py-1 border border-gray-200 rounded text-[10px] focus:outline-none focus:border-primary-300"
              />
            </div>
            <button type="submit" className="px-2 py-1 bg-primary-600 text-white rounded text-[10px] font-medium hover:bg-primary-700">
              Go
            </button>
          </form>

          {showFilters && (
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-1">
              <div>
                <label className="block text-[9px] font-medium text-gray-600 mb-0.5">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-2 py-0.5 border border-gray-200 rounded text-[10px]"
                >
                  <option value="">All</option>
                  <option value="OPEN">Open</option>
                  <option value="PENDING_MD_APPROVAL">MD Approval</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-medium text-gray-600 mb-0.5">Branch</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-2 py-0.5 border border-gray-200 rounded text-[10px]"
                >
                  <option value="">All</option>
                  {branchOptions.slice(0, 10).map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-medium text-gray-600 mb-0.5">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-2 py-0.5 border border-gray-200 rounded text-[10px]"
                >
                  <option value="">All</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-medium text-gray-600 mb-0.5">From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-2 py-0.5 border border-gray-200 rounded text-[10px]"
                />
              </div>
              <div>
                <label className="block text-[9px] font-medium text-gray-600 mb-0.5">To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-2 py-0.5 border border-gray-200 rounded text-[10px]"
                />
              </div>
              <div className="col-span-full flex justify-end">
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
                      limit: 15,
                    })
                  }
                  className="text-[9px] text-primary-600 hover:underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tickets Display */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <FiXCircle className="mx-auto h-6 w-6 text-red-500 mb-1" />
            <h3 className="text-xs font-medium text-red-800">Error</h3>
            <p className="text-[9px] text-red-600">{error}</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FiAlertCircle className="mx-auto h-6 w-6 text-gray-300 mb-2" />
            <h3 className="text-xs font-medium text-gray-900 mb-1">No tickets found</h3>
            <p className="text-[9px] text-gray-500 mb-3">Adjust filters or create a ticket</p>
            <Link href="/tickets/new" className="inline-flex items-center gap-1 px-2 py-1 bg-primary-600 text-white rounded text-[9px]">
              <FiPlusCircle className="w-3 h-3" />
              New Ticket
            </Link>
          </div>
        ) : (
          <>
            {/* List View - compact table */}
            {viewMode === 'list' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-[10px]">
                    <thead className="bg-gray-50">
                      <tr className="text-gray-500 font-medium">
                        <th className="px-2 py-1 text-left w-6">
                          <input
                            type="checkbox"
                            checked={selectedTickets.length === tickets.length}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-primary-600"
                          />
                        </th>
                        <th onClick={() => handleSort('ticketNumber')} className="px-2 py-1 text-left cursor-pointer">
                          Ticket#
                        </th>
                        <th onClick={() => handleSort('title')} className="px-2 py-1 text-left cursor-pointer">
                          Title
                        </th>
                        <th className="px-2 py-1 text-left">Branch</th>
                        <th className="px-2 py-1 text-left">Status</th>
                        <th className="px-2 py-1 text-left">Priority</th>
                        <th onClick={() => handleSort('createdAt')} className="px-2 py-1 text-left cursor-pointer">
                          Created
                        </th>
                        <th className="px-2 py-1 text-center w-8">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className="hover:bg-gray-50 cursor-pointer border-t border-gray-100"
                          onClick={() => router.push(`/send-ticket/${ticket.id}`)}
                        >
                          <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedTickets.includes(ticket.id)}
                              onChange={() => handleSelectTicket(ticket.id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-2 py-1 font-medium text-gray-900">{ticket.ticketNumber}</td>
                          <td className="px-2 py-1 text-gray-700 truncate max-w-[180px]">{ticket.title}</td>
                          <td className="px-2 py-1 text-gray-500">{ticket.category}</td>
                          <td className="px-2 py-1">
                            <span className={`px-1.5 py-0.5 text-[8px] font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-2 py-1">
                            <span className={`px-1.5 py-0.5 text-[8px] font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="px-2 py-1 text-gray-500 whitespace-nowrap">
                            {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                          </td>
                          <td className="px-2 py-1 text-center" onClick={(e) => e.stopPropagation()}>
                            <Link href={`/tickets/${ticket.id}`} className="text-primary-600 hover:text-primary-800">
                              <FiEye className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Grid View - compact cards */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md cursor-pointer overflow-hidden"
                    onClick={() => router.push(`/tickets/${ticket.id}`)}
                  >
                    <div className="p-2">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(ticket.status)}
                          <span className="text-[9px] font-medium text-gray-900">{ticket.ticketNumber}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedTickets.includes(ticket.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectTicket(ticket.id);
                          }}
                          className="rounded border-gray-300 w-3 h-3"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <h3 className="text-[10px] font-semibold text-gray-900 line-clamp-2 mb-1">{ticket.title}</h3>
                      <p className="text-[8px] text-gray-500 line-clamp-2 mb-1">{ticket.description?.slice(0, 80)}</p>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-1 py-0.5 text-[7px] font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-1 py-0.5 text-[7px] font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[8px] text-gray-500">
                        <span className="flex items-center gap-0.5"><FiUser className="w-2 h-2" /> {ticket.createdBy?.name?.slice(0, 12)}</span>
                        <span className="flex items-center gap-0.5"><FiClock className="w-2 h-2" /> {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination - compact */}
            {pagination.pages > 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 flex flex-wrap items-center justify-between gap-2 text-[9px]">
                <p className="text-gray-600">
                  {(pagination.page - 1) * pagination.limit + 1} – {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-2 py-0.5 border border-gray-300 rounded disabled:opacity-40"
                  >
                    Prev
                  </button>
                  {[...Array(Math.min(3, pagination.pages))].map((_, i) => {
                    let pageNum;
                    if (pagination.pages <= 3) pageNum = i + 1;
                    else if (pagination.page <= 2) pageNum = i + 1;
                    else if (pagination.page >= pagination.pages - 1) pageNum = pagination.pages - 2 + i;
                    else pageNum = pagination.page - 1 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-2 py-0.5 border rounded ${pagination.page === pageNum ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-700'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-2 py-0.5 border border-gray-300 rounded disabled:opacity-40"
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

// Compact Stat Card Component
function StatCardCompact({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 hover:shadow transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[8px] text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-base font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-1.5 rounded-full ${color}`}>
          <Icon className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}