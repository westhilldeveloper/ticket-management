'use client'

export default function SecondaryStats({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Avg Response Time</p>
        <p className="text-xl font-semibold text-gray-900 mt-1">{stats.avgResponseTime}</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Avg Resolution Time</p>
        <p className="text-xl font-semibold text-gray-900 mt-1">{stats.avgResolutionTime}</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Active Users</p>
        <p className="text-xl font-semibold text-gray-900 mt-1">{stats.activeUsers}</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Resolved This Week</p>
        <p className="text-xl font-semibold text-gray-900 mt-1">{stats.resolvedThisWeek}</p>
      </div>
    </div>
  )
}