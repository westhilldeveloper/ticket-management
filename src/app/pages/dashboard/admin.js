import { useRequireRole } from '../../hooks/useAuth'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import AdminStats from '../../components/admin/AdminStats'
import TicketQueue from '../../components/admin/TicketQueue'
import PendingApprovals from '../../components/admin/PendingApprovals'

export default function AdminDashboard() {
  const { user, loading } = useRequireRole(['ADMIN', 'SUPER_ADMIN'])

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
        <h1 className="text-2xl font-semibold text-gray-900">
          Admin Dashboard
        </h1>

        <AdminStats />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PendingApprovals />
          <TicketQueue />
        </div>
      </div>
    </DashboardLayout>
  )
}