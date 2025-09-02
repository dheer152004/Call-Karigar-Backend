const express = require('express');
const router = express.Router();
const otpController = require('./otp.controller');

// Send OTP
router.post('/send', otpController.sendOTP);

// Verify OTP
router.post('/verify', otpController.verifyOTP);

// Resend OTP
router.post('/resend', otpController.resendOTP);

// Request new OTP
router.post('/request', otpController.requestNewOTP);


module.exports = router;
