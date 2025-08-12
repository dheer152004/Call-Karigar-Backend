const Service = require('../models/Service');
const ServiceCategory = require('../models/ServiceCategory');

// @desc    Get services by category
// @route   GET /api/services/category/:categoryId
// @access  Public
exports.getServicesByCategory = async (req, res) => {
    try {
        const services = await Service.find({ service_categoryId: req.params.categoryId })
            .populate('service_categoryId', 'name description icon')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: services.length,
            data: services
        });
    } catch (error) {
        console.error('Get services by category error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching services',
            error: error.message
        });
    }
};

// @desc    Search services
// @route   GET /api/services/search
// @access  Public
exports.searchServices = async (req, res) => {
    try {
        const { q, category, minPrice, maxPrice } = req.query;
        const query = {};

        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ];
        }

        if (category) {
            query.service_categoryId = category;
        }

        if (minPrice || maxPrice) {
            query.baseprice = {};
            if (minPrice) query.baseprice.$gte = Number(minPrice);
            if (maxPrice) query.baseprice.$lte = Number(maxPrice);
        }

        const services = await Service.find(query)
            .populate('service_categoryId', 'name description icon')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: services.length,
            data: services
        });
    } catch (error) {
        console.error('Search services error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching services',
            error: error.message
        });
    }
};

// @desc    Get active services
// @route   GET /api/services/active
// @access  Public
exports.getActiveServices = async (req, res) => {
    try {
        const services = await Service.find({ isActive: true })
            .populate('service_categoryId', 'name description icon')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: services.length,
            data: services
        });
    } catch (error) {
        console.error('Get active services error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching active services',
            error: error.message
        });
    }
};

// @desc    Toggle service status
// @route   PATCH /api/services/:id/status
// @access  Private (Admin)
exports.toggleServiceStatus = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        service.isActive = !service.isActive;
        await service.save();

        const updatedService = await Service.findById(service._id)
            .populate('service_categoryId', 'name description icon');

        res.status(200).json({
            success: true,
            data: updatedService
        });
    } catch (error) {
        console.error('Toggle service status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling service status',
            error: error.message
        });
    }
};

// @desc    Create a new service
// @route   POST /api/services
// @access  Private (Admin only)
exports.createService = async (req, res) => {
    try {
        const { title, description, service_categoryId, baseprice } = req.body;

        // Validate request body
        if (!title || !service_categoryId || !baseprice) {
            return res.status(400).json({
                success: false,
                message: 'Title, service category and base price are required'
            });
        }

        // Validate base price
        if (baseprice <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Base price must be greater than 0'
            });
        }

        // Check if category exists and is active
        const category = await ServiceCategory.findById(service_categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Service category not found'
            });
        }

        if (!category.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Cannot create service in inactive category'
            });
        }

        // Create the service
        const service = await Service.create({
            title,
            description: description || '',
            service_categoryId,
            baseprice,
            isActive: true
        });

        // Fetch the populated service
        const populatedService = await Service.findById(service._id)
            .populate('service_categoryId', 'name description icon');

        res.status(201).json({
            success: true,
            data: populatedService,
            message: 'Service created successfully'
        });
    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating service',
            error: error.message
        });
    }
};

// @desc    Get all services
// @route   GET /api/services
// @access  Public
exports.getAllServices = async (req, res) => {
    try {
        const services = await Service.find()
            .populate('service_categoryId', 'name description icon')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: services.length,
            data: services
        });
    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching services',
            error: error.message
        });
    }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
exports.getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)
            .populate('service_categoryId', 'name description icon');

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        res.status(200).json({
            success: true,
            data: service
        });
    } catch (error) {
        console.error('Get service error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching service',
            error: error.message
        });
    }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private (Admin only)
exports.updateService = async (req, res) => {
    try {
        let service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Validate base price if it's being updated
        if (req.body.baseprice && req.body.baseprice <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Base price must be greater than 0'
            });
        }

        // If category is being updated, check if it exists and is active
        if (req.body.service_categoryId) {
            const category = await ServiceCategory.findById(req.body.service_categoryId);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Service category not found'
                });
            }
            if (!category.isActive) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot update to inactive category'
                });
            }
        }

        service = await Service.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('service_categoryId', 'name description icon');

        res.status(200).json({
            success: true,
            data: service,
            message: 'Service updated successfully'
        });
    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating service',
            error: error.message
        });
    }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (Admin only)
exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        await service.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Service deleted successfully'
        });
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting service',
            error: error.message
        });
    }
};

