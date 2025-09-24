const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const notificationSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4
    },
    userId: {
        type: String,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: [
            'new_support_ticket', 'ticket_updated', 'ticket_resolved', 'ticket_comment',
            'booking_created', 'booking_confirmed', 'booking_updated', 'booking_cancelled', 'booking_completed',
            'worker_registered', 'customer_registered', 'profile_updated', 'account_verified'
        ],
        required: true
    },
    category: {
        type: String,
        enum: ['account', 'booking', 'worker', 'payment', 'system', 'support'],
        required: true
    },
    recipientRole: {
        type: String,
        enum: ['customer', 'worker', 'admin'],
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'low'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    actionUrl: {
        type: String
    },
    bookingId: {
        type: String,
        ref: 'Booking'
    },
    expiresAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
