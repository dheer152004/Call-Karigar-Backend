const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const serviceCategorySchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true // e.g. "Plumbing", "Electrical", "AC Repair"
  },
  description: {
    type: String
  },
  icon: {
    type: String // optional: for frontend UI
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ServiceCategory', serviceCategorySchema);
