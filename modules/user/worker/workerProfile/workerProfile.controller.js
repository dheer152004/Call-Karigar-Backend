const WorkerProfile = require('./workerProfile.model');
const User = require('../../user.model');
const { generateUniqueUsername } = require('../../../../utils/usernameGenerator');

// @desc    Create worker profile
// @route   POST /api/worker-profile
// @access  Private (Worker only)
exports.createWorkerProfile = async (req, res) => {
    try {
        // Check if user is a worker
        if (req.user.role !== 'worker') {
            return res.status(403).json({
                success: false,
                message: 'Only workers can create worker profiles'
            });
        }

        // Check if profile already exists
        const existingProfile = await WorkerProfile.findById(req.user._id);
        if (existingProfile) {
            return res.status(400).json({
                success: false,
                message: 'Worker profile already exists'
            });
        }

        // Get user details for username generation
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate unique username
        const username = await generateUniqueUsername('worker', user.name);

        // Validate required fields
        const { photo, bio, skills } = req.body;
        if (!photo) {
            return res.status(400).json({
                success: false,
                message: 'Profile photo is required'
            });
        }

        const profile = await WorkerProfile.create({
            _id: req.user._id, // Use the user's UUID as the profile ID
            username,
            photo,
            bio,
            skills,
            ...req.body
        });

        res.status(201).json({
            success: true,
            data: profile,
            message: 'Worker profile created successfully'
        });
    } catch (error) {
        console.error('Create worker profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating worker profile',
            error: error.message
        });
    }
};

// @desc    Get all worker profiles
// @route   GET /api/worker-profile
// @access  Public
exports.getAllWorkerProfiles = async (req, res) => {
    try {
        const profiles = await WorkerProfile.find()
            .populate('userId', 'name email phone')
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
        if (profile.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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
        ).populate('userId', 'name email phone')
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
        if (profile.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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
        if (profile.userId.toString() !== req.user._id.toString()) {
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
