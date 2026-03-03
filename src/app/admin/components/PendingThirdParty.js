'use client'

import Link from 'next/link'
import { FiClock, FiExternalLink } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'

export default function PendingThirdParty({ tickets }) {
  if (!tickets || tickets.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <FiClock className="mr-2 text-indigo-600" />
          Pending Third Party
          <span className="ml-2 bg-indigo-100 text-indigo-600 text-xs px-2 py-1 rounded-full">
            {tickets.length}
          </span>
        </h2>
      </div>
      <div className="divide-y divide-gray-200">
        {tickets.slice(0, 5).map((ticket) => (
          <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <Link
                  href={`/send-ticket/${ticket.id}`}
                  className="text-lg font-medium text-gray-900 hover:text-primary-600 transition-colors"
                >
                  {ticket.title}
                </Link>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span>#{ticket.ticketNumber}</span>
                  <span>•</span>
                  <span>{ticket.thirdPartyStatus || 'Pending'}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                </div>
                {ticket.thirdPartyDetails && (
                  <p className="mt-2 text-sm text-gray-500">{ticket.thirdPartyDetails}</p>
                )}
              </div>
              <Link
                href={`/send-ticket/${ticket.id}`}
                className="inline-flex items-center px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                View Details
                <FiExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}