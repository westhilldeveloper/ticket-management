'use client'

export default function SecondaryStats({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      <div className="bg-white rounded border border-gray-100 p-1.5">
        <p className="text-[9px] text-gray-500">Avg Response Time</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5">{stats.avgResponseTime}</p>
      </div>
      <div className="bg-white rounded border border-gray-100 p-1.5">
        <p className="text-[9px] text-gray-500">Avg Resolution Time</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5">{stats.avgResolutionTime}</p>
      </div>
      <div className="bg-white rounded border border-gray-100 p-1.5">
        <p className="text-[9px] text-gray-500">Active Users</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5">{stats.activeUsers}</p>
      </div>
      <div className="bg-white rounded border border-gray-100 p-1.5">
        <p className="text-[9px] text-gray-500">Resolved This Week</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5">{stats.resolvedThisWeek}</p>
      </div>
    </div>
  )
}