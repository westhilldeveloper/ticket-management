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

  // Add this helper inside the component (before useEffect)
const getFirstDayOfMonth = () => {
  const date = new Date()
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

const fetchSystemStats = async () => {
  try {
    setLoading(true)

    // 1. Total users & active users
    const totalUsersRes = await fetch('/api/admin/users?limit=1')
    const totalUsersData = await totalUsersRes.json()
    const totalUsers = totalUsersData.pagination?.total || 0

    const activeUsersRes = await fetch('/api/admin/users?status=active&limit=1')
    const activeUsersData = await activeUsersRes.json()
    const activeUsers = activeUsersData.pagination?.total || 0

    // 2. Total tickets
    const ticketsRes = await fetch('/api/tickets?limit=1')
    const ticketsData = await ticketsRes.json()
    const totalTickets = ticketsData.pagination?.total || 0

    // 3. Open tickets
    const openTicketsRes = await fetch('/api/tickets?status=OPEN&limit=1')
    const openTicketsData = await openTicketsRes.json()
    const openTickets = openTicketsData.pagination?.total || 0

    // 4. Resolved this month
    const firstDay = getFirstDayOfMonth()
    const resolvedTicketsRes = await fetch(`/api/tickets?status=RESOLVED&dateFrom=${firstDay}&limit=1`)
    const resolvedTicketsData = await resolvedTicketsRes.json()
    const resolvedThisMonth = resolvedTicketsData.pagination?.total || 0

    // 5. Recent activities (audit logs) – already fetched separately
    const auditRes = await fetch('/api/admin/audit-logs?limit=10')
    const auditData = await auditRes.json()

    setSystemStats({
      totalUsers,
      activeUsers,
      totalTickets,
      openTickets,          // add this to state
      resolvedThisMonth,    // add this to state
      storageUsed: '2.3 GB',      // mock – replace with real calculation later
      apiCalls: 45678,             // mock
      errorRate: '0.02%',          // mock
      uptime: '99.9%',             // mock
      lastBackup: new Date().toISOString() // mock
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Super Admin Dashboard
          </h1>
          <div className="flex space-x-3">
            <Link
              href="/admin/settings"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              <FiSettings className="inline mr-2" />
              System Settings
            </Link>
          </div>
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* User Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <FiUsers className="text-primary-600" />
                  <span className="text-gray-700">Total Users</span>
                </div>
                <span className="font-bold text-gray-900">{systemStats.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <FiUserCheck className="text-green-600" />
                  <span className="text-gray-700">Active Users</span>
                </div>
                <span className="font-bold text-gray-900">{systemStats.activeUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <FiUserX className="text-red-600" />
                  <span className="text-gray-700">Inactive Users</span>
                </div>
                <span className="font-bold text-gray-900">
                  {systemStats.totalUsers - systemStats.activeUsers}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link
                href="/admin/users"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Manage Users →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket Statistics</h2>
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <FiDatabase className="text-primary-600" />
        <span className="text-gray-700">Total Tickets</span>
      </div>
      <span className="font-bold text-gray-900">{systemStats.totalTickets}</span>
    </div>
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <FiActivity className="text-yellow-600" />
        <span className="text-gray-700">Open Tickets</span>
      </div>
      <span className="font-bold text-gray-900">{systemStats.openTickets}</span>
    </div>
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <FiShield className="text-green-600" />
        <span className="text-gray-700">Resolved This Month</span>
      </div>
      <span className="font-bold text-gray-900">{systemStats.resolvedThisMonth}</span>
    </div>
  </div>
</div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recentActivities.map((activity, index) => (
                <div key={index} className="px-6 py-3">
                  <p className="text-sm text-gray-800">{activity.action}</p>
                  <p className="text-xs text-gray-500 mt-1">
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

// System Health Card Component
function SystemHealthCard({ title, value, icon: Icon, status }) {
  const statusColors = {
    healthy: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    error: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600'
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${statusColors[status]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <h3 className="text-sm text-gray-600">{title}</h3>
    </div>
  )
}

// Quick Action Card Component
function QuickActionCard({ title, description, icon: Icon, href, color }) {
  const colorClasses = {
    primary: 'bg-primary-50 hover:bg-primary-100 text-primary-700',
    secondary: 'bg-gray-50 hover:bg-gray-100 text-gray-700',
    info: 'bg-blue-50 hover:bg-blue-100 text-blue-700'
  }

  return (
    <Link
      href={href}
      className={`block p-6 rounded-xl transition-colors ${colorClasses[color]}`}
    >
      <Icon className="h-8 w-8 mb-3" />
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm opacity-75">{description}</p>
    </Link>
  )
}