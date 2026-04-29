// socket-server.js
import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling']
});

io.engine.on('connection_error', (err) => {
  console.error('Socket connection error:', err);
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('register', ({ userId, role }) => {
    socket.join(`user:${userId}`);
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') socket.join('admins');
    if (role === 'MD') socket.join('md');
    console.log(`User ${userId} (${role}) registered, socket ${socket.id}`);
  });

  socket.on('join-ticket', (ticketId) => {
    socket.join(`ticket-${ticketId}`);
    console.log(`Socket ${socket.id} joined ticket-${ticketId}`);
  });

  socket.on('leave-ticket', (ticketId) => {
    socket.leave(`ticket-${ticketId}`);
    console.log(`Socket ${socket.id} left ticket-${ticketId}`);
  });

  // ✅ ADDED: ticket-created
  socket.on('ticket-created', (ticketData) => {
    console.log('ticket-created:', ticketData.id);
    if (ticketData.createdById) {
      io.to(`user:${ticketData.createdById}`).emit('new-ticket', ticketData);
    }
    io.to('admins').emit('new-ticket', ticketData);
  });

  socket.on('admin-action-completed', ({ ticket, action }) => {
    console.log(`Admin action ${action} on ticket ${ticket.id}`);
    if (ticket.createdById) io.to(`user:${ticket.createdById}`).emit('ticket-updated', ticket);
    io.to(`ticket-${ticket.id}`).emit(`ticket-${ticket.id}-updated`, ticket);
  });

  socket.on('md-decision-completed', ({ ticket, action }) => {
    console.log(`MD decision ${action} on ticket ${ticket.id}`);
    if (ticket.createdById) io.to(`user:${ticket.createdById}`).emit('ticket-updated', ticket);
    io.to(`ticket-${ticket.id}`).emit(`ticket-${ticket.id}-updated`, ticket);
    io.to('admins').emit('ticket-updated', ticket);
  });

  socket.on('service-team-action-completed', ({ ticket, action }) => {
    console.log(`Service team action ${action} on ticket ${ticket.id}`);
    if (ticket.createdById) io.to(`user:${ticket.createdById}`).emit('ticket-updated', ticket);
    io.to(`ticket-${ticket.id}`).emit(`ticket-${ticket.id}-updated`, ticket);
    io.to('admins').emit('ticket-updated', ticket);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});