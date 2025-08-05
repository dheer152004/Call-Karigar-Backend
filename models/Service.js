const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const serviceSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  title: {
    type: String,
    required: true,
    trim: true // e.g. "Fan Installation", "Geyser Repair"
  },
  description: {
    type: String,
    default: ''
  },
  categoryId: {
    type: String,
    ref: 'ServiceCategory',
    required: true
  },
  createdBy: {
    type: String,
    ref: 'User', // Worker who created the service
    required: true
  },
  basePrice: {
    type: Number
  },
  estimatedDuration: {
    type: String, // e.g. '30 mins', '1 hour'
    default: ''
  },
  availableSlots: [
    {
      date: Date,
      timeSlots: [String] // e.g. ['10:00-11:00']
    }
  ],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
