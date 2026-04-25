import { Server } from 'socket.io';
import { setSocketIO, getSocketIO } from './socket-state.js';

let io = null;

export const initSocket = (server) => {
  console.log('🔧 initSocket called, server:', !!server);
  if (getSocketIO()) {
    console.log('Socket.IO already initialized, reusing instance');
    return getSocketIO();
  }

  io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('register', ({ userId, role }) => {
      console.log('register event received:', { userId, role, socketId: socket.id });
      socket.join(`user:${userId}`);
      console.log(`Socket ${socket.id} joined user:${userId}`);
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        socket.join('admins');
        console.log(`Socket ${socket.id} joined admins room`);
      }
       if (role === 'MD') {          
    socket.join('md');
    console.log(`MD ${userId} joined md room`);
      }
    });

    socket.on('ticket-created', (ticketData) => {
      console.log("=======> socket accepted", ticketData);
      if (ticketData.createdById) {
        io.to(`user:${ticketData.createdById}`).emit('new-ticket', ticketData);
      }
      io.to('admins').emit('new-ticket', ticketData);
    });

    socket.on('join-ticket', (ticketId) => {
      socket.join(`ticket-${ticketId}`);
    });

    socket.on('leave-ticket', (ticketId) => {
      socket.leave(`ticket-${ticketId}`);
    });

    // ✅ Moved INSIDE the connection callback
    socket.on('admin-action-completed', ({ ticket, action, userId }) => {
      console.log('admin-action-completed received', { ticketId: ticket.id, action });
      if (ticket.createdById) {
        io.to(`user:${ticket.createdById}`).emit('ticket-updated', ticket);
      }
      io.to(`ticket-${ticket.id}`).emit(`ticket-${ticket.id}-updated`, ticket);
    });


    socket.on('md-decision-completed', ({ ticket, action, userId }) => {
  console.log(`MD decision: ${action} for ticket ${ticket.id}`);
  
  // Broadcast to the ticket creator (employee)
  console.log("ticket user=====>", ticket.createdById)
  if (ticket.createdById) {
    io.to(`user:${ticket.createdById}`).emit('ticket-updated', ticket);
  }
  
  // Also emit to the ticket room for detail page
  io.to(`ticket-${ticket.id}`).emit(`ticket-${ticket.id}-updated`, ticket);
  
  // Optionally, broadcast to all admins (if they need to see the decision immediately)
  io.to('admins').emit('ticket-updated', ticket);
});

socket.on('service-team-action-completed', ({ ticket, action, userId }) => {
  console.log(`Service team action: ${action} for ticket ${ticket.id}`);
  
  // Broadcast to the ticket creator (employee)
  if (ticket.createdById) {
    io.to(`user:${ticket.createdById}`).emit('ticket-updated', ticket);
  }
  
  // Broadcast to the ticket room for detail page
  io.to(`ticket-${ticket.id}`).emit(`ticket-${ticket.id}-updated`, ticket);
  
  // Also broadcast to all admins (optional but useful)
  io.to('admins').emit('ticket-updated', ticket);
});


    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  setSocketIO(io);
  return io;
};

export const getIO = () => {
  const io = getSocketIO();
  if (!io) {
    console.warn('Socket.IO not initialized yet – emissions will be skipped');
    return null;
  }
  return io;
};

export const emitTicketUpdate = (ticketId, update, userId = null) => {
  const io = getIO();
  if (!io) return;
  io.to(`ticket-${ticketId}`).emit(`ticket-${ticketId}-updated`, update);
  if (userId) {
    io.to(`user:${userId}`).emit('ticket-updated', update);
  }
};