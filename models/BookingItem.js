const mongoose = require('mongoose');

const bookingItemSchema = new mongoose.Schema({
    bookingId: {
        type: String,        ref: 'Booking',
        required: true
    },
    service: {
        type: String,        ref: 'Service',
        required: true
    },
    variant: {
        type: String,        ref: 'ServiceVariant',
        required: true
    },
    addOns: [{
        addOn: {
            type: String,            ref: 'ServiceAddOn'
        },
        quantity: {
            type: Number,
            default: 1
        },
        price: Number
    }],
    price: {
        basePrice: {
            type: Number,
            required: true
        },
        addOnTotal: {
            type: Number,
            default: 0
        },
        discount: {
            type: Number,
            default: 0
        },
        finalPrice: {
            type: Number,
            required: true
        }
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    startTime: String,
    endTime: String,
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    workerNotes: String,
    customerNotes: String
}, {
    timestamps: true
});

// Calculate total price before saving
bookingItemSchema.pre('save', function(next) {
    if (this.isModified('price.basePrice') || 
        this.isModified('price.addOnTotal') || 
        this.isModified('price.discount')) {
        this.price.finalPrice = 
            this.price.basePrice + 
            this.price.addOnTotal - 
            this.price.discount;
    }
    next();
});

module.exports = mongoose.model('BookingItem', bookingItemSchema);
