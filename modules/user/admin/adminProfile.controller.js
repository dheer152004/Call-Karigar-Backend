const AdminProfile = require('./adminProfile.model');
const User = require('../user.model');
const bcrypt = require('bcryptjs');

exports.createAdmin = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // Create user account first
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            phone,
            password: hashedPassword,
            role: 'admin'
        });

        // Create admin profile directly in the database without validation
        const adminProfile = await AdminProfile.collection.insertOne({
            adminId: user._id,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Don't send password in response
        const userData = user.toObject();
        delete userData.password;

        res.status(201).json({
            success: true,
            message: 'Admin account created successfully',
            data: {
                user: userData,
                adminProfile: {
                    adminId: user._id,
                    _id: adminProfile.insertedId
                }
            }
        });

    } catch (error) {
        console.error('Create admin error:', error);

        // If user was created but admin profile failed, clean up user
        if (error.message.includes('AdminProfile validation failed') && req.user?._id) {
            await User.findByIdAndDelete(req.user._id);
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create admin profile',
            error: error.message
        });
    }
};

exports.getAdminProfile = async (req, res) => {
    try {
        const adminId = req.params.id || req.user._id;

        // If not super admin and trying to access other's profile
        if (req.user.role !== 'admin' && adminId !== req.user._id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this profile'
            });
        }

        const adminProfile = await AdminProfile.findOne({ adminId })
            .populate('adminId', 'name email phone');

        if (!adminProfile) {
            return res.status(404).json({
                success: false,
                message: 'Admin profile not found'
            });
        }

        res.status(200).json({
            success: true,
            data: adminProfile
        });

    } catch (error) {
        console.error('Get admin profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching admin profile',
            error: error.message
        });
    }
};

exports.updateAdminProfile = async (req, res) => {
    try {
        const adminId = req.params.id || req.user._id;
        const { permissions, isProfileComplete } = req.body;

        // If not super admin and trying to update other's profile
        if (req.user.role !== 'admin' && adminId !== req.user._id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this profile'
            });
        }

        const adminProfile = await AdminProfile.findOne({ adminId });

        if (!adminProfile) {
            return res.status(404).json({
                success: false,
                message: 'Admin profile not found'
            });
        }

        // Update allowed fields
        if (permissions) adminProfile.permissions = permissions;
        if (typeof isProfileComplete !== 'undefined') adminProfile.isProfileComplete = isProfileComplete;

        await adminProfile.save();

        res.status(200).json({
            success: true,
            message: 'Admin profile updated successfully',
            data: adminProfile
        });

    } catch (error) {
        console.error('Update admin profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating admin profile',
            error: error.message
        });
    }
};

exports.deleteAdminProfile = async (req, res) => {
    try {
        const adminId = req.params.id;

        // Only super admin can delete other admin profiles
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete admin profiles'
            });
        }

        const adminProfile = await AdminProfile.findOne({ adminId });

        if (!adminProfile) {
            return res.status(404).json({
                success: false,
                message: 'Admin profile not found'
            });
        }

        // Delete both admin profile and user account
        await Promise.all([
            AdminProfile.findByIdAndDelete(adminProfile._id),
            User.findByIdAndDelete(adminId)
        ]);

        res.status(200).json({
            success: true,
            message: 'Admin profile deleted successfully'
        });

    } catch (error) {
        console.error('Delete admin profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting admin profile',
            error: error.message
        });
    }
};
