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
    limit: 15 // increased default per page for compact view
  })
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 15
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/dynamic-categories', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
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

      const response = await fetch(`/api/admin/users?${params.toString()}`, { credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to fetch users')
      setUsers(data.users || [])
      setPagination(data.pagination || { total: 0, pages: 0, page: filters.page, limit: filters.limit })
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
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    } else if (!formData.email.endsWith('@westhillinternational.com') && !formData.email.endsWith('@finovestgroup.com') && formData.email !== 'admin@westhillinternational.com') {
      errors.email = 'Must use company email';
    }
    if (!selectedUser && !formData.password) {
      errors.password = 'Password is required for new users'
    } else if (formData.password && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    if (!formData.role) errors.role = 'Role is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to create user')
      toast.success('User created successfully')
      setShowAddModal(false)
      resetForm()
      fetchUsers()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditUser = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to update user')
      toast.success('User updated successfully')
      setShowEditModal(false)
      resetForm()
      fetchUsers()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user? This cannot be undone.')) return
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to delete user')
      toast.success('User deleted')
      fetchUsers()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
        credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to update user status')
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'}`)
      fetchUsers()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleResetPassword = async (userId) => {
    if (!confirm('Reset this user\'s password? They will receive an email.')) return
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST', credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to reset password')
      toast.success('Password reset email sent')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'EMPLOYEE', department: '', isActive: true })
    setFormErrors({})
    setSelectedUser(null)
  }

  const openEditModal = (user) => {
    setSelectedUser(user)
    setFormData({ name: user.name, email: user.email, password: '', role: user.role, department: user.department || '', isActive: user.isActive })
    setShowEditModal(true)
  }

  const exportUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/export', { credentials: 'include' })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Users exported')
    } catch (error) {
      toast.error('Export failed')
    }
  }

  const getRoleBadgeColor = (role) => ({
    'SUPER_ADMIN': 'bg-purple-100 text-purple-800',
    'ADMIN': 'bg-blue-100 text-blue-800',
    'MD': 'bg-green-100 text-green-800',
    'EMPLOYEE': 'bg-gray-100 text-gray-800'
  }[role] || 'bg-gray-100 text-gray-800')

  const getRoleIcon = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return <FiShield className="w-3 h-3" />
      case 'ADMIN': return <FiBriefcase className="w-3 h-3" />
      case 'MD': return <FiAward className="w-3 h-3" />
      default: return <FiUserCheck className="w-3 h-3" />
    }
  }

  if (loading && users.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-48"><LoadingSpinner size="small" /></div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-3 p-3">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-sm font-bold text-gray-800">User Management</h1>
            <p className="text-[10px] text-gray-500 mt-0.5">Manage system users, roles, and permissions</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={exportUsers} className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded text-[10px] text-gray-600 hover:bg-gray-50">
              <FiDownload className="w-3 h-3" /> Export
            </button>
            <button onClick={() => { resetForm(); setShowAddModal(true) }} className="flex items-center gap-1 px-2 py-1 bg-primary-600 text-white rounded text-[10px] hover:bg-primary-700">
              <FiUserPlus className="w-3 h-3" /> Add User
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded border border-gray-100 p-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[10px] font-semibold text-gray-600">Users</h2>
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1 text-[10px] text-gray-500">
              <FiFilter className="w-3 h-3" /> Filters {(filters.role || filters.status || filters.department) && <span className="bg-primary-100 text-primary-600 text-[9px] px-1 rounded">●</span>}
            </button>
          </div>
          <div className="flex gap-1">
            <div className="relative flex-1">
              <FiSearch className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input type="text" value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))} onKeyDown={(e) => e.key === 'Enter' && fetchUsers()} placeholder="Search..." className="w-full pl-6 pr-2 py-1 text-[10px] border border-gray-200 rounded focus:outline-none focus:border-primary-300" />
            </div>
            <button onClick={fetchUsers} className="px-2 py-1 bg-primary-600 text-white rounded text-[10px]">Go</button>
          </div>
          {showFilters && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-1">
              <select value={filters.role} onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value, page: 1 }))} className="text-[10px] border border-gray-200 rounded px-1 py-0.5">
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option><option value="MD">MD</option><option value="EMPLOYEE">Employee</option><option value="SERVICE_TEAM">Service Team</option>
              </select>
              <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))} className="text-[10px] border border-gray-200 rounded px-1 py-0.5">
                <option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
              <input type="text" value={filters.department} onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value, page: 1 }))} placeholder="Department" className="text-[10px] border border-gray-200 rounded px-1 py-0.5" />
              <div className="sm:col-span-3 flex justify-end">
                <button onClick={() => setFilters({ role: '', status: '', department: '', search: '', page: 1, limit: 15 })} className="text-[9px] text-primary-600">Clear all</button>
              </div>
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded p-2 text-[10px] text-red-700 flex items-center gap-1"><FiAlertCircle className="w-3 h-3" />{error}</div>}

        {users.length > 0 ? (
          <div className="bg-white rounded border border-gray-100 overflow-hidden">
            <table className="min-w-full text-[10px]">
              <thead className="bg-gray-50">
                <tr className="text-gray-500">
                  <th className="px-2 py-1 text-left">User</th><th className="px-2 py-1 text-left">Contact</th><th className="px-2 py-1 text-left">Role</th><th className="px-2 py-1 text-left">Dept</th><th className="px-2 py-1 text-left">Status</th><th className="px-2 py-1 text-left">Joined</th><th className="px-2 py-1 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center"><span className="text-[9px] font-medium text-primary-700">{user.name.charAt(0)}</span></div>
                        <div><div className="font-medium text-gray-800 text-[10px]">{user.name}</div><div className="text-[7px] text-gray-400">ID: {user.id.slice(0,6)}</div></div>
                      </div>
                    </td>
                    <td className="px-2 py-1"><div className="text-[10px] text-gray-700">{user.email}</div>{user.emailVerified ? <div className="text-[7px] text-green-600 flex items-center gap-0.5"><FiCheckCircle className="w-2 h-2" /> Verified</div> : <div className="text-[7px] text-yellow-600 flex items-center gap-0.5"><FiAlertCircle className="w-2 h-2" /> Unverified</div>}</td>
                    <td className="px-2 py-1"><span className={`inline-flex items-center gap-0.5 px-1 py-0.5 text-[9px] font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>{getRoleIcon(user.role)}<span>{user.role.replace('_', ' ')}</span></span></td>
                    <td className="px-2 py-1 text-[10px] text-gray-500">{user.department || '-'}</td>
                    <td className="px-2 py-1">{user.isActive ? <span className="px-1 py-0.5 text-[7px] font-medium rounded-full bg-green-100 text-green-700">Active</span> : <span className="px-1 py-0.5 text-[7px] font-medium rounded-full bg-red-100 text-red-700">Inactive</span>}</td>
                    <td className="px-2 py-1 text-[10px] text-gray-500"><div>{format(new Date(user.createdAt), 'dd MMM yy')}</div><div className="text-[7px]">{formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</div></td>
                    <td className="px-2 py-1 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEditModal(user)} className="text-blue-600 hover:text-blue-800" title="Edit"><FiEdit2 className="w-3 h-3" /></button>
                        {user.id !== currentUser?.id && <button onClick={() => handleToggleStatus(user.id, user.isActive)} className={user.isActive ? 'text-yellow-600' : 'text-green-600'} title={user.isActive ? 'Deactivate' : 'Activate'}>{user.isActive ? <FiLock className="w-3 h-3" /> : <FiUnlock className="w-3 h-3" />}</button>}
                        <button onClick={() => handleResetPassword(user.id)} className="text-purple-600" title="Reset Password"><FiRefreshCw className="w-3 h-3" /></button>
                        {user.id !== currentUser?.id && <button onClick={() => handleDeleteUser(user.id)} className="text-red-600" title="Delete"><FiTrash2 className="w-3 h-3" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination.pages > 1 && (
              <div className="px-2 py-1 bg-gray-50 border-t border-gray-100 flex justify-between text-[9px]">
                <span>{pagination.total} users</span>
                <div className="flex gap-1">
                  <button onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1} className="px-1.5 border rounded disabled:opacity-40">Prev</button>
                  <span className="px-1">{pagination.page}/{pagination.pages}</span>
                  <button onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.pages} className="px-1.5 border rounded disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded border border-gray-100 p-4 text-center">
            <FiUsers className="mx-auto w-8 h-8 text-gray-300 mb-2" />
            <p className="text-[10px] text-gray-500">No users found. Adjust filters or add a user.</p>
            <button onClick={() => { resetForm(); setShowAddModal(true) }} className="mt-2 px-2 py-1 bg-primary-600 text-white rounded text-[10px]">Add User</button>
          </div>
        )}
      </div>

      {/* Modals – compact version */}
      {showAddModal && (
        <UserModalCompact
          title="Add User"
          formData={formData}
          formErrors={formErrors}
          onInputChange={handleInputChange}
          dynamicCategories={categories}
          onSubmit={handleAddUser}
          onClose={() => { setShowAddModal(false); resetForm() }}
          submitting={submitting}
        />
      )}
      {showEditModal && (
        <UserModalCompact
          title="Edit User"
          formData={formData}
          formErrors={formErrors}
          onInputChange={handleInputChange}
          onSubmit={handleEditUser}
          onClose={() => { setShowEditModal(false); resetForm() }}
          submitting={submitting}
          isEdit
          dynamicCategories={categories}
        />
      )}
    </DashboardLayout>
  )
}

// Compact User Modal Component
function UserModalCompact({ title, formData, formErrors, onInputChange, onSubmit, onClose, submitting, isEdit, dynamicCategories }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded shadow-sm w-full max-w-sm p-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FiXCircle className="w-3.5 h-3.5" /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-2">
          <div><label className="block text-[10px] font-medium text-gray-600 mb-0.5">Full Name</label><input type="text" name="name" value={formData.name} onChange={onInputChange} className={`w-full px-2 py-1 text-[10px] border border-gray-200 rounded ${formErrors.name ? 'border-red-500' : ''}`} placeholder="Full name" />{formErrors.name && <p className="text-[7px] text-red-500 mt-0.5">{formErrors.name}</p>}</div>
          <div><label className="block text-[10px] font-medium text-gray-600 mb-0.5">Email</label><input type="email" name="email" value={formData.email} onChange={onInputChange} className={`w-full px-2 py-1 text-[10px] border border-gray-200 rounded ${formErrors.email ? 'border-red-500' : ''}`} placeholder="user@company.com" disabled={isEdit} />{formErrors.email && <p className="text-[7px] text-red-500 mt-0.5">{formErrors.email}</p>}</div>
          {!isEdit && <div><label className="block text-[10px] font-medium text-gray-600 mb-0.5">Password</label><input type="password" name="password" value={formData.password} onChange={onInputChange} className={`w-full px-2 py-1 text-[10px] border border-gray-200 rounded ${formErrors.password ? 'border-red-500' : ''}`} placeholder="8+ chars" />{formErrors.password && <p className="text-[7px] text-red-500 mt-0.5">{formErrors.password}</p>}<p className="text-[7px] text-gray-400 mt-0.5">Min 8 characters</p></div>}
          <div><label className="block text-[10px] font-medium text-gray-600 mb-0.5">Role</label><select name="role" value={formData.role} onChange={onInputChange} className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded"><option value="EMPLOYEE">Employee</option><option value="ADMIN">Admin</option><option value="MD">Managing Director</option><option value="SERVICE_TEAM">Service Team</option></select>{formErrors.role && <p className="text-[7px] text-red-500 mt-0.5">{formErrors.role}</p>}</div>
          <div><label className="block text-[10px] font-medium text-gray-600 mb-0.5">Department</label>{dynamicCategories?.length > 0 ? <select name="department" value={formData.department} onChange={onInputChange} className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded"><option value="">Select Department</option>{dynamicCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}</select> : <input type="text" name="department" value={formData.department} onChange={onInputChange} className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded" placeholder="Department" />}</div>
          <div className="flex items-center"><input type="checkbox" name="isActive" checked={formData.isActive} onChange={onInputChange} className="h-3 w-3 text-primary-600 rounded border-gray-300" /><label className="ml-1.5 text-[10px] text-gray-700">Active</label></div>
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-2 py-1 border border-gray-200 rounded text-[9px] text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" disabled={submitting} className="px-2 py-1 bg-primary-600 text-white rounded text-[9px] font-medium hover:bg-primary-700 disabled:opacity-50">{submitting ? <LoadingSpinner size="small" /> : (isEdit ? 'Update' : 'Create')}</button></div>
        </form>
      </div>
    </div>
  )
}