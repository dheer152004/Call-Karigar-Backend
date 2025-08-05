const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bookingSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
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
  serviceId: {
    type: String,
    ref: 'Service',
    required: true
  },
  address_id:{
    type: String,
    ref: 'Address',
    required: true
  },
  bookingDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String, // e.g. '09:00-11:00'
    required: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'cash', 'wallet'],
    default: 'online'
  },
  price: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
