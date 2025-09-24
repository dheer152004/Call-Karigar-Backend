const Booking = require('./booking.model');
const NotificationService = require('../../services/notificationService');

exports.completeBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Find the booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if the worker making request is assigned to this booking
        if (booking.workerId !== req.user._id) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to complete this booking'
            });
        }

        // Check if booking can be completed
        // if (booking.status !== 'in-progress') {
        //     return res.status(400).json({
        //         success: false,
        //         message: `Booking cannot be completed. Current status: ${booking.status}`
        //     });
        // }

        // Update booking status
        booking.status = 'completed';
        booking.updatedAt = new Date();
        await booking.save();

        // Send notification to customer
        await NotificationService.sendNotification({
            userId: booking.customerId,
            type: 'booking_completed',
            title: 'Service Completed',
            message: 'Your service has been marked as completed by the worker. Please rate your experience!',
            metadata: {
                bookingId: booking._id
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Booking marked as completed successfully',
            data: booking
        });

    } catch (error) {
        console.error('Complete booking error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error completing booking',
            error: error.message
        });
    }
};