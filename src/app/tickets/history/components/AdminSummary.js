import { FiActivity } from 'react-icons/fi'
import { getActionInfo } from '../utils/helpers'

export const AdminSummary = ({ stats }) => {
  return (
    <div className="bg-blue-50/30 rounded border border-blue-100 p-2">
      <h3 className="text-[9px] font-medium text-gray-700 mb-1.5 flex items-center">
        <FiActivity className="mr-1 h-3 w-3 text-blue-600" />
        Summary
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {Object.entries(stats.actionBreakdown).slice(0, 4).map(([action, count]) => {
          const info = getActionInfo(action)
          const Icon = info.icon
          return (
            <div key={action} className="flex items-center space-x-1">
              <div className={`h-4 w-4 rounded-full ${info.bg} flex items-center justify-center`}>
                <Icon className={`h-2 w-2 ${info.color}`} />
              </div>
              <div>
                <p className="text-[9px] font-medium text-gray-900">{count}</p>
                <p className="text-[5px] text-gray-500">{info.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}