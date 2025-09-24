const Razorpay = require('razorpay');
const Transaction = require('../../models/Transaction');
const Booking = require('../../models/Booking');
const crypto = require('crypto');

class PaymentService {
    constructor() {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }

    /**
     * Create a new payment order
     */
    async createPaymentOrder(bookingId, amount, currency = 'INR') {
        try {
            const options = {
                amount: amount * 100, // Convert to smallest currency unit
                currency,
                receipt: `booking_${bookingId}`,
                payment_capture: 1
            };

            const order = await this.razorpay.orders.create(options);
            return order;
        } catch (error) {
            console.error('Error creating payment order:', error);
            throw error;
        }
    }

    /**
     * Verify payment signature
     */
    verifyPaymentSignature(bookingId, paymentId, signature) {
        const text = bookingId + '|' + paymentId;
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(text)
            .digest('hex');

        return generated_signature === signature;
    }

    /**
     * Process successful payment
     */
    async processSuccessfulPayment(bookingId, paymentDetails) {
        try {
            // Create transaction record
            const transaction = await Transaction.create({
                bookingId,
                customerId: paymentDetails.customerId,
                paymentId: paymentDetails.razorpay_payment_id,
                amount: paymentDetails.amount,
                currency: paymentDetails.currency,
                paymentMethod: paymentDetails.method,
                status: 'success',
                paymentGatewayResponse: paymentDetails
            });

            // Update booking status
            await Booking.findByIdAndUpdate(bookingId, {
                paymentStatus: 'paid',
                transactionId: transaction._id
            });

            return transaction;
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
            const transaction = await Transaction.create({
                bookingId,
                customerId: paymentDetails.customerId,
                paymentId: paymentDetails.razorpay_payment_id,
                amount: paymentDetails.amount,
                currency: paymentDetails.currency,
                paymentMethod: paymentDetails.method,
                status: 'failed',
                paymentGatewayResponse: {
                    ...paymentDetails,
                    error: error.message
                }
            });

            // Update booking status
            await Booking.findByIdAndUpdate(bookingId, {
                paymentStatus: 'failed',
                transactionId: transaction._id
            });

            return transaction;
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
            const transaction = await Transaction.findById(transactionId);
            if (!transaction) {
                throw new Error('Transaction not found');
            }

            const refund = await this.razorpay.payments.refund(transaction.paymentId, {
                amount: amount * 100, // Convert to smallest currency unit
                notes: {
                    reason: reason
                }
            });

            // Update transaction
            transaction.refundStatus = amount === transaction.amount ? 'complete' : 'partial';
            transaction.refundAmount = (transaction.refundAmount || 0) + amount;
            await transaction.save();

            return refund;
        } catch (error) {
            console.error('Error initiating refund:', error);
            throw error;
        }
    }
}

module.exports = new PaymentService();
