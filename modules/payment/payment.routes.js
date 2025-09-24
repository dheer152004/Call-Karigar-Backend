const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const {
    createPayment,
    verifyPayment,
    getAllPayments,
    getCustomerPayments,
    getWorkerPayments,
    getPaymentById,
    updatePayment,
    initiateRefund,
    getPaymentStatus
} = require('./payment.controller');

// All routes require authentication
router.use(protect);

// Mixed access routes
router.post('/', createPayment);
router.post('/verify', verifyPayment);  // Payment verification endpoint

// Role-based routes
router.get('/all', authorize('admin'), getAllPayments);
router.get('/customer', authorize('customer'), getCustomerPayments);
router.get('/worker', authorize('worker'), getWorkerPayments);

// Dynamic parameter routes - MUST come after specific routes
router.get('/:id', getPaymentById);
router.get('/:id/status', getPaymentStatus);
router.put('/:id', updatePayment);
router.post('/:id/refund', initiateRefund);

module.exports = router;
