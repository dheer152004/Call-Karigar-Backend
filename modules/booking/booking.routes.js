const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const {
    createBooking,
    getAllBookings,
    getCustomerBookings,
    getWorkerBookings,
    getBooking,
    updateBooking,
    cancelBooking
} = require('./booking.controller');
const { updateBookingStatus } = require('./booking.service.updateStatus');

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

// Customer-specific status update route
router.patch('/:bookingId/status', authorize('customer'), updateBookingStatus);

module.exports = router;
