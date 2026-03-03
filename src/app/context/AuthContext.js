'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      
      // Handle 401 gracefully - it just means no user is logged in
      if (res.status === 401) {
        setUser(null)
        setLoading(false)
        return
      }
      
      const data = await res.json()
      if (res.ok) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Login failed')
      }
      
      // Set user state
      setUser(data.user)
      
      // Show success message
      toast.success('Login successful!')
      
      // Redirect based on role
      setTimeout(() => {
        switch (data.user.role) {
          case 'SUPER_ADMIN':
            router.push('/admin')
            break
          case 'ADMIN':
            router.push('/dashboard')
            break
          case 'MD':
            router.push('/dashboard/md')
            break
          default:
            router.push('/dashboard')
        }
      }, 100)
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.message || 'Login failed')
      return { success: false, error: error.message }
    }
  }

  const signup = async (userData) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Signup failed')
      }
      
      toast.success('OTP sent to your email!')
      return { success: true, email: userData.email }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error.message || 'Signup failed')
      return { success: false, error: error.message }
    }
  }

  const verifyOTP = async (email, otp) => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Verification failed')
      }
      
      toast.success('Email verified successfully!')
      return { success: true }
    } catch (error) {
      console.error('OTP verification error:', error)
      toast.error(error.message || 'Verification failed')
      return { success: false, error: error.message }
    }
  }

  const forgotPassword = async (email) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to send OTP')
      }
      
      toast.success('OTP sent to your email!')
      return { success: true }
    } catch (error) {
      console.error('Forgot password error:', error)
      toast.error(error.message || 'Failed to send OTP')
      return { success: false, error: error.message }
    }
  }

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Password reset failed')
      }
      
      toast.success('Password reset successful!')
      
      setTimeout(() => {
        router.push('/auth/login')
      }, 100)
      
      return { success: true }
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error(error.message || 'Password reset failed')
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      toast.success('Logged out successfully')
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed')
    }
  }

  const value = {
    user,
    loading,
    login,
    signup,
    verifyOTP,
    forgotPassword,
    resetPassword,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}