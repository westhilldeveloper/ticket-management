// socket-state.js
const SOCKET_IO_KEY = Symbol.for('ticket-management.socket.io');

// Initialize on the global object if not present
if (!global[SOCKET_IO_KEY]) {
  global[SOCKET_IO_KEY] = null;
}

export function setSocketIO(io) {
  console.log('🔧 setSocketIO called');
  global[SOCKET_IO_KEY] = io;
}

export function getSocketIO() {
  const io = global[SOCKET_IO_KEY];
  if (!io) {
    console.warn('⚠️ getSocketIO: no instance found');
  }
  return io;
}