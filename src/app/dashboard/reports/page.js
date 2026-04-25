// app/dashboard/reports/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import ErrorBoundary from '@/app/components/common/ErrorBoundary';
import { useToast } from '@/app/context/ToastContext';
import {
  FiFileText,
  FiCalendar,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiTrendingUp
} from 'react-icons/fi';
import { format } from 'date-fns';

function ReportsContent() {
  const { user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  // States
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: 'ALL',
    priority: 'ALL',
    status: 'ALL'
  });
  const [availableCategories, setAvailableCategories] = useState([]);

  // Fetch categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/dynamic-categories');
        if (res.ok) {
          const data = await res.json();
          setAvailableCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.category !== 'ALL') params.append('category', filters.category);
      if (filters.priority !== 'ALL') params.append('priority', filters.priority);
      if (filters.status !== 'ALL') params.append('status', filters.status);

      const res = await fetch(`/api/reports?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load report');
      setSummary(data.summary);
      setTickets(data.tickets);
    } catch (error) {
      console.error('Report fetch error:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [filters, user, toast]);

  useEffect(() => {
    if (user && !authLoading) fetchReport();
  }, [fetchReport, user, authLoading]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      category: 'ALL',
      priority: 'ALL',
      status: 'ALL'
    });
  };

  // Export to CSV (reuse logic or use existing export)
  const exportCSV = () => {
    if (!tickets.length) {
      toast.error('No data to export');
      return;
    }
    let csv = 'Ticket Number,Title,Category,Priority,Status,Created By,Assigned To,Created Date,Closed Date,Duration\n';
    tickets.forEach(ticket => {
      csv += `"${ticket.ticketNumber}","${ticket.title.replace(/"/g, '""')}",${ticket.category},${ticket.priority},${ticket.status},${ticket.createdBy?.name || 'N/A'},${ticket.assignedTo?.name || 'Unassigned'},${format(new Date(ticket.createdAt), 'yyyy-MM-dd')},${ticket.closedAt ? format(new Date(ticket.closedAt), 'yyyy-MM-dd') : 'N/A'},${ticket.durationText}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Role check
  if (!user || !['ADMIN', 'SUPER_ADMIN', 'MD'].includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <FiAlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="text-gray-500 mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value ?? 0}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detailed Reports</h1>
            <p className="text-gray-500 mt-1">Ticket analytics with time tracking</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportCSV}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <FiDownload className="mr-2" />
              Export CSV
            </button>
            <button
              onClick={fetchReport}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiFilter className="mr-2" />
              Filters
            </h2>
            <button
              onClick={resetFilters}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input-field w-full"
              >
                <option value="ALL">All Categories</option>
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="input-field w-full"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field w-full"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="PENDING_MD_APPROVAL">Pending MD Approval</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="SERVICE_IN_PROGRESS">Service In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="REJECTED_BY_MD">Rejected by MD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Tickets" value={summary.total} icon={FiFileText} color="bg-blue-600" />
            <StatCard title="Open / Pending" value={summary.open + summary.pendingMD} icon={FiAlertCircle} color="bg-amber-500" />
            <StatCard title="Resolved / Closed" value={summary.resolved + summary.closed} icon={FiCheckCircle} color="bg-green-600" />
            <StatCard title="Avg Resolution Time" value={summary.avgResolutionTime ? `${summary.avgResolutionTime} days` : 'N/A'} icon={FiTrendingUp} color="bg-purple-600" />
          </div>
        )}

        {/* Detailed Ticket Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Ticket Details</h2>
            <p className="text-sm text-gray-500 mt-1">Showing {tickets.length} tickets</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No tickets match the selected filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Closed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.ticketNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{ticket.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{ticket.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ticket.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                          ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          ticket.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{ticket.status.replace(/_/g, ' ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(ticket.createdAt), 'dd/MM/yy')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.closedAt ? format(new Date(ticket.closedAt), 'dd/MM/yy') : '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{ticket.durationText}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ReportsPage() {
  return (
    <ErrorBoundary>
      <ReportsContent />
    </ErrorBoundary>
  );
}