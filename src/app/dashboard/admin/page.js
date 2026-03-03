'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/context/AuthContext'
import DashboardLayout from '@/app/components/layouts/DashboardLayout'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'
import { 
  FiUsers, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle,
  FiTrendingUp,
  FiPieChart,
  FiUserCheck,
  FiUserX,
  FiCalendar
} from 'react-icons/fi'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    pendingApproval: 0,
    inProgress: 0,
    resolvedToday: 0,
    avgResponseTime: '0h',
    totalUsers: 0,
    activeUsers: 0
  })
  const [recentTickets, setRecentTickets] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryData, setCategoryData] = useState({
    labels: ['HR', 'IT', 'Technical'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B']
    }]
  })
  const [weeklyData, setWeeklyData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Tickets Created',
      data: [0, 0, 0, 0, 0, 0, 0],
      backgroundColor: '#3B82F6'
    }]
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all tickets for stats
      const ticketsRes = await fetch('/api/tickets?limit=100')
      const ticketsData = await ticketsRes.json()
      
      if (ticketsRes.ok) {
        const tickets = ticketsData.tickets || []
        
        // Calculate stats
        const openTickets = tickets.filter(t => t.status === 'OPEN').length
        const pendingApproval = tickets.filter(t => t.status === 'PENDING_MD_APPROVAL').length
        const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length
        const resolvedToday = tickets.filter(t => {
          const today = new Date()
          const ticketDate = new Date(t.updatedAt)
          return (t.status === 'RESOLVED' || t.status === 'CLOSED') &&
            ticketDate.toDateString() === today.toDateString()
        }).length

        // Category distribution
        const hrTickets = tickets.filter(t => t.category === 'HR').length
        const itTickets = tickets.filter(t => t.category === 'IT').length
        const techTickets = tickets.filter(t => t.category === 'TECHNICAL').length

        setCategoryData({
          labels: ['HR', 'IT', 'Technical'],
          datasets: [{
            data: [hrTickets, itTickets, techTickets],
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B']
          }]
        })

        // Weekly data
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const weeklyCounts = [0, 0, 0, 0, 0, 0, 0]
        
        tickets.forEach(ticket => {
          const date = new Date(ticket.createdAt)
          const dayIndex = date.getDay()
          weeklyCounts[dayIndex]++
        })

        setWeeklyData({
          labels: weekDays,
          datasets: [{
            label: 'Tickets Created',
            data: weeklyCounts,
            backgroundColor: '#3B82F6'
          }]
        })

        setStats({
          totalTickets: tickets.length,
          openTickets,
          pendingApproval,
          inProgress,
          resolvedToday,
          avgResponseTime: '2.5h',
          totalUsers: 150,
          activeUsers: 120
        })

        // Recent tickets
        setRecentTickets(tickets.slice(0, 5))
      }

      // Fetch pending approvals
      const pendingRes = await fetch('/api/tickets?status=PENDING_MD_APPROVAL&limit=5')
      const pendingData = await pendingRes.json()
      
      if (pendingRes.ok) {
        setPendingApprovals(pendingData.tickets || [])
      }

    } catch (error) {
      console.error('Error fetching admin dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

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
            Admin Dashboard
          </h1>
          <div className="flex space-x-3">
            <Link
              href="/admin/reports"
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Generate Report
            </Link>
            <Link
              href="/admin/users"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              Manage Users
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Tickets"
            value={stats.totalTickets}
            icon={FiTrendingUp}
            color="primary"
            change="+12%"
          />
          <StatCard
            title="Open Tickets"
            value={stats.openTickets}
            icon={FiAlertCircle}
            color="yellow"
            change="-3%"
          />
          <StatCard
            title="Pending Approval"
            value={stats.pendingApproval}
            icon={FiClock}
            color="purple"
            change="+5"
          />
          <StatCard
            title="Resolved Today"
            value={stats.resolvedToday}
            icon={FiCheckCircle}
            color="green"
            change="+8"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Activity */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity</h2>
            <Bar 
              data={weeklyData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Category</h2>
            <div className="h-64">
              <Pie 
                data={categoryData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        {pendingApprovals.length > 0 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Pending MD Approvals</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {pendingApprovals.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="block px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
                      <p className="text-xs text-gray-500">
                        #{ticket.ticketNumber} • {ticket.category} • by {ticket.createdBy?.name}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                      Pending Approval
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Tickets */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block px-6 py-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
                    <p className="text-xs text-gray-500">
                      #{ticket.ticketNumber} • {ticket.category} • {ticket.createdBy?.name}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    ticket.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' :
                    ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {ticket.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color, change }) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600'
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {change && (
          <span className="text-sm text-green-600">{change}</span>
        )}
      </div>
      <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}