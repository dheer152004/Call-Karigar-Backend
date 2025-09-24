const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const adminProfileSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4
    },
    userId: {
        type: String,
        required: true,
        unique: true,
        ref: 'User'
    },
    permissions: [{
        type: String,
        enum: ['manage_users', 'manage_services', 'manage_bookings', 'manage_payments', 'manage_reports', 'manage_settings'],
        default: ['manage_users']
    }],
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AdminProfile', adminProfileSchema);
