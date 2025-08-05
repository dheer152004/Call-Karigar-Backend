const express = require('express');
const router = express.Router();
const {
    createCustomerProfile,
    getAllCustomerProfiles,
    getCustomerProfile,
    updateCustomerProfile,
    deleteCustomerProfile
} = require('../controllers/customerProfileController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Admin routes
router.get('/', authorize('admin'), getAllCustomerProfiles);

// Customer routes
router.post('/', authorize('customer'), createCustomerProfile);

// Mixed access routes (owner or admin)
router.get('/:id', getCustomerProfile);
router.put('/:id', updateCustomerProfile);
router.delete('/:id', deleteCustomerProfile);

module.exports = router;
