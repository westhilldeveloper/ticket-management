'use client'

import { FiUsers } from 'react-icons/fi'

export default function TopUsers({ users }) {
  if (!users || users.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <FiUsers className="mr-2 text-primary-600" />
          Top Contributors
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        {users.map((user) => (
          <div key={user.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-medium">
                {user.name?.charAt(0) || user.email?.charAt(0)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.role}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{user.ticketCount}</p>
              <p className="text-xs text-gray-500">tickets</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}