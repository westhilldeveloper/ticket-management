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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
      </div>
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {activities.length > 0 ? (
          activities.map((activity, index) => {
            const { icon: Icon, color, bg } = getActivityIcon(activity.type)
            return (
              <div key={activity.id || index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full flex-shrink-0 ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <span>{activity.user?.name || 'System'}</span>
                      <span className="mx-1">•</span>
                      <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-8 text-center text-gray-500">
            No recent activities
          </div>
        )}
      </div>
    </div>
  )
}