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
    case 'OPEN': return <FiAlertCircle className="h-5 w-5 text-yellow-500" />
    case 'PENDING_MD_APPROVAL': return <FiClock className="h-5 w-5 text-purple-500" />
    case 'PENDING_THIRD_PARTY': return <FiExternalLink className="h-5 w-5 text-orange-500" />
    case 'IN_PROGRESS': return <FiRefreshCw className="h-5 w-5 text-blue-500" />
    case 'APPROVED_BY_MD': return <FiThumbsUp className="h-5 w-5 text-green-500" />
    case 'REJECTED_BY_MD': return <FiThumbsDown className="h-5 w-5 text-red-500" />
    case 'REJECTED_BY_SERVICE': return <FiThumbsDown className="h-5 w-5 text-red-500" />
    case 'RESOLVED': return <FiCheckCircle className="h-5 w-5 text-green-500" />
    case 'CLOSED': return <FiCheckSquare className="h-5 w-5 text-gray-500" />
    case 'PENDING_SERVICE_ACCEPTANCE': return <FiUserPlus className="h-5 w-5 text-indigo-500" />
    case 'SERVICE_IN_PROGRESS': return <FiTool className="h-5 w-5 text-teal-500" />
    case 'SERVICE_RESOLVED': return <FiCheckCircle className="h-5 w-5 text-green-500" />
    default: return <FiClock className="h-5 w-5 text-gray-500" />
  }
}

export default function TicketHeader({ ticket }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Ticket #{ticket.ticketNumber}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Shared via public link
        </p>
      </div>
      <div className="flex items-center space-x-3">
        <span className={`px-3 py-1 rounded-md border-1 border-black text-sm font-medium flex items-center ${getStatusColor(ticket.status)}`}>
          {getStatusIcon(ticket.status)}
          <span className="ml-1">{ticket.status.replace(/_/g, ' ')}</span>
        </span>
      </div>
    </div>
  )
}