'use client';
import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const socketInstance = io(process.env.NEXTAUTH_URL || 'http://localhost:3000', {
        withCredentials: true,
      })

      socketInstance.on('connect', () => {
        console.log('Socket connected')
        setConnected(true)

         // Register the user with their ID and role
      socketInstance.emit('register', {
        userId: user.id,
        role: user.role, // make sure user.role exists (e.g., 'EMPLOYEE' or 'ADMIN')
      })
      
      })

      

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected')
        setConnected(false)
      })

      socketInstance.on('ticket-updated', (data) => {
        toast.success(`Ticket ${data.ticketNumber} status updated to ${data.status}`)
      })

      setSocket(socketInstance)

      return () => {
        socketInstance.disconnect()
      }
    }
  }, [user])

  const joinTicket = (ticketId) => {
    if (socket) {
      socket.emit('join-ticket', ticketId)
    }
  }

  const leaveTicket = (ticketId) => {
    if (socket) {
      socket.emit('leave-ticket', ticketId)
    }
  }

  const value = {
    socket,
    connected,
    joinTicket,
    leaveTicket,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}