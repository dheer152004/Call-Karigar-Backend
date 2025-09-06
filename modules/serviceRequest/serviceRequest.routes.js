const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validation');
const { body } = require('express-validator');
const serviceRequestController = require('./serviceRequest.controller');

// Validation middleware
const createRequestValidation = [
    body('serviceId')
        .exists().withMessage('Service ID is required')
        .notEmpty().withMessage('Service ID cannot be empty')
        .isUUID().withMessage('Invalid service ID format'),
    
    body('description')
        .exists().withMessage('Description is required')
        .trim()
        .isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
    
    body('preferredDateTime')
        .exists().withMessage('Preferred date and time is required')
        .isISO8601().withMessage('Invalid date format. Please use ISO format (e.g., 2025-09-06T10:00:00Z)')
        .custom((value) => {
            const date = new Date(value);
            const now = new Date();
            if (date < now) {
                throw new Error('Preferred date and time must be in the future');
            }
            return true;
        }),
    
    body('addressId')
        .exists().withMessage('Address ID is required')
        .notEmpty().withMessage('Address ID cannot be empty')
        .isUUID().withMessage('Invalid address ID format')];

const rejectRequestValidation = [
    body('reason').isString().trim().isLength({ min: 5, max: 200 })
];

// Customer routes
router.post('/',
    protect,
    authorize('customer'),
    createRequestValidation,
    validateRequest,
    serviceRequestController.createServiceRequest
);

router.get('/customer',
    protect,
    authorize('customer'),
    serviceRequestController.getCustomerServiceRequests
);

// Worker routes
router.post('/:id/accept',
    protect,
    authorize('worker'),
    serviceRequestController.acceptServiceRequest
);

router.post('/:id/reject',
    protect,
    authorize('worker'),
    rejectRequestValidation,
    validateRequest,
    serviceRequestController.rejectServiceRequest
);

router.get('/worker',
    protect,
    authorize('worker'),
    serviceRequestController.getWorkerServiceRequests
);

module.exports = router;
