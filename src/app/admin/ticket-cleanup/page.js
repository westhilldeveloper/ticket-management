'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/components/layouts/DashboardLayout'
import { useToast } from '@/app/context/ToastContext'
import { FiTrash2, FiAlertCircle, FiSearch, FiLoader, FiEye } from 'react-icons/fi'
import Link from 'next/link'

export default function TicketCleanupPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [actionType, setActionType] = useState(null) // 'single' or 'all'
  const [isDeleting, setIsDeleting] = useState(false)
  const toast = useToast()

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/tickets?limit=1000', { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setTickets(data.tickets || [])
      } else {
        toast.error(data.message || 'Failed to fetch tickets')
      }
    } catch (error) {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSingle = (ticket) => {
    setSelectedTicket(ticket)
    setActionType('single')
    setShowPasswordModal(true)
  }

  const handleDeleteAll = () => {
    if (tickets.length === 0) {
      toast.error('No tickets to delete')
      return
    }
    setActionType('all')
    setShowPasswordModal(true)
  }

  const confirmDelete = async () => {
    if (!password) {
      toast.error('Password is required')
      return
    }
    setIsDeleting(true)
    try {
      if (actionType === 'single' && selectedTicket) {
        const res = await fetch(`/api/admin/tickets/${selectedTicket.id}`, {
          method: 'DELETE',
          credentials: 'include'
        })
        const data = await res.json()
        if (res.ok) {
          toast.success('Ticket deleted successfully')
          setTickets(prev => prev.filter(t => t.id !== selectedTicket.id))
          setShowPasswordModal(false)
          setPassword('')
          setSelectedTicket(null)
        } else {
          toast.error(data.message || 'Delete failed')
        }
      } else if (actionType === 'all') {
        const res = await fetch('/api/admin/tickets/all', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
          credentials: 'include'
        })
        const data = await res.json()
        if (res.ok) {
          toast.success(data.message)
          setTickets([])
          setShowPasswordModal(false)
          setPassword('')
        } else {
          toast.error(data.message || 'Delete failed')
        }
      }
    } catch (error) {
      toast.error('Network error')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredTickets = tickets.filter(ticket =>
    ticket.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <FiLoader className="animate-spin h-6 w-6 text-gray-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-5 max-w-[1400px] mx-auto text-sm">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Ticket Cleanup</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Delete individual tickets or all tickets (requires password confirmation)
            </p>
          </div>
          <button
            onClick={handleDeleteAll}
            disabled={tickets.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            Delete All Tickets ({tickets.length})
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by ticket number or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-gray-300 focus:ring-gray-400 focus:border-gray-400"
            />
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Ticket Number</th>
                  <th className="px-3 py-2 text-left font-medium">Title</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Created</th>
                  <th className="px-3 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 font-medium text-gray-800">{ticket.ticketNumber}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-md truncate">{ticket.title}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
                        {ticket.status?.replace(/_/g, ' ') || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap space-x-2">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        target="_blank"
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <FiEye className="inline w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteSingle(ticket)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <FiTrash2 className="inline w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-3 py-6 text-center text-gray-400 text-xs">
                      No tickets found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Password Confirmation Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-5 w-full max-w-md border border-gray-200 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <FiAlertCircle className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-semibold text-gray-800">
                  {actionType === 'all' ? 'Delete All Tickets' : 'Delete Ticket'}
                </h2>
              </div>
              <p className="text-xs text-gray-600 mb-4">
                {actionType === 'all'
                  ? `You are about to delete ALL ${tickets.length} tickets. This action cannot be undone.`
                  : `You are about to delete ticket ${selectedTicket?.ticketNumber} – "${selectedTicket?.title}". This action cannot be undone.`}
              </p>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Confirm your password
                </label>
                <input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmDelete()}
                  className="w-full rounded-md border-gray-300 text-xs py-1.5 px-2 focus:ring-gray-400 focus:border-gray-400"
                  placeholder="Enter your password"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPassword('')
                    setSelectedTicket(null)
                  }}
                  className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? <FiLoader className="animate-spin w-3.5 h-3.5" /> : <FiTrash2 className="w-3.5 h-3.5" />}
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}