const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../../../middleware/auth');

const uploadDir = '/tmp/admin';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'admin-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File is too large. Maximum size is 5MB.'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'File upload error: ' + err.message
        });
    } else if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
};

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

// Check profile status middleware
const checkProfileStatus = async (req, res, next) => {
    try {
        const AdminProfile = require('./admin.model');
        const profile = await AdminProfile.findOne({ userId: req.user.id });
        
        if (profile && req.path === '/update-profile') {
            return res.redirect('/admin/dashboard');
        }
        
        if (!profile && !req.path.match(/^\/update-profile|^\/create-profile/)) {
            return res.status(303).json({
                success: false,
                message: 'Please complete your profile first',
                data: {
                    redirectTo: '/admin/update-profile'
                }
            });
        }
        next();
    } catch (error) {
        next(error);
    }
};

// Apply profile check middleware to all routes except profile completion
router.use((req, res, next) => {
    if (!req.path.match(/^\/complete-profile|^\/create-profile/)) {
        return checkProfileStatus(req, res, next);
    }
    next();
});

// Profile completion route
router.get('/update-profile', async (req, res) => {
    const AdminProfile = require('./admin.model');
    const profile = await AdminProfile.findOne({ userId: req.user.id });
    
    if (profile) {
        return res.redirect('/admin/dashboard');
    }
    
    res.sendFile('admin/complete-profile.html', { root: 'public' });
});

// Create profile endpoint
router.post('/create-profile', upload.single('photo'), handleMulterError, async (req, res) => {
    try {
        const AdminProfile = require('./admin.model');
        
        // Check if profile already exists
        let profile = await AdminProfile.findOne({ userId: req.user.id });
        
        if (profile) {
            return res.status(400).json({
                success: false,
                message: 'Profile already exists',
                data: {
                    profile,
                    redirectTo: '/admin/dashboard'
                }
            });
        }

        // Create new profile
        profile = new AdminProfile({
            userId: req.user.id,
            designation: req.body.designation || 'System Administrator',
            photo: req.file ? `/uploads/admin/${req.file.filename}` : 'default-admin.jpg',
            permissions: [
                'manage_users',
                'manage_services',
                'manage_bookings',
                'manage_payments',
                'manage_reports',
                'manage_settings'
            ]
        });

        await profile.save();

        res.status(201).json({
            success: true,
            message: 'Profile created successfully',
            data: {
                profile,
                redirectTo: '/admin/dashboard'
            }
        });

    } catch (error) {
        console.error('Profile creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating profile',
            ...(process.env.NODE_ENV === 'development' && { error: error.message })
        });
    }
});

// Handle profile photo upload
router.post('/upload-photo', upload.single('photo'), handleMulterError, (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                filename: req.file.filename,
                path: `/uploads/admin/${req.file.filename}`
            }
        });
    } catch (error) {
        console.error('Profile photo upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading file'
        });
    }
});

module.exports = router;
