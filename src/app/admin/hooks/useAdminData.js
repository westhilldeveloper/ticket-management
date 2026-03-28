'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/context/ToastContext'
import { format } from 'date-fns'

export function useAdminData(timeRange, socket) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    pendingApproval: 0,
    pendingThirdParty: 0,
    inProgress: 0,
    resolvedToday: 0,
    resolvedThisWeek: 0,
    resolvedThisMonth: 0,
    avgResponseTime: '0h',
    avgResolutionTime: '0h',
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    admins: 0,
    mds: 0,
    employees: 0,
    ticketsByCategory: { HR: 0, IT: 0, TECHNICAL: 0 },
    ticketsByPriority: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
    ticketsByStatus: {},
    mdApprovals: { pending: 0, approved: 0, rejected: 0 }
  })
  const [recentTickets, setRecentTickets] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [pendingThirdParty, setPendingThirdParty] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [topUsers, setTopUsers] = useState([])

  const router = useRouter()
  const toast = useToast()

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const statsResponse = await fetch('/api/admin/stats', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!statsResponse.ok) {
        if (statsResponse.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(`Stats API returned ${statsResponse.status}`)
      }
      
      const statsData = await statsResponse.json()
      if (statsData.stats) setStats(statsData.stats)

      const ticketsResponse = await fetch(`/api/admin/recent-tickets?limit=10&timeRange=${timeRange}`, {
        credentials: 'include'
      })
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json()
        setRecentTickets(ticketsData.tickets || [])
      }

      const pendingResponse = await fetch('/api/admin/pending-approvals', { credentials: 'include' })
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json()
        setPendingApprovals(pendingData.tickets || [])
      }

      const thirdPartyResponse = await fetch('/api/admin/pending-third-party', { credentials: 'include' })
      if (thirdPartyResponse.ok) {
        const thirdPartyData = await thirdPartyResponse.json()
        setPendingThirdParty(thirdPartyData.tickets || [])
      }

      const activitiesResponse = await fetch(`/api/admin/recent-activities?limit=10&timeRange=${timeRange}`, {
        credentials: 'include'
      })
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        setRecentActivities(activitiesData.activities || [])
      }

      const usersResponse = await fetch('/api/admin/top-users?limit=5', { credentials: 'include' })
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setTopUsers(usersData.users || [])
      }

    } catch (error) {
      console.error('Error fetching admin data:', error)
      setError(error.message)
      toast.error('Failed to load dashboard data', { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }, [timeRange, router, toast, socket])

  const exportReport = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/export-report?timeRange=${timeRange}`, {
        credentials: 'include'
      })
      
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `admin-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Report exported successfully', { duration: 3000 })
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Failed to export report', { duration: 5000 })
    }
  }, [timeRange, toast])

  // WebSocket handlers
  useEffect(() => {
    if (!socket) return

    const handleTicketUpdate = () => {
      fetchDashboardData()
      toast.info('Ticket was updated', { duration: 3000 })
    }

    const handleNewTicket = () => {
      fetchDashboardData()
      toast.info('New ticket created', { duration: 3000 })
    }

    const handleMDApproval = (approval) => {
      fetchDashboardData()
      toast.info(`Ticket ${approval.status === 'APPROVED' ? 'approved' : 'rejected'} by MD`, { duration: 3000 })
    }

    socket.on('ticket-updated', handleTicketUpdate)
    socket.on('new-ticket', handleNewTicket)
    socket.on('md-approval', handleMDApproval)

    return () => {
      socket.off('ticket-updated', handleTicketUpdate)
      socket.off('new-ticket', handleNewTicket)
      socket.off('md-approval', handleMDApproval)
    }
  }, [socket, fetchDashboardData, toast])

  return {
    loading,
    error,
    stats,
    recentTickets,
    pendingApprovals,
    pendingThirdParty,
    recentActivities,
    topUsers,
    fetchDashboardData,
    exportReport
  }
}