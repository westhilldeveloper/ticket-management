'use client'

import  React,{ useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link'
import { useSocket } from '@/app/context/SocketContext'
import { useToast } from '@/app/context/ToastContext'
import DashboardLayout from '@/app/components/layouts/DashboardLayout'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiUser,
  FiMail,
  FiCalendar,
  FiTag,
  FiPaperclip,
  FiMessageSquare,
  FiSend,
  FiDownload,
  FiEye,
  FiEdit2,
  FiSave,
  FiX,
  FiArrowLeft,
  FiRefreshCw,
  FiExternalLink,
  FiThumbsUp,
  FiThumbsDown,
  FiUsers
} from 'react-icons/fi'
import { formatDistanceToNow, format } from 'date-fns'

export default function TicketDetailsPage({ params }) {
  const { id } = React.use(params)
  const { user } = useAuth()
  const { socket, joinTicket, leaveTicket } = useSocket()
  const toast = useToast()
  const router = useRouter()

  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showStatusForm, setShowStatusForm] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [mdDecision, setMdDecision] = useState(null)
  const [mdReview, setMdReview] = useState('')
  const [showThirdPartyForm, setShowThirdPartyForm] = useState(false)
  const [thirdPartyDetails, setThirdPartyDetails] = useState('')
  const [thirdPartyStatus, setThirdPartyStatus] = useState('')

  useEffect(() => {
    if (id) {
      fetchTicket()
      joinTicket(id)

      return () => {
        leaveTicket(id)
      }
    }
  }, [id])

  useEffect(() => {
    if (socket) {
      socket.on(`ticket-${id}-updated`, handleTicketUpdate)
      
      return () => {
        socket.off(`ticket-${id}-updated`, handleTicketUpdate)
      }
    }
  }, [socket, id])

  const handleTicketUpdate = (updatedTicket) => {
    setTicket(updatedTicket)
    toast.info('Ticket was updated')
  }

  const fetchTicket = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tickets/${id}`, {
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch ticket')
      }

      setTicket(data.ticket)
    } catch (error) {
      console.error('Error fetching ticket:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async (role = null) => {
    try {
      const url = role ? `/api/admin/users?role=${role}` : '/api/admin/users'
      const response = await fetch(url, {
        credentials: 'include'
      })
      const data = await response.json()
      setUsers(data.users || [])
      console.log("responser===>", response)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  

  const handleAddReview = async () => {
    if (!review.trim()) {
      toast.error('Please enter a review')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/tickets/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: review,
          reviewType: getReviewType()
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add review')
      }

      setTicket(prev => ({
        ...prev,
        reviews: [data.review, ...(prev.reviews || [])]
      }))
      setReview('')
      toast.success('Review added successfully')
    } catch (error) {
      console.error('Error adding review:', error)
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const getReviewType = () => {
    if (user.role === 'MD') return 'MD_REVIEW'
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return 'ADMIN_REVIEW'
    return 'TICKET_CREATION'
  }

  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: selectedStatus,
          review: review || `Status updated to ${selectedStatus}`
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status')
      }

      setTicket(data.ticket)
      setShowStatusForm(false)
      setSelectedStatus('')
      setReview('')
      toast.success('Status updated successfully')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssignTicket = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assignedToId: selectedUserId,
          review: `Ticket assigned to ${users.find(u => u.id === selectedUserId)?.name}`
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign ticket')
      }

      setTicket(data.ticket)
      setShowAssignForm(false)
      setSelectedUserId('')
      toast.success('Ticket assigned successfully')
    } catch (error) {
      console.error('Error assigning ticket:', error)
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleMDDecision = async (approved) => {
    if (!mdReview.trim() && !approved) {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: approved ? 'APPROVED_BY_MD' : 'REJECTED_BY_MD',
          mdApproval: approved ? 'APPROVED' : 'REJECTED',
          review: mdReview || (approved ? 'Approved by MD' : 'Rejected by MD')
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process decision')
      }

      setTicket(data.ticket)
      setMdDecision(null)
      setMdReview('')
      toast.success(approved ? 'Ticket approved' : 'Ticket rejected')
    } catch (error) {
      console.error('Error processing MD decision:', error)
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleThirdPartyUpdate = async () => {
    if (!thirdPartyStatus) {
      toast.error('Please select a status')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          thirdParty: true,
          thirdPartyStatus: thirdPartyStatus,
          thirdPartyDetails: thirdPartyDetails,
          status: 'PENDING_THIRD_PARTY',
          review: `Third party status updated to ${thirdPartyStatus}`
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update third party status')
      }

      setTicket(data.ticket)
      setShowThirdPartyForm(false)
      setThirdPartyStatus('')
      setThirdPartyDetails('')
      toast.success('Third party status updated')
    } catch (error) {
      console.error('Error updating third party:', error)
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseTicket = async () => {
    if (!confirm('Are you sure you want to close this ticket?')) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'CLOSED',
          review: 'Ticket closed',
          closedAt: new Date()
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to close ticket')
      }

      setTicket(data.ticket)
      toast.success('Ticket closed successfully')
    } catch (error) {
      console.error('Error closing ticket:', error)
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'OPEN': 'bg-yellow-100 text-yellow-800',
      'PENDING_MD_APPROVAL': 'bg-purple-100 text-purple-800',
      'PENDING_THIRD_PARTY': 'bg-orange-100 text-orange-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'APPROVED_BY_MD': 'bg-green-100 text-green-800',
      'REJECTED_BY_MD': 'bg-red-100 text-red-800',
      'RESOLVED': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'bg-blue-100 text-blue-800',
      'MEDIUM': 'bg-green-100 text-green-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-red-100 text-red-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPEN':
        return <FiAlertCircle className="h-5 w-5 text-yellow-500" />
      case 'PENDING_MD_APPROVAL':
        return <FiClock className="h-5 w-5 text-purple-500" />
      case 'APPROVED_BY_MD':
        return <FiThumbsUp className="h-5 w-5 text-green-500" />
      case 'REJECTED_BY_MD':
        return <FiThumbsDown className="h-5 w-5 text-red-500" />
      case 'RESOLVED':
      case 'CLOSED':
        return <FiCheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <FiClock className="h-5 w-5 text-gray-500" />
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

  if (error || !ticket) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-12">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <FiXCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || 'Ticket Not Found'}
            </h2>
            <p className="text-gray-600 mb-6">
              {error ? 'An error occurred while loading the ticket.' : 'The ticket you\'re looking for doesn\'t exist.'}
            </p>
            <Link
              href="/tickets"
              className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <FiArrowLeft className="mr-2" />
              Back to Tickets
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const canEdit = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role)
  const isMD = user?.role === 'MD'
  const isCreator = user?.id === ticket.createdBy?.id
  const isAssigned = user?.id === ticket.assignedTo?.id

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="mr-2" />
            Back
          </button>
          <div className="flex items-center items-center justify-between space-x-3">
            <span className={`px-3 flex py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
              {getStatusIcon(ticket.status)}
              <span className="ml-1">{ticket.status.replace(/_/g, ' ')}</span>
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Details Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {ticket.title}
                </h1>
                <p className="text-sm text-gray-500 mb-4">
                  Ticket #{ticket.ticketNumber}
                </p>

                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                </div>

                {/* Attachments */}
                {ticket.attachment && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <FiPaperclip className="mr-2" />
                      Attachments
                    </h3>
                    <div className="space-y-2">
                      {ticket.attachment.split(',').map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center">
                            <FiDownload className="mr-2 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              Attachment {index + 1}
                            </span>
                          </div>
                          <FiExternalLink className="text-gray-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            {/* Reviews Section - Visible to all users but posting restricted to admins */}
<div className="bg-white rounded-xl shadow-lg overflow-hidden">
  <div className="p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      <FiMessageSquare className="mr-2" />
      Reviews & Comments
    </h2>

    {/* Add Review Form - Only for admins */}
    {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
      <div className="mb-6">
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Add a review or comment..."
          className="input-field w-full"
          rows="3"
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleAddReview}
            disabled={submitting || !review.trim()}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? <LoadingSpinner size="small" /> : (
              <>
                <FiSend className="mr-2" />
                Post Review
              </>
            )}
          </button>
        </div>
      </div>
    )}

    {/* Reviews List - Visible to all users */}
    <div className="space-y-4">
      {ticket.reviews?.map((review, index) => (
        <div key={review.id || index} className="border-l-4 border-primary-200 bg-gray-50 p-4 rounded-r-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <FiUser className="h-4 w-4 text-primary-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {review.createdBy?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {review.createdBy?.role} • {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
              {review.reviewType.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {review.content}
          </p>
        </div>
      ))}

      {(!ticket.reviews || ticket.reviews.length === 0) && (
        <p className="text-center text-gray-500 py-4">
          No reviews yet.
        </p>
      )}
    </div>
  </div>
</div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Quick Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
  <h3 className="text-sm font-medium text-gray-500 mb-4">Ticket Information</h3>
  
  <div className="space-y-3">
    {/* Created By */}
    <div className="flex items-start">
      <FiUser className="mr-3 text-gray-400 mt-0.5" />
      <div>
        <p className="text-xs text-gray-500">Created By</p>
        <p className="text-sm font-medium text-gray-900">{ticket.createdBy?.name}</p>
        <p className="text-xs text-gray-500">{ticket.createdBy?.department}</p>
      </div>
    </div>

    {/* Email */}
    <div className="flex items-start">
      <FiMail className="mr-3 text-gray-400 mt-0.5" />
      <div>
        <p className="text-xs text-gray-500">Email</p>
        <p className="text-sm text-gray-900">{ticket.createdBy?.email}</p>
      </div>
    </div>

    {/* Assigned To */}
    {ticket.assignedTo && (
      <div className="flex items-start">
        <FiUsers className="mr-3 text-gray-400 mt-0.5" />
        <div>
          <p className="text-xs text-gray-500">Assigned To</p>
          <p className="text-sm font-medium text-gray-900">{ticket.assignedTo.name}</p>
        </div>
      </div>
    )}

    {/* Created Date */}
    <div className="flex items-start">
      <FiCalendar className="mr-3 text-gray-400 mt-0.5" />
      <div>
        <p className="text-xs text-gray-500">Created</p>
        <p className="text-sm text-gray-900">
          {format(new Date(ticket.createdAt), 'PPP')}
        </p>
        <p className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>

    {/* Branch (fix: use ticket.category) */}
    <div className="flex items-start">
      <FiTag className="mr-3 text-gray-400 mt-0.5" />
      <div>
        <p className="text-xs text-gray-500">Branch</p>
        <p className="text-sm text-gray-900">{user.branch || 'Not specified'}</p>
      </div>
    </div>

    {/* NEW: Main Category */}
    <div className="flex items-start">
      <FiTag className="mr-3 text-gray-400 mt-0.5" />
      <div>
        <p className="text-xs text-gray-500">{ticket.requestServiceType} FOR</p>
        <p className="text-sm text-gray-900">{ticket.mainCategory || 'Not specified'}</p>
      </div>
    </div>

    {/* NEW: Request / Service Type */}
    <div className="flex items-start">
      <FiTag className="mr-3 text-gray-400 mt-0.5" />
      <div>
        <p className="text-xs text-gray-500">Request / Service</p>
        <p className="text-sm text-gray-900">{ticket.requestServiceType || 'Not specified'}</p>
      </div>
    </div>

    {/* NEW: Item / Service Type */}
    <div className="flex items-start">
      <FiTag className="mr-3 text-gray-400 mt-0.5" />
      <div>
        <p className="text-xs text-gray-500">Item / Service Type</p>
        <p className="text-sm text-gray-900">{ticket.itemType || 'Not specified'}</p>
      </div>
    </div>
  </div>
</div>

            {/* Timeline Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Timeline</h3>
              <div className="space-y-3">
                {ticket.history?.slice(0, 5).map((event, index) => (
                  <div key={event.id || index} className="flex items-start">
                    <div className="mr-3">
                      <div className="h-2 w-2 mt-2 rounded-full bg-primary-500"></div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">{event.action}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons - Based on Role and Status */}
            {(canEdit || isMD || isAssigned) && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Actions</h3>
                <div className="space-y-3">
                  {/* Status Update Button */}
                  {canEdit && (
                    <button
                      onClick={() => setShowStatusForm(!showStatusForm)}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      <FiRefreshCw className="mr-2" />
                      Update Status
                    </button>
                  )}

                  {/* Assign Button */}
                  {canEdit && !ticket.assignedTo && (
                    <button
                      onClick={() => {
                        setShowAssignForm(true)
                        fetchUsers()
                      }}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      <FiUsers className="mr-2" />
                      Assign Ticket
                    </button>
                  )}

                  {/* MD Approval Actions */}
                  {isMD && ticket.status === 'PENDING_MD_APPROVAL' && (
                    <>
                      <button
                        onClick={() => handleMDDecision(true)}
                        className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <FiThumbsUp className="mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => setMdDecision('reject')}
                        className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <FiThumbsDown className="mr-2" />
                        Reject
                      </button>
                    </>
                  )}

                  {/* Third Party Button */}
                  {canEdit && (
                    <button
                      onClick={() => setShowThirdPartyForm(!showThirdPartyForm)}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      <FiExternalLink className="mr-2" />
                      Third Party Service
                    </button>
                  )}

                  {/* Close Ticket Button */}
                  {(canEdit || isCreator) && ticket.status !== 'CLOSED' && (
                    <button
                      onClick={handleCloseTicket}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <FiXCircle className="mr-2" />
                      Close Ticket
                    </button>
                  )}
                </div>

                {/* Status Update Form */}
                {showStatusForm && (
                  <div className="mt-4 space-y-3">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">Select Status</option>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="PENDING_MD_APPROVAL">Pending MD Approval</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Add a review (optional)"
                      className="input-field w-full"
                      rows="2"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleStatusUpdate}
                        disabled={submitting}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        {submitting ? <LoadingSpinner size="small" /> : 'Update'}
                      </button>
                      <button
                        onClick={() => setShowStatusForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Assign Form */}
                {showAssignForm && (
                  <div className="mt-4 space-y-3">
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">Select User</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleAssignTicket}
                        disabled={submitting}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        {submitting ? <LoadingSpinner size="small" /> : 'Assign'}
                      </button>
                      <button
                        onClick={() => setShowAssignForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* MD Reject Form */}
                {mdDecision === 'reject' && (
                  <div className="mt-4 space-y-3">
                    <textarea
                      value={mdReview}
                      onChange={(e) => setMdReview(e.target.value)}
                      placeholder="Reason for rejection..."
                      className="input-field w-full"
                      rows="3"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleMDDecision(false)}
                        disabled={submitting}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        {submitting ? <LoadingSpinner size="small" /> : 'Confirm Rejection'}
                      </button>
                      <button
                        onClick={() => setMdDecision(null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Third Party Form */}
                {showThirdPartyForm && (
                  <div className="mt-4 space-y-3">
                    <select
                      value={thirdPartyStatus}
                      onChange={(e) => setThirdPartyStatus(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">Select Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="FAILED">Failed</option>
                    </select>
                    <textarea
                      value={thirdPartyDetails}
                      onChange={(e) => setThirdPartyDetails(e.target.value)}
                      placeholder="Additional details..."
                      className="input-field w-full"
                      rows="3"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleThirdPartyUpdate}
                        disabled={submitting}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        {submitting ? <LoadingSpinner size="small" /> : 'Update'}
                      </button>
                      <button
                        onClick={() => setShowThirdPartyForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}