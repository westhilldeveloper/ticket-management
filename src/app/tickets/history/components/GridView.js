import Link from 'next/link'
import { FiInfo } from 'react-icons/fi'
import { getActionInfo, getRoleBadge, getCategoryBadge, formatAction } from '../utils/helpers'
import { formatDate } from '../utils/dateUtils'

export const GridView = ({ history, onTicketClick, loadingMore, loadMoreRef }) => {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {history.map((item) => {
          const ActionIcon = getActionInfo(item.action).icon
          const colorClass = getActionInfo(item.action).color
          const bgClass = getActionInfo(item.action).bg
          const formattedDate = formatDate(item.createdAt, true)
          const roleBadge = item.createdBy ? getRoleBadge(item.createdBy.role) : null
          const categoryBadge = item.ticket?.category ? getCategoryBadge(item.ticket.category) : null
          
          return (
            <div key={item.id} className="bg-white rounded border border-gray-200 p-2 hover:shadow-sm transition-shadow">
              {/* Card header */}
              <div className="flex items-start justify-between mb-1.5">
                <div className={`h-5 w-5 rounded-full ${bgClass} flex items-center justify-center`}>
                  <ActionIcon className={`h-2.5 w-2.5 ${colorClass}`} />
                </div>
                <span className="text-[6px] text-gray-400" title={formattedDate.full}>
                  {formattedDate.short}
                </span>
              </div>

              {/* Ticket info */}
              <Link
                href={`/tickets/${item.ticket?.id}`}
                onClick={() => onTicketClick?.(item.ticket?.id)}
                className="block group"
              >
                <h3 className="text-[9px] font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                  {item.ticket?.title || 'Unknown Ticket'}
                </h3>
              </Link>

              {/* Action */}
              <p className="text-[7px] text-gray-600 mb-1.5">
                {formatAction(item)}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-0.5 mb-1.5">
                {categoryBadge && (
                  <span className={`px-1 py-px rounded text-[5px] font-medium ${categoryBadge.bg} ${categoryBadge.text}`}>
                    {categoryBadge.label}
                  </span>
                )}
                {item.action && (
                  <span className={`px-1 py-px rounded text-[5px] font-medium ${bgClass} ${colorClass}`}>
                    {getActionInfo(item.action).label}
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                <div className="flex items-center space-x-0.5">
                  {item.createdBy ? (
                    <div className={`inline-flex items-center px-1 py-px rounded ${roleBadge?.bg} ${roleBadge?.text}`}>
                      {roleBadge?.icon && <roleBadge.icon className="h-2 w-2 mr-px" />}
                      <span className="text-[5px] font-medium">{item.createdBy.name}</span>
                    </div>
                  ) : (
                    <span className="text-[5px] text-gray-400">System</span>
                  )}
                </div>
                <span className="text-[5px] text-gray-400 font-mono">
                  #{item.ticket?.ticketNumber?.slice(-4) || item.ticket?.id?.slice(-4)}
                </span>
              </div>

              {/* Changes indicator */}
              {item.changes && Object.keys(item.changes).length > 0 && (
                <div className="mt-1 text-[5px] text-gray-400 flex items-center">
                  <FiInfo className="h-2 w-2 mr-px" />
                  {Object.keys(item.changes).length} change{Object.keys(item.changes).length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Infinite scroll sentinel */}
      {loadMoreRef && (
        <div ref={loadMoreRef} className="flex justify-center py-2">
          {loadingMore ? (
            <span className="text-[6px] text-gray-400">Loading more...</span>
          ) : (
            <div className="h-4" />
          )}
        </div>
      )}
    </>
  )
}