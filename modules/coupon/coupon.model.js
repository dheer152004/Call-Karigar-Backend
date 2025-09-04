const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        uppercase: true
    },
    type: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    maxDiscount: {
        type: Number // Only for percentage type
    },
    minOrderValue: {
        type: Number,
        default: 0
    },
    validFrom: {
        type: Date,
        required: true
    },
    validUntil: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    applicableServices: [{
        type: String,        ref: 'Service'
    }],
    applicableCategories: [{
        type: String,        ref: 'ServiceCategory'
    }],
    maxUsage: {
        type: Number // Total number of times this coupon can be used
    },
    usageCount: {
        type: Number,
        default: 0
    },
    maxUsagePerUser: {
        type: Number,
        default: 1
    },
    isActive: {
        type: Boolean,
        default: true
    },
    termsAndConditions: [String]
}, {
    timestamps: true
});

// Add indexes for faster queries
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ validUntil: 1 });
couponSchema.index({ isActive: 1 });

// Virtual for checking if coupon is expired
couponSchema.virtual('isExpired').get(function() {
    return Date.now() > this.validUntil;
});

// Virtual for checking if coupon is valid for use
couponSchema.virtual('isValid').get(function() {
    return this.isActive && 
           !this.isExpired && 
           (!this.maxUsage || this.usageCount < this.maxUsage);
});

module.exports = mongoose.model('Coupon', couponSchema);
