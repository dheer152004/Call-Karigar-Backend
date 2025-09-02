const app = require('../app');
const connectDB = require('../config/db');

// DB Connection
try {
  connectDB();
} catch (error) {
  console.error('Database connection error:', error);
  // Continue even if DB connection fails
}

// Configure routes
const routes = {
  '/api/auth': '../modules/auth/auth.routes',
  '/api/users': '../modules/user/user.routes',
  '/api/otp': '../modules/otp/otp.routes',
  '/api/notifications': '../modules/notifications/notification.routes',
  '/api/service-categories': '../modules/serviceCategories/serviceCategory.routes',
  '/api/services': '../modules/serviceCategories/servicess/service.routes',
  '/api/addresses': '../modules/address/address.routes',
  '/api/customer-profiles': '../modules/user/customer/customerProfile.routes',
  '/api/worker-profiles': '../modules/user/worker/workerProfile/workerProfile.routes',
  '/api/worker-documents': '../modules/user/worker/workerDocuments/workerDocuments.routes',
  '/api/worker-services': '../modules/user/worker/workerService/workerService.routes',
  '/api/bookings': '../modules/booking/booking.routes',
  '/api/payments': '../modules/payment/payment.routes',
  '/api/reviews': '../modules/review/review.routes'
};

// Register routes
Object.entries(routes).forEach(([path, routeModule]) => {
  try {
    const route = require(routeModule);
    app.use(path, route);
  } catch (error) {
    console.error(`Error loading route ${path}:`, error.message);
  }
});

// Basic routes
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile('login.html', { root: path.join(__dirname, '../public') });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
// Set higher limit for event listeners
require('events').EventEmitter.defaultMaxListeners = 15;

function startServer(port) {
  // Validate port number
  port = parseInt(port);
  if (port >= 65536) {
    console.error('No available ports found in range');
    process.exit(1);
  }

  // Create HTTP server
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Try accessing: http://localhost:${port}/login.html`);
    console.log(`Or alternative URL: http://localhost:${port}/login`);
  });

  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying port ${port + 1}...`);
      server.close();
      startServer(port + 1);
    } else {
      console.error('Server error:', error);
    }
  });
  
  return server;
}

// Start the server with initial port
const server = startServer(PORT);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  server.close(() => process.exit(1));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  server.close(() => process.exit(1));
});