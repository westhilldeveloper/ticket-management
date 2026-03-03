'use client'

export default function StatCard({ title, value, icon: Icon, color, trend, trendLabel }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend !== undefined && (
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{trend}</p>
            <p className="text-xs text-gray-500">{trendLabel}</p>
          </div>
        )}
      </div>
      <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}