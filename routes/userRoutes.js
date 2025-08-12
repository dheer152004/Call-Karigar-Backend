const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser,
  logoutUser, 
  getUsers, 
  getUserProfile,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');

// Public routes
router.post('/register', validateRegistration, registerUser);
router.post('/login', validateLogin, loginUser);

// Protected routes
router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);
router.get('/all', protect, authorize('admin'), getUsers);

// CRUD operations
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser);

module.exports = router;