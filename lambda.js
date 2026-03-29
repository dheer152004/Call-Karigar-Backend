const serverless = require('serverless-http');
const app = require('./app');
const connectDB = require('./config/db');

let isConnected = false;

// Pass request:true so req.apiGateway is populated in your fallback parser
const serverlessHandler = serverless(app, { request: true });

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  // Decode base64 body from API Gateway before Express sees it
  if (event.body && event.isBase64Encoded) {
    event.body = Buffer.from(event.body, 'base64').toString('utf8');
    event.isBase64Encoded = false;
  }

  // Force Content-Type so express.json() always parses the body
  if (event.body && event.headers) {
    event.headers['content-type'] = 'application/json';
    event.headers['Content-Type'] = 'application/json';
  }

  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }

  return serverlessHandler(event, context);
};