const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../user/user.model');
const CustomerProfile = require('../user/customer/customerProfile.model');
const WorkerProfile = require('../user/worker/workerProfile/workerProfile.model');
const AdminProfile = require('../user/admin/admin.model');
const NotificationService = require('../../services/notificationService');
const Address = require('../address/address.model');

// Helper function to generate a unique username
const generateUsername = async (name, Model, isWorker = false) => {
    const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseName;
    if (isWorker) username += '.pro';
    let counter = 1;
    
    while (await Model.findOne({ username })) {
        username = isWorker ? 
            `${baseName}.pro${counter}` : 
            `${baseName}${counter}`;
        counter++;
    }

    return username;
};

const createUserProfile = async (user, addressData = null) => {
    // For admin users, create a profile with random data
    if (user.role === 'admin') {
        const username = `admin.${user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        const adminProfile = new AdminProfile({
            userId: user._id,
            username,
            photo: `admin-${Math.floor(Math.random() * 5)}.jpg`,
            bio: `Senior administrator with ${Math.floor(Math.random() * 5 + 2)} years of experience`,
            department: ['Operations', 'Support', 'Management'][Math.floor(Math.random() * 3)],
            status: 'active',
            permissions: ['manage_users', 'manage_workers', 'manage_services', 'manage_bookings'],
            preferences: {
                language: 'en',
                notifications: true,
                theme: 'dark'
            }
        });
        
        const savedProfile = await adminProfile.save();
        return {
            username,
            profile: savedProfile,
            isProfileComplete: true
        };
    }

    // Create address if provided
    let addressId = null;
    if (addressData) {
        const address = new Address({
            userId: user._id,
            label: addressData.label || 'Home',
            addressLine: addressData.addressLine,
            city: addressData.city,
            state: addressData.state,
            postalCode: addressData.postalCode,
            country: addressData.country || 'India',
            isPrimary: true // First address is primary
        });
        const savedAddress = await address.save();
        addressId = savedAddress._id;
    }

    // Base profile data with UUID handling
    let profileData = {
        userId: user._id.toString(), // Ensure it's a string
        phoneNumber: user.phone,
        email: user.email,
        address: addressId, // Link the address if created
        preferences: { 
            language: 'en', 
            notifications: true 
        },
        savedAddresses: addressId ? [addressId] : [] // Add to saved addresses if created
    };

    if (user.role === 'customer') {
        const username = await generateUsername(user.name, CustomerProfile);
        
        // Create new profile document with random data
        const newProfile = new CustomerProfile({
            ...profileData,
            username,
            photo: `profile-${Math.floor(Math.random() * 10)}.jpg`,
            bio: `Hi, I'm ${user.name}!`,
            status: 'active',
            preferences: {
                ...profileData.preferences,
                currency: 'INR',
                theme: Math.random() > 0.5 ? 'light' : 'dark'
            },
            stats: {
                totalBookings: Math.floor(Math.random() * 10),
                completedBookings: Math.floor(Math.random() * 8),
                cancelledBookings: Math.floor(Math.random() * 2),
                totalSpent: Math.floor(Math.random() * 10000)
            }
        });

        // Save the profile
        const savedProfile = await newProfile.save();

        return {
            username,
            profile: savedProfile,
            isProfileComplete: true
        };
    } else if (user.role === 'worker') {
        const username = await generateUsername(user.name, WorkerProfile, true);
        
        // Create new worker profile
        const newProfile = new WorkerProfile({
            userId: user._id,
            username,
            phoneNumber: user.phone,
            email: user.email,
            photo: `worker-${Math.floor(Math.random() * 10)}.jpg`,
            bio: `Professional service provider with ${Math.floor(Math.random() * 10 + 1)} years of experience`,
            skills: ['Plumbing', 'Electrical', 'Carpentry', 'Painting'].slice(0, Math.floor(Math.random() * 3 + 1)),
            status: 'active',
            isVerified: true,
            preferences: {
                language: 'en',
                notifications: true,
                availability: {
                    autoAccept: Math.random() > 0.5,
                    maxJobsPerDay: Math.floor(Math.random() * 5 + 3)
                }
            },
            stats: {
                totalJobs: Math.floor(Math.random() * 50),
                completedJobs: Math.floor(Math.random() * 40),
                cancelledJobs: Math.floor(Math.random() * 5),
                totalEarnings: Math.floor(Math.random() * 50000)
            },
            ratingAverage: (Math.random() * 2 + 3).toFixed(1),
            ratingCount: Math.floor(Math.random() * 30)
        });

        // Save the profile
        const savedProfile = await newProfile.save();
        
        return {
            username,
            profile: savedProfile
        };
    }
};

