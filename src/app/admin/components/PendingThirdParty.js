'use client'

import Link from 'next/link'
import { FiClock, FiExternalLink } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'

export default function PendingThirdParty({ tickets }) {
  if (!tickets || tickets.length === 0) return null

  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <h2 className="text-[10px] font-semibold text-gray-700 flex items-center">
          <FiClock className="mr-1 w-3 h-3 text-indigo-500" />
          Pending Third Party
          <span className="ml-1 bg-indigo-100 text-indigo-600 text-[10px] px-1 py-0.5 rounded-full">
            {tickets.length}
          </span>
        </h2>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-100">
        {tickets.slice(0, 5).map((ticket) => (
          <div key={ticket.id} className="px-2 py-1.5 hover:bg-gray-50 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
              <div className="flex-1">
                <Link
                  href={`/send-ticket/${ticket.id}`}
                  className="text-[10px] font-medium text-gray-800 hover:text-primary-600 transition-colors"
                >
                  {ticket.title}
                </Link>
                <div className="flex flex-wrap items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                  <span>#{ticket.ticketNumber}</span>
                  <span className="text-gray-300">•</span>
                  <span>{ticket.thirdPartyStatus || 'Pending'}</span>
                  <span className="text-gray-300">•</span>
                  <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                </div>
                {ticket.thirdPartyDetails && (
                  <p className="mt-1 text-[10px] text-gray-400 line-clamp-2">
                    {ticket.thirdPartyDetails}
                  </p>
                )}
              </div>
              <Link
                href={`/send-ticket/${ticket.id}`}
                className="inline-flex items-center gap-0.5 text-[10px] text-primary-600 hover:text-primary-700"
              >
                View Details
                <FiExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}