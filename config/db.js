const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    if (isConnected || mongoose.connection.readyState === 1) {
      return;
    }

    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI exists:', !!mongoUri);

    if (!mongoUri) {
      throw new Error('Missing MongoDB connection string. Set MONGO_URI (or MONGODB_URI).');
    }

    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

module.exports = connectDB;