'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import { useToast } from '@/app/context/ToastContext'
import DashboardLayout from '@/app/components/layouts/DashboardLayout'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'
import {
  FiUsers,
  FiUserPlus,
  FiEdit2,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiMail,
  FiCalendar,
  FiTag,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiShield,
  FiAward,
  FiBriefcase,
  FiLock,
  FiUnlock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle
} from 'react-icons/fi'
import { formatDistanceToNow, format } from 'date-fns'

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const toast = useToast()
  const router = useRouter()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    department: '',
    isActive: true
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    department: '',
    search: '',
    page: 1,
    limit: 10
  })
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/dynamic-categories', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        console.log("categories====>", data)
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };
  fetchCategories();
}, []);

  useEffect(() => {
    fetchUsers()
  }, [filters.role, filters.status, filters.department, filters.page])



  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (filters.role) params.append('role', filters.role)
      if (filters.status) params.append('status', filters.status)
      if (filters.department) params.append('department', filters.department)
      if (filters.search) params.append('search', filters.search)
      params.append('page', filters.page)
      params.append('limit', filters.limit)

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users')
      }

      setUsers(data.users || [])
      setPagination(data.pagination || {
        total: 0,
        pages: 0,
        page: filters.page,
        limit: filters.limit
      })
    } catch (error) {
      console.error('Error fetching users:', error)
      setError(error.message)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }

   if (!formData.email.trim()) {
  errors.email = 'Email is required';
} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
  errors.email = 'Invalid email format';
} else if (
  !formData.email.endsWith('@westhillinternational.com') &&
  !formData.email.endsWith('@finovestgroup.com') &&
  formData.email !== 'admin@westhillinternational.com'
) {
  errors.email = 'Must use company email (@westhillinternational.com or @finovestgroup.com)';
}

    if (!selectedUser && !formData.password) {
      errors.password = 'Password is required for new users'
    } else if (formData.password && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (!formData.role) {
      errors.role = 'Role is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user')
      }

      toast.success('User created successfully')
      setShowAddModal(false)
      resetForm()
      fetchUsers()
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditUser = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user')
      }

      toast.success('User updated successfully')
      setShowEditModal(false)
      resetForm()
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user')
      }

      toast.success('User deleted successfully')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(error.message)
    }
  }

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user status')
      }

      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`)
      fetchUsers()
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast.error(error.message)
    }
  }

  const handleResetPassword = async (userId) => {
    if (!confirm('Are you sure you want to reset this user\'s password? They will receive an email with reset instructions.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password')
      }

      toast.success('Password reset email sent')
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error(error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      department: '',
      isActive: true
    })
    setFormErrors({})
    setSelectedUser(null)
  }

  const openEditModal = (user) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department || '',
      isActive: user.isActive
    })
    setShowEditModal(true)
  }

  const exportUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/export', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Users exported successfully')
    } catch (error) {
      console.error('Error exporting users:', error)
      toast.error('Failed to export users')
    }
  }

  const getRoleBadgeColor = (role) => {
    const colors = {
      'SUPER_ADMIN': 'bg-purple-100 text-purple-800',
      'ADMIN': 'bg-blue-100 text-blue-800',
      'MD': 'bg-green-100 text-green-800',
      'EMPLOYEE': 'bg-gray-100 text-gray-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <FiShield className="h-4 w-4" />
      case 'ADMIN':
        return <FiBriefcase className="h-4 w-4" />
      case 'MD':
        return <FiAward className="h-4 w-4" />
      default:
        return <FiUserCheck className="h-4 w-4" />
    }
  }

  if (loading && users.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">
              Manage system users, roles, and permissions
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportUsers}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <FiDownload className="mr-2" />
              Export
            </button>
            <button
              onClick={() => {
                resetForm()
                setShowAddModal(true)
              }}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <FiUserPlus className="mr-2" />
              Add User
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <FiFilter className="h-5 w-5" />
              <span>Filters</span>
              {(filters.role || filters.status || filters.department) && (
                <span className="bg-primary-100 text-primary-600 text-xs px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                placeholder="Search by name or email..."
                className="input-field pl-10"
              />
            </div>
            <button
              onClick={fetchUsers}
              className="btn-primary"
            >
              Search
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value, page: 1 }))}
                  className="input-field"
                >
                  <option value="">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MD">Managing Director</option>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="SERVICE_TEAM">Service Team</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                  className="input-field"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={filters.department}
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value, page: 1 }))}
                  placeholder="Filter by department"
                  className="input-field"
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  onClick={() => {
                    setFilters({
                      role: '',
                      status: '',
                      department: '',
                      search: '',
                      page: 1,
                      limit: 10
                    })
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center text-red-700">
            <FiAlertCircle className="mr-2 h-5 w-5" />
            {error}
          </div>
        )}

        {/* Users Table */}
        {users.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      {user.emailVerified ? (
                        <div className="text-xs text-green-600 flex items-center mt-1">
                          <FiCheckCircle className="mr-1 h-3 w-3" />
                          Verified
                        </div>
                      ) : (
                        <div className="text-xs text-yellow-600 flex items-center mt-1">
                          <FiAlertCircle className="mr-1 h-3 w-3" />
                          Not Verified
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getRoleBadgeColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1">{user.role.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isActive ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{format(new Date(user.createdAt), 'MMM dd, yyyy')}</div>
                      <div className="text-xs">
                        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit User"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                          className={`${user.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                          title={user.isActive ? 'Deactivate User' : 'Activate User'}
                        >
                          {user.isActive ? <FiLock className="h-5 w-5" /> : <FiUnlock className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Reset Password"
                        >
                          <FiRefreshCw className="h-5 w-5" />
                        </button>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> users
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FiUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 mb-6">
              {filters.search || filters.role || filters.status || filters.department
                ? 'Try adjusting your filters'
                : 'Get started by adding your first user'}
            </p>
            <button
              onClick={() => {
                resetForm()
                setShowAddModal(true)
              }}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <FiUserPlus className="mr-2" />
              Add User
            </button>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <UserModal
          title="Add New User"
          formData={formData}
          formErrors={formErrors}
          onInputChange={handleInputChange}
          dynamicCategories={categories}
          onSubmit={handleAddUser}
          onClose={() => {
            setShowAddModal(false)
            resetForm()
          }}
          submitting={submitting}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <UserModal
          title="Edit User"
          formData={formData}
          formErrors={formErrors}
          onInputChange={handleInputChange}
          onSubmit={handleEditUser}
          onClose={() => {
            setShowEditModal(false)
            resetForm()
          }}
          submitting={submitting}
          isEdit
          dynamicCategories={categories}
        />
      )}
    </DashboardLayout>
  )
}

