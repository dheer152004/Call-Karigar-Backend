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
  service_categoryId: {
    type: String,
    ref: 'ServiceCategory',
    required: true
  },
  baseprice:{
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
