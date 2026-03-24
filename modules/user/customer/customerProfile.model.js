const mongoose = require('mongoose');

const customerProfileSchema = new mongoose.Schema({
    userId: {
        type: String,      
        ref: 'User',
        required: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        match: [/^\d{10}$/, 'Phone number must be 10 digits']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    photo: {
        type: String,
        default: 'default-profile.jpg'
    },
    bio: {
        type: String,
        trim: true,
        maxLength: 500,
        default: ''
    },
    status: {
        type: String,
        enum: ['new', 'active', 'inactive', 'blocked'],
        default: 'new',
        required: true
    },
    preferences: {
        language: { type: String, enum: ['en', 'hi'], default: 'en' },
        notifications: { type: Boolean, default: true },
        theme: { type: String, enum: ['light', 'dark'], default: 'light' },
        currency: { type: String, enum: ['INR', 'USD'], default: 'INR' }
    },
    stats: {
        totalBookings: { type: Number, default: 0 },
        completedBookings: { type: Number, default: 0 },
        cancelledBookings: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 }
    },
    savedAddresses: [{
        type: String,
        ref: 'Address'    
    }],
    savedWorkers: [{
        type: String,
        ref: 'WorkerProfile'
    }],
    recentServices: [{
        service: { type: String, ref: 'Service' },
        lastBooked: { type: Date }
    }],
    joinedAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now }
}, {
    timestamps: true
});

customerProfileSchema.pre('save', function(next) {
    this.lastActive = new Date();
    next();
});

module.exports = mongoose.model('CustomerProfile', customerProfileSchema);