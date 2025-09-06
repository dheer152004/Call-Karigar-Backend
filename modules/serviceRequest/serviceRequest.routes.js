const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validation');
const { body } = require('express-validator');
const serviceRequestController = require('./serviceRequest.controller');

// Validation middleware
const createRequestValidation = [
    body('serviceId').isString().notEmpty(),
    body('description').isString().trim().isLength({ min: 10, max: 500 }),
    body('preferredDateTime').isISO8601().toDate(),
    body('addressId').isString().notEmpty()
];

const rejectRequestValidation = [
    body('reason').isString().trim().isLength({ min: 5, max: 200 })
];

// Customer routes
router.post('/', protect, authorize('customer'), createRequestValidation, validateRequest, serviceRequestController.createServiceRequest);

router.get('/customer', protect, authorize('customer'), serviceRequestController.getCustomerServiceRequests);

router.post('/:id/approve', protect, authorize('customer'), serviceRequestController.approveWorker);

router.post('/:id/reject-worker',
    protect,
    authorize('customer'),
    body('reason').isString().trim().isLength({ min: 5, max: 200 }),
    validateRequest,
    serviceRequestController.rejectWorker
);

// Worker routes
router.post('/:id/accept', protect, authorize('worker'), serviceRequestController.acceptServiceRequest);

router.post('/:id/reject', protect, authorize('worker'), rejectRequestValidation, validateRequest, serviceRequestController.rejectServiceRequest);

router.get('/worker', protect, authorize('worker'), serviceRequestController.getWorkerServiceRequests);

module.exports = router;
