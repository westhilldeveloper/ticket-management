'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useSocket } from '@/app/context/SocketContext';
import { useToast } from '@/app/context/ToastContext';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import ErrorBoundary from '@/app/components/common/ErrorBoundary';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

// Custom hooks
import { useAdminData } from './hooks/useAdminData';

// Components
import AdminHeader from './components/AdminHeader';
import StatsGrid from './components/StatsGrid';
import TrendChart from './components/Charts/TrendChart';
import StatusChart from './components/Charts/StatusChart';
import PriorityChart from './components/Charts/PriorityChart';
import CategoryChart from './components/Charts/CategoryChart';
import PendingApprovals from './components/PendingApprovals';
import PendingThirdParty from './components/PendingThirdParty';
import RecentTickets from './components/RecentTickets';
import RecentActivities from './components/RecentActivities';
import LoadingSkeleton from './components/LoadingSkeleton';

// Utils
import { CHART_COLORS, STATUS_COLORS } from './utils/chartConfig';

function AdminDashboardContent() {
  const { user, isLoading: authLoading } = useAuth();
  const { socket, isConnected } = useSocket(); 
  const router = useRouter();
  const toast = useToast();

  const [isClient, setIsClient] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [requestServiceType, setRequestServiceType] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    loading,
    error,
    stats,
    recentTickets,
    pendingApprovals,
    pendingThirdParty,
    recentActivities,
    topUsers,
    fetchDashboardData,
    exportReport,
  } = useAdminData(timeRange, requestServiceType, socket);

  // Fetch categories for dynamic chart
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/dynamic-categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setDynamicCategories(data.categories);
      } catch (err) {
        console.error('Error fetching categories:', err);
        toast.error('Could not load categories for chart');
      } finally {
        setCategoriesLoading(false);
      }
    };
    if (isClient && user) fetchCategories();
  }, [isClient, user, toast]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initial fetch
  useEffect(() => {
    if (isClient && user) fetchDashboardData();
  }, [fetchDashboardData, isClient, user]);

  // Listen for new ticket events
  useEffect(() => {
    if (socket && isConnected) {
      const handleNewTicket = (ticketData) => {
        console.log('New ticket received:', ticketData);
        fetchDashboardData();
        toast.success(`New ticket #${ticketData.ticketNumber} created`, { duration: 4000 });
      };
      socket.on('new-ticket', handleNewTicket);
      return () => {
        socket.off('new-ticket', handleNewTicket);
      };
    }
  }, [socket, isConnected, fetchDashboardData, toast]);

  useEffect(() => {
    if (socket && isConnected) {
      const handleTicketUpdated = (updatedTicket) => {
        console.log('Admin: ticket updated', updatedTicket);
        fetchDashboardData();
        toast.info(`Ticket #${updatedTicket.ticketNumber} updated`);
      };
      socket.on('ticket-updated', handleTicketUpdated);
      return () => socket.off('ticket-updated', handleTicketUpdated);
    }
  }, [socket, isConnected, fetchDashboardData, toast]);

  // Authorization check
  useEffect(() => {
    if (isClient && user && !['ADMIN', 'SUPER_ADMIN', 'MD', 'SERVICE_TEAM'].includes(user.role)) {
      router.push('/dashboard');
      toast.error('You do not have permission to access this page');
    }
  }, [isClient, user, router, toast]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  // Generate chart data
  const generateChartData = useCallback(() => {
    let categoryLabels = [];
    let categoryValues = [];
    let categoryColors = [];

    if (dynamicCategories.length > 0) {
      categoryLabels = dynamicCategories.map((cat) => cat.name);
      categoryValues = dynamicCategories.map((cat) => stats.ticketsByCategory?.[cat.name] || 0);
      const colorValues = Object.values(CHART_COLORS);
      categoryColors = categoryLabels.map((_, idx) => colorValues[idx % colorValues.length]);
    } else if (!categoriesLoading && dynamicCategories.length === 0) {
      categoryLabels = ['No Categories'];
      categoryValues = [0];
      categoryColors = [CHART_COLORS.gray];
    }

    const categoryData = {
      labels: categoryLabels,
      datasets: [{ data: categoryValues, backgroundColor: categoryColors }],
    };

    // Priority chart
    const priorityData = {
      labels: ['Low', 'Medium', 'High', 'Critical'],
      datasets: [{
        data: [
          stats.ticketsByPriority?.LOW || 0,
          stats.ticketsByPriority?.MEDIUM || 0,
          stats.ticketsByPriority?.HIGH || 0,
          stats.ticketsByPriority?.CRITICAL || 0,
        ],
        backgroundColor: [
          CHART_COLORS.primary,
          CHART_COLORS.secondary,
          CHART_COLORS.warning,
          CHART_COLORS.danger,
        ],
      }],
    };

    // Status chart
    const statusLabels = [];
    const statusData = [];
    const statusColors = [];
    Object.entries(stats.ticketsByStatus || {}).forEach(([key, value]) => {
      if (value > 0) {
        statusLabels.push(key.replace(/_/g, ' '));
        statusData.push(value);
        statusColors.push(STATUS_COLORS[key] || CHART_COLORS.gray);
      }
    });
    const statusDataObj = {
      labels: statusLabels,
      datasets: [{ data: statusData, backgroundColor: statusColors }],
    };

    // Trend data (mock)
    const days = timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : 30;
    const labels = [];
    const trendValues = [];
    for (let i = days - 1; i >= 0; i--) {
      labels.push(`Day ${days - i}`);
      trendValues.push(Math.floor(Math.random() * 10) + 5);
    }
    const trendData = {
      labels,
      datasets: [{
        label: 'Tickets',
        data: trendValues,
        borderColor: CHART_COLORS.primary,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      }],
    };

    return { categoryData, priorityData, statusData: statusDataObj, trendData };
  }, [dynamicCategories, categoriesLoading, stats, timeRange]);

  const chartData = generateChartData();

  // Loading state
  if (!isClient || authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="p-3">
          <LoadingSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-4">
          <FiAlertCircle className="h-8 w-8 text-amber-500 mb-2" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">Authentication Required</h3>
          <p className="text-xs text-gray-500 mb-3">Please log in to view the admin dashboard</p>
          <Link
            href="/login"
            className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Go to Login
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-6 px-3">
          <div className="bg-red-50 border border-red-200 rounded p-4 text-center">
            <FiAlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
            <h2 className="text-base font-bold text-red-800 mb-1">Error Loading Dashboard</h2>
            <p className="text-xs text-red-600 mb-3">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-3 p-3 md:p-4">
        <AdminHeader
          userName={user?.name}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onExport={exportReport}
          onRefresh={handleRefresh}
          isConnected={isConnected}
          requestServiceType={requestServiceType}
          onRequestServiceTypeChange={setRequestServiceType}
          isRefreshing={isRefreshing}
        />

        <StatsGrid stats={stats} />

        {/* Charts Section - compact grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <TrendChart stats={stats} timeRange={timeRange} />
          <StatusChart stats={stats} />
          <PriorityChart stats={stats} />
          {/* <CategoryChart data={chartData.categoryData} /> */}
        </div>

        <PendingApprovals approvals={pendingApprovals} />
        <PendingThirdParty tickets={pendingThirdParty} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <RecentTickets tickets={recentTickets} />
          <RecentActivities activities={recentActivities} />
        </div>
      </div>
    </DashboardLayout>
  );
}

// Main export with ErrorBoundary
export default function AdminPage() {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-4">
            <FiAlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">Something went wrong</h3>
            <p className="text-xs text-gray-500 mb-3 max-w-md">{error?.message || 'Unable to load admin dashboard.'}</p>
            <div className="flex space-x-2">
              <button
                onClick={resetError}
                className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Try Again
              </button>
              <Link
                href="/dashboard"
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </DashboardLayout>
      )}
    >
      <AdminDashboardContent />
    </ErrorBoundary>
  );
}