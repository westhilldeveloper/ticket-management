'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    console.log('Connecting to socket at:', socketUrl);

    const socketInstance = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'], // explicit fallback
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setConnected(true);
      socketInstance.emit('register', { userId: user.id, role: user.role });
      toast.success('Real-time connected', { duration: 2000 });
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      socketInstance.emit('register', { userId: user.id, role: user.role });
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setConnected(false);
      toast.error('Real-time connection failed', { duration: 3000 });
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
    });

    socketInstance.on('ticket-updated', (data) => {
      console.log('Global ticket-updated received:', data);
      toast.success(`Ticket ${data.ticketNumber} updated to ${data.status}`);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user?.id, user?.role]);

  const joinTicket = (ticketId) => socket?.emit('join-ticket', ticketId);
  const leaveTicket = (ticketId) => socket?.emit('leave-ticket', ticketId);

  return (
    <SocketContext.Provider value={{ socket, connected, joinTicket, leaveTicket }}>
      {children}
    </SocketContext.Provider>
  );
};