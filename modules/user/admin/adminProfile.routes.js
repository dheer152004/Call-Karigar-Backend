const express = require('express');
const router = express.Router();
const {
    createAdmin,
    getAdminProfile,
    updateAdminProfile,
    deleteAdminProfile
} = require('./adminProfile.controller');
const { protect, authorize } = require('../../../../middleware/auth');

// Protect all routes
router.use(protect);

// Admin registration (only for super admins)
router.post('/', authorize('admin'), createAdmin);

// Get admin profile
router.get('/:id?', authorize('admin'), getAdminProfile);

// Update admin profile
router.put('/:id?', authorize('admin'), updateAdminProfile);

// Delete admin profile (only for super admins)
router.delete('/:id', authorize('admin'), deleteAdminProfile);

module.exports = router;
