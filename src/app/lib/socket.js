const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
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
      socket.join(`user:${userId}`);
      console.log(`Socket ${socket.id} joined user:${userId}`);
      if (role === 'ADMIN') {
        socket.join('admins');
        console.log(`Socket ${socket.id} joined admins room`);
      }
    });

    socket.on('ticket-created', (ticketData) => {
      console.log('Ticket created:', ticketData.ticketNumber);
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

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

const emitTicketUpdate = (ticketId, update) => {
  if (!io) return;
  io.to(`ticket-${ticketId}`).emit('ticket-updated', update);
};

module.exports = { initSocket, getIO, emitTicketUpdate };