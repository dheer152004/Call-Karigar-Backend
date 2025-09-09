const Notification = require('../modules/notifications/notification.model');
const socketService = require('./socketService');
const emailService = require('./emailService');
const User = require('../modules/user/user.model');

class NotificationService {
    constructor() {
        if (NotificationService.instance) {
            return NotificationService.instance;
        }
        NotificationService.instance = this;
    }

    async createNotification(data) {
        try {
            const notification = await Notification.create({
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type,
                category: data.category,
                priority: data.priority || 'low',
                metadata: data.metadata || {},
                recipientRole: data.recipientRole,
                actionUrl: data.actionUrl,
                expiresAt: data.expiresAt
            });

            // Send real-time notification
            socketService.sendToUser(data.userId, {
                ...notification.toObject(),
                isRealTime: true
            });

            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    // Helper methods for different types of notifications
    async notifyUserRegistration(userId, userData) {
        await emailService.sendWelcomeEmail(userData.email, userData.name);
        return this.createNotification({
            userId,
            type: 'user_registration',
            title: 'Welcome to Call Karigar!',
            message: `Welcome ${userData.name}! Your account has been created successfully.`,
            recipientRole: 'customer',
            priority: 'medium',
            metadata: {
                email: userData.email,
                phone: userData.phone
            }
        });
    }

    async notifyNewSupportTicket(ticketData, adminId) {
        // Create high-priority notification for admin
        return this.createNotification({
            userId: adminId,
            type: 'new_support_ticket',
            title: 'New Support Ticket Created',
            message: `New ${ticketData.category} ticket: ${ticketData.subject}`,
            recipientRole: 'admin',
            priority: 'high',
            category: 'system',  // Using system category temporarily
            metadata: {
                ticketId: ticketData._id,
                ticketNumber: ticketData.ticketNumber,
                category: ticketData.category,
                subject: ticketData.subject,
                bookingId: ticketData.bookingId
            },
            actionUrl: `/admin/support-tickets/${ticketData._id}`,
            data: ticketData
        });
    }

    async notifyProfileUpdate(userId, updates) {
        return this.createNotification({
            userId,
            type: 'profile_update',
            title: 'Profile Updated',
            message: 'Your profile information has been updated successfully.',
            recipientRole: 'customer',
            metadata: { updates }
        });
    }

    async notifyAddressUpdate(userId, addressData) {
        return this.createNotification({
            userId,
            type: 'address_update',
            title: 'Address Updated',
            message: 'Your address has been updated successfully.',
            recipientRole: 'customer',
            metadata: { address: addressData }
        });
    }

    async notifyBookingCreated(userId, bookingData) {
        // Notify customer
        await this.createNotification({
            userId,
            type: 'booking_created',
            title: 'Booking Confirmed',
            message: `Your booking for ${bookingData.serviceName} has been created successfully.`,
            recipientRole: 'customer',
            priority: 'high',
            metadata: { bookingId: bookingData._id },
            actionUrl: `/bookings/${bookingData._id}`
        });

        // Notify worker
        if (bookingData.workerId) {
            await this.createNotification({
                userId: bookingData.workerId,
                type: 'booking_created',
                title: 'New Booking Received',
                message: `You have received a new booking request for ${bookingData.serviceName}.`,
                recipientRole: 'worker',
                priority: 'high',
                metadata: { bookingId: bookingData._id },
                actionUrl: `/worker/bookings/${bookingData._id}`
            });
        }
    }

    async notifyPaymentReceived(userId, paymentData) {
        return this.createNotification({
            userId,
            type: 'payment_received',
            title: 'Payment Received',
            message: `Payment of ₹${paymentData.amount} has been received successfully.`,
            recipientRole: 'customer',
            priority: 'high',
            metadata: {
                paymentId: paymentData._id,
                amount: paymentData.amount,
                bookingId: paymentData.bookingId
            }
        });
    }

    async notifyPasswordChanged(userId) {
        const user = await User.findById(userId);
        if (user) {
            // It's good practice to notify the user about the password change
            // For security reasons, we don't send the new password
        }
        return this.createNotification({
            userId,
            type: 'password_changed',
            title: 'Password Changed',
            message: 'Your password has been changed successfully. If you did not make this change, please contact support immediately.',
            recipientRole: 'customer',
            priority: 'high'
        });
    }

    async notifyWorkerVerified(workerId, workerData) {
        return this.createNotification({
            userId: workerId,
            type: 'worker_verified',
            title: 'Account Verified',
            message: 'Congratulations! Your worker account has been verified. You can now start accepting bookings.',
            recipientRole: 'worker',
            priority: 'high',
            actionUrl: '/worker/dashboard'
        });
    }

    async notifyReviewReceived(workerId, reviewData) {
        return this.createNotification({
            userId: workerId,
            type: 'review_received',
            title: 'New Review Received',
            message: `You have received a ${reviewData.rating}-star review from a customer.`,
            recipientRole: 'worker',
            category: 'booking',
            metadata: {
                reviewId: reviewData._id,
                rating: reviewData.rating,
                bookingId: reviewData.bookingId
            }
        });
    }

    // Methods for managing notifications
    async markAsRead(notificationId, userId) {
        return Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true },
            { new: true }
        );
    }

