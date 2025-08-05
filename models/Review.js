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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
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
