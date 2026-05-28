// src/app/context/SocketContext.js
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();
 
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
console.log("socket url=======>",process.env.NEXT_PUBLIC_SOCKET_URL)
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      withCredentials: true
      // transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setConnected(true);

      socketInstance.emit('register', {
        userId: user.id,
        role: user.role,
      });
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketInstance.on('ticket-updated', (data) => {
      console.log('Global ticket-updated received:', data);
      toast.success(`Ticket ${data.ticketNumber} status updated to ${data.status}`);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user?.id, user?.role]);

  const joinTicket = (ticketId) => {
    if (socket) socket.emit('join-ticket', ticketId);
  };

  const leaveTicket = (ticketId) => {
    if (socket) socket.emit('leave-ticket', ticketId);
  };

  return (
    <SocketContext.Provider value={{ socket, connected, joinTicket, leaveTicket }}>
      {children}
    </SocketContext.Provider>
  );
};