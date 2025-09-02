const CustomerProfile = require('./customerProfile.model');
const Address = require('../../address/address.model');
const User = require('../user.model');
const { generateUniqueUsername } = require('../../../utils/usernameGenerator');

// Helper function to validate customer profile data
const validateProfileData = (data) => {
    const requiredFields = ['phoneNumber', 'address'];
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

    // Validate address ID is provided
    if (!data.address) {
        return {
            isValid: false,
            error: 'Address ID is required'
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
        console.log('Creating customer profile:', req.body);

        // Role validation
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                success: false,
                message: 'Only customers can create customer profiles'
            });
        }

        // Check for existing profile
        const existingProfile = await CustomerProfile.findById(req.user.id);
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

        // Get user details for username generation
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate unique username
        const username = await generateUniqueUsername('customer', user.name);

        // Create profile with provided data
        const profileData = {
            userId: req.user.id,
            username,
            phoneNumber: user.phone, // Get from user data
            email: user.email, // Get from user data
            address: req.body.address,
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
            savedAddresses: [req.body.address], // Add the primary address to saved addresses
            joinedAt: new Date(),
            lastActive: new Date()
        };

        const profile = await CustomerProfile.create(profileData);

        res.status(201).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Create customer profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating customer profile',
            error: error.message
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

// Note: Address-related operations should be handled by the addressController instead
// The CustomerProfile only stores a reference to an address
