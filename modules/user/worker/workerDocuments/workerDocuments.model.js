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
    type: String,
    required: true
  },
  pan: {
    type: String,
    required: true
  },
  drivingLicense: {
    type: String,
    required: true
  },
  certifications: {
    type: String,
    required: true
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