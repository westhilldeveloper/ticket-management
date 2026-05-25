import { FiClock, FiAlertCircle, FiRefreshCw, FiThumbsUp, FiThumbsDown, FiCheckCircle, FiCheckSquare, FiExternalLink, FiUserPlus, FiTool } from 'react-icons/fi'

const getStatusColor = (status) => {
  const colors = {
    'OPEN': 'bg-yellow-100 text-yellow-800',
    'PENDING_MD_APPROVAL': 'bg-purple-100 text-purple-800',
    'PENDING_THIRD_PARTY': 'bg-orange-100 text-orange-800',
    'IN_PROGRESS': 'bg-blue-100 text-blue-800',
    'APPROVED_BY_MD': 'bg-green-100 text-green-800',
    'REJECTED_BY_MD': 'bg-red-100 text-red-800',
    'RESOLVED': 'bg-green-100 text-green-800',
    'CLOSED': 'bg-gray-100 text-gray-800',
    'SERVICE_RESOLVED': 'bg-green-100 text-green-800',
    'PENDING_SERVICE_ACCEPTANCE': 'bg-indigo-100 text-indigo-800',
    'SERVICE_IN_PROGRESS': 'bg-teal-100 text-teal-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'OPEN': return <FiAlertCircle className="w-3.5 h-3.5 text-yellow-500" />
    case 'PENDING_MD_APPROVAL': return <FiClock className="w-3.5 h-3.5 text-purple-500" />
    case 'PENDING_THIRD_PARTY': return <FiExternalLink className="w-3.5 h-3.5 text-orange-500" />
    case 'IN_PROGRESS': return <FiRefreshCw className="w-3.5 h-3.5 text-blue-500" />
    case 'APPROVED_BY_MD': return <FiThumbsUp className="w-3.5 h-3.5 text-green-500" />
    case 'REJECTED_BY_MD': return <FiThumbsDown className="w-3.5 h-3.5 text-red-500" />
    case 'REJECTED_BY_SERVICE': return <FiThumbsDown className="w-3.5 h-3.5 text-red-500" />
    case 'RESOLVED': return <FiCheckCircle className="w-3.5 h-3.5 text-green-500" />
    case 'CLOSED': return <FiCheckSquare className="w-3.5 h-3.5 text-gray-500" />
    case 'PENDING_SERVICE_ACCEPTANCE': return <FiUserPlus className="w-3.5 h-3.5 text-indigo-500" />
    case 'SERVICE_IN_PROGRESS': return <FiTool className="w-3.5 h-3.5 text-teal-500" />
    case 'SERVICE_RESOLVED': return <FiCheckCircle className="w-3.5 h-3.5 text-green-500" />
    default: return <FiClock className="w-3.5 h-3.5 text-gray-500" />
  }
}

export default function TicketHeader({ ticket }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <div>
        <h1 className="text-sm font-bold text-gray-800">
          Ticket #{ticket.ticketNumber}
        </h1>
        <p className="text-[9px] text-gray-400 mt-0.5">
          Shared via public link
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`px-1.5 py-0.5 rounded border border-black text-[9px] font-medium flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
          {getStatusIcon(ticket.status)}
          <span>{ticket.status.replace(/_/g, ' ')}</span>
        </span>
      </div>
    </div>
  )
}