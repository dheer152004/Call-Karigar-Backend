const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
    workerId: {
        type: String,
        ref: 'WorkerProfile',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: props => `${props.value} is not a valid time format (HH:mm)!`
        }
    },
    endTime: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: props => `${props.value} is not a valid time format (HH:mm)!`
        }
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    isBooked: {
        type: Boolean,
        default: false
    },
    bookingId: {
        type: String,        ref: 'Booking'
    }
}, {
    timestamps: true
});

// Index for faster queries
timeSlotSchema.index({ workerId: 1, date: 1 });
timeSlotSchema.index({ date: 1, isAvailable: 1 });

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
