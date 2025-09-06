const NotificationService = require('../../services/notificationService');

// @desc    Create a notification
// @route   POST /api/notifications
// @access  Private
exports.createNotification = async (req, res) => {
    try {
        const notification = await NotificationService.createNotification(req.body);
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
        const result = await NotificationService.getUserNotifications(req.user._id, req.query);
        res.status(200).json({
            success: true,
            totalCount: result.pagination.totalItems,
            ...result
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
        const notification = await NotificationService.markAsRead(req.params.id, req.user._id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found or you do not have permission to mark it as read'
            });
        }
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
        const notification = await NotificationService.deleteNotification(req.params.id, req.user._id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found or you do not have permission to delete it'
            });
        }
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
        await NotificationService.markAllAsRead(req.user._id);
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
