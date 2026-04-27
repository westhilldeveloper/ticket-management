// socket-server.js
import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: 'https://tickets.coinplus.co.in',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('register', ({ userId, role }) => {
    socket.join(`user:${userId}`);
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') socket.join('admins');
    if (role === 'MD') socket.join('md');
    console.log(`User ${userId} (${role}) registered, socket ${socket.id}`);
  });

  // Add all other event handlers exactly as in your current socket.js:
  socket.on('join-ticket', (ticketId) => socket.join(`ticket-${ticketId}`));
  socket.on('leave-ticket', (ticketId) => socket.leave(`ticket-${ticketId}`));
  socket.on('admin-action-completed', ({ ticket, action }) => {
    if (ticket.createdById) io.to(`user:${ticket.createdById}`).emit('ticket-updated', ticket);
    io.to(`ticket-${ticket.id}`).emit(`ticket-${ticket.id}-updated`, ticket);
  });
  socket.on('md-decision-completed', ({ ticket }) => {
    if (ticket.createdById) io.to(`user:${ticket.createdById}`).emit('ticket-updated', ticket);
    io.to(`ticket-${ticket.id}`).emit(`ticket-${ticket.id}-updated`, ticket);
    io.to('admins').emit('ticket-updated', ticket);
  });
  socket.on('service-team-action-completed', ({ ticket }) => {
    if (ticket.createdById) io.to(`user:${ticket.createdById}`).emit('ticket-updated', ticket);
    io.to(`ticket-${ticket.id}`).emit(`ticket-${ticket.id}-updated`, ticket);
    io.to('admins').emit('ticket-updated', ticket);
  });

  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});