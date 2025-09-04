const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const reviewSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  bookingId: {
    type: String,
    ref: 'Booking',
    required: true
  },
  customerId: {
    type: String,
    ref: 'User',
    required: true
  },
  workerId: {
    type: String,
    ref: 'User',
    required: true
  },
  workerServiceId: {
    type: String,
    ref: 'WorkerService',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  serviceQuality: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    description: "Rating for the quality of service provided"
  },
  punctuality: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    description: "Rating for worker's punctuality"
  },
  professionalism: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    description: "Rating for worker's professional behavior"
  },
  comment: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);
