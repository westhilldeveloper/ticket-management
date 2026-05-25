'use client'

import React, { useState, useEffect } from 'react'
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
      return () => leaveTicket(id)
    }
  }, [id])

  useEffect(() => {
    if (socket) {
      socket.on(`ticket-${id}-updated`, handleTicketUpdate)
      return () => socket.off(`ticket-${id}-updated`, handleTicketUpdate)
    }
  }, [socket, id])

  const handleTicketUpdate = (updatedTicket) => {
    setTicket(updatedTicket)
    toast.info('Ticket was updated')
  }

  const fetchTicket = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tickets/${id}`, { credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to fetch ticket')
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
      const response = await fetch(url, { credentials: 'include' })
      const data = await response.json()
      setUsers(data.users || [])
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: review, reviewType: getReviewType() }),
        credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to add review')
      setTicket(prev => ({ ...prev, reviews: [data.review, ...(prev.reviews || [])] }))
      setReview('')
      toast.success('Review added successfully')
    } catch (error) {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus, review: review || `Status updated to ${selectedStatus}` }),
        credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to update status')
      setTicket(data.ticket)
      setShowStatusForm(false)
      setSelectedStatus('')
      setReview('')
      toast.success('Status updated successfully')
    } catch (error) {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedToId: selectedUserId,
          review: `Ticket assigned to ${users.find(u => u.id === selectedUserId)?.name}`
        }),
        credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to assign ticket')
      setTicket(data.ticket)
      setShowAssignForm(false)
      setSelectedUserId('')
      toast.success('Ticket assigned successfully')
    } catch (error) {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: approved ? 'APPROVED_BY_MD' : 'REJECTED_BY_MD',
          mdApproval: approved ? 'APPROVED' : 'REJECTED',
          review: mdReview || (approved ? 'Approved by MD' : 'Rejected by MD')
        }),
        credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to process decision')
      setTicket(data.ticket)
      setMdDecision(null)
      setMdReview('')
      toast.success(approved ? 'Ticket approved' : 'Ticket rejected')
    } catch (error) {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thirdParty: true,
          thirdPartyStatus,
          thirdPartyDetails,
          status: 'PENDING_THIRD_PARTY',
          review: `Third party status updated to ${thirdPartyStatus}`
        }),
        credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to update third party status')
      setTicket(data.ticket)
      setShowThirdPartyForm(false)
      setThirdPartyStatus('')
      setThirdPartyDetails('')
      toast.success('Third party status updated')
    } catch (error) {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED', review: 'Ticket closed', closedAt: new Date() }),
        credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to close ticket')
      setTicket(data.ticket)
      toast.success('Ticket closed successfully')
    } catch (error) {
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
      'REJECTED_BY_SERVICE': 'bg-red-100 text-red-800',
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
    const size = "w-3.5 h-3.5"
    switch (status) {
      case 'OPEN': return <FiAlertCircle className={`${size} text-yellow-500`} />
      case 'PENDING_MD_APPROVAL': return <FiClock className={`${size} text-purple-500`} />
      case 'APPROVED_BY_MD': return <FiThumbsUp className={`${size} text-green-500`} />
      case 'REJECTED_BY_MD': return <FiThumbsDown className={`${size} text-red-500`} />
      case 'RESOLVED':
      case 'CLOSED': return <FiCheckCircle className={`${size} text-green-500`} />
      default: return <FiClock className={`${size} text-gray-500`} />
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-48"><LoadingSpinner size="small" /></div>
      </DashboardLayout>
    )
  }

  if (error || !ticket) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-6">
          <div className="bg-white rounded shadow-sm border border-gray-100 p-4 text-center">
            <FiXCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
            <h2 className="text-sm font-bold text-gray-800 mb-1">{error || 'Ticket Not Found'}</h2>
            <p className="text-[10px] text-gray-500 mb-3">{error ? 'An error occurred.' : 'Ticket does not exist.'}</p>
            <Link href="/tickets" className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-primary-600 text-white rounded">Back to Tickets</Link>
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
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-4">
        {/* Header with back button */}
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-800"><FiArrowLeft className="w-3 h-3" /> Back</button>
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(ticket.status)}`}>
              {getStatusIcon(ticket.status)}<span>{ticket.status.replace(/_/g, ' ')}</span>
            </span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-3">
            {/* Ticket Details Card */}
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-2.5">
                <h1 className="text-sm font-bold text-gray-800 mb-0.5">{ticket.title}</h1>
                <p className="text-[10px] text-gray-500 mb-2">#{ticket.ticketNumber}</p>
                <p className="text-[10px] text-gray-700 whitespace-pre-wrap mb-2">{ticket.description}</p>
                {ticket.attachment && (
                  <div className="border-t border-gray-100 pt-1.5 mt-1">
                    <h3 className="text-[10px] font-medium text-gray-600 mb-1 flex items-center gap-1"><FiPaperclip className="w-3 h-3" /> Attachments</h3>
                    <div className="space-y-1">
                      {ticket.attachment.split(',').map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-1.5 bg-gray-50 rounded text-[10px]">
                          <span className="truncate">Attachment {idx+1}</span>
                          <FiExternalLink className="w-3 h-3 text-gray-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-2.5">
                <h2 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1"><FiMessageSquare className="w-3.5 h-3.5" /> Reviews & Comments</h2>
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                  <div className="mb-3">
                    <textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Add a review..." className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded" rows="2" />
                    <div className="mt-1 flex justify-end"><button onClick={handleAddReview} disabled={submitting || !review.trim()} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-primary-600 text-white rounded">{submitting ? <LoadingSpinner size="small" /> : <><FiSend className="w-3 h-3" /> Post</>}</button></div>
                  </div>
                )}
                <div className="space-y-2">
                  {ticket.reviews?.map((r, idx) => (
                    <div key={r.id || idx} className="border-l-2 border-primary-200 bg-gray-50 p-1.5 rounded-r">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1"><FiUser className="w-3 h-3 text-gray-500" /><span className="text-[10px] font-medium">{r.createdBy?.name}</span><span className="text-[8px] text-gray-400">{r.createdBy?.role} • {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</span></div>
                        <span className="text-[7px] px-1 bg-primary-100 rounded">{r.reviewType.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-[10px] text-gray-700">{r.content}</p>
                    </div>
                  ))}
                  {(!ticket.reviews || ticket.reviews.length === 0) && <p className="text-center text-[10px] text-gray-400 py-2">No reviews yet.</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Ticket Information */}
           <div className="bg-white rounded shadow-sm border border-gray-100 p-2.5">
  <h3 className="text-[11px] font-semibold text-gray-500 uppercase mb-2">Ticket Information</h3>
  <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1.5 text-[11px]">
    {/* Created By */}
    <span className="text-gray-500">Created By:</span>
    <div>
      <div>{ticket.createdBy?.name}</div>
      <div className="text-gray-400 text-[9px]">{ticket.createdBy?.department}</div>
    </div>

    {/* Email */}
    <span className="text-gray-500">Email:</span>
    <span className="break-words">{ticket.createdBy?.email}</span>

    {/* Assigned To */}
    {ticket.assignedTo && (
      <>
        <span className="text-gray-500">Assigned To:</span>
        <span>{ticket.assignedTo.name}</span>
      </>
    )}

    {/* Created */}
    <span className="text-gray-500">Created:</span>
    <div>
      <div>{format(new Date(ticket.createdAt), 'PPP')}</div>
      <div className="text-gray-400 text-[9px]">{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</div>
    </div>

    {/* Branch */}
    <span className="text-gray-500">Branch:</span>
    <span>{ticket.category || 'Not specified'}</span>

    {/* Main Category */}
    <span className="text-gray-500">{ticket.requestServiceType} FOR:</span>
    <span>{ticket.mainCategory?.name || 'Not specified'}</span>

    {/* Request/Service Type */}
    <span className="text-gray-500">Request/Service:</span>
    <span>{ticket.requestServiceType || 'Not specified'}</span>

    {/* Item/Service Type */}
    <span className="text-gray-500">Item/Service Type:</span>
    <span>{ticket.itemType || 'Not specified'}</span>
  </div>
</div>

            {/* Timeline */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-2.5">
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Timeline</h3>
              <div className="space-y-1.5">
                {ticket.history?.slice(0, 5).map((event, idx) => (
                  <div key={event.id || idx} className="flex items-start gap-1.5"><div className="w-1.5 h-1.5 mt-1 rounded-full bg-primary-500"></div><div><p className="text-[10px] text-gray-700">{event.action}</p><p className="text-[8px] text-gray-400">{formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}</p></div></div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {/* {(canEdit || isMD || isAssigned)  && ticket.status !== 'CLOSED' && (
              <div className="bg-white rounded shadow-sm border border-gray-100 p-2.5">
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Actions</h3>
                <div className="space-y-1.5">
                  {canEdit && <button onClick={() => setShowStatusForm(!showStatusForm)} className="w-full flex items-center justify-center gap-1 px-2 py-1 text-[10px] border border-gray-200 rounded">Update Status</button>}
                  {canEdit && !ticket.assignedTo && <button onClick={() => { setShowAssignForm(true); fetchUsers() }} className="w-full flex items-center justify-center gap-1 px-2 py-1 text-[10px] border border-gray-200 rounded">Assign Ticket</button>}
                  {isMD && ticket.status === 'PENDING_MD_APPROVAL' && (
                    <>
                      <button onClick={() => handleMDDecision(true)} className="w-full flex items-center justify-center gap-1 px-2 py-1 text-[10px] bg-green-600 text-white rounded">Approve</button>
                      <button onClick={() => setMdDecision('reject')} className="w-full flex items-center justify-center gap-1 px-2 py-1 text-[10px] bg-red-600 text-white rounded">Reject</button>
                    </>
                  )}
                  {canEdit && <button onClick={() => setShowThirdPartyForm(!showThirdPartyForm)} className="w-full flex items-center justify-center gap-1 px-2 py-1 text-[10px] border border-gray-200 rounded">Third Party</button>}
                  {(canEdit || isCreator) && ticket.status !== 'CLOSED' && <button onClick={handleCloseTicket} className="w-full flex items-center justify-center gap-1 px-2 py-1 text-[10px] border border-red-200 text-red-600 rounded">Close Ticket</button>}
                </div>

                {showStatusForm && (
                  <div className="mt-2 space-y-1.5">
                    <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full px-1.5 py-1 text-[10px] border rounded"><option value="">Select Status</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="PENDING_MD_APPROVAL">Pending MD</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option></select>
                    <textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Add a review (optional)" className="w-full px-1.5 py-1 text-[10px] border rounded" rows="2" />
                    <div className="flex gap-1"><button onClick={handleStatusUpdate} className="flex-1 px-2 py-1 text-[10px] bg-primary-600 text-white rounded">Update</button><button onClick={() => setShowStatusForm(false)} className="px-2 py-1 text-[10px] border rounded">Cancel</button></div>
                  </div>
                )}

                {showAssignForm && (
                  <div className="mt-2 space-y-1.5">
                    <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full px-1.5 py-1 text-[10px] border rounded"><option value="">Select User</option>{users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}</select>
                    <div className="flex gap-1"><button onClick={handleAssignTicket} className="flex-1 px-2 py-1 text-[10px] bg-primary-600 text-white rounded">Assign</button><button onClick={() => setShowAssignForm(false)} className="px-2 py-1 text-[10px] border rounded">Cancel</button></div>
                  </div>
                )}

                {mdDecision === 'reject' && (
                  <div className="mt-2 space-y-1.5">
                    <textarea value={mdReview} onChange={(e) => setMdReview(e.target.value)} placeholder="Reason for rejection..." className="w-full px-1.5 py-1 text-[10px] border rounded" rows="2" />
                    <div className="flex gap-1"><button onClick={() => handleMDDecision(false)} className="flex-1 px-2 py-1 text-[10px] bg-red-600 text-white rounded">Confirm Rejection</button><button onClick={() => setMdDecision(null)} className="px-2 py-1 text-[10px] border rounded">Cancel</button></div>
                  </div>
                )}

                {showThirdPartyForm && (
                  <div className="mt-2 space-y-1.5">
                    <select value={thirdPartyStatus} onChange={(e) => setThirdPartyStatus(e.target.value)} className="w-full px-1.5 py-1 text-[10px] border rounded"><option value="">Select Status</option><option value="PENDING">Pending</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option></select>
                    <textarea value={thirdPartyDetails} onChange={(e) => setThirdPartyDetails(e.target.value)} placeholder="Details..." className="w-full px-1.5 py-1 text-[10px] border rounded" rows="2" />
                    <div className="flex gap-1"><button onClick={handleThirdPartyUpdate} className="flex-1 px-2 py-1 text-[10px] bg-primary-600 text-white rounded">Update</button><button onClick={() => setShowThirdPartyForm(false)} className="px-2 py-1 text-[10px] border rounded">Cancel</button></div>
                  </div>
                )}
              </div>
            )} */}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}