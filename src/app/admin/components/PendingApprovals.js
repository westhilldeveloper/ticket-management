'use client'

import Link from 'next/link'
import { FiClock, FiExternalLink } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'

export default function PendingApprovals({ approvals }) {
  if (!approvals || approvals.length === 0) return null

  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <h2 className="text-[10px] font-semibold text-gray-700 flex items-center">
          <FiClock className="mr-1 w-3 h-3 text-purple-500" />
          Pending MD Approvals
          <span className="ml-1 bg-purple-100 text-purple-600 text-[8px] px-1 py-0.5 rounded-full">
            {approvals.length}
          </span>
        </h2>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-100">
        {approvals.slice(0, 5).map((ticket) => (
          <div key={ticket.id} className="px-2 py-1.5 hover:bg-gray-50 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Link
                    href={`/send-ticket/${ticket.id}`}
                    className="text-[10px] font-medium text-gray-800 hover:text-primary-600 transition-colors"
                  >
                    {ticket.title}
                  </Link>
                  <span className="text-[9px] text-gray-400">
                    #{ticket.ticketNumber}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[9px] text-gray-500">
                  <span>From: {ticket.createdBy?.name}</span>
                  <span className="text-gray-300">•</span>
                  <span>{ticket.category}</span>
                  <span className="text-gray-300">•</span>
                  <span>
                    Priority:{' '}
                    <span className={`font-medium ${
                      ticket.priority === 'CRITICAL' ? 'text-red-600' :
                      ticket.priority === 'HIGH' ? 'text-orange-600' :
                      ticket.priority === 'MEDIUM' ? 'text-green-600' :
                      'text-blue-600'
                    }`}>
                      {ticket.priority}
                    </span>
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-400">
                    {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                  </span>
                </div>
                {ticket.reviews?.[0] && (
                  <p className="mt-1 text-[8px] text-gray-500 bg-gray-50 p-1 rounded border border-gray-100">
                    <span className="font-medium">Review:</span> {ticket.reviews[0].content}
                  </p>
                )}
              </div>
              <div className="flex items-center">
                <Link
                  href={`/send-ticket/${ticket.id}`}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary-600 text-white rounded text-[9px] font-medium hover:bg-primary-700 transition-colors"
                >
                  Review
                  <FiExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
        {approvals.length > 5 && (
          <div className="px-2 py-1 bg-gray-50 border-t border-gray-100">
            <Link
              href="/admin/approvals"
              className="text-[9px] text-primary-600 hover:text-primary-700"
            >
              View all {approvals.length} pending approvals →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}