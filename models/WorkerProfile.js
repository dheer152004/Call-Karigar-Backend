const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const workerProfileSchema = new mongoose.Schema({
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
  photo: {
    type: String, // URL or file path to the profile photo
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  skills: {
    type: [{
    type: String,
    ref: 'ServiceCategory'
    }], // e.g. ['plumbing', 'electrical']
    required: true
  },
  experienceYears: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  availabilitySlots: [
    {
      date: Date,       // specific date
      timeSlots: [String] // e.g. ['09:00-11:00', '14:00-16:00']
    }
  ],
  certifications: {
    type: [String], // URLs or file references
    default: []
  },
  ratingAverage: {
    type: Number,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WorkerProfile', workerProfileSchema);
