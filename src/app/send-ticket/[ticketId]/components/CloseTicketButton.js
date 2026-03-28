import { FiXCircle } from 'react-icons/fi'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'

export default function CloseTicketButton({
  isAdmin,
  isEmployee,
  ticket,
  handleCloseTicket,   // This function should NOT have its own confirm
  submitting,
}) {
  if ((!isAdmin && !isEmployee) || ticket.status === 'CLOSED' || ticket.status === 'RESOLVED')
    return null

  const onCloseClick = () => {
    if (window.confirm('Are you sure you want to close this ticket?')) {
      handleCloseTicket()
    }
  }

  return (
    <div className="p-6 border-b border-gray-200">
      <button
        onClick={onCloseClick}
        disabled={submitting}
        className="w-full px-4 py-3 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors"
      >
        {submitting ? <LoadingSpinner size="small" /> : <><FiXCircle className="inline mr-2" /> Close Ticket</>}
      </button>
    </div>
  )
}