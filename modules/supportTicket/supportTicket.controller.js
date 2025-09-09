const SupportTicket = require('./supportTicket.model');
const Booking = require('../booking/booking.model');
const NotificationService = require('../../services/notificationService');

// Create a new support ticket
exports.createTicket = async (req, res) => {
    try {
        const { bookingId, category, subject, description, attachments } = req.body;

        // Validate category
        const validCategories = ['payment', 'service', 'worker', 'booking', 'account', 'technical', 'other'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: [{
                    field: 'category',
                    message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
                }]
            });
        }

        // If bookingId is provided, verify it belongs to the user
        if (bookingId) {
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            if (booking.customerId !== req.user._id && booking.workerId !== req.user._id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to create ticket for this booking'
                });
            }
        }

        // Validate attachments if provided
        let validatedAttachments = [];
        if (attachments && !Array.isArray(attachments)) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: [{
                    field: 'attachments',
                    message: 'Attachments must be an array'
                }]
            });
        }

        // Create ticket
        const ticket = await SupportTicket.create({
            userId: req.user._id,
            userRole: req.user.role,
            bookingId,
            category,
            subject,
            description,
            attachments: attachments || []
        });

        // Populate user details
        const populatedTicket = await SupportTicket.findById(ticket._id)
            .populate('userId', 'name email phone')
            .populate('bookingId')
            .populate('assignedTo', 'name email');

        // Find admin users to notify
        const User = require('../user/user.model');
        const admins = await User.find({ role: 'admin' });
        
        // Create notification for each admin
        for (const admin of admins) {
            await NotificationService.notifyNewSupportTicket(populatedTicket, admin._id);
        }

        res.status(201).json({
            success: true,
            data: populatedTicket
        });
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating support ticket',
            error: error.message
        });
    }
};

// Get all tickets (with filters)
exports.getTickets = async (req, res) => {
    try {
        const query = {};
        
        // For non-admin users, show only their tickets
        if (req.user.role !== 'admin') {
            query.userId = req.user._id;
        }

        // Apply filters
        if (req.query.status) query.status = req.query.status;
        if (req.query.category) query.category = req.query.category;
        if (req.query.priority) query.priority = req.query.priority;

        // Date range filter
        if (req.query.startDate && req.query.endDate) {
            query.createdAt = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        const tickets = await SupportTicket.find(query)
            .populate('userId', 'name email phone')
            .populate('bookingId')
            .populate('assignedTo', 'name email')
            .sort({ priority: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets
        });
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tickets',
            error: error.message
        });
    }
};

// Get single ticket
exports.getTicket = async (req, res) => {
    try {
        const ticket = await SupportTicket.findOne({
            $or: [
                { _id: req.params.id },
                { ticketNumber: req.params.id.toUpperCase() }
            ]
        })
        .populate('userId', 'name email phone')
        .populate('bookingId')
        .populate('assignedTo', 'name email')
        .populate('comments.userId', 'name role');

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Check authorization
        if (req.user.role !== 'admin' && ticket.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this ticket'
            });
        }

        res.status(200).json({
            success: true,
            data: ticket
        });
    } catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching ticket',
            error: error.message
        });
    }
};

// Add comment to ticket
exports.addComment = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Check authorization
        if (req.user.role !== 'admin' && ticket.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to comment on this ticket'
            });
        }

        const comment = {
            userId: req.user._id,
            userRole: req.user.role,
            message: req.body.message,
            attachments: req.body.attachments || []
        };

        ticket.comments.push(comment);
        ticket.lastActivityAt = new Date();

        // If admin is commenting, update status to in-progress
        if (req.user.role === 'admin' && ticket.status === 'open') {
            ticket.status = 'in-progress';
        }

        await ticket.save();

        // Populate the updated ticket
        const updatedTicket = await SupportTicket.findById(ticket._id)
            .populate('userId', 'name email phone')
            .populate('bookingId')
            .populate('assignedTo', 'name email')
            .populate('comments.userId', 'name role');

        // Send notification
        await NotificationService.createNotification({
            userId: ticket.userId,
            type: 'ticket_comment',
            title: 'New Comment on Support Ticket',
            message: `${req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1)} has commented on ticket ${ticket.ticketNumber}`,
            category: 'support',
            recipientRole: ticket.userRole,
            priority: 'medium',
            metadata: {
                ticketId: ticket._id,
                ticketNumber: ticket.ticketNumber,
                commenterRole: req.user.role
            },
            actionUrl: `/${ticket.userRole}/support-tickets/${ticket._id}`
        });
        

        res.status(200).json({
            success: true,
            data: updatedTicket
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding comment',
            error: error.message
        });
    }
};

