const AdminProfile = require('./admin.model');
const { v4: uuidv4 } = require('uuid');

// Create admin profile
exports.createAdminProfile = async (userId, name) => {
    try {
        
        const adminProfile = new AdminProfile({
            userId,
            permissions: ['manage_users', 'manage_services', 'manage_bookings', 'manage_payments', 'manage_reports', 'manage_settings']
        });

        return await adminProfile.save();
    } catch (error) {
        console.error('Error creating admin profile:', error);
        throw error;
    }
};

// Get admin profile
exports.getAdminProfile = async (userId) => {
    try {
        return await AdminProfile.findOne({ userId });
    } catch (error) {
        console.error('Error getting admin profile:', error);
        throw error;
    }
};
