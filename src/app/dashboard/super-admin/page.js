'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/app/components/layouts/DashboardLayout'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'
import { 
  FiUsers, 
  FiSettings, 
  FiActivity,
  FiDatabase,
  FiShield,
  FiAlertTriangle,
  FiCpu,
  FiHardDrive,
  FiUserCheck,
  FiUserX
} from 'react-icons/fi'

export default function SuperAdminDashboard() {
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTickets: 0,
    openTickets: 0,
    resolvedThisMonth: 0,
    storageUsed: '0 MB',
    apiCalls: 0,
    errorRate: '0%',
    uptime: '99.9%',
    lastBackup: null
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const getFirstDayOfMonth = () => {
    const date = new Date()
    date.setDate(1)
    date.setHours(0, 0, 0, 0)
    return date.toISOString()
  }

  const fetchSystemStats = async () => {
    try {
      setLoading(true)

      const totalUsersRes = await fetch('/api/admin/users?limit=1')
      const totalUsersData = await totalUsersRes.json()
      const totalUsers = totalUsersData.pagination?.total || 0

      const activeUsersRes = await fetch('/api/admin/users?status=active&limit=1')
      const activeUsersData = await activeUsersRes.json()
      const activeUsers = activeUsersData.pagination?.total || 0

      const ticketsRes = await fetch('/api/tickets?limit=1')
      const ticketsData = await ticketsRes.json()
      const totalTickets = ticketsData.pagination?.total || 0

      const openTicketsRes = await fetch('/api/tickets?status=OPEN&limit=1')
      const openTicketsData = await openTicketsRes.json()
      const openTickets = openTicketsData.pagination?.total || 0

      const firstDay = getFirstDayOfMonth()
      const resolvedTicketsRes = await fetch(`/api/tickets?status=RESOLVED&dateFrom=${firstDay}&limit=1`)
      const resolvedTicketsData = await resolvedTicketsRes.json()
      const resolvedThisMonth = resolvedTicketsData.pagination?.total || 0

      const auditRes = await fetch('/api/admin/audit-logs?limit=10')
      const auditData = await auditRes.json()

      setSystemStats({
        totalUsers,
        activeUsers,
        totalTickets,
        openTickets,
        resolvedThisMonth,
        storageUsed: '2.3 GB',
        apiCalls: 45678,
        errorRate: '0.02%',
        uptime: '99.9%',
        lastBackup: new Date().toISOString()
      })

      setRecentActivities(auditData.logs || [])
    } catch (error) {
      console.error('Error fetching system stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemStats()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 p-5 max-w-[1600px] mx-auto text-sm">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
            Super Admin Dashboard
          </h1>
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            <FiSettings className="w-3.5 h-3.5" />
            System Settings
          </Link>
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SystemHealthCard
            title="System Uptime"
            value={systemStats.uptime}
            icon={FiCpu}
            status="healthy"
          />
          <SystemHealthCard
            title="Error Rate"
            value={systemStats.errorRate}
            icon={FiAlertTriangle}
            status="healthy"
          />
          <SystemHealthCard
            title="API Calls"
            value={systemStats.apiCalls.toLocaleString()}
            icon={FiActivity}
            status="info"
          />
          <SystemHealthCard
            title="Storage Used"
            value={systemStats.storageUsed}
            icon={FiHardDrive}
            status="warning"
          />
        </div>

        {/* User & Ticket Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">User Statistics</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <FiUsers className="text-gray-500 w-3.5 h-3.5" />
                  <span className="text-gray-600">Total Users</span>
                </div>
                <span className="font-medium text-gray-800">{systemStats.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <FiUserCheck className="text-green-600 w-3.5 h-3.5" />
                  <span className="text-gray-600">Active Users</span>
                </div>
                <span className="font-medium text-gray-800">{systemStats.activeUsers}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <FiUserX className="text-red-500 w-3.5 h-3.5" />
                  <span className="text-gray-600">Inactive Users</span>
                </div>
                <span className="font-medium text-gray-800">
                  {systemStats.totalUsers - systemStats.activeUsers}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <Link
                href="/admin/users"
                className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
              >
                Manage Users →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Ticket Statistics</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <FiDatabase className="text-gray-500 w-3.5 h-3.5" />
                  <span className="text-gray-600">Total Tickets</span>
                </div>
                <span className="font-medium text-gray-800">{systemStats.totalTickets}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <FiActivity className="text-yellow-600 w-3.5 h-3.5" />
                  <span className="text-gray-600">Open Tickets</span>
                </div>
                <span className="font-medium text-gray-800">{systemStats.openTickets}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <FiShield className="text-green-600 w-3.5 h-3.5" />
                  <span className="text-gray-600">Resolved This Month</span>
                </div>
                <span className="font-medium text-gray-800">{systemStats.resolvedThisMonth}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickActionCard
            title="User Management"
            description="Add, edit, or deactivate users"
            icon={FiUsers}
            href="/admin/users"
            color="primary"
          />
          <QuickActionCard
            title="System Settings"
            description="Configure system parameters"
            icon={FiSettings}
            href="/admin/settings"
            color="secondary"
          />
          <QuickActionCard
            title="Audit Logs"
            description="View system activity logs"
            icon={FiActivity}
            href="/admin/audit-logs"
            color="info"
          />
        </div>

        {/* Recent Activities */}
        {recentActivities.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Recent Activities</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {recentActivities.map((activity, index) => (
                <div key={index} className="px-4 py-2">
                  <p className="text-xs text-gray-700">{activity.action}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

// System Health Card Component – Compact European style
function SystemHealthCard({ title, value, icon: Icon, status }) {
  const statusColors = {
    healthy: 'bg-green-50 text-green-700',
    warning: 'bg-yellow-50 text-yellow-700',
    error: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-1.5 rounded-md ${statusColors[status]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-base font-semibold text-gray-800">{value}</span>
      </div>
      <h3 className="text-xs font-medium text-gray-500">{title}</h3>
    </div>
  )
}

// Quick Action Card Component – Compact European style
function QuickActionCard({ title, description, icon: Icon, href, color }) {
  const colorClasses = {
    primary: 'bg-primary-50 hover:bg-primary-100 text-primary-700',
    secondary: 'bg-gray-50 hover:bg-gray-100 text-gray-700',
    info: 'bg-blue-50 hover:bg-blue-100 text-blue-700'
  }

  return (
    <Link
      href={href}
      className={`block p-3 rounded-lg border border-gray-200 transition-colors ${colorClasses[color]}`}
    >
      <Icon className="h-5 w-5 mb-2" />
      <h3 className="text-sm font-medium mb-0.5">{title}</h3>
      <p className="text-xs opacity-75">{description}</p>
    </Link>
  )
}