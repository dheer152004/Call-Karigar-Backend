const WorkerService = require('./workerService.model');
const WorkerProfile = require('../workerProfile/workerProfile.model');
const Service = require('../../../serviceCategories/servicess/service.model');
const User = require('../../../user/user.model');  // Fixed the path to User model

// @desc    Add service to worker's profile
// @route   POST /api/worker-services
// @access  Private (Worker only)
exports.addWorkerService = async (req, res) => {
    try {
        const { serviceId, price, experience, description } = req.body;

        // Validate price
        if (!price || price <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be a positive number'
            });
        }

        // Check if service exists
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Check if worker profile exists
        const workerProfile = await WorkerProfile.findOne({ _id: req.user._id });
        if (!workerProfile) {
            return res.status(404).json({
                success: false,
                message: 'Worker profile not found'
            });
        }

        // Check if worker already offers this service
        const existingService = await WorkerService.findOne({
            workerId: workerProfile._id,
            serviceId
        });

        if (existingService) {
            return res.status(400).json({
                success: false,
                message: 'You already offer this service'
            });
        }

        const workerService = await WorkerService.create({
            workerId: workerProfile._id, // Use userId instead of _id
            serviceId,
            customPrice: price,
            experience: experience || '0 years',
            description: description || '',
            isActive: true
        });

        // Populate service details
        const populatedWorkerService = await WorkerService.findById(workerService._id)
            .populate('serviceId', 'title description baseprice')
            .populate('workerId', 'bio skills');

        res.status(201).json({
            success: true,
            data: populatedWorkerService
        });
    } catch (error) {
        console.error('Add worker service error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding worker service',
            error: error.message
        });
    }
};

// @desc    Flexible search for all worker services by any requirement
// @route   GET/POST /api/worker-services/search-all
// @access  Public
exports.searchWorkerServicesFlexible = async (req, res) => {
    try {
        // Accept from query or body
        const params = req.method === 'POST' ? req.body : req.query;
        const {
            keyword,
            serviceId,
            minPrice,
            maxPrice,
            skills,
            minRating,
            page = 1,
            limit = 20
        } = params;

        // Build base query
        const match = { isActive: true };
        if (serviceId) match.serviceId = serviceId;
        if (minPrice || maxPrice) {
            match.customPrice = {};
            if (minPrice) match.customPrice.$gte = Number(minPrice);
            if (maxPrice) match.customPrice.$lte = Number(maxPrice);
        }

        // Find candidate worker services
        let workerServices = await WorkerService.find(match).lean();
        if (!workerServices.length) {
            return res.status(200).json({ success: true, count: 0, data: [] });
        }

        // Get service details
        const serviceIds = [...new Set(workerServices.map(ws => ws.serviceId.toString()))];
        const services = await Service.find({ _id: { $in: serviceIds } }).select('title description basePrice').lean();
        const servicesMap = new Map(services.map(s => [s._id.toString(), s]));

        // Get worker details
        const workerIds = [...new Set(workerServices.map(ws => ws.workerId.toString()))];
        const workers = await User.find({ _id: { $in: workerIds }, role: 'worker' }).select('name email phone').lean();
        const workersMap = new Map(workers.map(w => [w._id.toString(), w]));

        // Get worker profiles
        const workerProfiles = await WorkerProfile.find({ userId: { $in: workerIds } }).select('userId bio skills photo username rating availability').lean();
        const profilesMap = new Map(workerProfiles.map(p => [p.userId.toString(), p]));

        // Normalize skills
        let reqSkills = [];
        if (skills) {
            if (Array.isArray(skills)) reqSkills = skills.map(s => s.toString().toLowerCase().trim());
            else reqSkills = skills.toString().split(',').map(s => s.toLowerCase().trim());
        }

        // Filter by keyword, skills, rating
        const keywordRegex = keyword ? new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
        let filtered = workerServices.filter(ws => {
            const service = servicesMap.get(ws.serviceId.toString()) || {};
            const worker = workersMap.get(ws.workerId.toString()) || {};
            const profile = profilesMap.get(ws.workerId.toString()) || {};

            // Keyword: match service title/description
            if (keywordRegex) {
                const hay = [service.title, service.description].join(' ');
                if (!keywordRegex.test(hay)) return false;
            }
            // Skills: require all requested skills in profile
            if (reqSkills.length) {
                const workerSkills = (profile.skills || []).map(s => s.toString().toLowerCase());
                const hasAll = reqSkills.every(rs => workerSkills.includes(rs));
                if (!hasAll) return false;
            }
            // Rating
            if (minRating) {
                const rating = Number(profile.rating || 0);
                if (rating < Number(minRating)) return false;
            }
            return true;
        });

        // Pagination
        const total = filtered.length;
        const pageNum = Math.max(1, Number(page) || 1);
        const perPage = Math.max(1, Math.min(100, Number(limit) || 20));
        const start = (pageNum - 1) * perPage;
        const paged = filtered.slice(start, start + perPage);

        // Build response
        const results = paged.map(ws => {
            const worker = workersMap.get(ws.workerId.toString()) || {};
            const profile = profilesMap.get(ws.workerId.toString()) || {};
            const service = servicesMap.get(ws.serviceId.toString()) || {};
            return {
                _id: ws._id,
                workerId: ws.workerId,
                serviceId: ws.serviceId,
                customPrice: ws.customPrice,
                experience: ws.experience,
                description: ws.description,
                isActive: ws.isActive,
                serviceDetails: service,
                workerProfile: profile,
                basicInfo: worker ? { name: worker.name, email: worker.email, phone: worker.phone } : {}
            };
        });

        return res.status(200).json({ success: true, total, page: pageNum, perPage, count: results.length, data: results });
    } catch (error) {
        console.error('Flexible search worker services error:', error);
        return res.status(500).json({ success: false, message: 'Error searching worker services', error: error.message });
    }
};

