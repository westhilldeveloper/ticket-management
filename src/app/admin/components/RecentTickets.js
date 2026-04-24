'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

const statusColors = {
  OPEN: 'bg-yellow-100 text-yellow-800',
  PENDING_MD_APPROVAL: 'bg-purple-100 text-purple-800',
  PENDING_THIRD_PARTY: 'bg-indigo-100 text-indigo-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  APPROVED_BY_MD: 'bg-emerald-100 text-emerald-800',
  REJECTED_BY_MD: 'bg-red-100 text-red-800',
  REJECTED_BY_SERVICE: 'bg-red-100 text-red-800',
  CLOSED: 'bg-gray-100 text-gray-800'
}

export default function RecentTickets({ tickets }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
      </div>
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {tickets.length > 0 ? (
          tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/send-ticket/${ticket.id}`}
              className="block p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-900 truncate">{ticket.title}</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[ticket.status] || 'bg-gray-100 text-gray-800'}`}>
                  {ticket.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>#{ticket.ticketNumber} • {ticket.category} • {ticket.priority}</span>
                <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            No recent tickets
          </div>
        )}
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <Link
          href="/tickets/ticketlist"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View All Tickets →
        </Link>
      </div>
    </div>
  )
}