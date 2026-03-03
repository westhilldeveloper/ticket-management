'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  FiUser,
  FiMail,
  FiCalendar,
  FiTag,
  FiPaperclip,
  FiDownload,
  FiExternalLink,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiThumbsUp,
  FiThumbsDown
} from 'react-icons/fi'
import { formatDistanceToNow, format } from 'date-fns'

export default function TicketDetails({ ticket, onUpdate }) {
  const [showAllAttachments, setShowAllAttachments] = useState(false)

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
      case 'PENDING_THIRD_PARTY':
        return <FiExternalLink className="h-5 w-5 text-orange-500" />
      case 'IN_PROGRESS':
        return <FiClock className="h-5 w-5 text-blue-500" />
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

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return '📷'
    } else if (['pdf'].includes(ext)) {
      return '📄'
    } else if (['doc', 'docx'].includes(ext)) {
      return '📝'
    } else if (['xls', 'xlsx'].includes(ext)) {
      return '📊'
    } else {
      return '📎'
    }
  }

  const attachments = ticket.attachment ? ticket.attachment.split(',').map((url, index) => ({
    url,
    name: `Attachment ${index + 1}`,
    size: null // Size not stored, would need additional logic
  })) : []

  const displayedAttachments = showAllAttachments ? attachments : attachments.slice(0, 3)

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {ticket.title}
            </h1>
            <p className="text-sm text-gray-500">
              Ticket #{ticket.ticketNumber}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(ticket.status)}`}>
              {getStatusIcon(ticket.status)}
              <span className="ml-1">{ticket.status.replace(/_/g, ' ')}</span>
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-start space-x-2">
            <FiUser className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Created By</p>
              <p className="text-sm font-medium text-gray-900">
                {ticket.createdBy?.name || 'Unknown'}
              </p>
              {ticket.createdBy?.department && (
                <p className="text-xs text-gray-500">{ticket.createdBy.department}</p>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <FiMail className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Contact</p>
              <p className="text-sm text-gray-900 break-all">
                {ticket.createdBy?.email || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <FiCalendar className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm text-gray-900">
                {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <FiTag className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Category</p>
              <p className="text-sm font-medium text-gray-900">{ticket.category}</p>
            </div>
          </div>
        </div>

        {/* Assignment Info */}
        {ticket.assignedTo && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Assigned to:</span> {ticket.assignedTo.name}
              {ticket.assignedTo.email && ` (${ticket.assignedTo.email})`}
            </p>
          </div>
        )}

        {/* MD Approval Info */}
        {ticket.mdApproval && ticket.mdApproval !== 'PENDING' && (
          <div className={`mb-6 p-4 rounded-lg ${
            ticket.mdApproval === 'APPROVED' ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <p className={`text-sm ${
              ticket.mdApproval === 'APPROVED' ? 'text-green-700' : 'text-red-700'
            }`}>
              <span className="font-medium">
                {ticket.mdApproval === 'APPROVED' ? '✓ Approved by MD' : '✗ Rejected by MD'}
              </span>
              {ticket.mdRejectReason && (
                <span className="block mt-1">Reason: {ticket.mdRejectReason}</span>
              )}
            </p>
          </div>
        )}

        {/* Third Party Info */}
        {ticket.thirdParty && (
          <div className="mb-6 p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-700">
              <span className="font-medium">Third Party Service:</span>{' '}
              {ticket.thirdPartyStatus || 'Pending'}
            </p>
            {ticket.thirdPartyDetails && (
              <p className="text-sm text-orange-600 mt-1">
                {ticket.thirdPartyDetails}
              </p>
            )}
          </div>
        )}

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
          <div className="prose max-w-none bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <FiPaperclip className="mr-2" />
              Attachments ({attachments.length})
            </h3>
            <div className="space-y-2">
              {displayedAttachments.map((file, index) => (
                <a
                  key={index}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getFileIcon(file.name)}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700 group-hover:text-primary-600">
                        {file.name}
                      </p>
                      {file.size && (
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      )}
                    </div>
                  </div>
                  <FiDownload className="text-gray-400 group-hover:text-primary-600" />
                </a>
              ))}

              {attachments.length > 3 && !showAllAttachments && (
                <button
                  onClick={() => setShowAllAttachments(true)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Show {attachments.length - 3} more attachments
                </button>
              )}

              {showAllAttachments && attachments.length > 3 && (
                <button
                  onClick={() => setShowAllAttachments(false)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Show less
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}