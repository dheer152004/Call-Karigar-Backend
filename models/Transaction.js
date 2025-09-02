const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    bookingId: {
        type: String,        ref: 'Booking',
        required: true
    },
    customerId: {
        type: String,
        ref: 'CustomerProfile',
        required: true
    },
    paymentId: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['card', 'upi', 'netbanking', 'wallet', 'cod']
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'success', 'failed', 'refunded'],
        default: 'pending'
    },
    refundStatus: {
        type: String,
        enum: ['none', 'pending', 'partial', 'complete'],
        default: 'none'
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    paymentGatewayResponse: {
        type: Object
    },
    metadata: {
        type: Object
    }
}, {
    timestamps: true
});

// Indexes for faster queries
transactionSchema.index({ bookingId: 1 });
transactionSchema.index({ customerId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ paymentId: 1 }, { unique: true });

module.exports = mongoose.model('Transaction', transactionSchema);
