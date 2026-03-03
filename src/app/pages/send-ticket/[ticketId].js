import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import TicketDetails from '../../components/tickets/TicketDetails'
import ReviewSection from '../../components/tickets/ReviewSection'
import StatusTimeline from '../../components/tickets/StatusTimeline'

export default function SendTicket() {
  const router = useRouter()
  const { ticketId } = router.query
  const { user, loading: authLoading } = useAuth()
  const { joinTicket, leaveTicket } = useSocket()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (ticketId) {
      fetchTicket()
      joinTicket(ticketId)

      return () => {
        leaveTicket(ticketId)
      }
    }
  }, [ticketId])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=/send-ticket/${ticketId}`)
    }
  }, [user, authLoading, ticketId, router])

  const fetchTicket = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(`/api/tickets/${ticketId}`)
      setTicket(data.ticket)
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch ticket')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Ticket Not Found</h2>
          <p className="text-gray-600">The ticket you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  // Check if user has access to this ticket
  const hasAccess = 
    user.role === 'SUPER_ADMIN' ||
    user.role === 'MD' ||
    user.id === ticket.createdBy.id ||
    (user.role === 'ADMIN' && ticket.assignedTo?.id === user.id)

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this ticket.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <TicketDetails ticket={ticket} />
            <ReviewSection ticket={ticket} onUpdate={fetchTicket} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <StatusTimeline ticket={ticket} />
            
            {/* Action buttons based on role and status */}
            {user.role === 'ADMIN' && ticket.status === 'OPEN' && (
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleAssignToSelf()}
                    className="w-full btn-primary"
                  >
                    Assign to Me
                  </button>
                  <button
                    onClick={() => handleRequestMDApproval()}
                    className="w-full btn-secondary"
                  >
                    Request MD Approval
                  </button>
                  <button
                    onClick={() => handleMarkThirdParty()}
                    className="w-full btn-secondary"
                  >
                    Mark as Third Party
                  </button>
                </div>
              </div>
            )}

            {user.role === 'MD' && ticket.status === 'PENDING_MD_APPROVAL' && (
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">MD Approval</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleMDApproval(true)}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleMDApproval(false)}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}