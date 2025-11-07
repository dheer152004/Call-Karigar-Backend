// Socket.io logic for real-time location sharing
module.exports = (io) => {
  io.on('connection', (socket) => {
    // Listen for location updates from clients
    socket.on('locationUpdate', (data) => {
      // Broadcast to all other clients
      socket.broadcast.emit('locationUpdate', data);
    });
  });
};
