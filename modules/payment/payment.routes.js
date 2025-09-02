const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const {
    createPayment,
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

// Admin routes
router.get('/all', authorize('admin'), getAllPayments);

// Customer routes
router.get('/customer', authorize('customer'), getCustomerPayments);

// Worker routes
router.get('/worker', authorize('worker'), getWorkerPayments);

// Mixed access routes
router.post('/', createPayment);
router.get('/:id', getPaymentById);
router.get('/:id/status', getPaymentStatus);
router.put('/:id', updatePayment);
router.post('/:id/refund', initiateRefund);

module.exports = router;
