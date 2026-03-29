const mongoose = require('mongoose');
const Booking = require('./booking.model');
const WorkerService = require('../user/worker/workerService/workerService.model');
const Payment = require('../payment/payment.model');
const Coupon = require('../coupon/coupon.model');
const CustomerProfile = require('../user/customer/customerProfile.model');
const WorkerProfile = require('../user/worker/workerProfile/workerProfile.model');
const bookingService = require('./booking.service');
const { updateBookingStatus } = require('./booking.service.updateStatus');

const incrementCancellationStats = async (booking) => {
    try {
        await Promise.all([
            CustomerProfile.updateOne(
                { _id: booking.customerId },
                { $inc: { 'stats.cancelledBookings': 1 } }
            ),
            WorkerProfile.updateOne(
                { _id: booking.workerId },
                { $inc: { 'stats.cancelledJobs': 1 } }
            )
        ]);
    } catch (e) {
        // Stats updates should not block cancellation
        console.error('Error incrementing cancellation stats:', e.message);
    }
};

const validateCancellableStatus = (booking) => {
    if (booking.status === 'cancelled') {
        return { ok: false, message: 'Booking is already cancelled' };
    }
    if (booking.status === 'completed') {
        return { ok: false, message: 'Completed booking cannot be cancelled' };
    }
    return { ok: true };
};

const cancelBookingInternal = async ({ req, res, cancelledBy, roleCheck }) => {
    const { bookingId } = req.params;
    const reason = req.body?.reason || `Cancelled by ${cancelledBy}`;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const canCancel = validateCancellableStatus(booking);
    if (!canCancel.ok) {
        return res.status(400).json({ success: false, message: canCancel.message });
    }

    if (roleCheck) {
        const roleCheckResult = roleCheck(booking);
        if (!roleCheckResult.ok) {
            return res.status(roleCheckResult.status || 403).json({
                success: false,
                message: roleCheckResult.message
            });
        }
    }

    booking.status = 'cancelled';
    booking.cancelledBy = cancelledBy;
    booking.cancellationReason = reason;
    await booking.save();

    await incrementCancellationStats(booking);

    await Promise.all([
        bookingService.createBookingNotification(
            booking,
            bookingService.NOTIFICATION_TYPES.BOOKING_CANCELLED,
            booking.customerId,
            'customer'
        ),
        bookingService.createBookingNotification(
            booking,
            bookingService.NOTIFICATION_TYPES.BOOKING_CANCELLED,
            booking.workerId,
            'worker'
        )
    ]);

    return res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: booking
    });
};

