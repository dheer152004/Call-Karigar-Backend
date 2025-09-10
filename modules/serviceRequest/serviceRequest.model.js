const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const serviceRequestSchema = new mongoose.Schema({
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
    serviceId: {
        type: String,
        ref: 'Service',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'expired', 'completed'],
        default: 'pending'
    },
    description: {
        type: String,
        required: true
    },
    preferredDateTime: {
        type: Date,
        required: true
    },
    location: {
        addressId: {
            type: String,
            ref: 'Address',
            required: true
        }
    },
    rejectedBy: [{
        workerId: {
            type: String,
            ref: 'User'
        },
        reason: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    acceptedBy: {
        workerId: {
            type: String,
            ref: 'User'
        },
        timestamp: {
            type: Date
        }
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 30 * 60000) // 30 minutes from now
    }
}, {
    timestamps: true
});

// Index for faster queries
serviceRequestSchema.index({ status: 1, serviceCategoryId: 1, expiresAt: 1 });
serviceRequestSchema.index({ 'rejectedBy.workerId': 1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
