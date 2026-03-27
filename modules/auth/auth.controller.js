const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../user/user.model');
const CustomerProfile = require('../user/customer/customerProfile.model');
const otpController = require('../otp/otp.controller');
const WorkerProfile = require('../user/worker/workerProfile/workerProfile.model');
const AdminProfile = require('../user/admin/admin.model');
const NotificationService = require('../../services/notificationService');
const Address = require('../address/address.model');
const EmailService = require('../../services/emailService');

// returns profile, uses _id pattern consistently
const createBasicProfile = async (user) => {
    let profile = null;
    let message = '';
    let redirectTo = '';

    switch (user.role) {
        case 'admin':
            profile = await AdminProfile.create({
                _id: user._id,
                permissions: [
                    'manage_users',
                    'manage_services',
                    'manage_bookings',
                    'manage_payments',
                    'manage_reports',
                    'manage_settings'
                ]
            });
            message = 'Admin registration successful. Please complete your profile.';
            redirectTo = '/admin/update-profile';
            break;

        case 'customer':
            profile = await CustomerProfile.create({
                _id: user._id,
                status: 'new',
                phoneNumber: user.phone,
                email: user.email,
                photo: 'default-profile.jpg',
                bio: '',
                preferences: {
                    language: 'en',
                    notifications: true,
                    currency: 'INR',
                    theme: 'light'
                },
                stats: {
                    totalBookings: 0,
                    completedBookings: 0,
                    cancelledBookings: 0,
                    totalSpent: 0
                }
            });
            message = 'Customer registration successful. Welcome to Call Kaarigar!';
            redirectTo = '/customer/update-profile';
            break;

        case 'worker':
            profile = await WorkerProfile.create({
                _id: user._id, 
                phoneNumber: user.phone,
                email: user.email,
                photo: 'default-worker.jpg',
                bio: '',
                skills: [],
                status: 'pending',
                isVerified: false,
                preferences: {
                    language: 'en',
                    notifications: true,
                    availability: {
                        autoAccept: false,
                        maxJobsPerDay: 5
                    }
                },
                stats: {
                    totalJobs: 0,
                    completedJobs: 0,
                    cancelledJobs: 0,
                    totalEarnings: 0
                }
            });
            message = 'Worker registration successful. Please complete your profile and verify your documents.';
            redirectTo = '/worker/update-profile';
            break;

        default:
            throw new Error(`Invalid role: ${user.role}`);
    }

    return { profile, message, redirectTo };
};


