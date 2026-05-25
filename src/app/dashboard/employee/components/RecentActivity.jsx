// RecentActivity.jsx
import { FiInfo, FiClock } from 'react-icons/fi';

export default function RecentActivity({ activities }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!activities || activities.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header – clean, no uppercase, normal tracking */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FiClock className="w-4 h-4 text-gray-500" />
          Recent Activity
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">Latest updates on your tickets</p>
      </div>

      {/* Activity list – accessible list */}
      <ul className="divide-y divide-gray-100" aria-label="Recent activity list">
        {activities.map((activity) => (
          <li key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <FiInfo className="w-4 h-4 text-pink-400" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-relaxed">
                  {activity.description || 'Activity recorded'}
                </p>
                <time className="text-xs text-gray-400 mt-1 block" dateTime={activity.createdAt}>
                  {formatDate(activity.createdAt)}
                </time>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Optional footer with count */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
        Showing {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
      </div>
    </div>
  );
}