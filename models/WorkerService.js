const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const workerServiceSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  workerId: {
    type: String,
    ref: 'User', // or 'WorkerProfile' if you're referencing WorkerProfile directly
    required: true
  },
  serviceId: {
    type: String,
    ref: 'Service',
    required: true
  },
  customPrice: {
    type: Number, // You can use Decimal128 if you're handling precise money
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WorkerService', workerServiceSchema);
