const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

// @desc    Create payment
// @route   POST /api/payments
// @access  Private (Customer only)
exports.createPayment = async (req, res) => {
    try {
        // Check if user is customer
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                success: false,
                message: 'Only customers can make payments'
            });
        }

        // Check if booking exists
        const booking = await Booking.findById(req.body.bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Create payment record
        const payment = await Payment.create({
            customerId: req.user._id,
            workerId: booking.workerId,
            bookingId: booking._id,
            amount: req.body.amount,
            paymentMethod: req.body.paymentMethod,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating payment',
            error: error.message
        });
    }
};

// @desc    Update payment status
// @route   PUT /api/payments/:id
// @access  Private (Admin only)
exports.updatePaymentStatus = async (req, res) => {
    try {
        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true, runValidators: true }
        );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // If payment is successful, update booking status
        if (req.body.status === 'completed') {
            await Booking.findByIdAndUpdate(
                payment.bookingId,
                { paymentStatus: 'paid' }
            );
        }

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Update payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating payment',
            error: error.message
        });
    }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private (Admin only)
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('customerId', 'name email')
            .populate('workerId', 'name email')
            .populate('bookingId');

        res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payments',
            error: error.message
        });
    }
};

// @desc    Get customer payments
// @route   GET /api/payments/customer
// @access  Private (Customer only)
exports.getCustomerPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ customerId: req.user._id })
            .populate('workerId', 'name email')
            .populate('bookingId');

        res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });
    } catch (error) {
        console.error('Get customer payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer payments',
            error: error.message
        });
    }
};

// @desc    Get worker payments
// @route   GET /api/payments/worker
// @access  Private (Worker only)
exports.getWorkerPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ workerId: req.user._id })
            .populate('customerId', 'name email')
            .populate('bookingId');

        res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });
    } catch (error) {
        console.error('Get worker payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching worker payments',
            error: error.message
        });
    }
};
