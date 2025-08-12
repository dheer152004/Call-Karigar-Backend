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
  '/api/users': '../routes/userRoutes',
  '/api/services': '../routes/serviceRoutes',
  '/api/service-categories': '../routes/categoryRoutes',
  '/api/worker-profile': '../routes/workerProfileRoutes',
  '/api/customer-profile': '../routes/customerProfileRoutes',
  '/api/bookings': '../routes/bookingRoutes',
  '/api/reviews': '../routes/reviewRoutes',
  '/api/payments': '../routes/paymentRoutes',
  '/api/notifications': '../routes/notificationRoutes',
  '/api/worker-documents': '../routes/workerDocumentRoutes',
  '/api/worker-services': '../routes/workerServiceRoutes',
  '/api/addresses': '../routes/addressRoutes'
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

// Create HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Try accessing: http://localhost:${PORT}/login.html`);
  console.log(`Or alternative URL: http://localhost:${PORT}/login`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

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