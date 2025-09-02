const { Address } = require('./address.model');

// Helper function to validate update fields
const validateUpdateFields = (updates) => {
    const allowedUpdates = ['label', 'addressLine', 'city', 'state', 'postalCode', 'country', 'isPrimary'];
    return {
        isValid: updates.every((update) => allowedUpdates.includes(update)),
        allowedUpdates
    };
};

// Create a new address
exports.createAddress = async (req, res) => {
    try {
        console.log('Creating address with data:', req.body);
        console.log('User ID from token:', req.user.id);

        // If this is the user's first address, make it primary
        const existingAddresses = await Address.find({ userId: req.user.id });
        if (existingAddresses.length === 0) {
            req.body.isPrimary = true;
        }

        if (!req.body || !req.body.label || !req.body.addressLine) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['label', 'addressLine', 'city', 'state', 'postalCode']
            });
        }

        const address = new Address({
            ...req.body,
            userId: req.user.id
        });

        console.log('Address object created:', address);
        
        await address.save();
        console.log('Address saved successfully');
        
        res.status(201).json(address);
    } catch (error) {
        console.error('Error creating address:', error);
        res.status(400).json({
            error: error.message,
            details: error.errors ? Object.values(error.errors).map(e => e.message) : undefined
        });
    }
};

// Get user's own addresses
exports.getUserAddresses = async (req, res) => {
    try {
        console.log('Getting addresses for user:', req.user.id);
        const addresses = await Address.find({ userId: req.user.id });
        res.json({ success: true, data: addresses });
    } catch (error) {
        console.error('Error getting user addresses:', error);
        res.status(500).json({
            success: false,
            error: 'Error retrieving addresses'
        });
    }
};

// Get all addresses (admin only)
exports.getAllAddresses = async (req, res) => {
    try {
        console.log('Admin requesting all addresses');
        const addresses = await Address.find().populate('userId', 'username email');
        res.json({ success: true, data: addresses });
    } catch (error) {
        console.error('Error getting all addresses:', error);
        res.status(500).json({
            success: false,
            error: 'Error retrieving addresses'
        });
    }
};

// Get user's specific address
exports.getUserAddress = async (req, res) => {
    try {
        const address = await Address.findOne({ 
            _id: req.params.id, 
            userId: req.user.id 
        });
        
        if (!address) {
            return res.status(404).json({
                success: false,
                error: 'Address not found'
            });
        }
        
        res.json({ success: true, data: address });
    } catch (error) {
        console.error('Error getting user address:', error);
        res.status(500).json({
            success: false,
            error: 'Error retrieving address'
        });
    }
};

// Get any address (admin only)
exports.getAddress = async (req, res) => {
    try {
        const address = await Address.findById(req.params.id)
            .populate('userId', 'username email');
        
        if (!address) {
            return res.status(404).json({
                success: false,
                error: 'Address not found'
            });
        }
        
        res.json({ success: true, data: address });
    } catch (error) {
        console.error('Error getting address:', error);
        res.status(500).json({
            success: false,
            error: 'Error retrieving address'
        });
    }
};

// Update user's own address
exports.updateAddress = async (req, res) => {
    try {
        console.log('User updating address:', {
            addressId: req.params.id,
            userId: req.user.id,
            updateData: req.body,
            method: req.method
        });

        // Validate fields
        const updates = Object.keys(req.body);
        const { isValid, allowedUpdates } = validateUpdateFields(updates);
        
        if (!isValid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid updates',
                allowedUpdates
            });
        }

        // Only validate all required fields for PUT requests
        if (req.method === 'PUT') {
            const requiredFields = ['label', 'addressLine', 'city', 'state', 'postalCode'];
            const missingFields = requiredFields.filter(field => !req.body[field]);
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'For PUT requests, all fields are required',
                    missingFields
                });
            }
        }

        // Find and update address
        const address = await Address.findOne({ 
            _id: req.params.id, 
            userId: req.user.id 
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                error: 'Address not found'
            });
        }

        // Apply updates and save
        updates.forEach(update => address[update] = req.body[update]);
        await address.save();

        res.json({
            success: true,
            message: 'Address updated successfully',
            data: address
        });

    } catch (error) {
        console.error('Error updating address:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Update any address (admin only)
exports.updateAnyAddress = async (req, res) => {
    try {
        console.log('Admin updating address:', {
            addressId: req.params.id,
            updateData: req.body,
            method: req.method
        });

        // Validate fields
        const updates = Object.keys(req.body);
        const { isValid, allowedUpdates } = validateUpdateFields(updates);
        
        if (!isValid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid updates',
                allowedUpdates
            });
        }

        // Only validate all required fields for PUT requests
        if (req.method === 'PUT') {
            const requiredFields = ['label', 'addressLine', 'city', 'state', 'postalCode'];
            const missingFields = requiredFields.filter(field => !req.body[field]);
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'For PUT requests, all fields are required',
                    missingFields
                });
            }
        }

        // Find and update address
        const address = await Address.findById(req.params.id);

        if (!address) {
            return res.status(404).json({
                success: false,
                error: 'Address not found'
            });
        }

        // Apply updates and save
        updates.forEach(update => address[update] = req.body[update]);
        await address.save();

        res.json({
            success: true,
            message: 'Address updated successfully',
            data: address
        });

    } catch (error) {
        console.error('Error updating address:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete user's own address
exports.deleteAddress = async (req, res) => {
    try {
        const address = await Address.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.user.id 
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                error: 'Address not found'
            });
        }

        res.json({
            success: true,
            message: 'Address deleted successfully',
            data: address
        });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({
            success: false,
            error: 'Error deleting address'
        });
    }
};

// Delete any address (admin only)
exports.deleteAnyAddress = async (req, res) => {
    try {
        const address = await Address.findByIdAndDelete(req.params.id);

        if (!address) {
            return res.status(404).json({
                success: false,
                error: 'Address not found'
            });
        }

        res.json({
            success: true,
            message: 'Address deleted successfully',
            data: address
        });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({
            success: false,
            error: 'Error deleting address'
        });
    }
};

// Delete an address
exports.deleteAddress = async (req, res) => {
    try {
        const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!address) {
            return res.status(404).send();
        }
        res.send(address);
    } catch (error) {
        res.status(500).send(error);
    }
};
