'use client'

export default function StatCard({ title, value, icon: Icon, color, trend, trendLabel }) {
  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-2 hover:shadow transition-shadow">
      <div className="flex items-center justify-between mb-1">
        <div className={`p-1 rounded ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        {trend !== undefined && (
          <div className="text-right">
            <p className="text-[10px] font-medium text-gray-700">{trend}</p>
            <p className="text-[10px] text-gray-400">{trendLabel}</p>
          </div>
        )}
      </div>
      <h3 className="text-[9px] text-gray-500 mb-0.5">{title}</h3>
      <p className="text-sm font-bold text-gray-800">{value}</p>
    </div>
  )
}