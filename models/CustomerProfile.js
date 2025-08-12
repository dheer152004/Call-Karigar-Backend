const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const customerProfileSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  userId: {
    type: String,
    ref: 'User',
    required: true,
    unique: true
  },
  address: {
    type: String,
    ref: 'Address',
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'hi'] // Only allow English and Hindi
  },
  joinedAt: {
    type: Date,
    default: Date.now 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CustomerProfile', customerProfileSchema);