exports.handleBookingRequest = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { action, rejectionReason } = req.body;

        // Validate action
        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Must be either "accept" or "reject"'
            });
        }

        // Find the booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Verify that the worker is the one assigned to this booking
        if (booking.workerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to handle this booking'
            });
        }

        // Check if booking can be accepted/rejected
        if (booking.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot ${action} booking that is not in pending state`
            });
        }

        // Update booking status based on action
        if (action === 'accept') {
            booking.status = 'confirmed';
        } else {
            booking.status = 'cancelled';
            booking.cancellationReason = rejectionReason || 'Rejected by worker';
            booking.cancelledBy = 'worker';
        }

        booking.workerResponseTime = new Date();
        await booking.save();

        if (action === 'reject') {
            await incrementCancellationStats(booking);
        }

        // Send notifications to customer
        const notificationType = action === 'accept' ? 
            bookingService.NOTIFICATION_TYPES.BOOKING_CONFIRMED :
            bookingService.NOTIFICATION_TYPES.BOOKING_CANCELLED;

        await bookingService.createBookingNotification(
            booking,
            notificationType,
            booking.customerId,
            'customer'
        );

        res.status(200).json({
            success: true,
            message: `Booking ${action === 'accept' ? 'accepted' : 'rejected'} successfully`,
            data: booking
        });

    } catch (error) {
        console.error('Error handling booking request:', error);
        res.status(500).json({
            success: false,
            message: 'Error handling booking request',
            error: error.message
        });
    }
};

// @desc    Cancel booking as customer
// @route   PATCH /api/bookings/:bookingId/cancel/customer
// @access  Private (Customer only)
exports.cancelBookingAsCustomer = async (req, res) => {
    try {
        return await cancelBookingInternal({
            req,
            res,
            cancelledBy: 'customer',
            roleCheck: (booking) => {
                if (booking.customerId.toString() !== req.user._id.toString()) {
                    return { ok: false, status: 403, message: 'Not authorized to cancel this booking' };
                }
                return { ok: true };
            }
        });
    } catch (error) {
        console.error('Cancel booking (customer) error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error cancelling booking',
            error: error.message
        });
    }
};

// @desc    Cancel booking as worker
// @route   PATCH /api/bookings/:bookingId/cancel/worker
// @access  Private (Worker only)
exports.cancelBookingAsWorker = async (req, res) => {
    try {
        return await cancelBookingInternal({
            req,
            res,
            cancelledBy: 'worker',
            roleCheck: (booking) => {
                if (booking.workerId.toString() !== req.user._id.toString()) {
                    return { ok: false, status: 403, message: 'Not authorized to cancel this booking' };
                }
                return { ok: true };
            }
        });
    } catch (error) {
        console.error('Cancel booking (worker) error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error cancelling booking',
            error: error.message
        });
    }
};

// @desc    Cancel booking as admin
// @route   PATCH /api/bookings/:bookingId/cancel/admin
// @access  Private (Admin only)
exports.cancelBookingAsAdmin = async (req, res) => {
    try {
        return await cancelBookingInternal({
            req,
            res,
            cancelledBy: 'admin'
        });
    } catch (error) {
        console.error('Cancel booking (admin) error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error cancelling booking',
            error: error.message
        });
    }
};

exports.createBooking = async (req, res) => {
    console.log('Creating booking with user:', req.user);
    console.log('Request body:', req.body);
    
    try {
        // Check if user is a customer
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                success: false,
                message: 'Only customers can create bookings'
            });
        }

        // Validate required fields from request body
        const { workerId, workerServiceId, address_id, bookingDate, timeSlot, paymentMethod } = req.body;
        
        if (!workerId || !workerServiceId || !timeSlot || !address_id || !bookingDate || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                required: ['workerId', 'workerServiceId', 'bookingDate', 'timeSlot', 'address_id', 'paymentMethod']
            });
        }

        // Validate workerId format and convert if needed
        let validatedWorkerId;
        try {
            if (!mongoose.Types.ObjectId.isValid(workerId)) {
                // If it's not a valid ObjectId, check if it's a valid UUID
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                if (!uuidRegex.test(workerId)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid workerId format. Must be a valid UUID'
                    });
                }
                validatedWorkerId = workerId;
            } else {
                // Convert ObjectId to the corresponding User's UUID
                const worker = await mongoose.model('User').findOne({ _id: workerId });
                if (!worker) {
                    return res.status(404).json({
                        success: false,
                        message: 'Worker not found'
                    });
                }
                validatedWorkerId = worker._id; // This will be the UUID
            }
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'Error validating worker ID',
                error: err.message
            });
        }

        // Validate paymentMethod
        if (!['online', 'cash'].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method. Must be either "online" or "cash"'
            });
        }

        // Get worker service with populated service details
        const workerService = await WorkerService.findById(workerServiceId)
            .populate('serviceId', 'title description baseprice');
        if (!workerService) {
            return res.status(404).json({
                success: false,
                message: 'Worker service not found'
            });
        }

        // Verify that the worker ID matches the worker service
        if (workerService.workerId.toString() !== validatedWorkerId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Worker ID does not match the service provider'
            });
        }

        // Calculate base price and fees
        const baseAmount = workerService.customPrice;
        const serviceFeePercentage = 0.15; // 15%
        const serviceFee = baseAmount * serviceFeePercentage;
        const subTotal = baseAmount + serviceFee;

        // Parse and validate booking date
        const parsedBookingDate = new Date(bookingDate);
        if (isNaN(parsedBookingDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking date format. Use YYYY-MM-DD'
            });
        }

        // Parse time slot (format: "09:00-11:00")
        const cleanTimeSlot = timeSlot.replace(/['"\s]/g, ''); // Remove quotes and spaces
        const [startTime, endTime] = cleanTimeSlot.split('-');

        if (!startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Invalid time slot format. Should be "HH:MM-HH:MM"'
            });
        }

        // Validate time format
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid time format. Use 24-hour format (HH:MM)'
            });
        }

        // Initialize discount object
        const discount = {
            couponCode: null,
            percentage: 0,
            discountAmount: 0
        };

        // Apply coupon discount if provided
        if (req.body.couponCode) {
            const searchCode = req.body.couponCode.toUpperCase();
            console.log('Searching for coupon:', searchCode);
            
            // First, find any coupon with this code regardless of dates
            const anyCoupon = await Coupon.findOne({ code: searchCode });
            console.log('Any coupon found with this code:', anyCoupon);

            // Now search with date validation
            const currentDate = new Date();
            console.log('Current date:', currentDate);
            
            const coupon = await Coupon.findOne({ 
                code: searchCode,
                validFrom: { $lte: currentDate },
                validUntil: { $gte: currentDate }
            });

            console.log('Valid coupon found:', coupon);

            if (!coupon) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired coupon code'
                });
            }

            // Check if coupon has reached max usage
            if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon has reached maximum usage limit'
                });
            }

            // Check minimum order value
            if (subTotal < coupon.minOrderValue) {
                return res.status(400).json({
                    success: false,
                    message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon`
                });
            }

            // Verify service eligibility
            if (coupon.applicableServices && coupon.applicableServices.length > 0) {
                const serviceId = workerService.serviceId._id;
                if (!coupon.applicableServices.includes(serviceId)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Coupon not applicable for this service'
                    });
                }
            }

            // Calculate discount
            let discountAmount = 0;
            if (coupon.type === 'percentage') {
                discountAmount = (subTotal * coupon.value) / 100;
                if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                    discountAmount = coupon.maxDiscount;
                }
                discount.percentage = coupon.value;
            } else {
                discountAmount = coupon.value;
            }

            discount.couponCode = coupon.code;
            discount.discountAmount = discountAmount;

            // Increment coupon usage
            await Coupon.findByIdAndUpdate(coupon._id, {
                $inc: { usageCount: 1 }
            });
        }

        // Calculate final total amount
        const totalAmount = subTotal - discount.discountAmount;

        // Create booking with all required fields
        const booking = await Booking.create({
            customerId: req.user._id.toString(),
            workerId: validatedWorkerId.toString(),
            workerServiceId: workerServiceId.toString(),
            address_id,
            scheduledTimeSlot: {
                start: startTime,
                end: endTime
            },
            bookingDate: parsedBookingDate,
            subTotal,
            discount,
            totalAmount,
            paymentMethod,
            notes: req.body.notes,
            status: paymentMethod === 'online' ? 'pending' : 'confirmed'
        });

        // Payment logic for online payment
        if (paymentMethod === 'online') {
            // Create payment record
            const payment = await Payment.create({
                bookingId: booking._id.toString(),
                customerId: req.user._id.toString(),
                workerId: validatedWorkerId.toString(),
                amount: totalAmount,
                status: 'pending'
            });

            // Add payment reference to booking
            booking.paymentId = payment._id;
            await booking.save();

            // Create notifications
            await Promise.all([
                bookingService.createBookingNotification(
                    booking, 
                    bookingService.NOTIFICATION_TYPES.BOOKING_CREATED,
                    req.user._id,
                    'customer'
                ),
                bookingService.createBookingNotification(
                    booking,
                    bookingService.NOTIFICATION_TYPES.BOOKING_CREATED,
                    booking.workerId,
                    'worker'
                )
            ]);

            // Return booking with payment details and price breakdown
            return res.status(201).json({
                success: true,
                data: {
                    booking,
                    payment,
                    priceBreakdown: {
                        workerPrice: baseAmount,
                        serviceFee,
                        subTotal,
                        discount: {
                            couponCode: discount.couponCode,
                            percentage: discount.percentage,
                            discountAmount: discount.discountAmount
                        },
                        totalAmount
                    },
                    message: 'Booking created successfully. Payment pending.'
                }
            });
        }

        // For cash payments, create notifications and return booking details
        await Promise.all([
            bookingService.createBookingNotification(
                booking, 
                bookingService.NOTIFICATION_TYPES.BOOKING_CREATED,
                req.user._id,
                'customer'
            ),
            bookingService.createBookingNotification(
                booking,
                bookingService.NOTIFICATION_TYPES.BOOKING_CREATED,
                booking.workerId,
                'worker'
            )
        ]);

        return res.status(201).json({
            success: true,
            data: {
                booking,
                message: 'Booking created successfully'
            }
        });
    } catch (error) {
        console.error('Error in booking process:', error);
        return res.status(500).json({
            success: false,
            message: 'Error processing booking',
            error: error.message
        });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('customerId', 'name email')
            .populate('workerId', 'name email')
            .populate({
                path: 'workerServiceId',
                populate: {
                    path: 'serviceId',
                    select: 'title description baseprice'
                }
            })
            .populate('address_id');

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message
        });
    }
};

