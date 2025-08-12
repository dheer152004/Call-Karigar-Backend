const Booking = require('../models/Booking');
const WorkerProfile = require('../models/WorkerProfile');
const CustomerProfile = require('../models/CustomerProfile');

// @desc    Create a booking
// @route   POST /api/bookings
// @access  Private (Customer only)
exports.createBooking = async (req, res) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                success: false,
                message: 'Only customers can create bookings'
            });
        }

        const booking = await Booking.create({
            customerId: req.user._id,
            ...req.body
        });

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating booking',
            error: error.message
        });
    }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private (Admin only)
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('customerId', 'name email')
            .populate('workerId', 'name email')
            .populate({
                path: 'workerServiceId',
                populate: {
                    path: 'serviceId',
                    select: 'title description baseprice'
                }
            })
            .populate('address_id');

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message
        });
    }
};

// @desc    Get customer's bookings
// @route   GET /api/bookings/customer
// @access  Private (Customer only)
exports.getCustomerBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ customerId: req.user._id })
            .populate('workerId', 'name email')
            .populate({
                path: 'workerServiceId',
                populate: {
                    path: 'serviceId',
                    select: 'title description baseprice'
                }
            })
            .populate('address_id');

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('Get customer bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer bookings',
            error: error.message
        });
    }
};

// @desc    Get worker's bookings
// @route   GET /api/bookings/worker
// @access  Private (Worker only)
exports.getWorkerBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ workerId: req.user._id })
            .populate('customerId', 'name email')
            .populate({
                path: 'workerServiceId',
                populate: {
                    path: 'serviceId',
                    select: 'title description baseprice'
                }
            })
            .populate('address_id');

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('Get worker bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching worker bookings',
            error: error.message
        });
    }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private (Admin, Customer who booked, or Worker assigned)
exports.getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('customerId', 'name email')
            .populate('workerId', 'name email')
            .populate({
                path: 'workerServiceId',
                populate: {
                    path: 'serviceId',
                    select: 'title description baseprice'
                }
            })
            .populate('address_id');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check access rights
        if (
            req.user.role !== 'admin' &&
            booking.customerId.toString() !== req.user._id.toString() &&
            booking.workerId.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this booking'
            });
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking',
            error: error.message
        });
    }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id
// @access  Private (Admin, Customer who booked, or Worker assigned)
exports.updateBooking = async (req, res) => {
    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check access rights
        if (
            req.user.role !== 'admin' &&
            booking.customerId.toString() !== req.user._id.toString() &&
            booking.workerId.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this booking'
            });
        }

        // Only allow status updates
        booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true, runValidators: true }
        )
            .populate('customerId', 'name email')
            .populate('workerId', 'name email')
            .populate({
                path: 'workerServiceId',
                populate: {
                    path: 'serviceId',
                    select: 'title description baseprice'
                }
            })
            .populate('address_id');

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating booking',
            error: error.message
        });
    }
};

// @desc    Cancel booking
// @route   DELETE /api/bookings/:id
// @access  Private (Admin or Customer who booked)
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Only admin or customer who booked can cancel
        if (req.user.role !== 'admin' && booking.customerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this booking'
            });
        }

        // Update status to cancelled instead of deleting
        booking.status = 'cancelled';
        await booking.save();

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling booking',
            error: error.message
        });
    }
};