// @desc    Get all services offered by a worker
// @route   GET /api/worker-services/worker/:workerId
// @access  Public
exports.getWorkerServices = async (req, res) => {
    try {
        const workerId = req.params.workerId;
        const services = await WorkerService.find({ workerId, isActive: true })
            .populate('serviceId', 'title description baseprice')
            .populate('workerId', 'bio skills');

        res.status(200).json({
            success: true,
            count: services.length,
            data: services
        });
    } catch (error) {
        console.error('Get worker services error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching worker services',
            error: error.message
        });
    }
};

// @desc    Get workers offering a specific service
// @route   GET /api/worker-services/service/:serviceId
// @access  Public
exports.getServiceWorkers = async (req, res) => {
    try {
        const serviceId = req.params.serviceId;
        
        // Find the service first to ensure it exists
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Find all worker services for this service with populated data
        const workerServices = await WorkerService.find({ 
            serviceId: serviceId,
            isActive: true 
        }).lean();  // Use lean() for better performance

        // Get unique worker IDs
        const workerIds = [...new Set(workerServices.map(ws => ws.workerId))];

        // Fetch all workers in one query
        const workers = await User.find({
            _id: { $in: workerIds },
            role: 'worker'  // Ensure we only get worker users
        }).select('name email phone').lean();

        // Create a map of worker data for quick lookup
        const workersMap = new Map(workers.map(w => [w._id.toString(), w]));

        // Fetch all worker profiles in one query
        const workerProfiles = await WorkerProfile.find({
            userId: { $in: workerIds }
        }).select('userId bio skills photo username rating availability').lean();

        // Create a map of worker profiles for quick lookup
        const profilesMap = new Map(workerProfiles.map(p => [p.userId.toString(), p]));

        // Combine all the data
        const workersWithDetails = workerServices.map(ws => {
            const worker = workersMap.get(ws.workerId.toString());
            const profile = profilesMap.get(ws.workerId.toString()) || {};

            return {
                _id: ws._id,
                workerId: ws.workerId,
                serviceId: ws.serviceId,
                customPrice: ws.customPrice,
                experience: ws.experience,
                description: ws.description,
                isActive: ws.isActive,
                workerProfile: {
                    bio: profile.bio || '',
                    skills: profile.skills || [],
                    photo: profile.photo || 'default.jpg',
                    rating: profile.rating || 0,
                    availability: profile.availability || []
                },
                basicInfo: worker ? {
                    name: worker.name,
                    email: worker.email,
                    phone: worker.phone
                } : {}
            };
        });

        res.status(200).json({
            success: true,
            count: workersWithDetails.length,
            data: workersWithDetails,
            serviceDetails: {
                title: service.title,
                description: service.description,
                basePrice: service.basePrice
            }
        });
    } catch (error) {
        console.error('Get service workers error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching service workers',
            error: error.message
        });
    }
};

