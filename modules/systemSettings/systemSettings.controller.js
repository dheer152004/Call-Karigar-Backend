const SystemSettings = require('./systemSettings.model');

// Get system settings
exports.getSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne().select('-updatedBy');
        
        if (!settings) {
            // Create default settings if none exist
            settings = await SystemSettings.create({
                updatedBy: req.user._id
            });
        }

        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching system settings',
            error: error.message
        });
    }
};

// Update system settings
exports.updateSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        
        if (!settings) {
            settings = await SystemSettings.create({
                ...req.body,
                updatedBy: req.user._id
            });
        } else {
            // Update only the fields that are provided
            Object.keys(req.body).forEach(key => {
                if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt') {
                    if (typeof req.body[key] === 'object') {
                        settings[key] = {
                            ...settings[key],
                            ...req.body[key]
                        };
                    } else {
                        settings[key] = req.body[key];
                    }
                }
            });

            settings.updatedBy = req.user._id;
            await settings.save();
        }

        res.status(200).json({
            success: true,
            data: settings,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating system settings',
            error: error.message
        });
    }
};

// Get specific setting by category
exports.getSettingsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const settings = await SystemSettings.findOne().select(category);

        if (!settings) {
            return res.status(404).json({
                success: false,
                message: 'Settings not found'
            });
        }

        if (!settings[category]) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: settings[category]
        });
    } catch (error) {
        console.error('Get settings by category error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching settings category',
            error: error.message
        });
    }
};

// Update specific setting by category
exports.updateSettingsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        let settings = await SystemSettings.findOne();

        if (!settings) {
            // If no settings exist, create with defaults and update specified category
            const defaultSettings = {
                [category]: req.body,
                updatedBy: req.user._id
            };
            settings = await SystemSettings.create(defaultSettings);
        } else {
            // Update only the specified category
            settings[category] = {
                ...settings[category],
                ...req.body
            };
            settings.updatedBy = req.user._id;
            await settings.save();
        }

        res.status(200).json({
            success: true,
            data: settings[category],
            message: `${category} settings updated successfully`
        });
    } catch (error) {
        console.error('Update settings by category error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating settings category',
            error: error.message
        });
    }
};
