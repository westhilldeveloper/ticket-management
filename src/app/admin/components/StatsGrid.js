'use client'

import {
  FiUsers,
  FiFileText,
  FiClock,
  FiAlertCircle
} from 'react-icons/fi'
import StatCard from './StatCard'

export default function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Tickets"
        value={stats.totalTickets}
        icon={FiFileText}
        color="bg-blue-100 text-blue-600"
        trend={stats.resolvedToday}
        trendLabel="resolved today"
      />
      <StatCard
        title="Open Tickets"
        value={stats.openTickets}
        icon={FiAlertCircle}
        color="bg-yellow-100 text-yellow-600"
        trend={stats.inProgress}
        trendLabel="in progress"
      />
      <StatCard
        title="Pending Approval"
        value={stats.pendingApproval}
        icon={FiClock}
        color="bg-purple-100 text-purple-600"
        trend={stats.mdApprovals?.approved || 0}
        trendLabel="approved"
      />
      <StatCard
        title="Total Users"
        value={stats.totalUsers}
        icon={FiUsers}
        color="bg-green-100 text-green-600"
        trend={stats.newUsersToday}
        trendLabel="new today"
      />
    </div>
  )
}