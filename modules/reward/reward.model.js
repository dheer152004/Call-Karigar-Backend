const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const rewardSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  points: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reward', rewardSchema);