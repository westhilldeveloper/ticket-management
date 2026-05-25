'use client'

import { 
  FiFileText, 
  FiRefreshCw, 
  FiUsers, 
  FiThumbsUp, 
  FiThumbsDown, 
  FiActivity 
} from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'

const activityIcons = {
  TICKET_CREATED: { icon: FiFileText, color: 'text-green-600', bg: 'bg-green-100' },
  STATUS_CHANGED: { icon: FiRefreshCw, color: 'text-blue-600', bg: 'bg-blue-100' },
  USER_JOINED: { icon: FiUsers, color: 'text-purple-600', bg: 'bg-purple-100' },
  MD_APPROVED: { icon: FiThumbsUp, color: 'text-green-600', bg: 'bg-green-100' },
  MD_REJECTED: { icon: FiThumbsDown, color: 'text-red-600', bg: 'bg-red-100' },
  DEFAULT: { icon: FiActivity, color: 'text-gray-600', bg: 'bg-gray-100' }
}

export default function RecentActivities({ activities }) {
  const getActivityIcon = (type) => {
    return activityIcons[type] || activityIcons.DEFAULT
  }

  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <h2 className="text-[12px] font-semibold text-gray-700">Recent Activities</h2>
      </div>

      {/* Activities list */}
      <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
        {activities.length > 0 ? (
          activities.map((activity, index) => {
            const { icon: Icon, color, bg } = getActivityIcon(activity.type)
            return (
              <div key={activity.id || index} className="px-2 py-1.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-1.5">
                  <div className={`p-0.5 rounded-full flex-shrink-0 ${bg}`}>
                    <Icon className={`h-3 w-3 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-700 leading-tight">{activity.description}</p>
                    <div className="flex items-center mt-0.5 text-[10px] text-gray-400">
                      <span>{activity.user?.name || 'System'}</span>
                      <span className="mx-0.5">•</span>
                      <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="px-2 py-3 text-center text-[9px] text-gray-400">
            No recent activities
          </div>
        )}
      </div>
    </div>
  )
}