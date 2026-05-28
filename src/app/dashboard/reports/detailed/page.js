// app/dashboard/reports/detailed/page.js
'use client';
import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import ErrorBoundary from '@/app/components/common/ErrorBoundary';
import { useToast } from '@/app/context/ToastContext';
import {
  FiClock,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiChevronDown,
  FiChevronRight,
  FiAlertCircle
} from 'react-icons/fi';
import { format } from 'date-fns';

function DetailedReportsContent() {
  const { user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: 'ALL',
    status: 'ALL'
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch('/api/dynamic-categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    };
    fetchCategories();
  }, []);

  const fetchReport = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.category !== 'ALL') params.append('category', filters.category);
      if (filters.status !== 'ALL') params.append('status', filters.status);
      const res = await fetch(`/api/reports/detailed?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSummary(data.summary);
      setTickets(data.tickets);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [filters, user, toast]);

  useEffect(() => {
    if (user && !authLoading) fetchReport();
  }, [fetchReport, user, authLoading]);

  const toggleRow = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  const exportCSV = () => {
    if (!tickets.length) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Ticket Number',
      'Title',
      'Category',
      'Priority',
      'Status',
      'Created By',
      'Created Email',
      'Assigned To',
      'Overall Duration',
      'Overall Status',
      'Step Event',
      'Step User Name',
      'Step User Role',
      'Step User Email',
      'Start Time',
      'End Time',
      'Step Duration',
      'Step Duration Status'
    ];

    const rows = [];

    tickets.forEach(ticket => {
      if (ticket.timeline.length === 0) {
        rows.push([
          ticket.ticketNumber,
          ticket.title,
          ticket.category,
          ticket.priority,
          ticket.status,
          ticket.createdBy || '',
          ticket.createdByEmail || '',
          ticket.assignedTo || '',
          ticket.overallDuration,
          ticket.overallColor.toUpperCase(),
          'No timeline events',
          '',
          '',
          '',
          '',
          '',
          '',
          ''
        ]);
      } else {
        ticket.timeline.forEach(step => {
          rows.push([
            ticket.ticketNumber,
            ticket.title,
            ticket.category,
            ticket.priority,
            ticket.status,
            ticket.createdBy || '',
            ticket.createdByEmail || '',
            ticket.assignedTo || '',
            ticket.overallDuration,
            ticket.overallColor.toUpperCase(),
            step.event,
            step.user?.name || '',
            step.user?.role || '',
            step.user?.email || '',
            new Date(step.start).toLocaleString(),
            new Date(step.end).toLocaleString(),
            step.durationFormatted,
            step.color.toUpperCase()
          ]);
        });
      }
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detailed-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} activity rows`);
  };

  const getColorClass = (color) => {
    switch(color) {
      case 'green': return 'bg-green-50 text-green-700 border-green-200';
      case 'yellow': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'red': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner size="large" />
        </div>
      </DashboardLayout>
    );
  }
  if (!user || !['ADMIN', 'SUPER_ADMIN', 'MD'].includes(user.role)) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <FiAlertCircle className="mx-auto h-10 w-10 text-amber-500 mb-3" />
          <p className="text-sm text-gray-600">Access Denied</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 p-5 max-w-[1600px] mx-auto text-sm">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-800 tracking-tight">Detailed Timeline Report</h1>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiDownload className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={fetchReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
              <FiRefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                className="w-full rounded-md border-gray-300 text-xs py-1.5 px-2 focus:ring-gray-400 focus:border-gray-400"
                value={filters.startDate}
                onChange={e => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                className="w-full rounded-md border-gray-300 text-xs py-1.5 px-2 focus:ring-gray-400 focus:border-gray-400"
                value={filters.endDate}
                onChange={e => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select
                className="w-full rounded-md border-gray-300 text-xs py-1.5 px-2 focus:ring-gray-400 focus:border-gray-400"
                value={filters.category}
                onChange={e => setFilters({...filters, category: e.target.value})}
              >
                <option value="ALL">All</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                className="w-full rounded-md border-gray-300 text-xs py-1.5 px-2 focus:ring-gray-400 focus:border-gray-400"
                value={filters.status}
                onChange={e => setFilters({...filters, status: e.target.value})}
              >
                <option value="ALL">All</option>
                <option value="OPEN">Open</option>
                <option value="PENDING_MD_APPROVAL">Pending MD</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Stats - minimalist cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Tickets</p>
              <p className="text-xl font-semibold text-gray-800 mt-1">{summary.total}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Open / Pending</p>
              <p className="text-xl font-semibold text-gray-800 mt-1">{summary.open + summary.pendingMD}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">In Progress</p>
              <p className="text-xl font-semibold text-gray-800 mt-1">{summary.inProgress}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Resolved / Closed</p>
              <p className="text-xl font-semibold text-gray-800 mt-1">{summary.resolvedClosed}</p>
            </div>
          </div>
        )}

        {/* Tickets Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Ticket</th>
                  <th className="px-3 py-2 text-left font-medium">Title</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Priority</th>
                  <th className="px-3 py-2 text-left font-medium">Created</th>
                  <th className="px-3 py-2 text-left font-medium">Overall Duration</th>
                  <th className="px-3 py-2 text-center font-medium w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map(ticket => (
                  <React.Fragment key={ticket.id}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => toggleRow(ticket.id)}
                    >
                      <td className="px-3 py-2 font-medium text-gray-900">{ticket.ticketNumber}</td>
                      <td className="px-3 py-2 text-gray-700 max-w-xs truncate">{ticket.title}</td>
                      <td className="px-3 py-2 text-gray-600">{ticket.status.replace(/_/g, ' ')}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          ticket.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500">{format(new Date(ticket.createdAt), 'dd/MM/yy')}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${getColorClass(ticket.overallColor)}`}>
                          {ticket.overallDuration}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-400">
                        {expandedRows[ticket.id] ? <FiChevronDown className="inline w-3.5 h-3.5" /> : <FiChevronRight className="inline w-3.5 h-3.5" />}
                      </td>
                    </tr>
                    {expandedRows[ticket.id] && (
                      <tr className="bg-gray-50/80">
                        <td colSpan="7" className="px-4 py-3">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-700 mb-1">Activity Timeline</p>
                            <div className="space-y-1.5">
                              {ticket.timeline.map((item, idx) => (
                                <div key={`${ticket.id}-timeline-${idx}-${item.start}`} className="bg-white p-2.5 rounded border border-gray-200 text-xs">
                                  <div className="flex flex-wrap justify-between items-start gap-2">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-800 text-xs">
                                        {item.event}
                                        {item.user && (
                                          <span className="ml-2 text-gray-500 text-[10px] font-normal">
                                            by {item.user.name} ({item.user.role})
                                          </span>
                                        )}
                                      </div>
                                      {item.user && item.user.email && (
                                        <div className="text-gray-400 text-[9px] mt-0.5">{item.user.email}</div>
                                      )}
                                      <div className="text-gray-400 text-[9px] mt-1">
                                        {new Date(item.start).toLocaleString()} → {new Date(item.end).toLocaleString()}
                                      </div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-medium whitespace-nowrap ${getColorClass(item.color)}`}>
                                      {item.durationFormatted}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function DetailedReportsPage() {
  return (
    <ErrorBoundary>
      <DetailedReportsContent />
    </ErrorBoundary>
  );
}