// User Modal Component
function UserModal({ title, formData, formErrors, onInputChange, onSubmit, onClose, submitting, isEdit, dynamicCategories }) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiXCircle className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              className={`input-field ${formErrors.name ? 'border-red-500' : ''}`}
              placeholder="Enter full name"
            />
            {formErrors.name && (
              <p className="error-text mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onInputChange}
              className={`input-field ${formErrors.email ? 'border-red-500' : ''}`}
              placeholder="user@westhillinternational.com"
              disabled={isEdit} // Email cannot be edited
            />
            {formErrors.email && (
              <p className="error-text mt-1">{formErrors.email}</p>
            )}
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={onInputChange}
                className={`input-field ${formErrors.password ? 'border-red-500' : ''}`}
                placeholder="Enter password"
              />
              {formErrors.password && (
                <p className="error-text mt-1">{formErrors.password}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Minimum 8 characters
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={onInputChange}
              className={`input-field ${formErrors.role ? 'border-red-500' : ''}`}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
              <option value="MD">Managing Director</option>
              <option value="SERVICE_TEAM">Service Team</option>
            </select>
            {formErrors.role && (
              <p className="error-text mt-1">{formErrors.role}</p>
            )}
          </div>

          <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Department
    </label>
    {dynamicCategories && dynamicCategories.length > 0 ? (
    <select
      name="department"
      value={formData.department}
      onChange={onInputChange}
      className="input-field"
      required
    >
      <option value="">Select Department</option>
      {dynamicCategories.map(cat => (
        <option key={cat.id} value={cat.name}>{cat.name}</option>
      ))}
    </select>):  (
  <input type="text" name="department"  />
)}
  </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={onInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? <LoadingSpinner size="small" /> : (isEdit ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}