const mongoose = require('mongoose');
const workerProfileSchema = new mongoose.Schema({
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
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  photo: {
    type: String,
    default: 'default-worker.jpg'
  },
  bio: {
    type: String,
    default: 'Hello worker this side',
    maxLength: 1000
  },
  skills: [{
    type: String,
    ref: 'ServiceCategory',
    default: []
  }],
  address: {
    type: String,
    ref: 'Address',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'suspended'],
    default: 'pending'
  },
  isVerified: {
    type: Boolean,
    default: false
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
    availability: {
      autoAccept: {
        type: Boolean,
        default: false
      },
      maxJobsPerDay: {
        type: Number,
        default: 5
      }
    }
  },
  stats: {
    totalJobs: {
      type: Number,
      default: 0
    },
    completedJobs: {
      type: Number,
      default: 0
    },
    cancelledJobs: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    }
  },
  ratingAverage: {
    type: Number,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WorkerProfile', workerProfileSchema);
