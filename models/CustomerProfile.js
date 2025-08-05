const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { addressSchema } = require('./Addresses');

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
  address: [
    addressSchema

  ],
  phoneNumber: {
    type: String,
    required: true
  },
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CustomerProfile', customerProfileSchema);
