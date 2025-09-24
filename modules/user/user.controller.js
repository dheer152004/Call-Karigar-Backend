const User = require('./user.model');

// Get all users (admin only)
exports.getUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    // Fetch paginated users and total count
    const [users, total] = await Promise.all([
      User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments()
    ]);

    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      joinedDate: user.createdAt,
      lastUpdated: user.updatedAt,
      status: 'active'
    }));

    res.json({
      page,
      limit,
      totalUsers: total,
      totalPages: Math.ceil(total / limit),
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
        isPhoneVerified: user.isPhoneVerified,
        lastLogin: new Date()
      }
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
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

    // Normalize and check email/phone if being updated
    const normalizedEmail = email ? email.toLowerCase().trim() : user.email;
    const normalizedPhone = phone ? phone.replace(/\D/g, '') : user.phone;

    // Check if email or phone is being changed and is unique
    if ((email && normalizedEmail !== user.email) || 
        (phone && normalizedPhone !== user.phone)) {
      
      const existingUser = await User.findOne({
        _id: { $ne: userId }, // Exclude current user
        $or: [
          { email: normalizedEmail },
          { phone: normalizedPhone }
        ]
      });

      if (existingUser) {
        if (existingUser.email === normalizedEmail) {
          return res.status(400).json({
            success: false,
            message: 'email already registered'
          });
        }
        if (existingUser.phone === normalizedPhone) {
          return res.status(400).json({
            success: false,
            message: 'phone already registered'
          });
        }
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
