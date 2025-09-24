const WorkerIndependentService = require('./workerIndependentService.model');
const WorkerProfile = require('../../../worker/workerProfile/workerProfile.model');
const User = require('../../../../user/user.model');
// const WorkerProfile = require('../workerProfile/workerProfile.model');
// const User = require('../../user/user.model');

// Add a new independent service
exports.addIndependentService = async (req, res) => {
    try {
        const { serviceName, description, price, experience } = req.body;

        // Create independent service without checking worker profile
        const independentService = await WorkerIndependentService.create({
            workerId: req.user._id,
            serviceName,
            description,
            price,
            experience,
            isActive: true
        });

        return res.status(201).json({
            success: true,
            message: 'Independent service added successfully',
            data: independentService
        });

    } catch (error) {
        console.error('Error adding independent service:', error);
        return res.status(500).json({
            success: false,
            message: 'Error adding independent service',
            error: error.message
        });
    }
};

// Get all independent services (Public endpoint)
exports.getWorkerIndependentServices = async (req, res) => {
    try {
        // Get all active services with worker details
        const services = await WorkerIndependentService.find({ isActive: true })
            .populate({
                path: 'workerId',
                select: 'name phone email photo'
            });

        return res.status(200).json({
            success: true,
            count: services.length,
            data: services
        });
    } catch (error) {
        console.error('Error fetching independent services:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching independent services',
            error: error.message
        });
    }
};

// Get all independent services of a specific worker (Public endpoint)
exports.getWorkerSpecificIndependentServices = async (req, res) => {
    try {
        const { workerId } = req.params;

        // Get worker details first
        const workerProfile = await WorkerProfile.findOne({ userId: workerId })
            .populate('userId', 'name phone email photo')
            .select('userId');

        if (!workerProfile) {
            return res.status(404).json({
                success: false,
                message: 'Worker not found'
            });
        }

        // Get all active services of this worker
        const services = await WorkerIndependentService.find({
            workerId,
            isActive: true
        });

        return res.status(200).json({
            success: true,
            worker: workerProfile.userId,
            count: services.length,
            data: services
        });

    } catch (error) {
        console.error('Error fetching independent services:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching independent services',
            error: error.message
        });
    }
};

// Update an independent service
exports.updateIndependentService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const updates = req.body;

        const service = await WorkerIndependentService.findOne({
            _id: serviceId,
            workerId: req.user._id
        });

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        Object.keys(updates).forEach(key => {
            if (key !== 'workerId') { // Prevent updating workerId
                service[key] = updates[key];
            }
        });

        await service.save();

        return res.status(200).json({
            success: true,
            message: 'Service updated successfully',
            data: service
        });

    } catch (error) {
        console.error('Error updating independent service:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating independent service',
            error: error.message
        });
    }
};

// Delete/Deactivate an independent service
exports.deleteIndependentService = async (req, res) => {
    try {
        const { serviceId } = req.params;

        const service = await WorkerIndependentService.findOne({
            _id: serviceId,
            workerId: req.user._id
        });

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        service.isActive = false;
        await service.save();

        return res.status(200).json({
            success: true,
            message: 'Service deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting independent service:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting independent service',
            error: error.message
        });
    }
};