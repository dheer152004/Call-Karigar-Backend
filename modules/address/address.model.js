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
    required: true,
    default: "Home"
  },
  addressLine: {
    type: String,
    required: true,
    default: "Update your address"
  },
  city: {
    type: String,
    required: true,
    default: "Update your city"
  },
  state: {
    type: String,
    required: true,
    default: "Update your state"
  },
  postalCode: {
    type: String,
    required: true,
    default: "000000"
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

// Pre-save middleware to handle primary address
addressSchema.pre('save', async function(next) {
  try {
    if (this.isPrimary) {
      // If this address is being set as primary, unset any other primary address for this user
      await this.constructor.updateMany(
        { 
          userId: this.userId, 
          _id: { $ne: this._id }, 
          isPrimary: true 
        },
        { 
          isPrimary: false 
        }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});

// module.exports = mongoose.model('Address', addressSchema);

// const Address = mongoose.model('Address', addressSchema);
// module.exports = Address;
module.exports = mongoose.model('Address', addressSchema);
