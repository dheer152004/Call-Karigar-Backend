/*
 * Lambda/serverless entrypoint intentionally disabled.
 * This project is now running in EC2 mode using server.js.
 *
 * Previous Lambda handler code is commented out by request.
 */

module.exports.handler = async () => {
  throw new Error('Lambda handler is disabled. Run this app with node server.js on EC2.');
};