const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const BookingSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4
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
    workerServiceId: {
        type: String,
        ref: 'WorkerService',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    bookingDate: {
        type: Date,
        required: true
    },
    scheduledTimeSlot: {
        start: { type: String, required: true },
        end: { type: String, required: true }
    },
    address_id: {
        type: String,
        ref: 'Address',
        required: true
    },
    discount: {
        couponCode: {
            type: String,
            default: null
        },
        percentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        discountAmount: {
            type: Number,
            min: 0,
            default: 0
        }
    },
    subTotal: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    notes: {
        type: String
    },
    cancelledBy: {
        type: String,
        enum: ['customer', 'worker', 'admin', 'none'],
        default: 'none'
    },
    cancellationReason: {
        type: String
    },
    paymentMethod: {
        type: String,
        enum: ['online', 'cash'],
        // required: true
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

BookingSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Booking', BookingSchema);
