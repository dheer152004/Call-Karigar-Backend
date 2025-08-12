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

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',    // React development server
    'http://localhost:3001',    // Alternative React port
    'http://localhost:8080',    // Flutter web default port
    'http://localhost:8000',    // Alternative Flutter web port
    'capacitor://localhost',    // For mobile apps using Capacitor
    'http://localhost',         // Generic localhost
    'https://callkaarigar.onrender.com',  // Production domain
    'http://callkaarigar.onrender.com'    // Production domain (HTTP)
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true,  // Allow credentials (cookies, authorization headers, etc)
  maxAge: 86400      // Cache preflight request results for 24 hours
};

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all routes
app.use(limiter);

// CORS and parsing middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limit JSON body size
app.use(express.urlencoded({ extended: true }));

// Serve static files
const publicPath = path.resolve(__dirname, 'public');
console.log('Public directory absolute path:', publicPath);
app.use(express.static(publicPath));

// Import routes
const serviceRoutes = require('./routes/serviceRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const workerServiceRoutes = require('./routes/workerServiceRoutes');
const userRoutes = require('./routes/userRoutes');
const addressRoutes = require('./routes/addressRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const customerProfileRoutes = require('./routes/customerProfileRoutes');
const workerProfileRoutes = require('./routes/workerProfileRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Register routes
app.use('/api/services', serviceRoutes);
app.use('/api/service-categories', categoryRoutes);
app.use('/api/worker-services', workerServiceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/customer-profiles', customerProfileRoutes);
app.use('/api/worker-profiles', workerProfileRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

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