const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    userId: {
        type: String,
        ref: 'User',
        required: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    otp: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{6}$/.test(v); // Must be exactly 6 digits
            },
            message: props => `${props.value} is not a valid 6-digit OTP!`
        }
    },
    purpose: {
        type: String,
        enum: ['registration', 'login', 'reset_password', 'booking'],
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // OTP document will be automatically deleted after 5 minutes (300 seconds)
    },
    attempts: {
        type: Number,
        default: 0,
        max: 3 // Maximum verification attempts
    }
}, {
    timestamps: true
});

// Index for faster queries
otpSchema.index({ phone: 1, createdAt: 1 });

// Method to check if max attempts reached
otpSchema.methods.isMaxAttemptsReached = function() {
    return this.attempts >= 3;
};

module.exports = mongoose.model('OTP', otpSchema);
