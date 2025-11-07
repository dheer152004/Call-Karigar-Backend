const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Location', locationSchema);
