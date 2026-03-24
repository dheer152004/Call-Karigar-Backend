const WorkerProfile = require('./workerProfile.model');
const User = require('../../user.model');

// Helper function to validate worker profile data
const validateProfileData = (data) => {
    // For worker profile, basic validation - can be expanded
    if (data.skills && !Array.isArray(data.skills)) {
        return {
            isValid: false,
            error: 'Skills must be an array'
        };
    }

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

// @desc    Create worker profile
// @route   POST /api/worker-profile
// @access  Private (Worker only)
exports.createWorkerProfile = async (req, res) => {
    try {
        // Role validation
        if (req.user.role !== 'worker') {
            return res.status(403).json({
                success: false,
                message: 'Only workers can create worker profiles'
            });
        }

        // Check for existing profile — findOne with userId, NOT findById
        const existingProfile = await WorkerProfile.findOne({ userId: req.user._id });
        if (existingProfile) {
            return res.status(400).json({
                success: false,
                message: 'Worker profile already exists',
                profile: existingProfile
            });
        }

        // Validate profile data (consistent with customer controller)
        const validation = validateProfileData(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: validation.error
            });
        }

        // Get user details
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Destructure known fields from body
        const {
            photo,
            bio,
            skills,
            language,
            notifications,
            currency,
            address,
            ...rest
        } = req.body;

        // Build profile data explicitly — don't blindly spread req.body
        const profileData = {
            userId: req.user._id,
            phoneNumber: user.phone,
            email: user.email,
            photo: photo || '',
            bio: bio || '',
            // Ensure skills is always a valid array
            skills: Array.isArray(skills) && skills.length > 0 ? skills : [],
            preferences: {
                language: language || 'en',
                notifications: notifications !== undefined ? notifications : true,
                currency: currency || 'INR'
            },
            status: 'active',
            stats: {
                totalJobsCompleted: 0,
                totalEarnings: 0,
                cancelledJobs: 0,
                averageRating: 0
            },
            // Guard against undefined address
            savedAddresses: address ? [address] : [],
            joinedAt: new Date(),
            lastActive: new Date()
        };

        const profile = await WorkerProfile.create(profileData);

        res.status(201).json({
            success: true,
            message: 'Worker profile created successfully',
            data: profile
        });

    } catch (error) {
        console.error('Create worker profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating worker profile',
            ...(process.env.NODE_ENV !== 'production' && { error: error.message })
        });
    }
};

// @desc    Get all worker profiles
// @route   GET /api/worker-profile
// @access  Public
exports.getAllWorkerProfiles = async (req, res) => {
    try {
        const profiles = await WorkerProfile.find()
            .populate('_id', 'name email phone') // Populate user details from the _id reference
            .populate('skills', 'name description');

        res.status(200).json({
            success: true,
            count: profiles.length,
            data: profiles
        });
    } catch (error) {
        console.error('Get worker profiles error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching worker profiles',
            error: error.message
        });
    }
};

// @desc    Get single worker profile
// @route   GET /api/worker-profile/:id
// @access  Public
exports.getWorkerProfile = async (req, res) => {
    try {
        const profile = await WorkerProfile.findById(req.params.id)
            .populate('_id', 'name email phone')
            .populate('skills', 'name description');

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Worker profile not found'
            });
        }

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Get worker profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching worker profile',
            error: error.message
        });
    }
};

// @desc    Update worker profile
// @route   PUT /api/worker-profile/:id
// @access  Private (Worker Owner or Admin)
exports.updateWorkerProfile = async (req, res) => {
    try {
        let profile = await WorkerProfile.findById(req.params.id);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Worker profile not found'
            });
        }

        // Check ownership or admin status
        if (profile._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this profile'
            });
        }

        // Only admin can update verification status
        if (req.body.isVerified !== undefined && req.user.role !== 'admin') {
            delete req.body.isVerified;
        }

        // Create update object with validated fields
        const updateData = { ...req.body };
        
        // Validate photo if it's being updated
        if (updateData.photo === '') {
            return res.status(400).json({
                success: false,
                message: 'Profile photo cannot be empty'
            });
        }

        profile = await WorkerProfile.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('_id', 'name email phone')
         .populate('skills', 'name description');

        res.status(200).json({
            success: true,
            data: profile,
            message: 'Worker profile updated successfully'
        });
    } catch (error) {
        console.error('Update worker profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating worker profile',
            error: error.message
        });
    }
};

// @desc    Delete worker profile
// @route   DELETE /api/worker-profile/:id
// @access  Private (Worker Owner or Admin)
exports.deleteWorkerProfile = async (req, res) => {
    try {
        const profile = await WorkerProfile.findById(req.params.id);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Worker profile not found'
            });
        }

        // Check ownership or admin status
        if (profile._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this profile'
            });
        }

        await profile.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Worker profile deleted successfully'
        });
    } catch (error) {
        console.error('Delete worker profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting worker profile',
            error: error.message
        });
    }
};

// @desc    Update worker availability slots
// @route   PUT /api/worker-profile/:id/availability
// @access  Private (Worker Owner only)
exports.updateAvailability = async (req, res) => {
    try {
        const profile = await WorkerProfile.findById(req.params.id);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Worker profile not found'
            });
        }

        // Check ownership
        if (profile._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this profile'
            });
        }

        profile.availabilitySlots = req.body.availabilitySlots;
        await profile.save();

        res.status(200).json({
            success: true,
            data: profile,
            message: 'Availability slots updated successfully'
        });
    } catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating availability slots',
            error: error.message
        });
    }
};
