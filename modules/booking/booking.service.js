const notificationService = require('../../services/notificationService');
const emailService = require('../../services/emailService');

class BookingService {
    constructor() {
        this.NOTIFICATION_TYPES = {
            BOOKING_CREATED: 'booking_created',
            BOOKING_CONFIRMED: 'booking_confirmed',
            BOOKING_UPDATED: 'booking_updated',
            BOOKING_CANCELLED: 'booking_cancelled',
            BOOKING_COMPLETED: 'booking_completed'
        };
    }

    async createBookingNotification(booking, type, recipientId, recipientRole) {
        const notificationData = {
            userId: recipientId,
            type,
            category: 'booking',
            title: this.getNotificationTitle(type),
            message: this.getNotificationMessage(type, booking),
            recipientRole,
            priority: 'high',
            metadata: {
                bookingId: booking._id,
                status: booking.status,
                timestamp: new Date()
            }
        };

        return notificationService.createNotification(notificationData);
    }

    getNotificationTitle(type) {
        const titles = {
            [this.NOTIFICATION_TYPES.BOOKING_CREATED]: 'New Booking',
            [this.NOTIFICATION_TYPES.BOOKING_UPDATED]: 'Booking Updated',
            [this.NOTIFICATION_TYPES.BOOKING_CANCELLED]: 'Booking Cancelled',
            [this.NOTIFICATION_TYPES.BOOKING_COMPLETED]: 'Booking Completed'
        };
        return titles[type] || 'Booking Notification';
    }

    getNotificationMessage(type, booking) {
        const messages = {
            [this.NOTIFICATION_TYPES.BOOKING_CREATED]: 'A new booking has been created',
            [this.NOTIFICATION_TYPES.BOOKING_UPDATED]: `Booking status updated to ${booking.status}`,
            [this.NOTIFICATION_TYPES.BOOKING_CANCELLED]: `Booking has been cancelled by ${booking.cancelledBy}`,
            [this.NOTIFICATION_TYPES.BOOKING_COMPLETED]: 'Booking has been marked as completed'
        };
        return messages[type] || 'Your booking status has been updated';
    }

    async sendBookingEmail(type, booking, recipientEmail) {
        const emailData = {
            to: recipientEmail,
            subject: this.getEmailSubject(type),
            template: this.getEmailTemplate(type),
            context: {
                booking,
                date: new Date(booking.scheduledDate).toLocaleDateString(),
                timeSlot: `${booking.scheduledTimeSlot.start} - ${booking.scheduledTimeSlot.end}`
            }
        };

        return emailService.sendEmail(emailData);
    }

    getEmailSubject(type) {
        const subjects = {
            [this.NOTIFICATION_TYPES.BOOKING_CREATED]: 'Booking Confirmation',
            [this.NOTIFICATION_TYPES.BOOKING_UPDATED]: 'Booking Update',
            [this.NOTIFICATION_TYPES.BOOKING_CANCELLED]: 'Booking Cancellation',
            [this.NOTIFICATION_TYPES.BOOKING_COMPLETED]: 'Service Completed'
        };
        return subjects[type] || 'Booking Update';
    }

    getEmailTemplate(type) {
        const templates = {
            [this.NOTIFICATION_TYPES.BOOKING_CREATED]: 'booking-confirmation',
            [this.NOTIFICATION_TYPES.BOOKING_UPDATED]: 'booking-update',
            [this.NOTIFICATION_TYPES.BOOKING_CANCELLED]: 'booking-cancellation',
            [this.NOTIFICATION_TYPES.BOOKING_COMPLETED]: 'service-completed'
        };
        return templates[type] || 'booking-update';
    }
}

module.exports = new BookingService();
