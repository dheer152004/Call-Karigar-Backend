const mongoose = require('mongoose');

const adminProfileSchema = new mongoose.Schema({
    _id: {
        type: String,
        ref: 'User',
        required: true
    },
    permissions: {
        type: [String],
        enum: [
            'manage_users',
            'manage_services',
            'manage_bookings',
            'manage_payments',
            'manage_reports',
            'manage_settings'
        ],
        default: ['manage_users']
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AdminProfile', adminProfileSchema);