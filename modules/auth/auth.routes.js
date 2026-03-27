const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const authController = require('./auth.controller');

// Auth Routes
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.use(protect);
router.post('/logout', authController.logoutUser); // This will 404 until we implement logoutUser

module.exports = router;