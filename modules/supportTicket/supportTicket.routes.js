const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validation');
const { body } = require('express-validator');
const supportTicketController = require('./supportTicket.controller');

// Validation middleware
const ticketValidation = [
    body('category').isIn(['technical', 'billing', 'service', 'complaint', 'other']),
    body('subject').isString().trim().isLength({ min: 5, max: 100 }),
    body('description').isString().trim().isLength({ min: 10, max: 1000 }),
    body('attachments').optional().isArray()
];

const commentValidation = [
    body('message').isString().trim().isLength({ min: 1, max: 1000 }),
    body('attachments').optional().isArray()
];

const statusValidation = [
    body('status').isIn(['open', 'in-progress', 'resolved', 'closed', 'reopened']),
    body('resolution').optional().isString().trim().isLength({ min: 10, max: 1000 }),
    body('assignedTo').optional().isMongoId(),
    body('reopenReason').optional().isString().trim().isLength({ min: 10, max: 500 })
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
