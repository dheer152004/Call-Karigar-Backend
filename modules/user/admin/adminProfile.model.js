const mongoose = require('mongoose');

// Simplest possible admin profile schema without any validations
const adminProfileSchema = new mongoose.Schema({
    userId: {  // Changed from adminId to userId to match other schemas
        type: String,
        required: true
    }
}, {
    timestamps: true,
    strict: false,
    validateBeforeSave: false
});

// Create the model
const AdminProfile = mongoose.model('AdminProfile', adminProfileSchema);

// Drop and recreate indexes after model is defined
AdminProfile.collection.dropIndexes().catch(() => {});

// Create a new index without unique constraint
AdminProfile.collection.createIndex({ userId: 1 }).catch(() => {});

module.exports = AdminProfile;
