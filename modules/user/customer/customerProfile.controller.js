const CustomerProfile = require('./customerProfile.model');
const Address = require('../../address/address.model');
const User = require('../user.model');

// Helper function to validate customer profile data
const validateProfileData = (data) => {
    const requiredFields = ['phoneNumber'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
        return {
            isValid: false,
            error: `Missing required fields: ${missingFields.join(', ')}`
        };
    }

    // Validate phone number format
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(data.phoneNumber)) {
        return {
            isValid: false,
            error: 'Invalid phone number format. Must be 10 digits.'
        };
    }

    // Validate preferences if provided
    if (data.preferences) {
        if (data.preferences.language && !['en', 'hi'].includes(data.preferences.language)) {
            return {
                isValid: false,
                error: 'Invalid language preference. Must be either "en" or "hi"'
            };
        }
        if (typeof data.preferences.notifications !== 'undefined' && 
            typeof data.preferences.notifications !== 'boolean') {
            return {
                isValid: false,
                error: 'Notifications preference must be a boolean'
            };
        }
    }

    return { isValid: true };
};

// @desc    Create customer profile
// @route   POST /api/customer-profile
// @access  Private (Customer only)
exports.createCustomerProfile = async (req, res) => {
    try {
        // Role validation
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                success: false,
                message: 'Only customers can create customer profiles'
            });
        }

        // Check for existing profile — use findOne with userId, NOT findById
        // because the profile's _id is different from the user's _id
        const existingProfile = await CustomerProfile.findOne({ userId: req.user.id });
        if (existingProfile) {
            return res.status(400).json({
                success: false,
                message: 'Customer profile already exists',
                profile: existingProfile
            });
        }

        // Validate profile data
        const validation = validateProfileData(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: validation.error
            });
        }

        // Get user details
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Build profile data
        const profileData = {
            userId: req.user.id,
            phoneNumber: user.phone,
            email: user.email,
            preferences: {
                language: req.body.language || 'en',
                notifications: req.body.notifications !== undefined ? req.body.notifications : true,
                currency: req.body.currency || 'INR'
            },
            bio: req.body.bio || '',
            status: 'active',
            stats: {
                totalBookings: 0,
                completedBookings: 0,
                cancelledBookings: 0,
                totalSpent: 0
            },
            // Guard against undefined address being pushed into the array
            savedAddresses: req.body.address ? [req.body.address] : [],
            joinedAt: new Date(),
            lastActive: new Date()
        };

        const profile = await CustomerProfile.create(profileData);

        res.status(201).json({
            success: true,
            data: profile
        });

    } catch (error) {
        // Avoid logging full error.message in production as it may leak sensitive info
        console.error('Create customer profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating customer profile',
            // Only expose error detail in non-production environments
            ...(process.env.NODE_ENV !== 'production' && { error: error.message })
        });
    }
};

// @desc    Get all customer profiles
// @route   GET /api/customer-profile
// @access  Private (Admin only)
exports.getAllCustomerProfiles = async (req, res) => {
    try {
        const profiles = await CustomerProfile.find()
            .populate({
                path: 'userId',
                select: 'name email phone role createdAt updatedAt'
            })
            .populate('address');

        res.status(200).json({
            success: true,
            count: profiles.length,
            data: profiles
        });
    } catch (error) {
        console.error('Get customer profiles error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer profiles',
            error: error.message
        });
    }
};

// @desc    Get customer profile by ID
// @route   GET /api/customer-profile/:id
// @access  Private (Owner or Admin)
exports.getCustomerProfile = async (req, res) => {
    try {
        const profile = await CustomerProfile.findById(req.params.id)
            .populate('userId', 'name email phone')
            .populate('address');

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        // Check if user is owner or admin
        if (profile.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this profile'
            });
        }

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Get customer profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer profile',
            error: error.message
        });
    }
};

// @desc    Update customer profile
// @route   PUT /api/customer-profile/:id
// @access  Private (Owner or Admin)
exports.updateCustomerProfile = async (req, res) => {
    try {
        let profile = await CustomerProfile.findById(req.params.id);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        // Check ownership or admin status
        if (profile.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this profile'
            });
        }

        profile = await CustomerProfile.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('userId', 'name email phone');

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Update customer profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating customer profile',
            error: error.message
        });
    }
};

// @desc    Delete customer profile
// @route   DELETE /api/customer-profile/:id
// @access  Private (Owner or Admin)
exports.deleteCustomerProfile = async (req, res) => {
    try {
        const profile = await CustomerProfile.findById(req.params.id);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        // Check ownership or admin status
        if (profile.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this profile'
            });
        }

        await profile.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Customer profile deleted successfully'
        });
    } catch (error) {
        console.error('Delete customer profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting customer profile',
            error: error.message
        });
    }
};
// @desc    Upload customer profile photo
// @route   PUT /api/customer-profile/:id/photo
// @access  Private (Owner or Admin)
exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const profile = await CustomerProfile.findById(req.params.id);
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        // Check ownership or admin status
        if (profile.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this profile'
            });
        }

        const { uploadToCloudinary, deleteFromCloudinary } = require('../../../utils/cloudinary');

        // Delete old photo if exists
        if (profile.photo && profile.photo !== 'default-profile.jpg') {
            try {
                const publicId = profile.photo.split('/').pop().split('.')[0];
                await deleteFromCloudinary(publicId);
            } catch (err) {
                console.error('Error deleting old photo:', err);
            }
        }

        // Upload new photo to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, 'customer-profiles');

        profile.photo = result.secure_url;
        await profile.save();

        res.status(200).json({
            success: true,
            message: 'Profile photo uploaded successfully',
            data: profile
        });
    } catch (error) {
        console.error('Upload profile photo error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading profile photo',
            error: error.message
        });
    }
};
// Note: Address-related operations should be handled by the addressController instead
// The CustomerProfile only stores a reference to an address
