const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');

// Send OTP
router.post('/send', otpController.sendOTP);

// Verify OTP
router.post('/verify', otpController.verifyOTP);

// Resend OTP
router.post('/resend', otpController.resendOTP);

module.exports = router;
