const validator = require('validator');
const { validationResult } = require('express-validator');

// Middleware to check express-validator validation results
exports.validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Get only the first error for each field
        const uniqueErrors = {};
        errors.array().forEach(error => {
            if (!uniqueErrors[error.path]) {
                uniqueErrors[error.path] = error.msg;
            }
        });

        // Convert to array format
        const formattedErrors = Object.entries(uniqueErrors).map(([field, message]) => ({
            field,
            message
        }));

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: formattedErrors
        });
    }
    next();
};

exports.validateRegistration = (req, res, next) => {
    const { name, email, phone, password, role } = req.body;
    const errors = [];

    // Validate name
    if (!name || name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }

    // Validate email
    if (!email || !validator.isEmail(email)) {
        errors.push('Please provide a valid email address');
    }

    // Validate phone (basic validation, you might want to use a more specific pattern)
    if (!phone || !validator.isMobilePhone(phone)) {
        errors.push('Please provide a valid phone number');
    }

    // Validate password
    if (!password || password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }

    // Validate role
    if (role && !['customer', 'worker', 'admin'].includes(role)) {
        errors.push('Invalid role specified');
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    next();
};

exports.validateService = (req, res, next) => {
    const { title, description, category, price, location } = req.body;
    const errors = [];

    // Validate title
    if (!title || title.trim().length < 3) {
        errors.push('Title must be at least 3 characters long');
    }

    // Validate description
    if (!description || description.trim().length < 10) {
        errors.push('Description must be at least 10 characters long');
    }

    // Validate category
    if (!category) {
        errors.push('Category is required');
    }

    // Validate price
    if (!price || isNaN(price) || price <= 0) {
        errors.push('Please provide a valid price');
    }

    // Validate location
    if (!location || !location.city || !location.state) {
        errors.push('Location details (city and state) are required');
    }

    if (errors.length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors });
    }

    next();
};

exports.validateLogin = (req, res, next) => {
  const { email, phone, password } = req.body;
  const errors = [];

  // Check if either email or phone is provided
  if (!email && !phone) {
    errors.push('Email or phone number is required');
  }

  // If email is provided, validate it
  if (email && !validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  // If phone is provided, validate it
  if (phone && !validator.isMobilePhone(phone)) {
    errors.push('Please provide a valid phone number');
  }

  // Password is always required
  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

