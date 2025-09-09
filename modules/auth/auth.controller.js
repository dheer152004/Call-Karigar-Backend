const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../user/user.model');
const CustomerProfile = require('../user/customer/customerProfile.model');
const WorkerProfile = require('../user/worker/workerProfile/workerProfile.model');
const AdminProfile = require('../user/admin/adminProfile.model');
const NotificationService = require('../../services/notificationService');
const Address = require('../address/address.model');

// Helper function to generate a unique username from name and email
const generateUsername = async (user, Model, isWorker = false) => {
    // Get name and email parts
    const namePart = user.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const emailPart = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Create base username
    let baseUsername = `${namePart}.${emailPart}`;
    if (isWorker) baseUsername += '.pro';
    
    // Try the base username first
    let username = baseUsername;
    let counter = 1;
    
    // Keep trying until we find a unique username
    while (await Model.findOne({ username })) {
        username = isWorker ? 
            `${baseUsername}${counter}` : 
            `${baseUsername}${counter}`;
        counter++;
    }

    return username;
};

const createBasicProfile = async (user) => {
    let profile = null;
    let message = '';
    let redirectTo = '';

    switch (user.role) {
        case 'admin':
            const adminProfile = await AdminProfile.create({
                userId: user._id,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            profile = {
                _id: adminProfile._id,
                userId: user._id
            };
            
            redirectTo = '/admin/update-profile';
            message = 'Admin registration successful. Please complete your profile.';
            break;

        case 'customer':
            // Create minimal customer profile
            const customerProfile = await CustomerProfile.create({
                userId: user._id,
                status: 'new',
                phoneNumber: user.phone,
                email: user.email,
                photo: 'default-profile.jpg',
                bio: '',
                address: [],
                savedAddresses: [],
                savedWorkers: [],
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

            profile = {
                _id: customerProfile._id,
                userId: user._id
            };
            
            redirectTo = '/customer/update-profile';
            message = 'Customer registration successful. Please complete your profile.';
            break;

        case 'worker':
            // Generate unique username for worker
            const username = await generateUsername(user, WorkerProfile, true);
            
            // Create worker profile with generated username
            const workerProfile = await WorkerProfile.create({
                userId: user._id,
                username: username,
                phoneNumber: user.phone,
                email: user.email,
                photo: 'default-worker.jpg',
                bio: 'Hello, I am a new service provider.',
                skills: [],
                status: 'pending',
                isVerified: false,
                availability: {
                    isAvailable: false,
                    schedule: []
                },
                preferences: {
                    language: 'en',
                    notifications: true,
                    maxJobRadius: 10,
                    autoAccept: false
                },
                stats: {
                    totalJobs: 0,
                    completedJobs: 0,
                    cancelledJobs: 0,
                    totalEarnings: 0,
                    rating: 0,
                    ratingCount: 0
                }
            });

            profile = {
                _id: workerProfile._id,
                userId: user._id
            };
            
            redirectTo = '/worker/update-profile';
            message = 'Worker registration successful. Please complete your profile and verify your documents.';
            break;
    }

    return {
        profile: { _id: profile.insertedId, userId: user._id },
        message,
        redirectTo
    };
};

// Helper function to create a new address
const createAddress = async (user, addressData) => {
    if (!addressData) return null;

    const address = new Address({
        userId: user._id,
        label: addressData.label || 'Home',
        addressLine: addressData.addressLine,
        city: addressData.city,
        state: addressData.state,
        postalCode: addressData.postalCode,
        country: addressData.country || 'India',
        isPrimary: true
    });
    const savedAddress = await address.save();
    return savedAddress._id;
};

// Helper function to get base profile data
const getBaseProfileData = (user, addressId = null) => {
    return {
        userId: user._id.toString(),
        phoneNumber: user.phone,
        email: user.email,
        address: addressId,
        preferences: { 
            language: 'en', 
            notifications: true 
        },
        savedAddresses: addressId ? [addressId] : []
    };
};

// Create initial profile is handled by createBasicProfile function
// This section is no longer needed as we're creating minimal profiles during registration

// Register a new user
exports.registerUser = async (req, res) => {
    try {
        const { 
            name, 
            email, 
            phone, 
            password, 
            role
        } = req.body;

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

        // Check for existing user with case-insensitive email or exact phone match
        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { phone: normalizedPhone }
            ]
        });

        if (existingUser) {
            const isDuplicateEmail = existingUser.email.toLowerCase() === normalizedEmail.toLowerCase();
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

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        console.log('Creating new user:', {
            name: name.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            role: role || 'customer'
        });

        // Create user with hashed password using create method
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            password: hashedPassword,
            role: role || 'customer',
            status: 'active',
            isPhoneVerified: false,
            isEmailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('User created successfully:', {
            _id: user._id,
            email: user.email,
            phone: user.phone,
            role: user.role
        });

        // Create basic profile
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
                console.error('Error sending welcome notification:', notifError);
                // Don't fail registration if notification fails
            }
        }

        // Send success response
        res.status(201).json({
            success: true,
            message: message,
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
                redirectTo
            }
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
                ...(isEmail ? [{ email: normalizedIdentifier.toLowerCase() }] : []),
                ...(isPhone ? [{ phone: normalizedPhone }] : [])
            ]
        };
        console.log('Search query:', JSON.stringify(query));
        
        // Make sure to select password field and use case-insensitive email comparison
        const user = await User.findOne(query);
        console.log('User found:', user ? { 
            _id: user._id, 
            email: user.email, 
            phone: user.phone,
            role: user.role
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
        try {
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
        } catch (error) {
            console.error('Password comparison error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error during authentication',
                details: {
                    type: 'server_error',
                    hint: 'Please try again later.'
                }
            });
        }

        // Get appropriate profile model based on role
        let profile = null;
        let redirectTo = null;
        
        // Fetch user's addresses
        const addresses = await Address.find({ userId: user._id })
            .sort({ isPrimary: -1, createdAt: -1 });
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
                success: true,
                message: 'Please complete your profile',
                details: {
                    type: 'profile',
                    exists: false,
                    hint: `Your ${user.role} profile needs to be completed before you can proceed.`
                },
                data: {
                    token,
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
                addresses: addresses,
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