const Content = require('./content.model');

// Create new content
exports.createContent = async (req, res) => {
    try {
        const content = await Content.create({
            ...req.body,
            createdBy: req.user._id,
            updatedBy: req.user._id
        });

        res.status(201).json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('Create content error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating content',
            error: error.message
        });
    }
};

// Get all content (with filters)
exports.getAllContent = async (req, res) => {
    try {
        const query = {};

        // Filter by type
        if (req.query.type) {
            query.type = req.query.type;
        }

        // Filter by category
        if (req.query.category) {
            query.category = req.query.category;
        }

        // Filter by status
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Filter by visibility based on user role
        if (req.user.role !== 'admin') {
            query.visibility = {
                $in: ['public', req.user.role]
            };
            query.status = 'published';
        }

        // Filter by validity date
        const currentDate = new Date();
        query.$or = [
            { validUntil: { $exists: false } },
            { validUntil: { $gt: currentDate } }
        ];
        query.validFrom = { $lte: currentDate };

        const content = await Content.find(query)
            .sort({ priority: -1, createdAt: -1 })
            .populate('createdBy', 'name')
            .populate('updatedBy', 'name');

        res.status(200).json({
            success: true,
            count: content.length,
            data: content
        });
    } catch (error) {
        console.error('Get content error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching content',
            error: error.message
        });
    }
};

// Get single content by ID or slug
exports.getContent = async (req, res) => {
    try {
        const query = req.params.id.match(/^[0-9a-fA-F-]{36}$/) 
            ? { _id: req.params.id }
            : { slug: req.params.id };

        const content = await Content.findOne(query)
            .populate('createdBy', 'name')
            .populate('updatedBy', 'name');

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        // Check visibility permission
        if (content.visibility !== 'public' && 
            content.visibility !== req.user.role && 
            req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this content'
            });
        }

        res.status(200).json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('Get content error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching content',
            error: error.message
        });
    }
};

// Update content
exports.updateContent = async (req, res) => {
    try {
        let content = await Content.findById(req.params.id);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        // Update content
        content = await Content.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                updatedBy: req.user._id
            },
            {
                new: true,
                runValidators: true
            }
        ).populate('createdBy', 'name')
         .populate('updatedBy', 'name');

        res.status(200).json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('Update content error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating content',
            error: error.message
        });
    }
};

// Delete content
exports.deleteContent = async (req, res) => {
    try {
        const content = await Content.findById(req.params.id);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        await content.remove();

        res.status(200).json({
            success: true,
            message: 'Content deleted successfully'
        });
    } catch (error) {
        console.error('Delete content error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting content',
            error: error.message
        });
    }
};

// Search content
exports.searchContent = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const query = {
            $text: { $search: q },
            status: 'published'
        };

        // Filter by visibility based on user role
        if (req.user.role !== 'admin') {
            query.visibility = {
                $in: ['public', req.user.role]
            };
        }

        const content = await Content.find(query)
            .sort({ priority: -1, score: { $meta: 'textScore' } })
            .populate('createdBy', 'name')
            .populate('updatedBy', 'name');

        res.status(200).json({
            success: true,
            count: content.length,
            data: content
        });
    } catch (error) {
        console.error('Search content error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching content',
            error: error.message
        });
    }
};