// Update ticket status (Admin only)
exports.updateTicketStatus = async (req, res) => {
    try {
        const { status, resolution, assignedTo } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);
        const User = require('../user/user.model');

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Validate status
        const validStatuses = ['open', 'in-progress', 'resolved', 'closed', 'reopened'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: [{
                    field: 'status',
                    message: `Status must be one of: ${validStatuses.join(', ')}`
                }]
            });
        }

        // Validate assignedTo if provided
        if (assignedTo) {
            const assignedAdmin = await User.findOne({ _id: assignedTo, role: 'admin' });
            if (!assignedAdmin) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: [{
                        field: 'assignedTo',
                        message: 'Invalid admin user ID'
                    }]
                });
            }
        }

        // Update status and last activity
        ticket.status = status;
        ticket.lastActivityAt = new Date();

        // Handle specific status changes
        if (status === 'resolved') {
            ticket.resolution = {
                message: resolution,
                resolvedBy: req.user._id,
                resolvedAt: new Date()
            };
        } else if (status === 'closed') {
            ticket.closedAt = new Date();
        } else if (status === 'reopened') {
            ticket.reopenedAt = new Date();
            ticket.reopenReason = req.body.reopenReason;
        }

        // Update assigned admin if provided
        if (assignedTo) {
            ticket.assignedTo = assignedTo;
        }

        await ticket.save();

        // Populate the updated ticket
        const updatedTicket = await SupportTicket.findById(ticket._id)
            .populate('userId', 'name email phone')
            .populate('bookingId')
            .populate('assignedTo', 'name email')
            .populate('comments.userId', 'name role');

        // Send notification
        await NotificationService.createNotification({
            userId: ticket.userId,
            type: 'ticket_updated',
            title: 'Support Ticket Updated',
            message: `Your ticket ${ticket.ticketNumber} has been updated to status: ${status}`,
            category: 'support',
            recipientRole: ticket.userRole,
            priority: 'high',
            metadata: {
                ticketId: ticket._id,
                ticketNumber: ticket.ticketNumber,
                status,
                resolution: resolution || undefined
            },
            actionUrl: `/${ticket.userRole}/support-tickets/${ticket._id}`
        });

        res.status(200).json({
            success: true,
            data: updatedTicket
        });
    } catch (error) {
        console.error('Update ticket status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating ticket status',
            error: error.message
        });
    }
};

// Get ticket statistics (Admin only)
exports.getTicketStats = async (req, res) => {
    try {
        const stats = await SupportTicket.aggregate([
            {
                $facet: {
                    'statusStats': [
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    'categoryStats': [
                        {
                            $group: {
                                _id: '$category',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    'priorityStats': [
                        {
                            $group: {
                                _id: '$priority',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    'responseTime': [
                        {
                            $match: {
                                'comments.1': { $exists: true }
                            }
                        },
                        {
                            $project: {
                                firstResponse: {
                                    $arrayElemAt: ['$comments', 1]
                                },
                                createdAt: 1
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                avgResponseTime: {
                                    $avg: {
                                        $subtract: ['$firstResponse.createdAt', '$createdAt']
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Get ticket stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching ticket statistics',
            error: error.message
        });
    }
};
