//For testing purpose, i am writing this comment

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load env vars
dotenv.config();

const app = express();

// Seed coupons in development
if (process.env.NODE_ENV === 'development') {
    const seedCoupons = require('./modules/coupon/coupon.seed');
    seedCoupons().then(() => {
        console.log('Coupon seeding completed');
    }).catch(err => {
        console.error('Coupon seeding failed:', err);
    });
}

// Routes
const couponRoutes = require('./modules/coupon/coupon.routes');
const workerIndependentServiceRoutes = require('./modules/user/worker/workerService/workerIndependentService/workerIndependentService.routes');
// const serviceRequestRoutes = require('./modules/serviceRequest/serviceRequest.routes');

// Mount routes

// CORS Configuration
const corsOptions = {
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  credentials: true,  // Allow credentials (cookies, authorization headers, etc)
  maxAge: 86400,     // Cache preflight request results for 24 hours
  exposedHeaders: ['Content-Range', 'X-Content-Range'] // Allow these headers to be exposed
};

// Allow the frontend origin (e.g., React app running on port 3000)
// In a production environment, replace '*' with your actual frontend domain
// corsOptions.origin = (origin, callback) => {
//   if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
//     callback(null, true);
//   } else {
//     callback(new Error('Not allowed by CORS by the CORS policy'));
//   }
// };



// Security middleware with configurations for static files
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000 // limit each IP to 5000 requests per windowMs
});

// Apply rate limiting to API routes only
app.use('/api', limiter);
app.use(limiter);

// CORS and parsing middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limit JSON body size
app.use(express.urlencoded({ extended: true }));


// Serve uploaded files
// app.use('/uploads', express.static(path.join(__dirname, 'tmp/uploads')));

// // Serve HTML files for different roles
// app.get('/login', (req, res) => {
//   res.sendFile(path.join(publicPath, 'login.html'));
// });

// app.get('/register', (req, res) => {
//   res.sendFile(path.join(publicPath, 'register.html'));
// });

// app.get('/admin/dashboard', (req, res) => {
//   res.sendFile(path.join(publicPath, 'admin/dashboard.html'));
// });

// app.get('/customer/dashboard', (req, res) => {
//   res.sendFile(path.join(publicPath, 'customer/dashboard.html'));
// });

// app.get('/worker/dashboard', (req, res) => {
//   res.sendFile(path.join(publicPath, 'worker/dashboard.html'));
// });

// Import routes from modules
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/user/user.routes');
const otpRoutes = require('./modules/otp/otp.routes');

const notificationRoutes = require('./modules/notifications/notification.routes');

const serviceCategoryRoutes = require('./modules/serviceCategories/serviceCategory.routes');
const serviceRoutes = require('./modules/serviceCategories/servicess/service.routes');

const addressRoutes = require('./modules/address/address.routes');

const customerProfileRoutes = require('./modules/user/customer/customerProfile.routes');
const workerProfileRoutes = require('./modules/user/worker/workerProfile/workerProfile.routes');
const workerDocumentRoutes = require('./modules/user/worker/workerDocuments/workerDocuments.routes');
const workerServiceRoutes = require('./modules/user/worker/workerService/workerService.routes');

const bookingRoutes = require('./modules/booking/booking.routes');
const paymentRoutes = require('./modules/payment/payment.routes');
const reviewRoutes = require('./modules/review/review.routes');
const supportTicketRoutes = require('./modules/supportTicket/supportTicket.routes');

// Register independent service routes
app.use('/api', workerIndependentServiceRoutes);

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/otp', otpRoutes);

app.use('/api/notifications', notificationRoutes);

app.use('/api/service-categories', serviceCategoryRoutes);
app.use('/api/services', serviceRoutes);

app.use('/api/addresses', addressRoutes);

// Profile routes
const adminProfileRoutes = require('./modules/user/admin/admin.routes');
app.use('/api/admin-profile', adminProfileRoutes);
app.use('/api/customer-profile', customerProfileRoutes);
app.use('/api/worker-profile', workerProfileRoutes);
app.use('/api/worker-documents', workerDocumentRoutes);
app.use('/api/worker-services', workerServiceRoutes);
app.use('/api/support-tickets', supportTicketRoutes);

// Worker verification routes
const workerVerificationRoutes = require('./modules/user/worker/workerProfile/workerVerification.routes');
app.use('/api/admin/workers', workerVerificationRoutes);

app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
// app.use('/api/service-requests', serviceRequestRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.url}`
  });
});

module.exports = app;
