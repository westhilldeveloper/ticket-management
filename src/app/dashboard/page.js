'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // Redirect based on role
      switch (user.role) {
        case 'SUPER_ADMIN':
          router.push('/dashboard/super-admin')
          break
        case 'ADMIN':
          router.push('/admin')
          break
        case 'MD':
          router.push('/dashboard/md')
          break
        case 'SERVICE_TEAM':
          router.push('/dashboard/service-team')
          break
        default:
          router.push('/dashboard/employee')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return null
}