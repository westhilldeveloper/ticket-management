'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/context/AuthContext'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'

export default function AdminCreateUser() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    role: 'EMPLOYEE',
    isActive: true,
  }) 
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // All available roles from your Prisma schema
  const roles = ['EMPLOYEE', 'ADMIN', 'MD', 'SERVICE_TEAM', 'SUPER_ADMIN']
  const departments = ['HR', 'IT', 'Finance', 'Operations', 'Sales', 'Marketing']

  // Redirect if not admin/superadmin (client‑side safety)
  useEffect(() => {
    if (!authLoading && user && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  // Email domain validation – same as employee signup
  const isValidEmail = (email) => {
    const allowedDomains = ['westhillinternational.com', 'finovestgroup.com']
    const domain = email.split('@')[1]
    return domain && allowedDomains.includes(domain)
  }

  // Password strength: at least 8 chars, one uppercase, one lowercase, one number, one special char
  const isStrongPassword = (password) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return strongRegex.test(password)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'

    const email = formData.email.trim()
    if (!email) newErrors.email = 'Email is required'
    else if (!isValidEmail(email)) newErrors.email = 'Must use a valid company email'

    if (!formData.password) newErrors.password = 'Password is required'
    else if (!isStrongPassword(formData.password)) {
      newErrors.password =
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.department) newErrors.department = 'Department is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Clear error for this field
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (serverError) setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    if (!validateForm()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department: formData.department,
          isActive: formData.isActive,
          // emailVerified is always true for admin‑created users (set by API)
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create user')
      }

      // Success – redirect to the users list page
      router.push('/admin/users')
      router.refresh() // if using server components
    } catch (error) {
      setServerError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Create New User
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              href="/admin/users"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </div>

        {serverError && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-800">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 bg-white shadow sm:rounded-lg p-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 input-field"
            />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Company Email *
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              placeholder="name@westhillinternational.com"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 input-field"
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">
              Department *
            </label>
            <select
              name="department"
              id="department"
              required
              value={formData.department}
              onChange={handleChange}
              className="mt-1 input-field"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {errors.department && <p className="error-text">{errors.department}</p>}
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role *
            </label>
            <select
              name="role"
              id="role"
              required
              value={formData.role}
              onChange={handleChange}
              className="mt-1 input-field"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password *
            </label>
            <input
              type="password"
              name="password"
              id="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 input-field"
            />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 input-field"
            />
            {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
          </div>

          {/* Active toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active (user can log in immediately)
            </label>
          </div>

          <div className="pt-5">
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {submitting ? <LoadingSpinner size="small" /> : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}