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
  isRead: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['booking', 'payment', 'support', 'promotion'],
    required: true
  },
  metadata: {
    type: Object // e.g., { bookingId: '123' }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);