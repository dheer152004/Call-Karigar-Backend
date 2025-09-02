const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> socket.id
    }

    initialize(server) {
        this.io = socketIO(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "*",
                methods: ["GET", "POST"]
            }
        });

        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication error'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.id;
                socket.userRole = decoded.role;
                next();
            } catch (error) {
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket) => {
            console.log('User connected:', socket.userId);
            this.connectedUsers.set(socket.userId, socket.id);

            // Join role-based room
            if (socket.userRole) {
                socket.join(`role:${socket.userRole}`);
            }

            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.userId);
                this.connectedUsers.delete(socket.userId);
            });

            // Handle custom events here
            socket.on('join:booking', (bookingId) => {
                socket.join(`booking:${bookingId}`);
            });

            socket.on('leave:booking', (bookingId) => {
                socket.leave(`booking:${bookingId}`);
            });
        });
    }

    // Send notification to specific user
    sendToUser(userId, notification) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit('notification', notification);
        }
    }

    // Send notification to all users with specific role
    sendToRole(role, notification) {
        this.io.to(`role:${role}`).emit('notification', notification);
    }

    // Send notification to all users in a booking room
    sendToBooking(bookingId, notification) {
        this.io.to(`booking:${bookingId}`).emit('booking:notification', notification);
    }

    // Send security alert
    sendSecurityAlert(userId, data) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit('security:alert', {
                type: data.type,
                message: data.message,
                timestamp: new Date(),
                metadata: data.metadata
            });
        }
    }

    // Send payment notification
    sendPaymentNotification(userId, data) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit('payment:notification', {
                type: data.type,
                amount: data.amount,
                message: data.message,
                timestamp: new Date(),
                metadata: data.metadata
            });
        }
    }

    // Send document status update
    sendDocumentStatus(userId, data) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit('document:status', {
                type: data.type,
                documentId: data.documentId,
                status: data.status,
                message: data.message,
                timestamp: new Date()
            });
        }
    }

    // Send wallet update
    sendWalletUpdate(userId, data) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit('wallet:update', {
                type: data.type,
                amount: data.amount,
                balance: data.balance,
                message: data.message,
                timestamp: new Date(),
                transactionId: data.transactionId
            });
        }
    }

    // Get user's connection status
    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }

    // Get connected users count
    getOnlineUsersCount() {
        return this.connectedUsers.size;
    }
}

module.exports = new SocketService();
