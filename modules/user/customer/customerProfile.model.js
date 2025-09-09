const mongoose = require('mongoose');

const customerProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'User',
    required: true,
    unique: true  // Each user can have only one customer profile
  },
  username: {
    type: String,
    trim: true,
    sparse: true  // Allow null values initially
  },
  phoneNumber: {
    type: String,
    match: [/^\d{10}$/, 'Phone number must be 10 digits'],
    sparse: true  // Allow null values initially
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    sparse: true  // Allow null values initially
  },
  photo: {
    type: String,
    default: 'default-profile.jpg'
  },
  address: [{  // Changed to array of addresses
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address'
  }],
  bio: {
    type: String,
    trim: true,
    maxLength: 500,
    default: ''
  },
  status: {
    type: String,
    enum: ['new', 'active', 'inactive', 'blocked'],  // Changed enum values
    default: 'new'  // Changed default value
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
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    currency: {
      type: String,
      enum: ['INR', 'USD'],
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
