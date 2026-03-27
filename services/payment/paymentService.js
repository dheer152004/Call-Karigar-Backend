const Payment = require('../../modules/payment/payment.model');
const Booking = require('../../modules/booking/booking.model');
const NotificationService = require('../notificationService');
const crypto = require('crypto');

class PaymentService {
    constructor() {
        this.cashfreeApiBase = process.env.CASHFREE_API_BASE_URL || 'https://api.cashfree.com';
        this.cashfreeAppId = process.env.CASHFREE_APP_ID;
        this.cashfreeSecret = process.env.CASHFREE_SECRET;
    }

    /**
     * Create a new payment order (Cashfree path)
     */
    async createPaymentOrder(bookingId, amount, currency = 'INR') {
        try {
            if (!this.cashfreeAppId || !this.cashfreeSecret) {
                throw new Error('Cashfree credentials are not configured');
            }

            // Placeholder implementation for Cashfree order creation.
            // Replace this with a call to Cashfree Order API using axios or fetch.
            return {
                id: `cashfree_order_${bookingId}`,
                amount,
                currency,
                status: 'CREATED'
            };
        } catch (error) {
            console.error('Error creating Cashfree payment order:', error);
            throw error;
        }
    }

    /**
     * Verify payment signature (Cashfree path)
     */
    verifyPaymentSignature(orderId, orderAmount, referenceId, signature) {
        if (!this.cashfreeSecret) {
            throw new Error('Cashfree secret is not configured');
        }

        const text = `${orderId}${orderAmount}${referenceId}`;
        const generatedSignature = crypto
            .createHmac('sha256', this.cashfreeSecret)
            .update(text)
            .digest('hex');

        return generatedSignature === signature;
    }

    /**
     * Process successful payment
     */
    async processSuccessfulPayment(bookingId, paymentDetails) {
        try {
            // Create payment record
            const payment = await Payment.create({
                bookingId,
                customerId: paymentDetails.customerId,
                workerId: paymentDetails.workerId,
                amount: paymentDetails.amount,
                paymentMethod: paymentDetails.method,
                transactionId: paymentDetails.paymentId || paymentDetails.transactionId,
                paymentGateway: paymentDetails.paymentGateway || 'cashfree',
                status: 'completed',
                gatewayResponse: paymentDetails,
                metadata: paymentDetails.metadata || {}
            });

            // Update booking status
            await Booking.findByIdAndUpdate(bookingId, {
                paymentStatus: 'paid',
                transactionId: payment._id
            });

            return payment;
        } catch (error) {
            console.error('Error processing payment:', error);
            throw error;
        }
    }

    /**
     * Process failed payment
     */
    async processFailedPayment(bookingId, paymentDetails, error) {
        try {
            const payment = await Payment.create({
                bookingId,
                customerId: paymentDetails.customerId,
                workerId: paymentDetails.workerId,
                amount: paymentDetails.amount,
                paymentMethod: paymentDetails.method,
                transactionId: paymentDetails.paymentId || paymentDetails.transactionId,
                paymentGateway: paymentDetails.paymentGateway || 'cashfree',
                status: 'failed',
                gatewayResponse: {
                    ...paymentDetails,
                    error: error.message
                },
                metadata: paymentDetails.metadata || {}
            });

            // Update booking status
            await Booking.findByIdAndUpdate(bookingId, {
                paymentStatus: 'failed',
                transactionId: payment._id
            });

            return payment;
        } catch (error) {
            console.error('Error processing failed payment:', error);
            throw error;
        }
    }

    /**
     * Initiate refund
     */
    async initiateRefund(transactionId, amount, reason) {
        try {
            const payment = await Payment.findById(transactionId);
            if (!payment) {
                throw new Error('Payment record not found');
            }

            // TODO: Implement Cashfree refund API call.
            // Placeholder flow for local bookkeeping.
            payment.refundStatus = amount === payment.amount ? 'complete' : 'partial';
            payment.refundAmount = (payment.refundAmount || 0) + amount;
            payment.refundReason = reason;
            await payment.save();

            return {
                id: `cashfree_refund_${Date.now()}`,
                status: payment.refundStatus,
                amount,
                reason
            };
        } catch (error) {
            console.error('Error initiating refund:', error);
            throw error;
        }
    }

    get NOTIFICATION_TYPES() {
        return {
            PAYMENT_COMPLETED: 'payment_completed',
            PAYMENT_FAILED: 'payment_failed',
            REFUND_COMPLETED: 'refund_completed'
        };
    }

    async createPaymentNotification(payment, type, recipientId, recipientRole) {
        try {
            const title = type === this.NOTIFICATION_TYPES.PAYMENT_COMPLETED
                ? 'Payment Completed'
                : type === this.NOTIFICATION_TYPES.REFUND_COMPLETED
                    ? 'Refund Completed'
                    : 'Payment Update';

            const message = type === this.NOTIFICATION_TYPES.PAYMENT_COMPLETED
                ? `Payment of ₹${payment.amount} for booking ${payment.bookingId} is completed.`
                : type === this.NOTIFICATION_TYPES.REFUND_COMPLETED
                    ? `Refund of ₹${payment.refundAmount || payment.amount} for booking ${payment.bookingId} is completed.`
                    : `Payment status updated for booking ${payment.bookingId}.`;

            await NotificationService.createNotification({
                userId: recipientId,
                recipientRole,
                priority: 'high',
                category: 'payment',
                type,
                title,
                message,
                metadata: {
                    paymentId: payment._id,
                    bookingId: payment.bookingId,
                    paymentStatus: payment.status
                },
                actionUrl: `/payments/${payment._id}`
            });
        } catch (error) {
            console.error('Error creating payment notification:', error);
            throw error;
        }
    }
}

module.exports = new PaymentService();