// Register a new user
exports.registerUser = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate role
        const validRoles = ['admin', 'customer', 'worker'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified'
            });
        }

        // Normalize input
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedPhone = phone.replace(/\D/g, '');

        // Check for existing user
        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { phone: normalizedPhone }
            ]
        });

        if (existingUser) {
            const isDuplicateEmail = existingUser.email === normalizedEmail;
            const isDuplicatePhone = existingUser.phone === normalizedPhone;

            return res.status(400).json({
                success: false,
                message: isDuplicateEmail && isDuplicatePhone ?
                    'Email and phone number already registered' :
                    isDuplicateEmail ?
                        'Email already registered' :
                        'Phone number already registered'
            });
        }

        // Removed manual bcrypt — model pre-save hook handles hashing
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            password: password,     // pre-save middleware hashes this
            role: role || 'customer',
            status: 'active',
            isPhoneVerified: false,
            isEmailVerified: false
        });

        // Create role-based profile
        const { profile, message, redirectTo } = await createBasicProfile(user);

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Send welcome notification (skip for admin)
        if (user.role !== 'admin') {
            try {
                await NotificationService.createNotification({
                    userId: user._id,
                    type: user.role === 'worker' ? 'worker_registered' : 'customer_registered',
                    category: 'account',
                    title: 'Welcome to Call Kaarigar!',
                    message: user.role === 'worker'
                        ? 'Your worker account has been created. Please complete your profile and upload required documents for verification.'
                        : 'Welcome to Call Kaarigar! Your account has been created successfully.',
                    recipientRole: user.role,
                    priority: 'high'
                });
            } catch (notifError) {
                // Don't fail registration if notification fails
                console.error('Error sending welcome notification:', notifError);
            }
        }

        res.status(201).json({
            success: true,
            message,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                },
                profile,    // now correctly returned for all roles
                token,
                redirectTo
            }
        });

    } catch (error) {
        console.error('Registration error:', error);

        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: messages[0],
                errors: messages
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already registered`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            ...(process.env.NODE_ENV !== 'production' && { error: error.message })
        });
    }
};


// Login user with email/phone and password
exports.loginUser = async (req, res) => {
    try {
        const { identifier, password: rawPassword } = req.body;
        const password = rawPassword ? rawPassword.trim() : '';

        // Validate input
        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email/phone and password'
            });
        }

        const normalizedIdentifier = identifier.toLowerCase().trim();

        // Determine if identifier is email or phone
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier);
        const normalizedPhone = normalizedIdentifier.replace(/\D/g, '');
        const isPhone = /^\d{10}$/.test(normalizedPhone);

        if (!isEmail && !isPhone) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email or 10-digit phone number'
            });
        }

        // Build query
        const query = {
            $or: [
                ...(isEmail ? [{ email: normalizedIdentifier }] : []),
                ...(isPhone ? [{ phone: normalizedPhone }] : [])
            ]
        };

        const user = await User.findOne(query);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: isEmail ?
                    'No account found with this email address' :
                    'No account found with this phone number'
            });
        }

        // Check if user is blocked
        if (user.status === 'blocked') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been blocked. Please contact support.'
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect password. Please try again.'
            });
        }

        // Fetch profile using findById — _id = user._id
        const ProfileModel = user.role === 'admin' ? AdminProfile :
                             user.role === 'customer' ? CustomerProfile :
                             WorkerProfile;

        const profile = await ProfileModel.findById(user._id);

        // Profile missing — return token so they can complete it
        if (!profile) {
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.status(200).json({
                success: true,
                message: 'Please complete your profile',
                data: {
                    token,
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role
                    },
                    redirectTo: `/${user.role}/update-profile`
                }
            });
        }

        // Update lastLogin without triggering pre-save middleware
        await User.updateOne(
            { _id: user._id },
            { lastLogin: new Date() }
        );

        // Generate token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        // Fetch addresses
        const addresses = await Address.find({ userId: user._id })
            .sort({ isPrimary: -1, createdAt: -1 });

        // Build profile data
        const profileData = {
            photo: profile.photo || 'default-profile.jpg',
            status: profile.status,
            bio: profile.bio,
            preferences: profile.preferences,
            stats: profile.stats,
            ...(user.role === 'worker' && {
                skills: profile.skills,
                isVerified: profile.isVerified,
                ratingAverage: profile.ratingAverage,
                ratingCount: profile.ratingCount
            })
        };

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status,
                    isEmailVerified: user.isEmailVerified,
                    isPhoneVerified: user.isPhoneVerified,
                    lastLogin: new Date()
                },
                profile: profileData,
                addresses,
                navigation: {
                    redirectTo: user.role === 'admin' ?
                        '/admin/dashboard' :
                        user.role === 'worker' ?
                            '/worker/update-profile' :
                            '/customer/update-profile',
                    allowedRoutes: [
                        `/${user.role}/dashboard`,
                        `/${user.role}/profile`,
                        `/${user.role}/settings`,
                        ...(user.role === 'customer' ? ['/customer/bookings', '/customer/payments'] : []),
                        ...(user.role === 'worker' ? ['/worker/jobs', '/worker/earnings', '/worker/availability'] : []),
                        ...(user.role === 'admin' ? ['/admin/users', '/admin/services', '/admin/reports'] : [])
                    ]
                },
                settings: {
                    theme: profile.preferences?.theme || 'light',
                    language: profile.preferences?.language || 'en',
                    notifications: profile.preferences?.notifications ?? true,
                    currency: profile.preferences?.currency || 'INR'
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login',
            ...(process.env.NODE_ENV !== 'production' && { error: error.message })
        });
    }
};


// Send email verification OTP
exports.sendEmailVerificationOTP = async (req, res) => {
    try {
        const { userId, email } = req.body;
        if (!userId || !email) {
            return res.status(400).json({ success: false, message: 'userId and email are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        req.body = {
            ...req.body,
            method: 'email',
            purpose: 'email_verification',
            email: email.toLowerCase().trim()
        };

        return otpController.sendOTP(req, res);

    } catch (error) {
        console.error('sendEmailVerificationOTP error:', error);
        res.status(500).json({ success: false, message: 'Server error sending email OTP' });
    }
};

// Verify email OTP
exports.verifyEmailOTP = async (req, res) => {
    try {
        const { userId, otp, email } = req.body;
        if (!userId || !otp || !email) {
            return res.status(400).json({ success: false, message: 'userId, otp and email are required' });
        }

        req.body = {
            ...req.body,
            method: 'email',
            email: email.toLowerCase().trim()
        };

        return otpController.verifyOTP(req, res);

    } catch (error) {
        console.error('verifyEmailOTP error:', error);
        res.status(500).json({ success: false, message: 'Server error verifying email OTP' });
    }
};

// Logout user
exports.logoutUser = async (req, res) => {
    try {
        if (req.user && req.user.id) {
            // updateOne avoids triggering pre-save middleware
            await User.updateOne(
                { _id: req.user.id },
                { lastLogout: new Date() }   // add lastLogout to User schema too
            );
        }

        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
            data: {
                redirectTo: '/auth/login'
            }
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during logout',
            ...(process.env.NODE_ENV !== 'production' && { error: error.message })
        });
    }
};


// Forgot password (send reset link via email)
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required.'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            // minimal information leak risk: always respond success
            return res.status(200).json({
                success: true,
                message: 'If this email is registered, a password reset link has been sent.'
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
        await user.save({ validateBeforeSave: false });

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password/${resetToken}`;
        const subject = 'Password Reset Request - Call Karigar';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Reset Request</h2>
                <p>Hi ${user.name || 'User'},</p>
                <p>You requested to reset your password. Please click the link below to reset it:</p>
                <p><a href="${resetUrl}" style="color: #1a73e8;">Reset Password</a></p>
                <p>This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
            </div>
        `;

        const emailSent = await EmailService.sendEmail(user.email, subject, '', html);

        if (!emailSent) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({
                success: false,
                message: 'Unable to send reset email. Please try again later.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'If this email is registered, a password reset link has been sent.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during password reset request',
            ...(process.env.NODE_ENV !== 'production' && { error: error.message })
        });
    }
};


// Reset password through token
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required.'
            });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        }).select('+resetPasswordToken +resetPasswordExpires');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired password reset token.'
            });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        const jwtToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully.',
            data: { token: jwtToken }
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during password reset',
            ...(process.env.NODE_ENV !== 'production' && { error: error.message })
        });
    }
};