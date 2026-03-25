// server.js
require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app'); // your existing app

const PORT = process.env.PORT || 5000;

require('events').EventEmitter.defaultMaxListeners = 15;

// Connect to database
console.log('Starting server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', PORT);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Server startup complete');
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});