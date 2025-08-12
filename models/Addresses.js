// models/Address.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const addressSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  label: {
    type: String, // e.g. "Home", "Office"
    required: true
  },
  addressLine: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true,
    default: 'India'
  },
  isPrimary: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Address = mongoose.model('Address', addressSchema);
module.exports = { Address, addressSchema };
