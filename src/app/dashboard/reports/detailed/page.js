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

  // Define CSV headers
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
      // Fallback: create one row with empty timeline columns
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
      // Create one row per timeline step
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

  // Convert to CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape commas, quotes, and newlines
      if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(','))
  ].join('\n');

  // Download file
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
      case 'green': return 'bg-green-100 text-green-800 border-green-200';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'red': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) return <div className="flex justify-center items-center h-96"><LoadingSpinner size="large" /></div>;
  if (!user || !['ADMIN', 'SUPER_ADMIN', 'MD'].includes(user.role)) {
    return (
      <DashboardLayout><div className="text-center py-12"><FiAlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" /><p>Access Denied</p></div></DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Detailed Timeline Report</h1>
          <div className="flex gap-3">
            <button onClick={exportCSV} className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50"><FiDownload /> Export CSV</button>
            <button onClick={fetchReport} className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2"><FiRefreshCw /> Refresh</button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium mb-1">Start Date</label><input type="date" className="input-field w-full" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">End Date</label><input type="date" className="input-field w-full" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">Category</label><select className="input-field w-full" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}><option value="ALL">All</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Status</label><select className="input-field w-full" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}><option value="ALL">All</option><option value="OPEN">Open</option><option value="PENDING_MD_APPROVAL">Pending MD</option><option value="IN_PROGRESS">In Progress</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option></select></div>
          </div>
        </div>

        {/* Summary stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border"><p className="text-gray-500 text-sm">Total Tickets</p><p className="text-2xl font-bold">{summary.total}</p></div>
            <div className="bg-white p-6 rounded-xl border"><p className="text-gray-500 text-sm">Open / Pending</p><p className="text-2xl font-bold">{summary.open + summary.pendingMD}</p></div>
            <div className="bg-white p-6 rounded-xl border"><p className="text-gray-500 text-sm">In Progress</p><p className="text-2xl font-bold">{summary.inProgress}</p></div>
            <div className="bg-white p-6 rounded-xl border"><p className="text-gray-500 text-sm">Resolved / Closed</p><p className="text-2xl font-bold">{summary.resolvedClosed}</p></div>
          </div>
        )}

        {/* Tickets table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overall Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                
                {tickets.map(ticket => (
                   <React.Fragment key={ticket.id}>
                    <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleRow(ticket.id)}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{ticket.ticketNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{ticket.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ticket.status.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-medium ${ticket.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' : ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>{ticket.priority}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-500">{format(new Date(ticket.createdAt), 'dd/MM/yy')}</td>
                      <td className="px-4 py-3 text-sm font-medium"><span className={`px-2 py-1 rounded-full text-xs ${getColorClass(ticket.overallColor)}`}>{ticket.overallDuration}</span></td>
                      <td className="px-4 py-3">{expandedRows[ticket.id] ? <FiChevronDown /> : <FiChevronRight />}</td>
                    </tr>
                    {expandedRows[ticket.id] && (
  <tr className="bg-gray-50">
    <td colSpan="7" className="px-4 py-4">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700 mb-2">Detailed Activity Timeline</p>
        <div className="space-y-1.5">
          {ticket.timeline.map((item, idx) => (
            <div  key={`${ticket.id}-timeline-${idx}-${item.start}`} className="bg-white p-3 rounded border text-xs">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
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
                  <div className="text-gray-500 text-[9px] mt-1">
                    {new Date(item.start).toLocaleString()} → {new Date(item.end).toLocaleString()}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${getColorClass(item.color)}`}>
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