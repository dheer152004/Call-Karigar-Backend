const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUserProfile,
  updateUser,
  deleteUser,
} = require('./user.controller');
const { protect, authorize } = require('../../middleware/auth');
// const { validateRegistration, validateLogin } = require('../../middleware/validation');

// Get all users (admin only)
router.get('/all', protect, authorize('admin'), getUsers);

//Get logged in user's profile
router.get('/me', protect, getUserProfile);


// CRUD operations
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser);

module.exports = router;