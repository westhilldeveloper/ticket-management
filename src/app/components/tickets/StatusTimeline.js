'use client'

import { useState } from 'react'
import {
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiCalendar,
  FiTag
} from 'react-icons/fi'
import { formatDistanceToNow, format } from 'date-fns'

export default function StatusTimeline({ ticket }) {
  const [expanded, setExpanded] = useState(false)

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPEN':
        return <FiAlertCircle className="h-5 w-5 text-yellow-500" />
      case 'PENDING_MD_APPROVAL':
        return <FiClock className="h-5 w-5 text-purple-500" />
      case 'PENDING_THIRD_PARTY':
        return <FiClock className="h-5 w-5 text-orange-500" />
      case 'IN_PROGRESS':
        return <FiClock className="h-5 w-5 text-blue-500" />
      case 'APPROVED_BY_MD':
        return <FiCheckCircle className="h-5 w-5 text-green-500" />
      case 'REJECTED_BY_MD':
        return <FiCheckCircle className="h-5 w-5 text-red-500" />
      case 'RESOLVED':
      case 'CLOSED':
        return <FiCheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <FiClock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'OPEN': 'border-yellow-500',
      'PENDING_MD_APPROVAL': 'border-purple-500',
      'PENDING_THIRD_PARTY': 'border-orange-500',
      'IN_PROGRESS': 'border-blue-500',
      'APPROVED_BY_MD': 'border-green-500',
      'REJECTED_BY_MD': 'border-red-500',
      'RESOLVED': 'border-green-500',
      'CLOSED': 'border-gray-500'
    }
    return colors[status] || 'border-gray-300'
  }

  // Create timeline events from history
  const timelineEvents = [
    {
      id: 'created',
      type: 'CREATED',
      status: 'OPEN',
      title: 'Ticket Created',
      description: `Ticket created by ${ticket.createdBy?.name || 'Unknown'}`,
      timestamp: ticket.createdAt,
      user: ticket.createdBy?.name,
      userRole: ticket.createdBy?.role
    },
    ...(ticket.history || []).map(event => ({
      id: event.id,
      type: event.action,
      status: event.newValue || event.action,
      title: event.action.replace(/_/g, ' '),
      description: event.description,
      timestamp: event.createdAt,
      user: event.createdBy?.name,
      userRole: event.createdBy?.role
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  const displayedEvents = expanded ? timelineEvents : timelineEvents.slice(0, 5)

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FiClock className="mr-2" />
          Status Timeline
        </h3>
      </div>

      {/* Timeline */}
      <div className="p-6">
        {displayedEvents.length > 0 ? (
          <div className="flow-root">
            <ul className="-mb-8">
              {displayedEvents.map((event, index) => (
                <li key={event.id}>
                  <div className="relative pb-8">
                    {index < displayedEvents.length - 1 && (
                      <span
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div className={`relative px-1 py-1 rounded-full border-2 ${getStatusColor(event.status)} bg-white`}>
                        {getStatusIcon(event.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {event.title}
                          </p>
                          <p className="mt-0.5 text-sm text-gray-600">
                            {event.description}
                          </p>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                          {event.user && (
                            <>
                              <span className="flex items-center">
                                <FiUser className="mr-1 h-3 w-3" />
                                {event.user}
                              </span>
                              {event.userRole && (
                                <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                                  {event.userRole}
                                </span>
                              )}
                            </>
                          )}
                          <span className="flex items-center">
                            <FiCalendar className="mr-1 h-3 w-3" />
                            {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm')}
                          </span>
                          <span className="text-gray-400">
                            ({formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-8">
            <FiClock className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500">No timeline events</p>
          </div>
        )}

        {/* Show More/Less Button */}
        {timelineEvents.length > 5 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {expanded ? 'Show Less' : `Show ${timelineEvents.length - 5} More Events`}
            </button>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Total Events</p>
            <p className="font-medium text-gray-900">{timelineEvents.length}</p>
          </div>
          <div>
            <p className="text-gray-500">Last Updated</p>
            <p className="font-medium text-gray-900">
              {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}