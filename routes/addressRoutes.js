const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { protect, authorize } = require('../middleware/auth');

// Debug middleware
router.use((req, res, next) => {
    console.log('Address Route Hit:', {
        method: req.method,
        path: req.path,
        body: req.body,
        headers: {
            ...req.headers,
            authorization: req.headers.authorization ? 'Bearer [hidden]' : undefined
        }
    });
    next();
});

// All routes require authentication
router.use(protect);

// User routes (any authenticated user can access their own addresses)
router.post('/', addressController.createAddress);                         // Create address
router.get('/my-addresses', addressController.getUserAddresses);          // Get user's addresses
router.get('/my-addresses/:id', addressController.getUserAddress);        // Get user's specific address
router.put('/my-addresses/:id', addressController.updateAddress);         // Full update
router.patch('/my-addresses/:id', addressController.updateAddress);       // Partial update
router.delete('/my-addresses/:id', addressController.deleteAddress);      // Delete address

// Admin routes (admin only)
router.get('/', authorize('admin'), addressController.getAllAddresses);             // Get all addresses
router.get('/:id', authorize('admin'), addressController.getAddress);              // Get any address
router.put('/:id', authorize('admin'), addressController.updateAnyAddress);        // Full update any address
router.patch('/:id', authorize('admin'), addressController.updateAnyAddress);      // Partial update any address
router.delete('/:id', authorize('admin'), addressController.deleteAnyAddress);     // Delete any address

module.exports = router;