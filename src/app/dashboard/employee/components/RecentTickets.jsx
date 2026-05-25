// src/app/tickets/new/components/RecentTickets.jsx
import Link from 'next/link';
import Image from 'next/image';
import { FiInbox, FiPlus } from 'react-icons/fi';

// Helper: Status icon – using GIF files (same as original dashboard)
const getStatusIcon = (status) => {
  const iconSize = 36; // matches original h-4 w-4 (16px? but original used 36 in Image width/height)
  switch (status) {
    case 'OPEN':
      return (
        <Image
          src="/images/open.gif"
          alt="Open"
          width={iconSize}
          height={iconSize}
          className="object-contain"
        />
      );
    case 'IN_PROGRESS':
      return (
        <Image
          src="/images/progress.gif"
          alt="In Progress"
          width={iconSize}
          height={iconSize}
          className="object-contain"
        />
      );
    case 'RESOLVED':
      return (
        <Image
          src="/images/resolved.gif"
          alt="Closed/Resolved"
          width={iconSize}
          height={iconSize}
          className="object-contain"
        />
      );
    case 'CLOSED':
      return (
        <Image
          src="/images/resolved.gif"
          alt="Closed/Resolved"
          width={iconSize}
          height={iconSize}
          className="object-contain"
        />
      );
    default:
      return (
        <Image
          src="/images/open.gif"
          alt="Status"
          width={iconSize}
          height={iconSize}
          className="object-contain"
        />
      );
  }
};

// Helper: Status badge (soft backgrounds, no uppercase)
const getStatusBadge = (status) => {
  const config = {
    OPEN: { bg: 'bg-pink-50', text: 'text-pink-700', label: 'Open' },
    IN_PROGRESS: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'In Progress' },
    RESOLVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Resolved' },
    CLOSED: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Closed' },
  };
  const { bg, text, label } = config[status] || config.OPEN;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

// Helper: Priority badge (same as original)
const getPriorityBadge = (priority) => {
  if (!priority) return null;
  const config = {
    URGENT: { bg: 'bg-red-50', text: 'text-red-700', label: 'Urgent' },
    HIGH: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'High' },
    MEDIUM: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Medium' },
    LOW: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Low' },
  };
  const { bg, text, label } = config[priority] || config.MEDIUM;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export default function RecentTickets({ tickets }) {
  const SCROLLABLE_HEIGHT = '400px';

  if (!tickets) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header – soft pink line, no uppercase */}
      <div className="px-6 py-4 bg-white border-b border-pink-100">
        <h2 className="text-sm font-semibold text-pink-700 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-pink-400 rounded-full"></span>
          Recent Tickets
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">Your latest support requests</p>
      </div>

      {tickets.length > 0 ? (
        <div
          className="overflow-y-auto"
          style={{ height: SCROLLABLE_HEIGHT }}
          tabIndex={0}
          role="region"
          aria-label="Scrollable recent tickets"
        >
          <ul className="divide-y divide-gray-100" aria-label="Tickets list">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  href={`/tickets/${ticket.id}`}
                  className="block px-6 py-2 hover:bg-gray-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side: GIF icon + details */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0 mt-0.5">
                        {getStatusIcon(ticket.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {ticket.title || 'Untitled Ticket'}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-gray-500">
                          <span>#{ticket.ticketNumber || ticket.id?.slice(0, 8) || 'N/A'}</span>
                          <span className="text-gray-300">•</span>
                          <span>{ticket.category || 'General'}</span>
                          {ticket.priority && (
                            <>
                              <span className="text-gray-300">•</span>
                              {getPriorityBadge(ticket.priority)}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side: status badge + date */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {getStatusBadge(ticket.status)}
                      <time className="text-xs text-gray-400" dateTime={ticket.createdAt}>
                        {formatDate(ticket.createdAt)}
                      </time>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-50 mb-4">
            <FiInbox className="h-8 w-8 text-pink-300" />
          </div>
          <p className="text-gray-500 font-medium mb-2">No tickets yet</p>
          <p className="text-xs text-gray-400 mb-4">Create your first support ticket to get started</p>
          <Link
            href="/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          >
            <FiPlus className="w-4 h-4" />
            New ticket
          </Link>
        </div>
      )}

      {tickets.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
          Showing {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
        </div>
      )}
    </div>
  );
}