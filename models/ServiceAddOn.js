const mongoose = require('mongoose');

const serviceAddOnSchema = new mongoose.Schema({
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
    price: {
        type: Number,
        required: true
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    maxQuantity: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ServiceAddOn', serviceAddOnSchema);
