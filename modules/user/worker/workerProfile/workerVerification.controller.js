const WorkerProfile = require('./workerProfile.model');
const NotificationService = require('../../../../services/notificationService');

/**
 * Toggle worker verification status
 * @route PATCH /api/admin/workers/:workerId/verify
 * @access Private (Admin only)
 */
exports.toggleWorkerVerification = async (req, res) => {
    try {
        const { workerId } = req.params;
        const { status, message } = req.body;

        // Find worker profile
        const workerProfile = await WorkerProfile.findOne({ userId: workerId });
        
        if (!workerProfile) {
            return res.status(404).json({
                success: false,
                message: 'Worker profile not found'
            });
        }

        // Toggle verification status
        workerProfile.isVerified = status !== undefined ? status : !workerProfile.isVerified;
        
        // If worker is being verified, also update their status to active
        if (workerProfile.isVerified) {
            workerProfile.status = 'active';
        }

        // Save the changes
        await workerProfile.save();

        // Send notification to worker
        await NotificationService.sendNotification({
            userId: workerId,
            type: 'verification',
            title: workerProfile.isVerified ? 'Profile Verified' : 'Profile Verification Update',
            message: message || (workerProfile.isVerified ? 
                'Congratulations! Your profile has been verified. You can now start accepting jobs.' : 
                'Your profile verification status has been updated.'),
            data: {
                isVerified: workerProfile.isVerified,
                status: workerProfile.status
            }
        });

        return res.json({
            success: true,
            message: `Worker verification ${workerProfile.isVerified ? 'approved' : 'revoked'} successfully`,
            data: {
                workerId: workerId,
                isVerified: workerProfile.isVerified,
                status: workerProfile.status,
                updatedAt: new Date()
            }
        });

    } catch (error) {
        console.error('Error toggling worker verification:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating worker verification status',
            error: error.message
        });
    }
};
