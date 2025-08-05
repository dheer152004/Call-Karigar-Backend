const ServiceCategory = require('../models/ServiceCategory');

// @desc    Create a new service category
// @route   POST /api/categories
// @access  Private (Admin only)
exports.createCategory = async (req, res) => {
    try {
        const { name, description, icon } = req.body;

        // Check if category already exists
        const existingCategory = await ServiceCategory.findOne({ name: name.trim() });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Service category already exists'
            });
        }

        // Create new category
        const category = await ServiceCategory.create({
            name: name.trim(),
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
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
    try {
        const categories = await ServiceCategory.find({
            isActive: true
        }).sort({ name: 1 }); // Sort alphabetically

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
// @route   GET /api/categories/:id
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
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
exports.updateCategory = async (req, res) => {
    try {
        const { name, description, icon, isActive } = req.body;
        const category = await ServiceCategory.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Service category not found'
            });
        }

        // If name is being updated, check for duplicates
        if (name && name !== category.name) {
            const existingCategory = await ServiceCategory.findOne({ name: name.trim() });
            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Service category name already exists'
                });
            }
        }

        const updatedCategory = await ServiceCategory.findByIdAndUpdate(
            req.params.id,
            {
                name: name?.trim() || category.name,
                description: description || category.description,
                icon: icon || category.icon,
                isActive: isActive !== undefined ? isActive : category.isActive
            },
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
// @route   DELETE /api/categories/:id
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

        // Soft delete by setting isActive to false
        await ServiceCategory.findByIdAndUpdate(req.params.id, { isActive: false });

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
