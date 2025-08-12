const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const workerAvailabilitySchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  workerId: {
    type: String,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlots: [{
    start: String, // e.g., '09:00'
    end: String,   // e.g., '11:00'
    isAvailable: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('WorkerAvailability', workerAvailabilitySchema);