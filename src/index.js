const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const serviceRoutes = require('../routes/serviceRoutes');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Move static file serving to BEFORE routes
// This is important - static middleware should be before your routes
const publicPath = path.resolve(__dirname, '../public');
console.log('Public directory absolute path:', publicPath);
app.use(express.static(publicPath));

// DB Connection
try {
  connectDB();
} catch (error) {
  console.error('Database connection error:', error);
  // Continue even if DB connection fails
}

// Routes
app.use('/api/users', require('../routes/userRoutes'));
app.use('/api/services', serviceRoutes);
app.use('/api/categories', require('../routes/categoryRoutes'));
app.use('/api/worker-profile', require('../routes/workerProfileRoutes'));
app.use('/api/customer-profile', require('../routes/customerProfileRoutes'));
app.use('/api/bookings', require('../routes/bookingRoutes'));
app.use('/api/reviews', require('../routes/reviewRoutes'));
app.use('/api/payments', require('../routes/paymentRoutes'));
app.use('/api/notifications', require('../routes/notificationRoutes'));
app.use('/api/worker-documents', require('../routes/workerDocumentRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'login.html'));
});

// Debug route for login page
app.get('/login', (req, res) => {
  const loginPath = path.join(publicPath, 'login.html');
  console.log('Login path:', loginPath);
  console.log('File exists:', fs.existsSync(loginPath));
  res.sendFile(loginPath);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Try accessing: http://localhost:${PORT}/login.html`);
  console.log(`Or alternative URL: http://localhost:${PORT}/login`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});