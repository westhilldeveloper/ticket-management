import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useSocket } from '../context/SocketContext'

export const useTickets = (initialFilters = {}) => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(initialFilters)
  const { socket } = useSocket()

  useEffect(() => {
    fetchTickets()
  }, [filters])

  useEffect(() => {
    if (socket) {
      socket.on('ticket-updated', handleTicketUpdate)
      return () => {
        socket.off('ticket-updated', handleTicketUpdate)
      }
    }
  }, [socket])

  const handleTicketUpdate = (updatedTicket) => {
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === updatedTicket.id ? updatedTicket : ticket
      )
    )
  }

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/api/tickets', { params: filters })
      setTickets(data.tickets)
    } catch (error) {
      toast.error('Failed to fetch tickets')
    } finally {
      setLoading(false)
    }
  }

  const createTicket = async (ticketData) => {
    try {
      const { data } = await axios.post('/api/tickets', ticketData)
      toast.success('Ticket created successfully')
      return { success: true, ticket: data.ticket }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create ticket')
      return { success: false, error: error.response?.data?.message }
    }
  }

  const updateTicket = async (ticketId, updates) => {
    try {
      const { data } = await axios.put(`/api/tickets/${ticketId}`, updates)
      toast.success('Ticket updated successfully')
      return { success: true, ticket: data.ticket }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update ticket')
      return { success: false, error: error.response?.data?.message }
    }
  }

  const addReview = async (ticketId, review, reviewType) => {
    try {
      const { data } = await axios.post(`/api/tickets/${ticketId}/reviews`, {
        content: review,
        reviewType,
      })
      toast.success('Review added successfully')
      return { success: true, review: data.review }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add review')
      return { success: false, error: error.response?.data?.message }
    }
  }

  const requestMDApproval = async (ticketId, review) => {
    return await updateTicket(ticketId, {
      status: 'PENDING_MD_APPROVAL',
      mdApproval: 'PENDING',
      review,
    })
  }

  const approveTicket = async (ticketId, review) => {
    return await updateTicket(ticketId, {
      status: 'APPROVED_BY_MD',
      mdApproval: 'APPROVED',
      review,
    })
  }

  const rejectTicket = async (ticketId, review) => {
    return await updateTicket(ticketId, {
      status: 'REJECTED_BY_MD',
      mdApproval: 'REJECTED',
      review,
    })
  }

  const closeTicket = async (ticketId, review) => {
    return await updateTicket(ticketId, {
      status: 'CLOSED',
      closedAt: new Date(),
      review,
    })
  }

  return {
    tickets,
    loading,
    filters,
    setFilters,
    createTicket,
    updateTicket,
    addReview,
    requestMDApproval,
    approveTicket,
    rejectTicket,
    closeTicket,
  }
}