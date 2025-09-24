const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const workerIndependentServiceSchema = new mongoose.Schema({
    _id: {
    type: String,
    default: uuidv4
    },
    workerId: {
        type: String,
        ref: 'User',
        required: true
    },
    serviceName: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    experience: {
        type: String,
        default: '0 years'
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxLength: 500
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Limit independent services per worker to 5
workerIndependentServiceSchema.statics.checkServiceLimit = async function(workerId) {
    const count = await this.countDocuments({ workerId });
    return count < 5;
};

module.exports = mongoose.model('WorkerIndependentService', workerIndependentServiceSchema);
