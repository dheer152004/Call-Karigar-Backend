const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const supportTicketSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  ticketNumber: {
    type: String,
    unique: true
  },
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    enum: ['customer', 'worker'],
    required: true
  },
  bookingId: {
    type: String,
    ref: 'Booking'
    // required: true
  },
  category: {
    type: String,
    enum: ['payment', 'service', 'worker', 'booking', 'account', 'technical', 'other'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed', 'reopened'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true
  },
  attachments: [{
    filename: String,
    url: String,
    type: String
  }],
  comments: [{
    userId: {
      type: String,
      ref: 'User',
      required: true
    },
    userRole: {
      type: String,
      enum: ['customer', 'worker', 'admin'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    attachments: [{
      filename: String,
      url: String,
      type: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolution: {
    message: String,
    resolvedBy: {
      type: String,
      ref: 'User'
    },
    resolvedAt: Date
  },
  assignedTo: {
    type: String,
    ref: 'User'
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  closedAt: Date,
  reopenedAt: Date,
  reopenReason: String
}, {
  timestamps: true
});

// Generate ticket number before saving
supportTicketSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Get the count of tickets for the current month
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lte: new Date(date.getFullYear(), date.getMonth() + 1, 0)
      }
    });
    
    // Format: TKT-YY-MM-XXXX (e.g., TKT-23-09-0001)
    this.ticketNumber = `TKT-${year}-${month}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);