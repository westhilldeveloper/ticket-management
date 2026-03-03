import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'

export const useRequireAuth = (redirectTo = '/auth/login') => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  return { user, loading }
}

export const useRequireRole = (allowedRoles, redirectTo = '/dashboard') => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      if (!allowedRoles.includes(user.role)) {
        router.push(redirectTo)
      }
    }
  }, [user, loading, router, allowedRoles, redirectTo])

  return { user, loading }
}