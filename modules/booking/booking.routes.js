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
    cancelBookingAsCustomer,
    cancelBookingAsWorker,
    cancelBookingAsAdmin,
    handleBookingRequest
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
router.post('/:bookingId/handle-request', authorize('worker'), handleBookingRequest);
router.post('/:bookingId/complete', authorize('worker'), require('./booking.complete.controller').completeBooking);

// Booking cancellation (role-specific)
router.patch('/:bookingId/cancel/customer', authorize('customer'), cancelBookingAsCustomer);
router.patch('/:bookingId/cancel/worker', authorize('worker'), cancelBookingAsWorker);
router.patch('/:bookingId/cancel/admin', authorize('admin'), cancelBookingAsAdmin);

// Mixed access routes
router.get('/:id', getBooking);
router.put('/:id', updateBooking);

// Customer-specific status update route
router.patch('/:bookingId/status', authorize('customer'), updateBookingStatus);

module.exports = router;