exports.getCustomerBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ customerId: req.user._id })
            .populate('workerId', 'name email phone')
            .populate({
                path: 'workerServiceId',
                populate: {
                    path: 'serviceId',
                    select: 'title description baseprice'
                }
            })
            .populate('address_id')
            .sort({ scheduledDate: -1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('Get customer bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer bookings',
            error: error.message
        });
    }
};

exports.getWorkerBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ workerId: req.user._id })
            .populate('customerId', 'name email phone')
            .populate({
                path: 'workerServiceId',
                populate: {
                    path: 'serviceId',
                    select: 'title description baseprice'
                }
            })
            .populate('address_id')
            .sort({ scheduledDate: -1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('Get worker bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching worker bookings',
            error: error.message
        });
    }
};

exports.getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('customerId', 'name email phone')
            .populate('workerId', 'name email phone')
            .populate({
                path: 'workerServiceId',
                populate: {
                    path: 'serviceId',
                    select: 'title description baseprice'
                }
            })
            .populate('address_id');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check authorization
        if (req.user.role !== 'admin' && 
            req.user._id.toString() !== booking.customerId._id.toString() && 
            req.user._id.toString() !== booking.workerId._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this booking'
            });
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking',
            error: error.message
        });
    }
};

exports.updateBooking = async (req, res) => {
    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check authorization
        console.log("user hhhhhaaaaaa:", req.user);
        if (req.user.role !== 'admin' &&
            req.user._id.toString() !== booking.customerId.toString() && 
            req.user._id.toString() !== booking.workerId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this booking'
            });

        }

        booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Create notifications for both customer and worker
        await Promise.all([
            bookingService.createBookingNotification(
                booking,
                bookingService.NOTIFICATION_TYPES.BOOKING_UPDATED,
                booking.customerId,
                'customer'
            ),
            bookingService.createBookingNotification(
                booking,
                bookingService.NOTIFICATION_TYPES.BOOKING_UPDATED,
                booking.workerId,
                'worker'
            )
        ]);

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating booking',
            error: error.message
        });
    }
};


module.exports = exports;
