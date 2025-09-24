const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../../../middleware/auth');
const workerIndependentServiceController = require('./workerIndependentService.controller');

// Add a new independent service
router.post('/worker/independent-services', 
    protect,
    authorize('worker'), 
    workerIndependentServiceController.addIndependentService
);

// Get all independent services for the worker as public
router.get('/worker/independent-services', 
    workerIndependentServiceController.getWorkerIndependentServices
);

// Get all independent services of a specific worker
router.get('/worker/:workerId/independent-services',
    workerIndependentServiceController.getWorkerSpecificIndependentServices
);

// Update an independent service
router.put('/worker/independent-services/:serviceId', 
    protect,
    authorize('worker'), 
    workerIndependentServiceController.updateIndependentService
);

// Delete/Deactivate an independent service
router.delete('/worker/independent-services/:serviceId', 
    protect,
    authorize('worker'), 
    workerIndependentServiceController.deleteIndependentService
);

module.exports = router;