// const notificationService = require('../../services/notificationService');
// const emailService = require('../../services/emailService');
// const Razorpay = require('razorpay');
// const crypto = require('crypto');
// require('dotenv').config();

// class PaymentService {
//     constructor() {
//         this.razorpay = new Razorpay({
//             key_id: process.env.RAZORPAY_KEY_ID,
//             key_secret: process.env.RAZORPAY_KEY_SECRET
//         });

//         this.NOTIFICATION_TYPES = {
//             PAYMENT_INITIATED: 'payment_initiated',
//             PAYMENT_COMPLETED: 'payment_completed',
//             PAYMENT_FAILED: 'payment_failed',
//             REFUND_INITIATED: 'refund_initiated',
//             REFUND_COMPLETED: 'refund_completed'
//         };
//     }

//     async createPaymentOrder(amount, currency = 'INR') {
//         try {
//             const options = {
//                 amount: amount * 100, // Amount in smallest currency unit
//                 currency,
//                 receipt: `rcpt_${Date.now()}`,
//                 payment_capture: 1
//             };

//             const order = await this.razorpay.orders.create(options);
//             return order;
//         } catch (error) {
//             console.error('Create payment order error:', error);
//             throw error;
//         }
//     }

//     async verifyPaymentSignature(paymentId, orderId, signature) {
//         try {
//             const expectedSignature = crypto
//                 .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
//                 .update(`${orderId}|${paymentId}`)
//                 .digest('hex');

//             return expectedSignature === signature;
//         } catch (error) {
//             console.error('Verify payment signature error:', error);
//             throw error;
//         }
//     }

//     async initiateRefund(paymentId, amount, speed = 'normal') {
//         try {
//             const refund = await this.razorpay.payments.refund(paymentId, {
//                 amount: amount * 100,
//                 speed
//             });
//             return refund;
//         } catch (error) {
//             console.error('Initiate refund error:', error);
//             throw error;
//         }
//     }

//     async createPaymentNotification(payment, type, recipientId, recipientRole) {
//         const notificationData = {
//             userId: recipientId,
//             type,
//             category: 'payment',
//             title: this.getNotificationTitle(type),
//             message: this.getNotificationMessage(type, payment),
//             recipientRole,
//             priority: 'high',
//             metadata: {
//                 paymentId: payment._id,
//                 amount: payment.amount,
//                 status: payment.status,
//                 timestamp: new Date()
//             }
//         };

//         return notificationService.createNotification(notificationData);
//     }

//     getNotificationTitle(type) {
//         const titles = {
//             [this.NOTIFICATION_TYPES.PAYMENT_INITIATED]: 'Payment Initiated',
//             [this.NOTIFICATION_TYPES.PAYMENT_COMPLETED]: 'Payment Successful',
//             [this.NOTIFICATION_TYPES.PAYMENT_FAILED]: 'Payment Failed',
//             [this.NOTIFICATION_TYPES.REFUND_INITIATED]: 'Refund Initiated',
//             [this.NOTIFICATION_TYPES.REFUND_COMPLETED]: 'Refund Processed'
//         };
//         return titles[type] || 'Payment Update';
//     }

//     getNotificationMessage(type, payment) {
//         const messages = {
//             [this.NOTIFICATION_TYPES.PAYMENT_INITIATED]: `Payment of ₹${payment.amount} initiated`,
//             [this.NOTIFICATION_TYPES.PAYMENT_COMPLETED]: `Payment of ₹${payment.amount} received successfully`,
//             [this.NOTIFICATION_TYPES.PAYMENT_FAILED]: `Payment of ₹${payment.amount} failed`,
//             [this.NOTIFICATION_TYPES.REFUND_INITIATED]: `Refund of ₹${payment.amount} initiated`,
//             [this.NOTIFICATION_TYPES.REFUND_COMPLETED]: `Refund of ₹${payment.amount} processed successfully`
//         };
//         return messages[type] || 'Your payment status has been updated';
//     }

//     async sendPaymentEmail(type, payment, recipientEmail) {
//         const emailData = {
//             to: recipientEmail,
//             subject: this.getEmailSubject(type),
//             template: this.getEmailTemplate(type),
//             context: {
//                 payment,
//                 amount: payment.amount,
//                 status: payment.status,
//                 date: new Date().toLocaleDateString()
//             }
//         };

//         return emailService.sendEmail(emailData);
//     }

//     getEmailSubject(type) {
//         const subjects = {
//             [this.NOTIFICATION_TYPES.PAYMENT_COMPLETED]: 'Payment Confirmation',
//             [this.NOTIFICATION_TYPES.PAYMENT_FAILED]: 'Payment Failed',
//             [this.NOTIFICATION_TYPES.REFUND_COMPLETED]: 'Refund Processed'
//         };
//         return subjects[type] || 'Payment Update';
//     }

//     getEmailTemplate(type) {
//         const templates = {
//             [this.NOTIFICATION_TYPES.PAYMENT_COMPLETED]: 'payment-confirmation',
//             [this.NOTIFICATION_TYPES.PAYMENT_FAILED]: 'payment-failed',
//             [this.NOTIFICATION_TYPES.REFUND_COMPLETED]: 'refund-confirmation'
//         };
//         return templates[type] || 'payment-update';
//     }
// }

// module.exports = new PaymentService();
