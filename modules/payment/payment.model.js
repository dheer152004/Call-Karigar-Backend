const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        ref: 'Booking',
        required: true
    },
    customerId: {
        type: String,
        ref: 'User',
        required: true
    },
    workerId: {
      type: String,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'netbanking', 'wallet', 'cash'],
        // required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    paymentGateway: {
        type: String,
        enum: ['razorpay', 'stripe', 'paytm', 'cash'],
        // required: true
    },
    gatewayResponse: {
        type: Object
    },
    refundId: {
        type: String,
        unique: true,
        sparse: true
    },
    refundReason: {
        type: String
    },
    metadata: {
        type: Object
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

PaymentSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Payment', PaymentSchema);
