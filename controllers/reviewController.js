const Review = require('../models/Review');
const Booking = require('../models/Booking');
const WorkerProfile = require('../models/WorkerProfile');

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private (Customer only)
exports.createReview = async (req, res) => {
    try {
        // Check if user is customer
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                success: false,
                message: 'Only customers can create reviews'
            });
        }

        // Check if booking exists and is completed
        const booking = await Booking.findById(req.body.bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Can only review completed bookings'
            });
        }

        // Check if review already exists for this booking
        const existingReview = await Review.findOne({ bookingId: req.body.bookingId });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'Review already exists for this booking'
            });
        }

        const review = await Review.create({
            customerId: req.user._id,
            workerId: booking.workerId,
            bookingId: booking._id,
            serviceId: booking.serviceId,
            ...req.body
        });

        // Update worker's rating average
        const workerProfile = await WorkerProfile.findOne({ userId: booking.workerId });
        if (workerProfile) {
            const reviews = await Review.find({ workerId: booking.workerId });
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            workerProfile.ratingAverage = totalRating / reviews.length;
            workerProfile.ratingCount = reviews.length;
            await workerProfile.save();
        }

        res.status(201).json({
            success: true,
            data: review
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating review',
            error: error.message
        });
    }
};

// @desc    Get all reviews for a worker
// @route   GET /api/reviews/worker/:workerId
// @access  Public
exports.getWorkerReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ workerId: req.params.workerId })
            .populate('customerId', 'name')
            .populate('serviceId', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        console.error('Get worker reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching worker reviews',
            error: error.message
        });
    }
};

// @desc    Get all reviews by a customer
// @route   GET /api/reviews/customer/:customerId
// @access  Private (Owner or Admin)
exports.getCustomerReviews = async (req, res) => {
    try {
        // Check authorization
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.customerId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view these reviews'
            });
        }

        const reviews = await Review.find({ customerId: req.params.customerId })
            .populate('workerId', 'name')
            .populate('serviceId', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        console.error('Get customer reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer reviews',
            error: error.message
        });
    }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (Review Owner or Admin)
exports.updateReview = async (req, res) => {
    try {
        let review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check ownership or admin status
        if (review.customerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this review'
            });
        }

        review = await Review.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('customerId', 'name')
            .populate('workerId', 'name')
            .populate('serviceId', 'title');

        // Update worker's rating average
        const workerProfile = await WorkerProfile.findOne({ userId: review.workerId });
        if (workerProfile) {
            const reviews = await Review.find({ workerId: review.workerId });
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            workerProfile.ratingAverage = totalRating / reviews.length;
            workerProfile.ratingCount = reviews.length;
            await workerProfile.save();
        }

        res.status(200).json({
            success: true,
            data: review
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating review',
            error: error.message
        });
    }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (Review Owner or Admin)
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check ownership or admin status
        if (review.customerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this review'
            });
        }

        await review.deleteOne();

        // Update worker's rating average
        const workerProfile = await WorkerProfile.findOne({ userId: review.workerId });
        if (workerProfile) {
            const reviews = await Review.find({ workerId: review.workerId });
            if (reviews.length > 0) {
                const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
                workerProfile.ratingAverage = totalRating / reviews.length;
                workerProfile.ratingCount = reviews.length;
            } else {
                workerProfile.ratingAverage = 0;
                workerProfile.ratingCount = 0;
            }
            await workerProfile.save();
        }

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting review',
            error: error.message
        });
    }
};
