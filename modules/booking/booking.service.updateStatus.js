const Booking = require('./booking.model');
const Payment = require('../payment/payment.model');
const bookingService = require('./booking.service');

const updateBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;

        // Validate status
        const allowedStatuses = ['completed', 'cancelled'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
            });
        }

        // Get booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user is the customer who made the booking
        if (booking.customerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this booking'
            });
        }

        // Check if booking can be updated
        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update a cancelled booking'
            });
        }

        if (booking.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update a completed booking'
            });
        }

        // Additional validations based on status
        if (status === 'cancelled') {
            if (booking.status === 'in-progress') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot cancel a booking that is in progress'
                });
            }
            booking.cancelledBy = 'customer';
        }

        // Update status
        booking.status = status;
        booking.updatedAt = new Date();
        await booking.save();

        // Create notifications for both customer and worker
        await Promise.all([
            bookingService.createBookingNotification(
                booking,
                status === 'cancelled' ? 'booking_cancelled' : 'booking_completed',
                req.user._id,
                'customer'
            ),
            bookingService.createBookingNotification(
                booking,
                status === 'cancelled' ? 'booking_cancelled' : 'booking_completed',
                booking.workerId,
                'worker'
            )
        ]);

        // If cancelled and payment was online, initiate refund process
        if (status === 'cancelled' && booking.paymentMethod === 'online') {
            // Find the payment
            const payment = await Payment.findOne({ bookingId: booking._id });
            if (payment && payment.status === 'succeeded') {
                // Update payment status to refund_pending
                payment.status = 'refund_pending';
                await payment.save();
            }
        }

        const updatedBooking = await Booking.findById(bookingId)
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
            data: {
                booking: updatedBooking,
                message: `Booking ${status} successfully`
            }
        });

    } catch (error) {
        console.error('Update booking status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating booking status',
            error: error.message
        });
    }
};

module.exports = { updateBookingStatus };
