const Notification = require('../models/Notification');

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private (Admin only)
exports.createNotification = async (req, res) => {
    try {
        const notification = await Notification.create({
            userId: req.body.userId,
            type: req.body.type,
            title: req.body.title,
            message: req.body.message,
            data: req.body.data
        });

        res.status(201).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating notification',
            error: error.message
        });
    }
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications',
            error: error.message
        });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Check ownership
        if (notification.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this notification'
            });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Update notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating notification',
            error: error.message
        });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Check ownership
        if (notification.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this notification'
            });
        }

        await notification.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting notification',
            error: error.message
        });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, isRead: false },
            { isRead: true }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating notifications',
            error: error.message
        });
    }
};
