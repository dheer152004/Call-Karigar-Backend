const serverless = require('serverless-http');
const app = require('./app');
const connectDB = require('./config/db');

let isConnected = false;
const serverlessHandler = serverless(app);

// AWS Lambda entrypoint
module.exports.handler = async (event, context) => {
  // Allows Lambda to return response without waiting for open DB sockets.
  context.callbackWaitsForEmptyEventLoop = false;

  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }

  return serverlessHandler(event, context);
};
