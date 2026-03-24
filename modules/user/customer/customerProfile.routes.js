const express = require('express');
const router = express.Router();
const {
    createCustomerProfile,
    getAllCustomerProfiles,
    getCustomerProfile,
    updateCustomerProfile,
    deleteCustomerProfile,
    uploadProfilePhoto
} = require('./customerProfile.controller');
const { protect, authorize } = require('../../../middleware/auth');
const uploadMiddleware = require('../../../middleware/fileUpload');

// Profile completion route
router.get('/update-profile', protect, authorize('customer'), (req, res) => {
    res.sendFile('customer/update-profile.html', { root: 'public' });
});

// All routes are protected
router.use(protect);

// Admin routes
router.get('/', authorize('admin'), getAllCustomerProfiles);

// Mixed access routes (owner or admin)
router.get('/:id', getCustomerProfile);
router.put('/:id', updateCustomerProfile);
router.put('/:id/photo', uploadMiddleware, uploadProfilePhoto);
router.delete('/:id', deleteCustomerProfile);

module.exports = router;
