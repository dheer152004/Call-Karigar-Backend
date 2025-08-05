const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/auth');
const { validateService } = require('../middleware/validation');

// Public routes
router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getServiceById);

// Protected routes (Worker only)
router.post('/', protect, authorize('worker'), validateService, serviceController.createService);
router.put('/:id', protect, authorize('worker'), validateService, serviceController.updateService);
router.delete('/:id', protect, authorize('worker'), serviceController.deleteService);

module.exports = router;
