const ServiceCategory = require('../models/ServiceCategory');

// @desc    Create a new service category
// @route   POST /api/service-categories
// @access  Private (Admin only)
exports.createCategory = async (req, res) => {
    try {
        const { name, description, icon } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Name is required'
            });
        }

        const category = await ServiceCategory.create({
            name,
            description,
            icon,
            isActive: true
        });

        res.status(201).json({
            success: true,
            data: category,
            message: 'Service category created successfully'
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating service category',
            error: error.message
        });
    }
};

// @desc    Get all service categories
// @route   GET /api/service-categories
// @access  Public
exports.getCategories = async (req, res) => {
    try {
        const categories = await ServiceCategory.find()
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching service categories',
            error: error.message
        });
    }
};

// @desc    Get single service category
// @route   GET /api/service-categories/:id
// @access  Public
exports.getCategoryById = async (req, res) => {
    try {
        const category = await ServiceCategory.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Service category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching service category',
            error: error.message
        });
    }
};

// @desc    Update service category
// @route   PUT /api/service-categories/:id
// @access  Private (Admin only)
exports.updateCategory = async (req, res) => {
    try {
        const category = await ServiceCategory.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Service category not found'
            });
        }

        // Only update allowed fields
        const { name, description, icon, isActive } = req.body;
        const updateData = {};
        
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (icon !== undefined) updateData.icon = icon;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedCategory = await ServiceCategory.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedCategory,
            message: 'Service category updated successfully'
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating service category',
            error: error.message
        });
    }
};

// @desc    Delete service category
// @route   DELETE /api/service-categories/:id
// @access  Private (Admin only)
exports.deleteCategory = async (req, res) => {
    try {
        const category = await ServiceCategory.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Service category not found'
            });
        }

        await category.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Service category deleted successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting service category',
            error: error.message
        });
    }
};