// Register a new user
exports.registerUser = async (req, res) => {
    try {
        const { 
            name, 
            email, 
            phone, 
            password, 
            role,
            address // Optional address during registration
        } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate address if provided
        if (address && (!address.addressLine || !address.city || !address.state || !address.postalCode)) {
            return res.status(400).json({
                success: false,
                message: 'If providing address, all address fields are required'
            });
        }

        // Normalize input
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedPhone = phone.replace(/\D/g, '');

        // Check both email and phone simultaneously
        const [existingEmail, existingPhone] = await Promise.all([
            User.findOne({ email: normalizedEmail }),
            User.findOne({ phone: normalizedPhone })
        ]);

        const errors = [];
        if (existingEmail) errors.push('email already registered');
        if (existingPhone) errors.push('phone already registered');

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: errors.join(', ')
            });
        }

        // Create user
        console.log('Creating new user:', {
            name: name.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            role: role || 'customer'
        });

        const user = new User({
            name: name.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            password,
            role: role || 'customer'
        });

        await user.save();
        console.log('User created successfully:', {
            _id: user._id,
            email: user.email,
            phone: user.phone,
            role: user.role
        });

        // Validate role
        if (role && !['customer', 'worker', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified'
            });
        }

        // Create user profile with address and send welcome notification
        try {
            const { username, profile } = await createUserProfile(user, address);
            
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
                    console.error('Error sending welcome notification:', notifError);
                    // Don't fail registration if notification fails
                }
            }

            // Generate token
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '7d' }
            );

            // Send success response
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role
                    },
                    profile,
                    token,
                    redirectTo: `/${user.role}/update-profile`
                }
            });

        } catch (profileError) {
            // If profile creation fails, delete the user
            await User.findByIdAndDelete(user._id);
            return res.status(500).json({
                success: false,
                message: `Failed to create ${user.role} profile`,
                error: profileError.message
            });
        }
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

