const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const workerDocumentSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  workerId: {
    type: String,
    ref: 'User',
    required: true,
    unique: true // Ensures one document set per worker
  },
  aadhar: {
    url: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      enum: ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'],
      required: true
    }
  },
  pan: {
    url: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      enum: ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'],
      required: true
    }
  },
  policeVerification: {
    url: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      enum: ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'],
      required: true
    }
  },
  certifications: {
    type: [{
      url: {
        type: String,
        required: true
      },
      fileType: {
        type: String,
        enum: ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'],
        required: true
      },
      title: {
        type: String,
        required: true
      },
      verified: {
        type: Boolean,
        default: false
      }
    }],
    default: []
  },
  isKYCComplete: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  lastVerifiedBy: {
    type: String,
    ref: 'User' // Admin who verified the documents
  }
}, {
  timestamps: true
});

// Index for faster querying by status


module.exports = mongoose.model('WorkerDocument', workerDocumentSchema);