const express = require('express');
const router = express.Router();
const {
    createBooking,
    getAllBookings,
    getCustomerBookings,
    getWorkerBookings,
    getBooking,
    updateBooking,
    cancelBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Admin routes
router.get('/all', authorize('admin'), getAllBookings);

// Customer routes
router.post('/', authorize('customer'), createBooking);
router.get('/customer', authorize('customer'), getCustomerBookings);

// Worker routes
router.get('/worker', authorize('worker'), getWorkerBookings);

// Mixed access routes
router.get('/:id', getBooking);
router.put('/:id', updateBooking);
router.delete('/:id', cancelBooking);

module.exports = router;
