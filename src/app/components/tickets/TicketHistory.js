'use client'

import { useState, useEffect } from 'react'
import {
  FiClock,
  FiUser,
  FiTag,
  FiMessageSquare,
  FiCheckCircle,
  FiXCircle,
  FiThumbsUp,
  FiThumbsDown,
  FiExternalLink,
  FiRefreshCw
} from 'react-icons/fi'
import { formatDistanceToNow, format } from 'date-fns'
import LoadingSpinner from '../common/LoadingSpinner'

export default function TicketHistory({ ticketId, initialHistory = [] }) {
  const [history, setHistory] = useState(initialHistory)
  const [loading, setLoading] = useState(!initialHistory.length)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!initialHistory.length && ticketId) {
      fetchHistory()
    }
  }, [ticketId])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tickets/${ticketId}/history`, {
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch history')
      }

      setHistory(data.history || [])
    } catch (error) {
      console.error('Error fetching history:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'TICKET_CREATED':
        return <FiCheckCircle className="h-5 w-5 text-green-500" />
      case 'STATUS_CHANGED':
        return <FiRefreshCw className="h-5 w-5 text-blue-500" />
      case 'ASSIGNED':
        return <FiUser className="h-5 w-5 text-purple-500" />
      case 'REVIEW_ADDED':
        return <FiMessageSquare className="h-5 w-5 text-primary-500" />
      case 'MD_APPROVED':
        return <FiThumbsUp className="h-5 w-5 text-green-500" />
      case 'MD_REJECTED':
        return <FiThumbsDown className="h-5 w-5 text-red-500" />
      case 'ADMIN_ACTION':
        return <FiTag className="h-5 w-5 text-orange-500" />
      case 'TICKET_CLOSED':
        return <FiCheckCircle className="h-5 w-5 text-gray-500" />
      default:
        return <FiClock className="h-5 w-5 text-gray-400" />
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'TICKET_CREATED':
        return 'border-green-200 bg-green-50'
      case 'STATUS_CHANGED':
        return 'border-blue-200 bg-blue-50'
      case 'ASSIGNED':
        return 'border-purple-200 bg-purple-50'
      case 'REVIEW_ADDED':
        return 'border-primary-200 bg-primary-50'
      case 'MD_APPROVED':
        return 'border-green-200 bg-green-50'
      case 'MD_REJECTED':
        return 'border-red-200 bg-red-50'
      case 'ADMIN_ACTION':
        return 'border-orange-200 bg-orange-50'
      case 'TICKET_CLOSED':
        return 'border-gray-200 bg-gray-50'
      default:
        return 'border-gray-100 bg-gray-50'
    }
  }

  const filteredHistory = filter === 'all' 
    ? history 
    : history.filter(item => item.action === filter)

  const actionTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'TICKET_CREATED', label: 'Created' },
    { value: 'STATUS_CHANGED', label: 'Status Changes' },
    { value: 'ASSIGNED', label: 'Assignments' },
    { value: 'REVIEW_ADDED', label: 'Reviews' },
    { value: 'MD_APPROVED', label: 'MD Approvals' },
    { value: 'MD_REJECTED', label: 'MD Rejections' },
    { value: 'ADMIN_ACTION', label: 'Admin Actions' },
    { value: 'TICKET_CLOSED', label: 'Closures' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="medium" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <FiXCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FiClock className="mr-2" />
            Ticket History
          </h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1"
          >
            {actionTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      {filteredHistory.length > 0 ? (
        <div className="p-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {filteredHistory.map((item, index) => (
                <li key={item.id || index}>
                  <div className="relative pb-8">
                    {index < filteredHistory.length - 1 && (
                      <span
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div className={`relative px-1 py-1 rounded-full ${getActionColor(item.action)}`}>
                        {getActionIcon(item.action)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">
                              {item.action.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-700">
                            {item.description}
                          </p>
                          {item.oldValue && item.newValue && (
                            <div className="mt-1 text-xs text-gray-500">
                              Changed from: <span className="line-through">{item.oldValue}</span> →{' '}
                              <span className="font-medium">{item.newValue}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                          <span>{item.createdBy?.name || 'System'}</span>
                          <span>•</span>
                          <span title={format(new Date(item.createdAt), 'PPP p')}>
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </span>
                          {item.createdBy?.role && (
                            <>
                              <span>•</span>
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                                {item.createdBy.role}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center">
          <FiClock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No history events found</p>
        </div>
      )}
    </div>
  )
}