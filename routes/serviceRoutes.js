const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService,
    getServicesByCategory,
    searchServices,
    getActiveServices,
    toggleServiceStatus
} = require('../controllers/serviceController');

// Public routes
router.get('/search', searchServices);
router.get('/active', getActiveServices);
router.get('/category/:categoryId', getServicesByCategory);
router.get('/', getAllServices);
router.get('/:id', getServiceById);

// Protected routes
router.post('/', protect, authorize('admin'), createService);
router.put('/:id', protect, authorize('admin'), updateService);
router.patch('/:id/status', protect, authorize('admin'), toggleServiceStatus);
router.delete('/:id', protect, authorize('admin'), deleteService);

module.exports = router;
