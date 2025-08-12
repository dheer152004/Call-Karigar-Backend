const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register new user
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      phone,
      password,
      role: role || 'customer' // Default to customer if role not specified
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'Registration successful',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Login successful',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get all users (admin only)
exports.getUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 }); // Sort by newest first

    // Format the response
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      joinedDate: user.createdAt,
      lastUpdated: user.updatedAt,
      status: 'active' // You can add a status field to your user model if needed
    }));

    res.json({
      totalUsers: users.length,
      users: formattedUsers
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .lean(); // Convert to plain JavaScript object

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format the response
    const profile = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      joinedDate: user.createdAt,
      lastUpdated: user.updatedAt,
      accountDetails: {
        isEmailVerified: false, // You can add these fields to your model if needed
        isPhoneVerified: false,
        lastLogin: new Date()
      }
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout user
exports.logoutUser = async (req, res) => {
  try {
    // Since we're using JWT, we don't need to do anything server-side
    // The client will remove the token
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};

// Update user profile
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only admin can update role and other users' profiles
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    // Check if email is being changed and is unique
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Check if phone is being changed and is unique
    if (phone && phone !== user.phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({ message: 'Phone number already in use' });
      }
    }

    // Update user
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    if (password) {
      user.password = password; // Will be hashed by pre-save middleware
    }
    // Only admin can update role
    if (role && req.user.role === 'admin') {
      user.role = role;
    }

    await user.save();

    // Return updated user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error during update' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only admin can delete users, or users can delete their own account
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this user' });
    }

    await user.deleteOne();

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error during deletion' });
  }
};