    async markAllAsRead(userId) {
        return Notification.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );
    }

    async deleteNotification(notificationId, userId) {
        return Notification.findOneAndDelete({ _id: notificationId, userId });
    }

    async getUnreadCount(userId) {
        return Notification.countDocuments({ userId, isRead: false });
    }

    // Security Notifications
    async notifyLoginAlert(userId, deviceInfo) {
        return this.createNotification({
            userId,
            type: 'login_alert',
            category: 'account',
            title: 'New Login Detected',
            message: `New login detected from ${deviceInfo.device} in ${deviceInfo.location}`,
            recipientRole: 'customer',
            priority: 'high',
            metadata: deviceInfo
        });
    }

    async notifyAccountStatus(userId, status, reason) {
        return this.createNotification({
            userId,
            type: status === 'blocked' ? 'account_blocked' : 'account_deactivated',
            category: 'account',
            title: `Account ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: `Your account has been ${status}. Reason: ${reason}`,
            recipientRole: 'customer',
            priority: 'high',
            metadata: { reason, status }
        });
    }

    async notifyEmailChanged(userId, newEmail) {
        await emailService.sendVerificationSuccessEmail(newEmail);
        return this.createNotification({
            userId,
            type: 'email_changed',
            category: 'account',
            title: 'Email Address Changed',
            message: `Your email address has been changed to ${newEmail}`,
            recipientRole: 'customer',
            priority: 'high',
            metadata: { newEmail }
        });
    }

    // Worker Document Notifications
    async notifyDocumentStatus(userId, documentInfo) {
        const { status, documentType, reason } = documentInfo;
        return this.createNotification({
            userId,
            type: `document_${status}`,
            category: 'worker',
            title: `Document ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: `Your ${documentType} has been ${status}${reason ? ': ' + reason : ''}`,
            recipientRole: 'worker',
            priority: 'high',
            metadata: documentInfo
        });
    }

    // Payment and Wallet Notifications
    async notifyWalletUpdate(userId, transactionInfo) {
        const { type, amount, balance, transactionId } = transactionInfo;
        return this.createNotification({
            userId,
            type: `wallet_${type}`,
            category: 'payment',
            title: `Wallet ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            message: `₹${amount} has been ${type} to your wallet. New balance: ₹${balance}`,
            recipientRole: 'customer',
            priority: 'medium',
            metadata: { amount, balance, transactionId }
        });
    }

    async notifyPayoutProcessed(userId, payoutInfo) {
        return this.createNotification({
            userId,
            type: 'payout_processed',
            category: 'payment',
            title: 'Payout Processed',
            message: `Your payout of ₹${payoutInfo.amount} has been processed`,
            recipientRole: 'worker',
            priority: 'high',
            metadata: payoutInfo
        });
    }

    async notifyInvoiceGenerated(userId, invoiceInfo) {
        return this.createNotification({
            userId,
            type: 'invoice_generated',
            category: 'payment',
            title: 'Invoice Generated',
            message: `Invoice #${invoiceInfo.invoiceNumber} has been generated for ₹${invoiceInfo.amount}`,
            recipientRole: 'customer',
            priority: 'medium',
            metadata: invoiceInfo,
            actionUrl: `/invoices/${invoiceInfo.invoiceId}`
        });
    }

    // Support Ticket Notifications
    async notifyTicketResponse(userId, ticketInfo) {
        return this.createNotification({
            userId,
            type: 'support_ticket_response',
            category: 'communication',
            title: 'Support Ticket Update',
            message: `New response on ticket #${ticketInfo.ticketId}: ${ticketInfo.responsePreview}`,
            recipientRole: 'customer',
            priority: 'medium',
            metadata: ticketInfo,
            actionUrl: `/support/tickets/${ticketInfo.ticketId}`
        });
    }

    async getUserNotifications(userId, query = {}) {
        const { page = 1, limit = 20, type, isRead } = query;
        const skip = (page - 1) * limit;

        const filter = { userId };
        if (type) filter.type = type;
        if (typeof isRead === 'boolean') filter.isRead = isRead;

        const [notifications, total] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Notification.countDocuments(filter)
        ]);

        return {
            notifications,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                total
            }
        };
    }
}

module.exports = new NotificationService();