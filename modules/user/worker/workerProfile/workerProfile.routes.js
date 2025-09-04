const express = require('express');
const router = express.Router();
const {
    createWorkerProfile,
    getAllWorkerProfiles,
    getWorkerProfile,
    updateWorkerProfile,
    deleteWorkerProfile,
    updateAvailability
} = require('./workerProfile.controller');
const { protect, authorize } = require('../../../../middleware/auth');

// Profile completion route
router.get('/update-profile', protect, authorize('worker'), (req, res) => {
    res.sendFile('worker/update-profile.html', { root: 'public' });
});

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
