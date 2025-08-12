const express = require('express');
const router = express.Router();
const {
    createWorkerProfile,
    getAllWorkerProfiles,
    getWorkerProfile,
    updateWorkerProfile,
    deleteWorkerProfile,
    updateAvailability
} = require('../controllers/workerProfileController');
const { protect, authorize } = require('../middleware/auth');

// Add worker profile validation middleware
router.use(protect); // All routes require authentication

// Public routes
router.get('/', getAllWorkerProfiles);
router.get('/:id', getWorkerProfile);

// Protected routes
router.post('/', authorize('worker'), createWorkerProfile);
router.put('/:id', authorize('worker', 'admin'), updateWorkerProfile);
router.delete('/:id', authorize('worker', 'admin'), deleteWorkerProfile);
router.put('/:id/availability', authorize('worker'), updateAvailability);

module.exports = router;
