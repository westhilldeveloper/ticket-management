'use client'

import Link from 'next/link'
import { FiClock, FiExternalLink } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'

export default function PendingApprovals({ approvals }) {
  if (!approvals || approvals.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <FiClock className="mr-2 text-purple-600" />
          Pending MD Approvals
          <span className="ml-2 bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
            {approvals.length}
          </span>
        </h2>
      </div>
      <div className="divide-y divide-gray-200">
        {approvals.slice(0, 5).map((ticket) => (
          <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Link
                    href={`/send-ticket/${ticket.id}`}
                    className="text-lg font-medium text-gray-900 hover:text-primary-600 transition-colors"
                  >
                    {ticket.title}
                  </Link>
                  <span className="text-sm text-gray-500">
                    #{ticket.ticketNumber}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    From: {ticket.createdBy?.name}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-600">
                    {ticket.category}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-600">
                    Priority: <span className={`font-medium ${
                      ticket.priority === 'CRITICAL' ? 'text-red-600' :
                      ticket.priority === 'HIGH' ? 'text-orange-600' :
                      ticket.priority === 'MEDIUM' ? 'text-green-600' :
                      'text-blue-600'
                    }`}>
                      {ticket.priority}
                    </span>
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500">
                    {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                  </span>
                </div>
                {ticket.reviews?.[0] && (
                  <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="font-medium">Review:</span> {ticket.reviews[0].content}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/send-ticket/${ticket.id}`}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                >
                  Review
                  <FiExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
        {approvals.length > 5 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <Link
              href="/admin/approvals"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all {approvals.length} pending approvals →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}