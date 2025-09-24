const jwt = require('jsonwebtoken');
const User = require('../modules/user/user.model');

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    console.log('Request Headers:', req.headers);
    console.log('Auth Header:', req.headers.authorization);
    
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('No token provided. Authorization header:', req.headers.authorization);
      return res.status(401).json({ message: 'Not authorized - No token provided' });
    }
    console.log('Token found:', token.substring(0, 10) + '...');

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified successfully. Decoded:', { userId: decoded.id, role: decoded.role });
    } catch (error) {
      console.log('Token verification failed:', error.message);
      return res.status(401).json({ message: 'Invalid token - ' + error.message });
    }
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log('User not found for id:', decoded.id);
      return res.status(401).json({ message: 'Token is not valid - User not found' });
    }
    console.log('User found:', { id: user._id, role: user.role });
    
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
