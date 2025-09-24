const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const workerServiceSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
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
  customPrice: {
    type: Number,
    required: true,
    min: [0, 'Price must be greater than 0']
  },
  experience: {
    type: String,
    default: '0 years'
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WorkerService', workerServiceSchema);
