const mongoose = require('mongoose');

const workerProfileSchema = new mongoose.Schema({

      _id: {
        type: String,      
        ref: 'User',
        required: true,
        // unique: true
    },
    // userId: {
    //     type: String,       
    //     ref: 'User',
    //     required: true,
    // },
    phoneNumber: {
        type: String,
        required: true,
        match: [/^\d{10}$/, 'Phone number must be 10 digits']
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    photo: {
        type: String,
        default: 'default-worker.jpg'
    },
    bio: {
        type: String,
        default: '',
        maxLength: 1000
    },
    // ✅ Removed invalid ref on String — pick one option:
    // Option A (plain strings): skills: [{ type: String }]
    // Option B (refs to ServiceCategory): skills: [{ type: String, ref: 'ServiceCategory' }] only if ServiceCategory._id is also UUID
    skills: [{ type: String }],
    status: {
        type: String,
        enum: ['pending', 'active', 'inactive', 'suspended'],
        default: 'pending'
    },
    isVerified: { type: Boolean, default: false },
    preferences: {
        language: { type: String, enum: ['en', 'hi'], default: 'en' },
        notifications: { type: Boolean, default: true },
        availability: {
            autoAccept: { type: Boolean, default: false },
            maxJobsPerDay: { type: Number, default: 5 }
        }
    },
    stats: {
        totalJobs: { type: Number, default: 0 },
        completedJobs: { type: Number, default: 0 },
        cancelledJobs: { type: Number, default: 0 },
        totalEarnings: { type: Number, default: 0 }
    },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    savedAddresses: [{
        type: String,
        ref: 'Address'
    }],
    joinedAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now }
}, {
    timestamps: true
});

workerProfileSchema.pre('save', function(next) {
    this.lastActive = new Date();
    // next();
});

module.exports = mongoose.model('WorkerProfile', workerProfileSchema);