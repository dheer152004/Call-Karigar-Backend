const express = require('express');
const router = express.Router();
const {
    createPayment,
    updatePaymentStatus,
    getAllPayments,
    getCustomerPayments,
    getWorkerPayments
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Admin routes
router.get('/', authorize('admin'), getAllPayments);
router.put('/:id', authorize('admin'), updatePaymentStatus);

// Customer routes
router.post('/', authorize('customer'), createPayment);
router.get('/customer', authorize('customer'), getCustomerPayments);

// Worker routes
router.get('/worker', authorize('worker'), getWorkerPayments);

module.exports = router;
