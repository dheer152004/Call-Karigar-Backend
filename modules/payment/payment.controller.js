const Payment = require('./payment.model');
const paymentService = require('./payment.service');
const Booking = require('../booking/booking.model');

exports.createPayment = async (req, res) => {
    try {
        const { bookingId, amount, paymentMethod, paymentGateway } = req.body;

        // Find the booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Create payment record
        const payment = await Payment.create({
            bookingId,
            customerId: booking.customerId,
            workerId: booking.workerId,
            amount,
            paymentMethod,
            paymentGateway,
            status: 'pending'
        });

        // Create order in payment gateway if not cash payment
        if (paymentGateway !== 'cash') {
            const order = await paymentService.createPaymentOrder(amount);
            payment.metadata = { orderId: order.id };
            await payment.save();
        }

        // Create notification for customer
        await paymentService.createPaymentNotification(
            payment,
            paymentService.NOTIFICATION_TYPES.PAYMENT_INITIATED,
            payment.customerId,
            'customer'
        );

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

exports.getCustomerPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ customerId: req.user._id })
            .populate('workerId', 'name email')
            .populate('bookingId')
            .sort({ createdAt: -1 });

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

exports.getWorkerPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ workerId: req.user._id })
            .populate('customerId', 'name email')
            .populate('bookingId')
            .sort({ createdAt: -1 });

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

exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('customerId', 'name email')
            .populate('workerId', 'name email')
            .populate('bookingId');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Check authorization
        if (req.user.role !== 'admin' && 
            req.user._id.toString() !== payment.customerId._id.toString() && 
            req.user._id.toString() !== payment.workerId._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this payment'
            });
        }

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment',
            error: error.message
        });
    }
};

exports.updatePayment = async (req, res) => {
    try {
        const { status, transactionId, gatewayResponse } = req.body;
        let payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Update payment status
        payment.status = status;
        payment.transactionId = transactionId;
        payment.gatewayResponse = gatewayResponse;
        await payment.save();

        // Create notifications
        const notificationType = status === 'completed' 
            ? paymentService.NOTIFICATION_TYPES.PAYMENT_COMPLETED
            : paymentService.NOTIFICATION_TYPES.PAYMENT_FAILED;

        await Promise.all([
            paymentService.createPaymentNotification(
                payment,
                notificationType,
                payment.customerId,
                'customer'
            ),
            paymentService.createPaymentNotification(
                payment,
                notificationType,
                payment.workerId,
                'worker'
            )
        ]);

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

exports.initiateRefund = async (req, res) => {
    try {
        const { reason } = req.body;
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Only completed payments can be refunded'
            });
        }

        if (payment.refundId) {
            return res.status(400).json({
                success: false,
                message: 'Refund already initiated for this payment'
            });
        }

        // Initiate refund in payment gateway
        if (payment.paymentGateway !== 'cash') {
            const refund = await paymentService.initiateRefund(
                payment.transactionId,
                payment.amount
            );
            payment.refundId = refund.id;
        }

        payment.status = 'refunded';
        payment.refundReason = reason;
        await payment.save();

        // Create notifications
        await Promise.all([
            paymentService.createPaymentNotification(
                payment,
                paymentService.NOTIFICATION_TYPES.REFUND_COMPLETED,
                payment.customerId,
                'customer'
            ),
            paymentService.createPaymentNotification(
                payment,
                paymentService.NOTIFICATION_TYPES.REFUND_COMPLETED,
                payment.workerId,
                'worker'
            )
        ]);

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Initiate refund error:', error);
        res.status(500).json({
            success: false,
            message: 'Error initiating refund',
            error: error.message
        });
    }
};

exports.getPaymentStatus = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .select('status transactionId refundId createdAt updatedAt');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment status',
            error: error.message
        });
    }
};

module.exports = exports;
