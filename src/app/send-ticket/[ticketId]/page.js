'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'  // Add this import for React.use()
import { useAuth } from '@/app/context/AuthContext'
import { useSocket } from '@/app/context/SocketContext'
import { useToast } from '@/app/context/ToastContext'
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
  FiThumbsUp,
  FiThumbsDown,
  FiExternalLink,
  FiDownload,
  FiEye,
  FiEdit2,
  FiSave,
  FiRefreshCw,
  FiUsers,
  FiBriefcase,
  FiTool,
  FiShoppingCart,
  FiCheckSquare,
  FiUserPlus 
} from 'react-icons/fi'
import { formatDistanceToNow, format } from 'date-fns'

export default function PublicTicketPage({ params }) {
  // Unwrap the params Promise using React.use()
  const { ticketId } = React.use(params)
  
  const { user } = useAuth()
  const { socket, joinTicket, leaveTicket } = useSocket()
  const toast = useToast()
  const router = useRouter()

  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [selectedAction, setSelectedAction] = useState(null)
  const [mdDecision, setMdDecision] = useState(null)
  const [mdReview, setMdReview] = useState('')
  const [thirdPartyDetails, setThirdPartyDetails] = useState('')
  const [thirdPartyStatus, setThirdPartyStatus] = useState('PENDING')
  const [adminReview, setAdminReview] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)

   const [serviceTeamMembers, setServiceTeamMembers] = useState([])
  const [selectedServiceUserId, setSelectedServiceUserId] = useState('')
  const [serviceResponse, setServiceResponse] = useState('') 
  const [serviceDecision, setServiceDecision] = useState(null)

  useEffect(() => {
    if (ticketId) {
      fetchTicket()
      if (user) {
        joinTicket(ticketId)
      }

      return () => {
        if (user) {
          leaveTicket(ticketId)
        }
      }
    }
  }, [ticketId, user])

  useEffect(() => {
    if (socket) {
      socket.on(`ticket-${ticketId}-updated`, handleTicketUpdate)
      
      return () => {
        socket.off(`ticket-${ticketId}-updated`, handleTicketUpdate)
      }
    }
  }, [socket, ticketId])

  const handleTicketUpdate = (updatedTicket) => {
    setTicket(updatedTicket)
    toast.info('Ticket status was updated')
  }

  const fetchTicket = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/public/tickets/${ticketId}`, {
        credentials: user ? 'include' : 'omit'
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

  // NEW: Fetch service team members (only when needed)
   const fetchServiceTeamMembers = async () => {
    try {
      const response = await fetch('/api/users?role=SERVICE_TEAM', {
        credentials: 'include'
      })
      const data = await response.json()
      if (response.ok) {
        setServiceTeamMembers(data.users || [])
      } else {
        toast.error('Failed to load service team members')
      }
    } catch (error) {
      console.error('Error fetching service team:', error)
      toast.error('Error loading service team members')
    }
  }

  // Admin/SuperAdmin/HR/IT Actions
  const handleAdminAction = async (action) => {
  // --- SPECIAL CASE: Assign to Service Team (use dedicated endpoint) ---
  if (action === 'ASSIGN_TO_SERVICE') {
    if (!selectedServiceUserId) {
      toast.error('Please select a service team member');
      return;
    }
    if (!adminReview.trim()) {
      toast.error('Please add a review');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/public/tickets/${ticketId}/assign-service-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedToId: selectedServiceUserId,
          review: adminReview,
        }),
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Assignment failed');

      setTicket(data.ticket);
      setSelectedAction(null);
      setAdminReview('');
      setSelectedServiceUserId('');
      toast.success('Ticket assigned to service team');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
    return; // ✅ important – exit early
  }

  // --- ALL OTHER ADMIN ACTIONS (use the generic endpoint) ---
  if (!adminReview.trim() && action !== 'CONFIRM' && action !== 'MESSAGE') {
    toast.error('Please add a review');
    return;
  }

  setSubmitting(true);
  try {
    const endpoint = `/api/public/tickets/${ticketId}/admin-action`;
    const body = {
      action,
      review: adminReview || (action === 'MESSAGE' ? review : `Action: ${action}`),
    };

    if (action === 'FORWARD_TO_MD') {
      body.status = 'PENDING_MD_APPROVAL';
      body.mdApproval = 'PENDING';
    } else if (action === 'THIRD_PARTY') {
      body.status = 'PENDING_THIRD_PARTY';
      body.thirdParty = true;
      body.thirdPartyStatus = thirdPartyStatus;
      body.thirdPartyDetails = thirdPartyDetails;
    } else if (action === 'CONFIRM') {
      body.status = 'IN_PROGRESS';
      body.confirmed = true;
    } else if (action === 'MESSAGE') {
      body.reviewType = 'ADMIN_REVIEW';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Action failed');

    setTicket(data.ticket);

    if (action === 'MESSAGE') {
      setReview('');
    } else {
      setSelectedAction(null);
      setAdminReview('');
      setThirdPartyDetails('');
    }

    toast.success('Action completed successfully');
  } catch (error) {
    console.error('Error performing action:', error);
    toast.error(error.message);
  } finally {
    setSubmitting(false);
  }
};

   // Service Team Actions
  const handleServiceResponse = async (action) => {
    if (!serviceResponse.trim() && action === 'reject') {
      toast.error('Please provide a reason for rejection')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/public/tickets/${ticketId}/service-team-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,           // 'accept' or 'reject'
          review: serviceResponse || (action === 'accept' ? 'Accepted by service team' : '')
        }),
        credentials: 'include'
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to respond')

      setTicket(data.ticket)
      setServiceDecision(null)
      setServiceResponse('')
      toast.success(action === 'accept' ? 'Ticket accepted' : 'Ticket rejected')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleServiceWorkUpdate = async (workType) => {
    if (!serviceResponse.trim()) {
      toast.error('Please add work details')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/public/tickets/${ticketId}/service-work-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workType,                 // 'PROGRESS' or 'RESOLVE'
          details: serviceResponse
        }),
        credentials: 'include'
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to update work')

      setTicket(data.ticket)
      setServiceResponse('')
      setSelectedAction(null)
      toast.success('Work update recorded')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // MD Actions
  const handleMDDecision = async (approved) => {
    if (!mdReview.trim() && !approved) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/public/tickets/${ticketId}/md-decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approved,
          review: mdReview || (approved ? 'Approved by MD' : 'Rejected by MD'),
          status: approved ? 'APPROVED_BY_MD' : 'REJECTED_BY_MD'
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

  // Admin work after MD approval
  const handleWorkUpdate = async (workType) => {
    if (!review.trim()) {
      toast.error('Please add work details')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/public/tickets/${ticketId}/work-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workType,
          details: review,
          status: workType === 'RESOLVE' ? 'RESOLVED' : 'IN_PROGRESS'
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update work')
      }

      setTicket(data.ticket)
      setReview('')
      setSelectedAction(null)
      toast.success('Work update recorded')
    } catch (error) {
      console.error('Error updating work:', error)
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Close ticket
  const handleCloseTicket = async () => {
    if (!confirm('Are you sure you want to close this ticket?')) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/public/tickets/${ticketId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          review: review || 'Ticket closed'
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
      'CLOSED': 'bg-gray-100 text-gray-800',
      'SERVICE_RESOLVED': 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPEN':
        return <FiAlertCircle className="h-5 w-5 text-yellow-500" />
      case 'PENDING_MD_APPROVAL':
        return <FiClock className="h-5 w-5 text-purple-500" />
      case 'PENDING_THIRD_PARTY':
        return <FiExternalLink className="h-5 w-5 text-orange-500" />
      case 'IN_PROGRESS':
        return <FiRefreshCw className="h-5 w-5 text-blue-500" />
      case 'APPROVED_BY_MD':
        return <FiThumbsUp className="h-5 w-5 text-green-500" />
      case 'REJECTED_BY_MD':
        return <FiThumbsDown className="h-5 w-5 text-red-500" />
      case 'RESOLVED':
        return <FiCheckCircle className="h-5 w-5 text-green-500" />
      case 'CLOSED':
        return <FiCheckSquare className="h-5 w-5 text-gray-500" />
      case 'PENDING_SERVICE_ACCEPTANCE':                         // NEW
        return <FiUserPlus className="h-5 w-5 text-indigo-500" />
      case 'SERVICE_IN_PROGRESS':                                // NEW
        return <FiTool className="h-5 w-5 text-teal-500" />
      case 'SERVICE_RESOLVED':
        return <FiCheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <FiClock className="h-5 w-5 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <FiXCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Ticket Not Found'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error ? 'An error occurred while loading the ticket.' : 'The ticket you\'re looking for doesn\'t exist or has expired.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role)
  const isMD = user?.role === 'MD'
  const isServiceTeam = user?.role === 'SERVICE_TEAM'
  const isEmployee = user?.role === 'EMPLOYEE' && user?.id === ticket.createdBy?.id
  const canView = isAdmin || isMD || isEmployee || !user // Allow public view without login

  if (!canView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <FiEye className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view this ticket.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Login to Continue
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Status */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Ticket #{ticket.ticketNumber}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Shared via public link
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(ticket.status)}`}>
              {getStatusIcon(ticket.status)}
              <span className="ml-1">{ticket.status.replace(/_/g, ' ')}</span>
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Ticket Details */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {ticket.title}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500">Branch</p>
                <p className="text-sm font-medium text-gray-900">{ticket.category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Priority</p>
                <p className="text-sm font-medium text-gray-900">{ticket.priority}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            {/* Attachments */}
            {ticket.attachment && (
              <div className="mt-6">
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

          {/* Admin Actions Section - Only visible to Admin/SuperAdmin */}
          {isAdmin && (
            <div className="p-6 border-b border-gray-200 bg-blue-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FiBriefcase className="mr-2 text-blue-600" />
                Admin Actions
              </h3>

              {!selectedAction ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setSelectedAction('CONFIRM')}
                    className="p-4 bg-white rounded-lg border-2 border-green-200 hover:border-green-400 transition-colors text-left"
                  >
                    <FiCheckCircle className="h-6 w-6 text-green-600 mb-2" />
                    <h4 className="font-medium text-gray-900">Confirm Receipt</h4>
                    <p className="text-xs text-gray-500 mt-1">Acknowledge ticket receipt</p>
                  </button>

                  <button
                    onClick={() => setSelectedAction('FORWARD_TO_MD')}
                    className="p-4 bg-white rounded-lg border-2 border-purple-200 hover:border-purple-400 transition-colors text-left"
                  >
                    <FiThumbsUp className="h-6 w-6 text-purple-600 mb-2" />
                    <h4 className="font-medium text-gray-900">Forward to MD</h4>
                    <p className="text-xs text-gray-500 mt-1">Request MD approval</p>
                  </button>

                  <button
                    onClick={() => setSelectedAction('THIRD_PARTY')}
                    className="p-4 bg-white rounded-lg border-2 border-orange-200 hover:border-orange-400 transition-colors text-left"
                  >
                    <FiExternalLink className="h-6 w-6 text-orange-600 mb-2" />
                    <h4 className="font-medium text-gray-900">Third Party</h4>
                    <p className="text-xs text-gray-500 mt-1">Request external service</p>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedAction('ASSIGN_TO_SERVICE')
                      fetchServiceTeamMembers()
                    }}
                    className="p-4 bg-white rounded-lg border-2 border-indigo-200 hover:border-indigo-400 transition-colors text-left"
                  >
                    <FiUserPlus className="h-6 w-6 text-indigo-600 mb-2" />
                    <h4 className="font-medium text-gray-900">Assign to Service Team</h4>
                    <p className="text-xs text-gray-500 mt-1">Send to internal service team</p>
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">
                      {selectedAction === 'CONFIRM' && 'Confirm Ticket Receipt'}
                      {selectedAction === 'FORWARD_TO_MD' && 'Forward to MD for Approval'}
                      {selectedAction === 'THIRD_PARTY' && 'Request Third Party Service'}
                       {selectedAction === 'ASSIGN_TO_SERVICE' && 'Assign to Service Team'}
                    </h4>
                    <button
                      onClick={() => setSelectedAction(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FiXCircle className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {selectedAction === 'CONFIRM' && (
                      <p className="text-sm text-gray-600">
                        Are you sure you want to confirm receipt of this ticket?
                      </p>
                    )}

                    {selectedAction === 'FORWARD_TO_MD' && (
                      <>
                        <textarea
                          value={adminReview}
                          onChange={(e) => setAdminReview(e.target.value)}
                          placeholder="Add your review/recommendation for MD..."
                          className="input-field w-full"
                          rows="3"
                        />
                      </>
                    )}

                    {selectedAction === 'THIRD_PARTY' && (
                      <>
                        <select
                          value={thirdPartyStatus}
                          onChange={(e) => setThirdPartyStatus(e.target.value)}
                          className="input-field w-full"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="QUOTATION">Quotation Requested</option>
                          <option value="PURCHASE">Purchase Required</option>
                          <option value="IN_PROGRESS">In Progress</option>
                        </select>
                        <textarea
                          value={thirdPartyDetails}
                          onChange={(e) => setThirdPartyDetails(e.target.value)}
                          placeholder="Serial No/ Details about third party service"
                          className="input-field w-full"
                          rows="3"
                        />
                        <textarea
                          value={adminReview}
                          onChange={(e) => setAdminReview(e.target.value)}
                          placeholder="Add your review/comments..."
                          className="input-field w-full"
                          rows="2"
                        />
                      </>
                    )}

                     {selectedAction === 'ASSIGN_TO_SERVICE' && (
                      <>
                        <select
                          value={selectedServiceUserId}
                          onChange={(e) => setSelectedServiceUserId(e.target.value)}
                          className="input-field w-full"
                          required
                        >
                          <option value="">Select a service team member</option>
                          {serviceTeamMembers.map(member => (
                            <option key={member.id} value={member.id}>
                              {member.name} ({member.email})
                            </option>
                          ))}
                        </select>
                        <textarea
                          value={adminReview}
                          onChange={(e) => setAdminReview(e.target.value)}
                          placeholder="Add instructions/review for the service team..."
                          className="input-field w-full"
                          rows="3"
                        />
                      </>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleAdminAction(selectedAction)}
                        disabled={submitting}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                      >
                        {submitting ? <LoadingSpinner size="small" /> : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setSelectedAction(null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MD Actions Section - Only visible to MD */}
          {isMD && ticket.status === 'PENDING_MD_APPROVAL' && (
            <div className="p-6 border-b border-gray-200 bg-purple-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FiThumbsUp className="mr-2 text-purple-600" />
                MD Approval Required
              </h3>

              {ticket.reviews?.length > 0 && (
                <div className="mb-4 p-4 bg-white rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Admin Review:</p>
                  <p className="text-sm text-gray-600">{ticket.reviews[0]?.content}</p>
                </div>
              )}

              {!mdDecision ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMdDecision('approve')}
                    className="p-4 bg-white rounded-lg border-2 border-green-200 hover:border-green-400 transition-colors"
                  >
                    <FiThumbsUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="font-medium text-gray-900">Approve</p>
                  </button>
                  <button
                    onClick={() => setMdDecision('reject')}
                    className="p-4 bg-white rounded-lg border-2 border-red-200 hover:border-red-400 transition-colors"
                  >
                    <FiThumbsDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="font-medium text-gray-900">Reject</p>
                  </button>
                </div>
                
              ) : (
                <div className="bg-white rounded-lg p-4">
                  <div className="mb-4">
                    {mdDecision === 'approve' ? (
                      <p className="text-sm text-gray-600">
                        Are you sure you want to approve this ticket?
                      </p>
                    ) : (
                      <textarea
                        value={mdReview}
                        onChange={(e) => setMdReview(e.target.value)}
                        placeholder="Please provide reason for rejection..."
                        className="input-field w-full"
                        rows="3"
                      />
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleMDDecision(mdDecision === 'approve')}
                      disabled={submitting}
                      className={`flex-1 px-4 py-2 rounded-lg text-white ${
                        mdDecision === 'approve' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-red-600 hover:bg-red-700'
                      } disabled:opacity-50`}
                    >
                      {submitting ? <LoadingSpinner size="small" /> : 'Confirm'}
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
            </div>
          )}

          {/* NEW: Service Team Actions Section */}
          {isServiceTeam && ticket.assignedToId === user?.id && (
            <>
              {/* Pending Acceptance */}
              {ticket.status === 'PENDING_SERVICE_ACCEPTANCE' && (
                <div className="p-6 border-b border-gray-200 bg-indigo-50">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <FiUserPlus className="mr-2 text-indigo-600" />
                    Service Team Assignment
                  </h3>

                  {!serviceDecision ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setServiceDecision('accept')}
                        className="p-4 bg-white rounded-lg border-2 border-green-200 hover:border-green-400 transition-colors"
                      >
                        <FiCheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="font-medium text-gray-900">Accept</p>
                      </button>
                      <button
                        onClick={() => setServiceDecision('reject')}
                        className="p-4 bg-white rounded-lg border-2 border-red-200 hover:border-red-400 transition-colors"
                      >
                        <FiXCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                        <p className="font-medium text-gray-900">Reject</p>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-4">
                      <div className="mb-4">
                        {serviceDecision === 'accept' ? (
                          <p className="text-sm text-gray-600">
                            Are you sure you want to accept this ticket?
                          </p>
                        ) : (
                          <textarea
                            value={serviceResponse}
                            onChange={(e) => setServiceResponse(e.target.value)}
                            placeholder="Please provide reason for rejection..."
                            className="input-field w-full"
                            rows="3"
                          />
                        )}
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleServiceResponse(serviceDecision)}
                          disabled={submitting}
                          className={`flex-1 px-4 py-2 rounded-lg text-white ${
                            serviceDecision === 'accept'
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-red-600 hover:bg-red-700'
                          } disabled:opacity-50`}
                        >
                          {submitting ? <LoadingSpinner size="small" /> : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setServiceDecision(null)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Service In Progress */}
              {ticket.status === 'SERVICE_IN_PROGRESS' && (
                <div className="p-6 border-b border-gray-200 bg-teal-50">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <FiTool className="mr-2 text-teal-600" />
                    Service Work
                  </h3>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setSelectedAction('PROGRESS')}
                      className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-400 text-left"
                    >
                      <FiRefreshCw className="h-5 w-5 text-blue-600 mb-1" />
                      <p className="text-sm font-medium">Add Progress Note</p>
                    </button>
                    <button
                      onClick={() => setSelectedAction('RESOLVE')}
                      className="p-3 bg-white rounded-lg border border-gray-200 hover:border-green-400 text-left"
                    >
                      <FiCheckCircle className="h-5 w-5 text-green-600 mb-1" />
                      <p className="text-sm font-medium">Mark Resolved</p>
                    </button>
                  </div>

                  {selectedAction && (
                    <div className="bg-white rounded-lg p-4">
                      <textarea
                        value={serviceResponse}
                        onChange={(e) => setServiceResponse(e.target.value)}
                        placeholder={`Add details about ${selectedAction.toLowerCase()}...`}
                        className="input-field w-full mb-3"
                        rows="2"
                      />
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleServiceWorkUpdate(selectedAction)}
                          disabled={submitting}
                          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                          {submitting ? <LoadingSpinner size="small" /> : 'Update'}
                        </button>
                        <button
                          onClick={() => setSelectedAction(null)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Admin Work Section - After MD Approval */}
          {isAdmin && ticket.status === 'APPROVED_BY_MD' && (
            <div className="p-6 border-b border-gray-200 bg-green-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FiTool className="mr-2 text-green-600" />
                Work on Ticket
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <button
                  onClick={() => setSelectedAction('WORK')}
                  className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-400 text-left"
                >
                  <FiRefreshCw className="h-5 w-5 text-blue-600 mb-1" />
                  <p className="text-sm font-medium">Start Working</p>
                </button>
                <button
                  onClick={() => setSelectedAction('PURCHASE')}
                  className="p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-400 text-left"
                >
                  <FiShoppingCart className="h-5 w-5 text-orange-600 mb-1" />
                  <p className="text-sm font-medium">Purchase Required</p>
                </button>
                <button
                  onClick={() => setSelectedAction('RESOLVE')}
                  className="p-3 bg-white rounded-lg border border-gray-200 hover:border-green-400 text-left"
                >
                  <FiCheckCircle className="h-5 w-5 text-green-600 mb-1" />
                  <p className="text-sm font-medium">Mark Resolved</p>
                </button>
              </div>

              {selectedAction && (
                <div className="bg-white rounded-lg p-4">
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder={`Add details about ${selectedAction.toLowerCase()}...`}
                    className="input-field w-full mb-3"
                    rows="2"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleWorkUpdate(selectedAction)}
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      {submitting ? <LoadingSpinner size="small" /> : 'Update'}
                    </button>
                    <button
                      onClick={() => setSelectedAction(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Close Ticket Button - Available to Admin and Employee */}
          {(isAdmin || isEmployee) && ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
            <div className="p-6 border-b border-gray-200">
              <button
                onClick={handleCloseTicket}
                disabled={submitting}
                className="w-full px-4 py-3 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors"
              >
                <FiXCircle className="inline mr-2" />
                Close Ticket
              </button>
            </div>
          )}

          {/* Status Timeline */}
          {ticket.history && ticket.history.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status Timeline</h3>
              <div className="space-y-3">
                {ticket.history.map((event, index) => (
                  <div key={event.id || index} className="flex items-start">
                    <div className="mr-3">
                      <div className="h-2 w-2 mt-2 rounded-full bg-primary-500"></div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">{event.description}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section - Visible to all authenticated users */}
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiMessageSquare className="mr-2" />
              Messages & Reviews
            </h3>

            {/* Add Message Form - Only for authenticated users */}
            {user && (
              <div className="mb-6">
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Add a message..."
                  className="input-field w-full"
                  rows="2"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => handleAdminAction('MESSAGE')}
                    disabled={submitting || !review.trim()}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {submitting ? <LoadingSpinner size="small" /> : (
                      <>
                        <FiSend className="mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Reviews List */}
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
                          {review.createdBy?.name || 'System'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {review.createdBy?.role || 'System'} • {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
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
                  No messages yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Ticket Management System • Share this link with authorized personnel</p>
        </div>
      </div>
    </div>
  )
}