// Login user with email/phone and password
exports.loginUser = async (req, res) => {
    try {
        console.log('Login attempt:', { ...req.body, password: '***' });
        const { identifier, password } = req.body;
        
        // Validate input
        if (!identifier || !password) {
            console.log('Missing credentials:', { identifier: !!identifier, password: !!password });
            return res.status(400).json({
                success: false,
                message: 'Please provide email/phone and password'
            });
        }

        // Normalize the identifier (could be email or phone)
        const normalizedIdentifier = identifier.toLowerCase().trim();
        console.log('Normalized identifier:', normalizedIdentifier);
        
        // Determine if identifier is an email or phone number
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier);
        const normalizedPhone = normalizedIdentifier.replace(/\D/g, '');
        const isPhone = /^\d{10}$/.test(normalizedPhone);
        
        console.log('Identifier type:', { isEmail, isPhone });
        
        // Find user by email or phone
        const query = {
            $or: [
                ...(isEmail ? [{ email: normalizedIdentifier }] : []),
                ...(isPhone ? [{ phone: normalizedPhone }] : [])
            ]
        };
        console.log('Search query:', JSON.stringify(query));
        
        const user = await User.findOne(query).select('+password');
        console.log('User found:', user ? { 
            _id: user._id, 
            email: user.email, 
            phone: user.phone,
            role: user.role,
            status: user.status 
        } : 'No user found');

        if (!user) {
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
                details: {
                    type: isEmail ? 'email' : 'phone',
                    exists: false,
                    hint: isEmail ? 
                        'No account found with this email address. Please register first.' : 
                        'No account found with this phone number. Please register first.'
                }
            });
        }

        // Check if user is active
        if (user.status === 'blocked') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been blocked. Please contact support.'
            });
        }

        // Check password
        console.log('Comparing password for user:', user._id);
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', isMatch);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
                details: {
                    type: 'password',
                    exists: true,
                    hint: 'The password you entered is incorrect. Please try again.'
                }
            });
        }

        // Get appropriate profile model based on role
        let profile = null;
        const Profile = user.role === 'admin' ? AdminProfile : 
                       user.role === 'customer' ? CustomerProfile : 
                       WorkerProfile;
        console.log('Looking for profile with role:', user.role);
        profile = await Profile.findOne({ userId: user._id });
        console.log('Profile found:', profile ? { 
            _id: profile._id, 
            username: profile.username,
            status: profile.status 
        } : 'No profile found');

        // Check if profile exists
        if (!profile) {
            // Generate token for profile completion
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '24h' }
            );

            return res.status(200).json({
                success: false,
                message: 'Please complete your profile',
                details: {
                    type: 'profile',
                    exists: false,
                    hint: `Your ${user.role} profile needs to be completed before you can proceed.`
                },
                data: {
                    token, // Include token for authenticated profile completion
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role
                    },
                    redirectTo: user.role === 'worker' ? '/worker/update-profile' : 
                               user.role === 'customer' ? '/customer/update-profile' : 
                               '/admin/update-profile'
                }
            });
        }

        // Update last login time
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        // Send response with profile-specific redirect
        // Prepare response based on user role
        // Prepare profile data
        const profileData = profile ? {
            username: profile.username,
            photo: profile.photo || 'default-profile.jpg',
            status: profile.status,
            bio: profile.bio,
            preferences: profile.preferences,
            stats: profile.stats,
            ...(profile.address && { address: profile.address }),
            ...(user.role === 'worker' && {
                skills: profile.skills,
                isVerified: profile.isVerified,
                ratingAverage: profile.ratingAverage,
                ratingCount: profile.ratingCount
            })
        } : null;

        const responseData = {
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
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt,
                    isEmailVerified: user.isEmailVerified || false,
                    isPhoneVerified: user.isPhoneVerified || false,
                    username: profile?.username
                },
                profile: profileData,
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
                    theme: profile?.preferences?.theme || 'light',
                    language: profile?.preferences?.language || 'en',
                    notifications: profile?.preferences?.notifications ?? true,
                    currency: profile?.preferences?.currency || 'INR'
                }
            }
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error('Login error details:', {
            message: error.message,
            stack: error.stack,
            path: error.path,
            name: error.name,
            code: error.code
        });
        
        // Send a more specific error message in development
        const isDevelopment = process.env.NODE_ENV !== 'production';
        res.status(500).json({
            success: false,
            message: isDevelopment ? `Login error: ${error.message}` : 'Internal server error during login',
            ...(isDevelopment && { details: {
                path: error.path,
                name: error.name,
                code: error.code
            }})
        });
    }
};

// Logout user (client-side token removal)
exports.logoutUser = async (req, res) => {
    try {
        // Update last logout time if user is authenticated
        if (req.user && req.user.id) {
            const user = await User.findById(req.user.id);
            if (user) {
                user.lastLogout = new Date();
                await user.save();
                
                // Log the logout for security audit
                console.log('User logged out:', {
                    userId: user._id,
                    email: user.email,
                    role: user.role,
                    timestamp: user.lastLogout
                });
            }
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
            ...(process.env.NODE_ENV === 'development' && { error: error.message })
        });
    }
};