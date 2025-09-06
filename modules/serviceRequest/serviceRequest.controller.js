const ServiceRequest = require('./serviceRequest.model');
const Service = require('../serviceCategories/servicess/service.model');
const User = require('../user/user.model');
const WorkerService = require('../user/worker/workerService/workerService.model');
const NotificationService = require('../../services/notificationService');

// @desc    Create a new service request
// @route   POST /api/service-requests
// @access  Private (Customer)
exports.createServiceRequest = async (req, res) => {
    try {
        const { serviceId, description, preferredDateTime, addressId } = req.body;
        const customerId = req.user._id;

        // Get service details to get category
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Create service request
        const serviceRequest = await ServiceRequest.create({
            customerId,
            serviceId,
            serviceCategoryId: service.categoryId,
            description,
            preferredDateTime: new Date(preferredDateTime),
            location: { addressId }
        });

        // Find available workers for this service
        const availableWorkers = await WorkerService.find({
            serviceId,
            status: 'active'
        }).populate('workerId', 'name email');

        // Send notifications to all available workers
        for (const worker of availableWorkers) {
            await NotificationService.createNotification({
                userId: worker.workerId._id,
                type: 'new_service_request',
                title: 'New Service Request',
                message: `A customer has requested ${service.name} service`,
                category: 'service_request',
                priority: 'high',
                metadata: {
                    requestId: serviceRequest._id,
                    serviceId,
                    serviceName: service.name
                },
                actionUrl: `/worker/service-requests/${serviceRequest._id}`
            });
        }

        // Notify customer that request has been created
        await NotificationService.createNotification({
            userId: customerId,
            type: 'service_request_created',
            title: 'Service Request Created',
            message: `Your service request for ${service.name} has been created successfully`,
            category: 'service_request',
            metadata: {
                requestId: serviceRequest._id,
                serviceId,
                serviceName: service.name
            },
            actionUrl: `/customer/service-requests/${serviceRequest._id}`
        });

        res.status(201).json({
            success: true,
            data: serviceRequest
        });
    } catch (error) {
        console.error('Create service request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating service request',
            error: error.message
        });
    }
};

// @desc    Accept service request
// @route   POST /api/service-requests/:id/accept
// @access  Private (Worker)
exports.acceptServiceRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const workerId = req.user._id;

        const serviceRequest = await ServiceRequest.findById(requestId);
        if (!serviceRequest) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found'
            });
        }

        // Check if request is still pending
        if (serviceRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Request is already ${serviceRequest.status}`
            });
        }

        // Check if worker is qualified for this service
        const workerService = await WorkerService.findOne({
            workerId,
            serviceId: serviceRequest.serviceId,
            status: 'active'
        });

        if (!workerService) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to accept this service request'
            });
        }

        // Update request status
        serviceRequest.status = 'accepted';
        serviceRequest.acceptedBy = {
            workerId,
            timestamp: new Date()
        };
        await serviceRequest.save();

        // Get service details for notification
        const service = await Service.findById(serviceRequest.serviceId);
        const worker = await User.findById(workerId);

        // Notify customer that request has been accepted
        await NotificationService.createNotification({
            userId: serviceRequest.customerId,
            type: 'service_request_accepted',
            title: 'Service Request Accepted',
            message: `Your service request for ${service.name} has been accepted by ${worker.name}`,
            category: 'service_request',
            priority: 'high',
            metadata: {
                requestId: serviceRequest._id,
                serviceId: service._id,
                serviceName: service.name,
                workerName: worker.name,
                workerId
            },
            actionUrl: `/customer/service-requests/${serviceRequest._id}`
        });

        res.status(200).json({
            success: true,
            data: serviceRequest
        });
    } catch (error) {
        console.error('Accept service request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error accepting service request',
            error: error.message
        });
    }
};

// @desc    Reject service request
// @route   POST /api/service-requests/:id/reject
// @access  Private (Worker)
exports.rejectServiceRequest = async (req, res) => {
    try {
        const { reason } = req.body;
        const requestId = req.params.id;
        const workerId = req.user._id;

        const serviceRequest = await ServiceRequest.findById(requestId);
        if (!serviceRequest) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found'
            });
        }

        // Check if request is still pending
        if (serviceRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Request is already ${serviceRequest.status}`
            });
        }

        // Add worker to rejected list
        serviceRequest.rejectedBy.push({
            workerId,
            reason,
            timestamp: new Date()
        });

        // Find other available workers who haven't rejected
        const otherWorkers = await WorkerService.find({
            serviceId: serviceRequest.serviceId,
            status: 'active',
            workerId: { 
                $nin: serviceRequest.rejectedBy.map(r => r.workerId)
            }
        }).populate('workerId', 'name email');

        // If no more workers available, mark request as expired
        if (otherWorkers.length === 0) {
            serviceRequest.status = 'expired';
            
            // Notify customer that no workers are available
            await NotificationService.createNotification({
                userId: serviceRequest.customerId,
                type: 'service_request_expired',
                title: 'No Workers Available',
                message: 'Unfortunately, no workers are currently available for your service request',
                category: 'service_request',
                priority: 'high',
                metadata: {
                    requestId: serviceRequest._id
                },
                actionUrl: `/customer/service-requests/${serviceRequest._id}`
            });
        } else {
            // Notify other workers about the request
            const service = await Service.findById(serviceRequest.serviceId);
            for (const worker of otherWorkers) {
                await NotificationService.createNotification({
                    userId: worker.workerId._id,
                    type: 'new_service_request',
                    title: 'New Service Request',
                    message: `A customer has requested ${service.name} service`,
                    category: 'service_request',
                    priority: 'high',
                    metadata: {
                        requestId: serviceRequest._id,
                        serviceId: service._id,
                        serviceName: service.name
                    },
                    actionUrl: `/worker/service-requests/${serviceRequest._id}`
                });
            }
        }

        await serviceRequest.save();

        res.status(200).json({
            success: true,
            data: serviceRequest
        });
    } catch (error) {
        console.error('Reject service request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting service request',
            error: error.message
        });
    }
};

// @desc    Get service requests for worker
// @route   GET /api/service-requests/worker
// @access  Private (Worker)
exports.getWorkerServiceRequests = async (req, res) => {
    try {
        const workerId = req.user._id;

        // Get worker's services
        const workerServices = await WorkerService.find({ workerId });
        const serviceIds = workerServices.map(ws => ws.serviceId);

        // Find requests for worker's services that are pending and not rejected by this worker
        const requests = await ServiceRequest.find({
            serviceId: { $in: serviceIds },
            status: 'pending',
            'rejectedBy.workerId': { $ne: workerId },
            expiresAt: { $gt: new Date() }
        }).populate('customerId', 'name')
          .populate('serviceId')
          .populate('location.addressId');

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        console.error('Get worker service requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting service requests',
            error: error.message
        });
    }
};

// @desc    Get customer's service requests
// @route   GET /api/service-requests/customer
// @access  Private (Customer)
exports.getCustomerServiceRequests = async (req, res) => {
    try {
        const customerId = req.user._id;

        const requests = await ServiceRequest.find({ customerId })
            .populate('serviceId')
            .populate('acceptedBy.workerId', 'name phone email')
            .populate('location.addressId');

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        console.error('Get customer service requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting service requests',
            error: error.message
        });
    }
};
