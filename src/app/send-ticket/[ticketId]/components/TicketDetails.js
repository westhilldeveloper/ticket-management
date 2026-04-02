import { useState, useEffect } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { FiPaperclip, FiDownload, FiExternalLink } from 'react-icons/fi'
import { useAuth } from '@/app/context/AuthContext'
import { useToast } from '@/app/context/ToastContext'
import RedirectTicketModal from '@/app/components/RedirectTicketModal'

export default function TicketDetails({ ticket }) {
  const { user } = useAuth()
  const toast = useToast()
  const [ticketData, setTicketData] = useState(ticket)
  const [showRedirectModal, setShowRedirectModal] = useState(false)

  const canEdit = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  // Keep local copy in sync with parent prop
  useEffect(() => {
    setTicketData(ticket)
  }, [ticket])

  const handleRedirectSuccess = (updatedTicket) => {
    setTicketData(updatedTicket) // update UI
  }

  const handleOpenModal = () => {
    if (!ticketData?.id) {
      toast.error('Cannot redirect: ticket ID missing')
      return
    }
    setShowRedirectModal(true)
  }

  return (
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {ticketData.title}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <p className="text-xs text-gray-500">Branch</p>
          <p className="text-sm font-medium text-gray-900">{ticketData.category}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Priority</p>
          <p className="text-sm font-medium text-gray-900">{ticketData.priority}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Created</p>
          <p className="text-sm font-medium text-gray-900">
            {format(new Date(ticketData.createdAt), 'MMM dd, yyyy')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Last Updated</p>
          <p className="text-sm font-medium text-gray-900">
            {formatDistanceToNow(new Date(ticketData.updatedAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      <div className="prose max-w-none">
        <p className="text-gray-700 whitespace-pre-wrap">
          {ticketData.description}
        </p>
      </div>

      {canEdit && (
        <button
          onClick={handleOpenModal}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <FiExternalLink className="mr-2" />
          Redirect to Department
        </button>
      )}

      {ticketData.attachment && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <FiPaperclip className="mr-2" />
            Attachments
          </h3>
          <div className="space-y-2">
            {ticketData.attachment.split(',').map((url, index) => (
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

      <RedirectTicketModal
        isOpen={showRedirectModal}
        onClose={() => setShowRedirectModal(false)}
        ticketId={ticketData.id}
        onRedirect={handleRedirectSuccess}
      />
    </div>
  )
}