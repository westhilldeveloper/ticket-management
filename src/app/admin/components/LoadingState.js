'use client'

import DashboardLayout from '@/app/components/layouts/DashboardLayout'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'

export default function LoadingState() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    </DashboardLayout>
  )
}