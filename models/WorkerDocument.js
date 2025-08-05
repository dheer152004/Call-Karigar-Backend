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
  documents: [{
    type: {
      type: String,
      enum: [
        'aadhar', 
        'pan', 
        'driving_license', 
        'police_verification', 
        'certification', 
        'profile_photo'
      ],
      required: true
    },
    url: {
      type: String, // Cloud storage URL (AWS S3, Firebase, etc.)
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: {
      type: String // Required if status is 'rejected'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verifiedAt: {
      type: Date // Timestamp of admin approval/rejection
    }
  }],
  isKYCComplete: {
    type: Boolean,
    default: false
  },
  lastVerifiedBy: {
    type: String,
    ref: 'User' // Admin who verified the documents
  }
}, {
  timestamps: true
});

// Index for faster querying by status
workerDocumentSchema.index({ 'documents.status': 1 });

module.exports = mongoose.model('WorkerDocument', workerDocumentSchema);