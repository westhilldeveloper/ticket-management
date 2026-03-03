import Link from 'next/link'
import { FiFileText } from 'react-icons/fi'
import { getActionInfo, getRoleBadge, getCategoryBadge, formatAction } from '../utils/helpers'
import { formatDate } from '../utils/dateUtils'

export const TimelineView = ({ history, onTicketClick }) => {
  return (
    <div className="bg-white rounded border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-100">
        {history.map((item, index) => {
          const ActionIcon = getActionInfo(item.action).icon
          const colorClass = getActionInfo(item.action).color
          const bgClass = getActionInfo(item.action).bg
          const formattedDate = formatDate(item.createdAt, true)
          const roleBadge = item.createdBy ? getRoleBadge(item.createdBy.role) : null
          const categoryBadge = item.ticket?.category ? getCategoryBadge(item.ticket.category) : null
          
          return (
            <div key={item.id} className="p-2.5 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-start space-x-2">
                {/* Timeline indicator */}
                <div className="relative">
                  <div className={`h-6 w-6 rounded-full ${bgClass} flex items-center justify-center`}>
                    <ActionIcon className={`h-3 w-3 ${colorClass}`} />
                  </div>
                  {index < history.length - 1 && (
                    <div className="absolute top-6 left-1/2 w-px h-5 bg-gray-100 transform -translate-x-1/2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <Link
                          href={`/tickets/${item.ticket?.id}`}
                          onClick={() => onTicketClick?.(item.ticket?.id)}
                          className="text-[10px] font-medium text-gray-900 hover:text-blue-600 transition-colors truncate"
                        >
                          {item.ticket?.title || 'Unknown Ticket'}
                        </Link>
                        {categoryBadge && (
                          <span className={`px-1 py-px rounded text-[6px] font-medium ${categoryBadge.bg} ${categoryBadge.text} shrink-0`}>
                            {categoryBadge.label}
                          </span>
                        )}
                      </div>
                      <p className="text-[8px] text-gray-600 mt-0.5">
                        {formatAction(item)}
                      </p>
                      
                      {/* Changes preview */}
                      {item.changes && Object.keys(item.changes).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-0.5">
                          {Object.entries(item.changes).slice(0, 2).map(([field, value]) => (
                            <span key={field} className="inline-flex items-center px-1 py-px bg-gray-50 rounded text-[6px] text-gray-600">
                              {field}: {typeof value === 'object' ? 'changed' : String(value).slice(0, 10)}
                            </span>
                          ))}
                          {Object.keys(item.changes).length > 2 && (
                            <span className="text-[6px] text-gray-400">
                              +{Object.keys(item.changes).length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-right ml-1 shrink-0">
                      <p className="text-[7px] text-gray-500" title={formattedDate.full}>
                        {formattedDate.short}
                      </p>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="mt-1 flex items-center text-[6px] text-gray-400">
                    {item.createdBy ? (
                      <>
                        <div className={`inline-flex items-center px-1 py-px rounded ${roleBadge?.bg} ${roleBadge?.text} mr-1`}>
                          {roleBadge?.icon && <roleBadge.icon className="h-2 w-2 mr-px" />}
                          {item.createdBy.name}
                        </div>
                        <span>·</span>
                      </>
                    ) : (
                      <span className="mr-1">System ·</span>
                    )}
                    <FiFileText className="h-2 w-2 mx-px" />
                    <span className="ml-px">
                      #{item.ticket?.ticketNumber?.slice(-4) || item.ticket?.id?.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}