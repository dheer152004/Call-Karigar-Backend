const Payment = require('./payment.model');
const Booking = require('../booking/booking.model');
const NotificationService = require('../../services/notificationService');

// Update payment status after successful frontend payment
exports.verifyPayment = async (req, res) => {
    try {
        const { 
            paymentId,      // Our internal payment ID
            transactionId,  // Payment gateway transaction ID
            paymentMethod,  // Payment method used
            paymentGateway  // Payment gateway used
        } = req.body;

        // Find the payment record
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

                // Allow test transactions in development environment
        const isTestTransaction = process.env.NODE_ENV === 'development' && 
            transactionId.startsWith('test_');

        // Validate transaction ID in production
        if (!isTestTransaction && process.env.NODE_ENV === 'production') {
            // In production, you might want to add additional validation here
            if (!transactionId || transactionId.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid transaction ID'
                });
            }
        }

        // Update payment status and transaction details
        payment.status = 'completed';
        payment.transactionId = transactionId;
        payment.paymentMethod = paymentMethod;
        payment.paymentGateway = paymentGateway;
        await payment.save();

        // Update booking status
        const booking = await Booking.findById(payment.bookingId);
        if (booking) {
            booking.paymentStatus = 'paid';
            await booking.save();
        }

        // Send notifications
        // await NotificationService.sendNotification({
        //     userId: payment.customerId,
        //     type: 'payment_completed',
        //     title: 'Payment Successful',
        //     message: `Your payment of ₹${payment.amount} has been completed successfully.`,
        //     metadata: {
        //         bookingId: payment.bookingId,
        //         paymentId: payment._id
        //     }
        // });

        return res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            data: payment
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message
        });
    }
};

exports.createPayment = async (req, res) => {
    try {
        const { bookingId, paymentMethod, paymentGateway } = req.body;

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
            amount: booking.totalAmount,
            paymentMethod,
            paymentGateway,
            status: 'pending'
        });

        // Store basic payment metadata
        payment.metadata = {
            bookingId: booking.id,
            amount: booking.totalAmount,
            currency: 'INR'
        };
        await payment.save();

        // Send notification using NotificationService will implement in future
        // await NotificationService.sendNotification({
        //     userId: payment.customerId,
        //     type: 'payment_initiated',
        //     title: 'Payment Initiated',
        //     message: `Payment of ₹${payment.amount} has been initiated for your booking.`,
        //     metadata: {
        //         bookingId: payment.bookingId,
        //         paymentId: payment._id
        //     }
        // });

        // Return payment details for frontend
        return res.status(201).json({
            success: true,
            data: {
                payment,
                paymentDetails: {
                    amount: booking.totalAmount,
                    currency: 'INR',
                    name: 'Call Karigar Service',
                    description: `Payment for booking #${booking.id}`,
                    customerId: booking.customerId,
                    bookingId: booking.id,
                    paymentId: payment._id,
                }
            }
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
        // Verify admin access
        if (req.user.role !== 'admin') {
            console.log('Unauthorized access attempt:', req.user.role);
            return res.status(403).json({
                success: false,
                message: 'Only admin users can access all payments'
            });
        }

        console.log('Fetching all payments for admin:', req.user._id);

        // Add pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalCount = await Payment.countDocuments();

        // Query with pagination and sorting
        const payments = await Payment.find()
            .populate('customerId', 'name email phone')
            .populate('workerId', 'name email phone')
            .populate('bookingId')
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit);

        console.log(`Found ${payments.length} payments`);

        res.status(200).json({
            success: true,
            count: payments.length,
            total: totalCount,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit),
                hasMore: skip + payments.length < totalCount
            },
            data: payments
        });
    } catch (error) {
        console.error('Get all payments error:', error);
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
            .populate('customerId', 'name email phone')
            .populate({
                path: 'workerId',
                select: 'name email phone services',
                populate: {
                    path: 'services',
                    select: 'serviceName serviceDescription price'
                }
            })
            .populate({
                path: 'bookingId',
                populate: [
                    {
                        path: 'serviceId',
                        select: 'serviceName serviceDescription price'
                    },
                    {
                        path: 'address',
                        select: 'addressLine1 addressLine2 city state pincode'
                    }
                ]
            })
            .sort({ createdAt: -1 });

        // Format the response data
        const formattedPayments = payments.map(payment => ({
            paymentId: payment._id,
            amount: payment.amount,
            status: payment.status,
            paymentMethod: payment.paymentMethod,
            transactionId: payment.transactionId,
            createdAt: payment.createdAt,
            customer: {
                id: payment.customerId._id,
                name: payment.customerId.name,
                email: payment.customerId.email,
                phone: payment.customerId.phone
            },
            worker: {
                id: payment.workerId._id,
                name: payment.workerId.name,
                email: payment.workerId.email,
                phone: payment.workerId.phone,
                services: payment.workerId.services
            },
            booking: {
                id: payment.bookingId._id,
                service: payment.bookingId.serviceId,
                address: payment.bookingId.address,
                status: payment.bookingId.status,
                scheduledDate: payment.bookingId.scheduledDate,
                totalAmount: payment.bookingId.totalAmount
            }
        }));

        res.status(200).json({
            success: true,
            count: payments.length,
            data: formattedPayments
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
