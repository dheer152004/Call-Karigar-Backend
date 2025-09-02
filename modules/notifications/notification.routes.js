const express = require('express');
const router = express.Router();
const {
    createNotification,
    getUserNotifications,
    markAsRead,
    deleteNotification,
    markAllAsRead
} = require('../notifications/notification.controller');
const { protect, authorize } = require('../../middleware/auth');

// All routes are protected
router.use(protect);

// Admin routes
router.post('/', authorize('admin'), createNotification);

// User routes
router.get('/', getUserNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
