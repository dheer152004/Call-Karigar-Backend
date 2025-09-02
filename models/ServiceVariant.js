const mongoose = require('mongoose');

const serviceVariantSchema = new mongoose.Schema({
    serviceId: {
        type: String,        ref: 'Service',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    price: {
        base: {
            type: Number,
            required: true
        },
        discount: {
            type: Number,
            default: 0
        },
        final: {
            type: Number,
            required: true
        }
    },
    features: [{
        type: String,
        required: true
    }],
    isPopular: {
        type: Boolean,
        default: false
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Calculate final price before saving
serviceVariantSchema.pre('save', function(next) {
    if (this.isModified('price.base') || this.isModified('price.discount')) {
        this.price.final = this.price.base - this.price.discount;
    }
    next();
});

module.exports = mongoose.model('ServiceVariant', serviceVariantSchema);
