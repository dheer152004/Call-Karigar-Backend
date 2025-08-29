const mongoose = require('mongoose');
// const { v4: uuidv4 } = require('uuid');

const customerProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
   photo: {
    type: String, // URL or file path to the profile photo
    required: true
  },
  address: {
    type: String,
    ref: 'Address',
    required: true
  },
  // language: {
  //   type: String,
  //   default: 'en',
  //   enum: ['en', 'hi'] // Only allow English and Hindi
  // },
  joinedAt: {
    type: Date,
    default: Date.now 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CustomerProfile', customerProfileSchema);
