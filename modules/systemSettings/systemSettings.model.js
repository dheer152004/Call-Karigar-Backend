const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const systemSettingsSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4
    },
    platformFees: {
        serviceFeePercentage: {
            type: Number,
            required: true,
            default: 15,
            min: 0,
            max: 100,
            description: "Platform service fee percentage"
        },
        taxPercentage: {
            type: Number,
            required: true,
            default: 18,
            min: 0,
            max: 100,
            description: "GST percentage"
        }
    },
    payments: {
        supportedMethods: [{
            type: String,
            enum: ['cash', 'online', 'upi'],
            default: ['cash', 'online']
        }],
        minimumBookingAmount: {
            type: Number,
            default: 100,
            min: 0
        },
        cancellationCharges: {
            type: Number,
            default: 50,
            min: 0
        }
    },
    booking: {
        maxFutureBookingDays: {
            type: Number,
            default: 30,
            min: 1,
            description: "Maximum days in advance a booking can be made"
        },
        minAdvanceBookingHours: {
            type: Number,
            default: 2,
            min: 0,
            description: "Minimum hours before service time a booking can be made"
        },
        autoConfirmationTimeout: {
            type: Number,
            default: 15,
            min: 1,
            description: "Minutes after which booking is auto-confirmed if worker doesn't respond"
        },
        autoCancellationTimeout: {
            type: Number,
            default: 30,
            min: 1,
            description: "Minutes after which unconfirmed booking is auto-cancelled"
        }
    },
    worker: {
        maxActiveServices: {
            type: Number,
            default: 10,
            min: 1,
            description: "Maximum number of services a worker can offer"
        },
        maxDailyBookings: {
            type: Number,
            default: 8,
            min: 1,
            description: "Maximum number of bookings a worker can accept per day"
        },
        requiredDocuments: [{
            type: String,
            enum: ['aadhar', 'pan', 'driving_license', 'voter_id', 'passport'],
            default: ['aadhar', 'pan']
        }]
    },
    customer: {
        maxActiveBookings: {
            type: Number,
            default: 5,
            min: 1,
            description: "Maximum number of active bookings a customer can have"
        },
        maxAddresses: {
            type: Number,
            default: 5,
            min: 1,
            description: "Maximum number of addresses a customer can save"
        }
    },
    support: {
        customerSupportEmail: {
            type: String,
            required: true,
            default: 'support@callkarigar.com'
        },
        customerSupportPhone: {
            type: String,
            required: true,
            default: '+91-1234567890'
        },
        supportHours: {
            start: {
                type: String,
                default: '09:00',
                validate: {
                    validator: function(v) {
                        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
                    },
                    message: 'Support hours must be in HH:MM format'
                }
            },
            end: {
                type: String,
                default: '18:00',
                validate: {
                    validator: function(v) {
                        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
                    },
                    message: 'Support hours must be in HH:MM format'
                }
            }
        }
    },
    notifications: {
        enableEmailNotifications: {
            type: Boolean,
            default: true
        },
        enableSMSNotifications: {
            type: Boolean,
            default: true
        },
        enablePushNotifications: {
            type: Boolean,
            default: true
        }
    },
    maintenance: {
        isMaintenanceMode: {
            type: Boolean,
            default: false
        },
        maintenanceMessage: {
            type: String,
            default: 'System is under maintenance. Please try again later.'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: String,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Ensure only one settings document exists
systemSettingsSchema.pre('save', async function(next) {
    if (this.isNew) {
        const count = await this.constructor.countDocuments();
        if (count > 0) {
            throw new Error('Only one settings document can exist');
        }
    }
    next();
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