// @desc    Get all workers' services (public)
// @route   GET /api/worker-services
// @access  Public
exports.getAllWorkerServices = async (req, res) => {
    try {
        // Fetch all active worker services
        const workerServices = await WorkerService.find({ isActive: true }).lean();

        // If none found, return empty array
        if (!workerServices || workerServices.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: []
            });
        }

        // Collect unique worker and service IDs
        const workerIds = [...new Set(workerServices.map(ws => ws.workerId.toString()))];
        const serviceIds = [...new Set(workerServices.map(ws => ws.serviceId.toString()))];

        // Fetch users (workers) in one query
        const workers = await User.find({ _id: { $in: workerIds }, role: 'worker' })
            .select('name email phone')
            .lean();
        const workersMap = new Map(workers.map(w => [w._id.toString(), w]));

        // Fetch worker profiles in one query
        const workerProfiles = await WorkerProfile.find({ userId: { $in: workerIds } })
            .select('userId bio skills photo username rating availability')
            .lean();
        const profilesMap = new Map(workerProfiles.map(p => [p.userId.toString(), p]));

        // Fetch service details in one query
        const services = await Service.find({ _id: { $in: serviceIds } })
            .select('title description basePrice')
            .lean();
        const servicesMap = new Map(services.map(s => [s._id.toString(), s]));

        // Combine data
        const results = workerServices.map(ws => {
            const workerIdStr = ws.workerId.toString();
            return {
                _id: ws._id,
                workerId: ws.workerId,
                serviceId: ws.serviceId,
                customPrice: ws.customPrice,
                experience: ws.experience,
                description: ws.description,
                isActive: ws.isActive,
                serviceDetails: servicesMap.get(ws.serviceId.toString()) || {},
                workerProfile: (profilesMap.get(workerIdStr) || {}),
                basicInfo: workersMap.get(workerIdStr) ? {
                    name: workersMap.get(workerIdStr).name,
                    email: workersMap.get(workerIdStr).email,
                    phone: workersMap.get(workerIdStr).phone
                } : {}
            };
        });

        res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error('Get all worker services error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching worker services',
            error: error.message
        });
    }
};

// @desc    Update worker service
// @route   PUT /api/worker-services/:id
// @access  Private (Worker only)
exports.updateWorkerService = async (req, res) => {
    try {
        const workerService = await WorkerService.findById(req.params.id);

        if (!workerService) {
            return res.status(404).json({
                success: false,
                message: 'Worker service not found'
            });
        }

        // Check ownership
        const workerProfile = await WorkerProfile.findOne({ userId: req.user._id });
        if (workerService.workerId.toString() !== workerProfile._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this service'
            });
        }

        // Validate price if provided
        if (req.body.price && req.body.price <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be a positive number'
            });
        }

        const updatedService = await WorkerService.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('serviceId', 'title description baseprice')
            .populate('workerId', 'bio skills');

        res.status(200).json({
            success: true,
            data: updatedService
        });
    } catch (error) {
        console.error('Update worker service error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating worker service',
            error: error.message
        });
    }
};

// @desc    Toggle worker service status
// @route   PATCH /api/worker-services/:id/toggle
// @access  Private (Worker only)
exports.toggleServiceStatus = async (req, res) => {
    try {
        const workerService = await WorkerService.findById(req.params.id);

        if (!workerService) {
            return res.status(404).json({
                success: false,
                message: 'Worker service not found'
            });
        }

        // Check ownership
        const workerProfile = await WorkerProfile.findOne({ userId: req.user._id });
        if (workerService.workerId.toString() !== workerProfile._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this service'
            });
        }

        workerService.isActive = !workerService.isActive;
        await workerService.save();

        const updatedService = await WorkerService.findById(workerService._id)
            .populate('serviceId', 'title description baseprice')
            .populate('workerId', 'bio skills');

        res.status(200).json({
            success: true,
            data: updatedService
        });
    } catch (error) {
        console.error('Toggle worker service error:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling worker service status',
            error: error.message
        });
    }
};

// @desc    Delete worker service
// @route   DELETE /api/worker-services/:id
// @access  Private (Worker only)
exports.deleteWorkerService = async (req, res) => {
    try {
        const workerService = await WorkerService.findById(req.params.id);

        if (!workerService) {
            return res.status(404).json({
                success: false,
                message: 'Worker service not found'
            });
        }

        // Check ownership
        const workerProfile = await WorkerProfile.findOne({ userId: req.user._id });
        if (workerService.workerId.toString() !== workerProfile._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this service'
            });
        }

        await workerService.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Worker service deleted successfully'
        });
    } catch (error) {
        console.error('Delete worker service error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting worker service',
            error: error.message
        });
    }
};
