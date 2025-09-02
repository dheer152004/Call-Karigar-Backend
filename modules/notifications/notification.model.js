const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const notificationSchema = new mongoose.Schema({
  // Basic Notification Fields
  _id: {
    type: String,
    default: uuidv4
  },
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  
  // Additional Data
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Reference IDs
  bookingId: {
    type: String,
    ref: 'Booking'
  },
  workerId: {
    type: String,
    ref: 'User'
  },
  serviceId: {
    type: String,
    ref: 'Service'
  },
  paymentId: {
    type: String,
    ref: 'Payment'
  },
  
  // Status and Interaction
  isRead: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  clickAction: {
    type: String,
    enum: [
      'open_booking',
      'open_payment',
      'open_profile',
      'open_service',
      'open_chat',
      'open_review'
    ]
  },
  actionUrl: {
    type: String
  },
  
  // Delivery Status
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending'
  },
  
  // Channel Configuration
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  },
  
  // Expiration
  expiresAt: {
    type: Date
  },
  
  // Meta Information
  metadata: {
    deviceInfo: String,
    location: String,
    userAgent: String
  },
  _id: {
    type: String,
    default: uuidv4
  },
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  recipientRole: {
    type: String,
    enum: ['customer', 'worker', 'admin'],
    required: true
  },
  category: {
    type: String,
    enum: ['booking', 'payment', 'profile', 'system', 'promotional'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'low'
  },
  type: {
    type: String,
    enum: [
      // Customer Booking Notifications
      'booking_confirmed',         // When booking is successful
      'booking_updated',          // When worker accepts/rejects/reschedules
      'worker_enroute',          // Worker is on the way
      'worker_arrived',          // Worker has arrived
      'booking_completed',       // Service is completed
      'booking_cancelled',       // Booking cancelled by either party
      'booking_reminder',       // Upcoming service reminder
      'feedback_request',      // Request for rating/review
      
      // Customer Payment Notifications
      'payment_success',        // Payment successful
      'payment_failed',         // Payment failed
      'refund_initiated',      // Refund process started
      'refund_completed',      // Refund completed
      'invoice_generated',     // New invoice available
      
      // Customer Promotional Notifications
      'new_promotion',         // New discount/offer
      'referral_reward',      // Referral program updates
      'loyalty_update',       // Loyalty points/tier updates
      
      // Worker Booking Notifications
      'new_booking_request',    // New service booking
      'booking_response_reminder', // Reminder to accept/reject
      'booking_auto_rejected',    // When worker doesn't respond in time
      'customer_cancelled',      // Customer cancelled booking
      'job_reminder',           // Upcoming job reminder
      
      // Worker Payment Notifications
      'payment_received',       // Payment received from customer
      'payout_initiated',      // Money transfer started
      'payout_completed',      // Money transfer completed
      'daily_earnings',        // Daily earnings summary
      'weekly_earnings',       // Weekly earnings summary
      'monthly_earnings',      // Monthly earnings summary
      
      // Worker Profile Notifications
      'document_verified',      // KYC/document verification success
      'document_rejected',      // KYC/document verification failed
      'profile_incomplete',    // Missing profile information
      'new_policy',           // Platform policy updates
      'training_material',    // New training content
      
      // Admin Notifications
      'new_user_registered',   // New user registration
      'kyc_pending',          // New document verification needed
      'high_value_booking',   // Bookings above certain value
      'dispute_raised',       // New customer/worker dispute
      'payment_issue',        // Payment processing issues
      'system_error',         // Technical/system errors
      'fraud_alert',         // Suspicious activity detected
      'low_rated_worker',    // Worker with poor ratings
      'frequent_canceller',  // User with many cancellations
      'negative_review',     // Poor service review
      
      // System Notifications
      'system_maintenance',   // Scheduled maintenance
      'app_update',          // New app version
      'service_disruption',  // Service unavailable
      'security_alert',      // Security related updates
      
      // Account Notifications
      'account_verified',    // Account verification complete
      'account_blocked',     // Account temporarily blocked
      'password_changed',    // Password change alert
      'profile_updated',      // Profile changes made
 
      'worker_registered',
      'worker_verified',
      'document_uploaded',
      'document_approved',
      'document_rejected',
      'payout_processed',
      
      // Reviews & Communication
      'review_received',
      'message_received',
      'support_ticket_created',
      'support_ticket_response',
      
      // Payments & Wallet
      'payment_received',
      'payment_refunded',
      'wallet_credited',
      'wallet_debited',
      'invoice_generated'
    ],
    required: true
  },
  category: {
    type: String,
    enum: ['account', 'booking', 'worker', 'payment', 'communication'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  recipientRole: {
    type: String,
    enum: ['customer', 'worker', 'admin'],
    default: 'customer'  // Making it optional with a default value
  },
  actionUrl: {
    type: String
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);