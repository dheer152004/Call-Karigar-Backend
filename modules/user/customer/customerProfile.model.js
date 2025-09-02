const mongoose = require('mongoose');

const customerProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    match: [/^\d{10}$/, 'Phone number must be 10 digits']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  photo: {
    type: String,
    default: 'default-profile.jpg'
  },
  address: {
    type: String,
    ref: 'Address',
    default: null
  },
  bio: {
    type: String,
    trim: true,
    maxLength: 500,
    default: ''
  },
  preferences: {
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  stats: {
    totalBookings: {
      type: Number,
      default: 0
    },
    completedBookings: {
      type: Number,
      default: 0
    },
    cancelledBookings: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    }
  },
  savedAddresses: [{
    type: String,
    ref: 'Address'
  }],
  savedWorkers: [{
    type: String,
    ref: 'WorkerProfile'
  }],
  recentServices: [{
    service: {
      type: String,
      ref: 'Service'
    },
    lastBooked: {
      type: Date
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastActive timestamp on every document update
customerProfileSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

module.exports = mongoose.model('CustomerProfile', customerProfileSchema);
