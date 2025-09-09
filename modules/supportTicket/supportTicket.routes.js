const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validation');
const { body } = require('express-validator');
const supportTicketController = require('./supportTicket.controller');

// Validation middleware
const ticketValidation = [
    body('category').isIn(['payment', 'service', 'worker', 'booking', 'account', 'technical', 'other']),
    body('subject').isString().trim().isLength({ min: 5, max: 100 }),
    body('description').isString().trim().isLength({ min: 10, max: 1000 }),
    body('attachments').optional().isArray()
];

const commentValidation = [
    body('message').isString().trim().isLength({ min: 1, max: 1000 }),
    body('attachments').optional().isArray()
];

const statusValidation = [
    body('status')
        .isString()
        .trim()
        .isIn(['open', 'in-progress', 'resolved', 'closed', 'reopened'])
        .withMessage('Status must be one of: open, in-progress, resolved, closed, or reopened'),
    body('resolution')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Resolution must be between 10 and 1000 characters'),
    body('assignedTo')
        .optional()
        .isString()
        .trim()
        .isUUID(4)
        .withMessage('Invalid assignedTo ID format'),
    body('reopenReason')
        .if(body('status').equals('reopened'))
        .isString()
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Reopen reason is required and must be between 10 and 500 characters when status is reopened')
];

// Routes
router.post('/', 
    protect, 
    ticketValidation,
    validateRequest,
    supportTicketController.createTicket
);

router.get('/', 
    protect, 
    supportTicketController.getTickets
);

router.get('/stats', 
    protect, 
    authorize('admin'), 
    supportTicketController.getTicketStats
);

router.get('/:id', 
    protect, 
    supportTicketController.getTicket
);

router.post('/:id/comments', 
    protect,
    commentValidation,
    validateRequest,
    supportTicketController.addComment
);

router.patch('/:id/status', 
    protect,
    authorize('admin'),
    statusValidation,
    validateRequest,
    supportTicketController.updateTicketStatus
);

module.exports = router;
