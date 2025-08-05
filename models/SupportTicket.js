const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const supportTicketSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  bookingId: {
    type: String,
    ref: 'Booking'
  },
  category: {
    type: String,
    enum: ['payment', 'service', 'worker', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true
  },
  resolution: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);