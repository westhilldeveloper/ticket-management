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
    <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <h2 className="text-[11px] font-semibold text-gray-700">Recent Tickets</h2>
      </div>

      {/* Tickets list */}
      <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
        {tickets.length > 0 ? (
          tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/send-ticket/${ticket.id}`}
              className="block px-2 py-1.5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[10px] font-medium text-gray-800 truncate">{ticket.title}</p>
                <span className={`px-1.5 py-0.5 text-[8px] font-medium rounded-full ${statusColors[ticket.status] || 'bg-gray-100 text-gray-800'}`}>
                  {ticket.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>#{ticket.ticketNumber} • {ticket.category} • {ticket.priority}</span>
                <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="px-2 py-3 text-center text-[10px] text-gray-400">
            No recent tickets
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-2 py-1.5 bg-gray-50 border-t border-gray-100">
        <Link
          href="/tickets/ticketlist"
          className="text-[9px] text-primary-600 hover:text-primary-700"
        >
          View All Tickets →
        </Link>
      </div>
    </div>
  )
}