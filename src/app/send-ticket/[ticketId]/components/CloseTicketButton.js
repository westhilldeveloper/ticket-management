import { FiXCircle } from 'react-icons/fi'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'

export default function CloseTicketButton({
  isAdmin,
  isEmployee,
  ticket,
  handleCloseTicket,
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
    <div className="p-3 border-b flex justify-end items-center border-gray-100 ">
      <button
        onClick={onCloseClick}
        disabled={submitting}
        className="w-1/4 px-2 py-1.5 border border-red-200 text-white bg-red-600 rounded text-[10px] font-bold hover:bg-red-800 hover:border-red-400 transition-colors flex items-center justify-center gap-1"
      >
        {submitting ? (
          <LoadingSpinner size="small" />
        ) : (
          <>
            <FiXCircle className="w-3.5 h-3.5" />
            <span>Close Ticket</span>
          </>
        )}
      </button>
    </div>
  )
}