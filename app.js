const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

dotenv.config();

const app = express();

app.set('trust proxy', 1);

// ─── 1. SECURITY ────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ─── 2. CORS ─────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => callback(null, true),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  maxAge: 86400,
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};
app.use(cors(corsOptions));

// ─── 3. BODY PARSERS (must be before routes) ─────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.post('/api/debug-body', (req, res) => {
  res.json({
    body: req.body,
    headers: req.headers,
    contentType: req.headers['content-type'],
    bodyType: typeof req.body,
    rawBody: JSON.stringify(req.body)
  });
});

// ─── 4. RATE LIMITING ────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000
});
app.use('/api', limiter);
app.use(limiter);

// ─── 5. DEV ONLY ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  const seedCoupons = require('./modules/coupon/coupon.seed');
  seedCoupons()
    .then(() => console.log('Coupon seeding completed'))
    .catch(err => console.error('Coupon seeding failed:', err));
}

// ─── 6. ROUTES ───────────────────────────────────────────────────────────────
const authRoutes                    = require('./modules/auth/auth.routes');
const userRoutes                    = require('./modules/user/user.routes');
const otpRoutes                     = require('./modules/otp/otp.routes');
const notificationRoutes            = require('./modules/notifications/notification.routes');
const serviceCategoryRoutes         = require('./modules/serviceCategories/serviceCategory.routes');
const serviceRoutes                 = require('./modules/serviceCategories/servicess/service.routes');
const addressRoutes                 = require('./modules/address/address.routes');
const adminProfileRoutes            = require('./modules/user/admin/admin.routes');
const customerProfileRoutes         = require('./modules/user/customer/customerProfile.routes');
const workerProfileRoutes           = require('./modules/user/worker/workerProfile/workerProfile.routes');
const workerDocumentRoutes          = require('./modules/user/worker/workerDocuments/workerDocuments.routes');
const workerServiceRoutes           = require('./modules/user/worker/workerService/workerService.routes');
const workerIndependentServiceRoutes = require('./modules/user/worker/workerService/workerIndependentService/workerIndependentService.routes');
const workerVerificationRoutes      = require('./modules/user/worker/workerProfile/workerVerification.routes');
const bookingRoutes                 = require('./modules/booking/booking.routes');
const paymentRoutes                 = require('./modules/payment/payment.routes');
const reviewRoutes                  = require('./modules/review/review.routes');
const couponRoutes                  = require('./modules/coupon/coupon.routes');
const supportTicketRoutes           = require('./modules/supportTicket/supportTicket.routes');

app.use('/api', workerIndependentServiceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/service-categories', serviceCategoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/admin-profile', adminProfileRoutes);
app.use('/api/customer-profile', customerProfileRoutes);
app.use('/api/worker-profile', workerProfileRoutes);
app.use('/api/worker-documents', workerDocumentRoutes);
app.use('/api/worker-services', workerServiceRoutes);
app.use('/api/support-tickets', supportTicketRoutes);
app.use('/api/admin/workers', workerVerificationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);

// ─── 7. ERROR HANDLERS ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.url}`
  });
});

module.exports = app;