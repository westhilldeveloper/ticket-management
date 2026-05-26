'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/app/components/layouts/DashboardLayout'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'
import ErrorBoundary from '@/app/components/common/ErrorBoundary'
import { useAuth } from '@/app/context/AuthContext'
import { useToast } from '@/app/context/ToastContext'
import Link from 'next/link'
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiFilter, 
  FiRefreshCw,
  FiAlertCircle,
  FiUser,
  FiCalendar
} from 'react-icons/fi'
import { format } from 'date-fns'

// Helper: format date
const formatDate = (dateString) => {
  if (!dateString) return '—'
  try {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm')
  } catch {
    return '—'
  }
}

// Tab configuration
const tabs = [
  { id: 'APPROVED', label: 'Approved', icon: FiCheckCircle, color: 'text-emerald-600' },
  { id: 'REJECTED', label: 'Rejected', icon: FiXCircle, color: 'text-red-600' }
]

function MDHistoryContent() {
  const { user, isLoading: authLoading } = useAuth()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('APPROVED')
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchHistory = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
       const approvalParam = activeTab.toUpperCase()
    const res = await fetch(`/api/tickets/md-history?mdApproval=${approvalParam}&limit=50&sort=desc`, {
      credentials: 'include'
    })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || 'Failed to fetch')
      }
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (err) {
      setError(err.message)
      toast.error('Could not load MD history')
    } finally {
      setLoading(false)
    }
  }, [activeTab, user, toast])

  useEffect(() => {
    if (user && (user.role === 'MD' || user.role === 'SUPER_ADMIN')) {
      fetchHistory()
    }
  }, [user, activeTab, fetchHistory])

  // Redirect or show access denied if not MD
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner size="small" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user || (user.role !== 'MD' && user.role !== 'SUPER_ADMIN')) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <FiAlertCircle className="mx-auto h-10 w-10 text-red-400 mb-3" />
          <h2 className="text-lg font-medium text-gray-800">Access Denied</h2>
          <p className="text-sm text-gray-500 mt-1">
            You do not have permission to view this page.
          </p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">MD History</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of tickets you have approved or rejected
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-4" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all
                    ${isActive 
                      ? 'border-pink-500 text-pink-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 ${isActive ? tab.color : 'text-gray-400'}`} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="small" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <FiAlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchHistory}
              className="mt-3 inline-flex items-center gap-1 text-sm text-red-700 underline"
            >
              <FiRefreshCw className="h-3 w-3" /> Try again
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            {activeTab === 'APPROVED' ? (
              <>
                <FiCheckCircle className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-500">No approved tickets yet</p>
              </>
            ) : (
              <>
                <FiXCircle className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-500">No rejected tickets found</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="text-base font-medium text-gray-800 hover:text-pink-600 transition-colors"
                    >
                      {ticket.title}
                    </Link>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                      <span>#{ticket.ticketNumber}</span>
                      <span className="flex items-center gap-1">
                        <FiUser className="h-3 w-3" />
                        {ticket.createdBy?.name || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiCalendar className="h-3 w-3" />
                        {activeTab === 'APPROVED' 
                          ? formatDate(ticket.mdApprovedAt) 
                          : formatDate(ticket.mdRejectedAt)}
                      </span>
                    </div>
                    {activeTab === 'REJECTED' && ticket.mdRejectReason && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 inline-block px-2 py-1 rounded">
                        Reason: {ticket.mdRejectReason}
                      </div>
                    )}
                    {activeTab === 'APPROVED' && ticket.mdApprovalComment && (
                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 inline-block px-2 py-1 rounded">
                        Comment: {ticket.mdApprovalComment}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${activeTab === 'APPROVED' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-red-100 text-red-800'
                      }
                    `}>
                      {activeTab === 'APPROVED' ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function MDHistoryPage() {
  return (
    <ErrorBoundary>
      <MDHistoryContent />
    </ErrorBoundary>
  )
}