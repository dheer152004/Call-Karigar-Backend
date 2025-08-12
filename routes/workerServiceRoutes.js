const express = require('express');
const router = express.Router();
const {
    addWorkerService,
    getWorkerServices,
    getServiceWorkers,
    updateWorkerService,
    toggleServiceStatus,
    deleteWorkerService
} = require('../controllers/workerServiceController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/worker/:workerId', getWorkerServices);
router.get('/service/:serviceId', getServiceWorkers);

// Protected routes (Worker only)
router.use(protect);
router.post('/', authorize('worker'), addWorkerService);
router.put('/:id', authorize('worker'), updateWorkerService);
router.patch('/:id/toggle', authorize('worker'), toggleServiceStatus);
router.delete('/:id', authorize('worker'), deleteWorkerService);

module.exports = router;
