const jwt = require('jsonwebtoken');
const User = require('../modules/user/user.model');

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    console.log('Auth Headers:', req.headers.authorization);
    
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'Not authorized - No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', { ...decoded, id: decoded.id });
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    console.log('Found user:', user ? { ...user.toJSON(), id: user._id } : null);
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid - User not found' });
    }

    // Add user to request object
    req.user = user;
    next();
    
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Please login first'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
