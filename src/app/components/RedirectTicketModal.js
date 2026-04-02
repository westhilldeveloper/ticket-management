// components/RedirectTicketModal.js
import { useState, useEffect } from 'react'
import { FiX, FiAlertCircle } from 'react-icons/fi'
import { useToast } from '@/app/context/ToastContext'

export default function RedirectTicketModal({ isOpen, onClose, ticketId, onRedirect }) {
  const [targetDepartment, setTargetDepartment] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [reason, setReason] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (targetDepartment) {
      fetchUsers(targetDepartment)
    } else {
      setUsers([])
      setAssignedToId('')
    }
  }, [targetDepartment])

  const fetchUsers = async (dept) => {
    try {
      const res = await fetch(`/api/admin/users?department=${dept}&role=ADMIN`, { credentials: 'include' })
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!targetDepartment) {
      toast.error('Please select a target department')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/redirect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetDepartment,
          assignedToId: assignedToId || undefined,
          reason
        }),
        credentials: 'include'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success('Ticket redirected successfully')
      onRedirect(data.ticket)
      onClose()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Redirect Ticket</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Department *
              </label>
              <select
                value={targetDepartment}
                onChange={(e) => setTargetDepartment(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Select department</option>
                <option value="IT">IT</option>
                <option value="ADMIN">Admin</option>
                <option value="HR">HR</option>
              </select>
            </div>
            {targetDepartment && users.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To (optional)
                </label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="3"
                className="w-full border rounded px-3 py-2"
                placeholder="Why is this ticket being redirected?"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Redirecting...' : 'Redirect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}