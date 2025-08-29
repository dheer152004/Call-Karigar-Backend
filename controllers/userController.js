const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register new user
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, gender, role } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Normalize input
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone.replace(/\D/g, ''); // Remove all non-digits

    // // Single query to check both email and phone
    // const existingUser = await User.findOne({
    //   $or: [
    //     { email: normalizedEmail },
    //     { phone: normalizedPhone }
    //   ]
    // });

    // Check both email and phone simultaneously
    const errors = [];
    const existingEmail = await User.findOne({ email: normalizedEmail });
    const existingPhone = await User.findOne({ phone: normalizedPhone });

    if (existingEmail) {
      errors.push('email already registered');
    }
    if (existingPhone) {
      errors.push('phone already registered');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join(', ')
      });
    }


    // Create new user with normalized values
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password,
      gender,
      role: role || 'customer' // Default to customer if role not specified
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Generate and send OTP
    const otp = await generateOTP();
    await OTP.create({
      userId: user._id,
      phone: normalizedPhone,
      otp,
      purpose: 'registration'
    });

    // Send OTP via SMS
    await sendSMS(normalizedPhone, `Your verification code is: ${otp}`);

    // Return response without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify your phone number.',
      user: userResponse,
      token,
      requiresVerification: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already registered`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// Login user

exports.loginUser = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    
    const identifier = email || phone;
    // Validate input
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

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

// Verify user's phone after registration
exports.verifyPhone = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'user not found'
      });
    }

    // Check if already verified
    if (user.isPhoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'phone already verified'
      });
    }

    // Find the latest OTP for this user
    const otpRecord = await OTP.findOne({
      userId,
      phone: user.phone,
      purpose: 'registration',
      isVerified: false,
      createdAt: { $gt: new Date(Date.now() - 300000) } // Within last 5 minutes
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'otp expired or not found'
      });
    }

    // Check if max attempts reached
    if (otpRecord.isMaxAttemptsReached()) {
      return res.status(400).json({
        success: false,
        message: 'maximum verification attempts reached'
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      
      return res.status(400).json({
        success: false,
        message: 'invalid otp',
        attemptsLeft: 3 - otpRecord.attempts
      });
    }

    // Mark OTP as verified
    otpRecord.isVerified = true;
    await otpRecord.save();

    // Update user verification status
    user.isPhoneVerified = true;
    await user.save();

    // Return success response
    res.json({
      success: true,
      message: 'phone verified successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isPhoneVerified: true
      }
    });

  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'error during phone verification'
    });
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
