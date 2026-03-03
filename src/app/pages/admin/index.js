import { useState, useEffect } from 'react'
import { useRequireRole } from '../../hooks/useAuth'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import UserManagement from '../../components/admin/UserManagement'
import SystemStats from '../../components/admin/SystemStats'
import AllTickets from '../../components/admin/AllTickets'

export default function SuperAdminPanel() {
  const { user, loading } = useRequireRole(['SUPER_ADMIN'])
  const [activeTab, setActiveTab] = useState('overview')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'users', name: 'User Management' },
    { id: 'tickets', name: 'All Tickets' },
    { id: 'settings', name: 'System Settings' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Super Admin Panel
          </h1>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div>
          {activeTab === 'overview' && <SystemStats />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'tickets' && <AllTickets />}
          {activeTab === 'settings' && (
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                System Settings
              </h2>
              <p className="text-gray-600">
                System settings and configurations will be available here.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}