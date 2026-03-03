'use client'

import { useState } from 'react'
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiThumbsUp,
  FiThumbsDown,
  FiExternalLink,
  FiRefreshCw,
  FiUser,
  FiMail
} from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'

export default function TicketStatus({ ticket, onStatusChange }) {
  const [selectedStatus, setSelectedStatus] = useState('')
  const [review, setReview] = useState('')
  const [showForm, setShowForm] = useState(false)

  const getStatusConfig = (status) => {
    const configs = {
      'OPEN': {
        icon: FiAlertCircle,
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
        label: 'Open',
        description: 'Ticket has been created and is waiting for review'
      },
      'PENDING_MD_APPROVAL': {
        icon: FiClock,
        color: 'text-purple-600',
        bg: 'bg-purple-100',
        label: 'Pending MD Approval',
        description: 'Waiting for Managing Director to review'
      },
      'PENDING_THIRD_PARTY': {
        icon: FiExternalLink,
        color: 'text-orange-600',
        bg: 'bg-orange-100',
        label: 'Pending Third Party',
        description: 'External service provider has been contacted'
      },
      'IN_PROGRESS': {
        icon: FiRefreshCw,
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        label: 'In Progress',
        description: 'Ticket is currently being worked on'
      },
      'APPROVED_BY_MD': {
        icon: FiThumbsUp,
        color: 'text-green-600',
        bg: 'bg-green-100',
        label: 'Approved by MD',
        description: 'Managing Director has approved the request'
      },
      'REJECTED_BY_MD': {
        icon: FiThumbsDown,
        color: 'text-red-600',
        bg: 'bg-red-100',
        label: 'Rejected by MD',
        description: 'Managing Director has rejected the request'
      },
      'RESOLVED': {
        icon: FiCheckCircle,
        color: 'text-green-600',
        bg: 'bg-green-100',
        label: 'Resolved',
        description: 'Issue has been resolved'
      },
      'CLOSED': {
        icon: FiCheckCircle,
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        label: 'Closed',
        description: 'Ticket has been closed'
      }
    }
    return configs[status] || configs['OPEN']
  }

  const currentStatus = getStatusConfig(ticket.status)

  const availableStatuses = [
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'PENDING_MD_APPROVAL', label: 'Pending MD Approval' },
    { value: 'PENDING_THIRD_PARTY', label: 'Pending Third Party' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' }
  ]

  const handleStatusUpdate = () => {
    if (!selectedStatus) {
      alert('Please select a status')
      return
    }

    onStatusChange(selectedStatus, review)
    setShowForm(false)
    setSelectedStatus('')
    setReview('')
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Current Status */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Current Status</h3>
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-full ${currentStatus.bg}`}>
            <currentStatus.icon className={`h-6 w-6 ${currentStatus.color}`} />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {currentStatus.label}
            </p>
            <p className="text-sm text-gray-600">
              {currentStatus.description}
            </p>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Status Timeline</h3>
        <div className="space-y-3">
          {ticket.history?.slice(0, 5).map((event, index) => (
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

      {/* Update Status Form */}
      {!showForm ? (
        <div className="p-6">
          <button
            onClick={() => setShowForm(true)}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Update Status
          </button>
        </div>
      ) : (
        <div className="p-6 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Update Ticket Status</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">New Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Select Status</option>
                {availableStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Review (Optional)</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Add a comment about this status change..."
                className="input-field w-full"
                rows="3"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleStatusUpdate}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Update
              </button>
              <button
                onClick={() => {
                  setShowForm(false)
                  setSelectedStatus('')
                  setReview('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Metadata */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Created</p>
            <p className="font-medium text-gray-900">
              {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Last Updated</p>
            <p className="font-medium text-gray-900">
              {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
            </p>
          </div>
          {ticket.closedAt && (
            <div className="col-span-2">
              <p className="text-gray-500">Closed</p>
              <p className="font-medium text-gray-900">
                {formatDistanceToNow(new Date(ticket.closedAt), { addSuffix: true })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}