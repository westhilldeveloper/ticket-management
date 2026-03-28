import { formatDistanceToNow, format } from 'date-fns'
import { FiPaperclip, FiDownload, FiExternalLink } from 'react-icons/fi'

export default function TicketDetails({ ticket }) {
  return (
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {ticket.title}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <p className="text-xs text-gray-500">Branch</p>
          <p className="text-sm font-medium text-gray-900">{ticket.category}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Priority</p>
          <p className="text-sm font-medium text-gray-900">{ticket.priority}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Created</p>
          <p className="text-sm font-medium text-gray-900">
            {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Last Updated</p>
          <p className="text-sm font-medium text-gray-900">
            {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      <div className="prose max-w-none">
        <p className="text-gray-700 whitespace-pre-wrap">
          {ticket.description}
        </p>
      </div>

      {ticket.attachment && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <FiPaperclip className="mr-2" />
            Attachments
          </h3>
          <div className="space-y-2">
            {ticket.attachment.split(',').map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <FiDownload className="mr-2 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    Attachment {index + 1}
                  </span>
                </div>
                <FiExternalLink className="text-gray-400" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}