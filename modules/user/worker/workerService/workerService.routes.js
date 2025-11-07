const express = require('express');
const router = express.Router();
const {
    addWorkerService,
    getWorkerServices,
    getServiceWorkers,
    getAllWorkerServices,
    updateWorkerService,
    toggleServiceStatus,
    deleteWorkerService
    ,searchWorkerServicesFlexible,
    searchWorkerServicesFlexiblebyGet
} = require('./workerService.controller');
const { protect, authorize } = require('../../../../middleware/auth');

// Public routes
router.get('/', getAllWorkerServices);
router.get('/worker/:workerId', getWorkerServices);
router.get('/service/:serviceId', getServiceWorkers);
// Flexible public search for all requirements
router.get('/search-all', searchWorkerServicesFlexible);
router.post('/search-all', searchWorkerServicesFlexible);
router.get('/search-all-by-get', searchWorkerServicesFlexiblebyGet);

// Protected routes (Worker only)
router.use(protect);
router.post('/', authorize('worker'), addWorkerService);
router.put('/:id', authorize('worker'), updateWorkerService);
router.patch('/:id/toggle', authorize('worker'), toggleServiceStatus);
router.delete('/:id', authorize('worker'), deleteWorkerService);

module.exports = router;
