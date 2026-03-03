import { useRequireRole } from '../../hooks/useAuth'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import TicketList from '../../components/tickets/TicketList'
import QuickActions from '../../components/dashboard/QuickActions'

export default function EmployeeDashboard() {
  const { user, loading } = useRequireRole(['EMPLOYEE'])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {user?.name}
          </h1>
        </div>

        <QuickActions />

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">My Tickets</h2>
          <TicketList filters={{ createdBy: user?.id }} />
        </div>
      </div>
    </DashboardLayout>
  )
}