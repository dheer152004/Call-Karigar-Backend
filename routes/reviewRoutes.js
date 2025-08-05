const express = require('express');
const router = express.Router();
const {
    createReview,
    getWorkerReviews,
    getCustomerReviews,
    updateReview,
    deleteReview
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/worker/:workerId', getWorkerReviews);

// Protected routes
router.use(protect);

// Customer routes
router.post('/', authorize('customer'), createReview);

// Mixed access routes
router.get('/customer/:customerId', getCustomerReviews);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

module.exports = router;
