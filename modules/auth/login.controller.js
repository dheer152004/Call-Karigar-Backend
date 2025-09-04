const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../user/user.model');
const CustomerProfile = require('../user/customer/customerProfile.model');
const WorkerProfile = require('../user/worker/workerProfile/workerProfile.model');
const AdminProfile = require('../user/admin/admin.model');

// exports.loginUser = async (req, res) => {
//     try {
//         console.log('Login attempt:', { ...req.body, password: '***' });
//         const { identifier, password } = req.body;
        
//         // Validate input
//         if (!identifier || !password) {
//             console.log('Missing credentials:', { identifier: !!identifier, password: !!password });
//             return res.status(400).json({
//                 success: false,
//                 message: 'Please provide email/phone and password'
//             });
//         }

//         // Check if identifier is email
//         const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        
//         // Build query based on identifier type
//         const searchQuery = isEmail
//             ? { email: identifier.toLowerCase().trim() }
//             : { phone: identifier.replace(/\D/g, '') };
            
//         console.log('Search query:', JSON.stringify(searchQuery));

//         // Find user
//         const user = await User.findOne(searchQuery).select('+password');
//         console.log('User found:', user ? {
//             _id: user._id,
//             email: user.email,
//             phone: user.phone,
//             role: user.role
//         } : 'No user found');

//         // Check if user exists
//         if (!user) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid credentials',
//                 details: {
//                     type: isEmail ? 'email' : 'phone',
//                     exists: false,
//                     hint: isEmail 
//                         ? 'No account found with this email address. Please register first.'
//                         : 'No account found with this phone number. Please register first.'
//                 }
//             });
//         }

//         // Check password
//         console.log('Verifying password for user:', user._id);
//         const isMatch = await bcrypt.compare(password, user.password);
//         console.log('Password match:', isMatch);

//         if (!isMatch) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid credentials',
//                 details: {
//                     type: 'password',
//                     exists: true,
//                     hint: 'The password you entered is incorrect. Please try again.'
//                 }
//             });
//         }

//         // Get appropriate profile
//         const Profile = user.role === 'admin' ? AdminProfile :
//                        user.role === 'customer' ? CustomerProfile :
//                        WorkerProfile;

//         const profile = await Profile.findOne({ userId: user._id });
//         console.log('Profile found:', profile ? {
//             _id: profile._id,
//             role: user.role,
//             username: profile.username
//         } : 'No profile found');

//         // Update last login
//         user.lastLogin = new Date();
//         await user.save();

//         // Generate JWT token
//         const token = jwt.sign(
//             { id: user._id, role: user.role },
//             process.env.JWT_SECRET,
//             { expiresIn: process.env.JWT_EXPIRE || '24h' }
//         );

//         // Send response
//         res.status(200).json({
//             success: true,
//             message: 'Login successful',
//             data: {
//                 token,
//                 user: {
//                     id: user._id,
//                     name: user.name,
//                     email: user.email,
//                     phone: user.phone,
//                     role: user.role,
//                     lastLogin: user.lastLogin
//                 },
//                 profile: profile ? {
//                     id: profile._id,
//                     username: profile.username,
//                     ...(user.role === 'worker' ? { 
//                         isVerified: profile.isVerified,
//                         status: profile.status
//                     } : {})
//                 } : null,
//                 redirectTo: profile 
//                     ? `/${user.role}/dashboard`
//                     : `/${user.role}/update-profile`
//             }
//         });

//     } catch (error) {
//         console.error('Login error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error during login',
//             details: {
//                 type: 'server',
//                 error: process.env.NODE_ENV === 'development' ? error.message : undefined
//             }
//         });
//     }
// };
