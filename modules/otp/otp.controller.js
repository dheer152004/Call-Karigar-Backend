const OTP = require('./otp.model');
const User = require('../user/user.model');
const emailService = require('../../services/emailService');
const NotificationService = require('../../services/notificationService');

// Generate OTP - Always 6 digits with leading zeros if needed
function generateOTP() {
    // Generate a random number between 0 and 999999
    const otp = Math.floor(Math.random() * 1000000);
    // Pad with leading zeros to always make it 6 digits
    return otp.toString().padStart(6, '0');
}

// Send OTP via SMS
async function sendSMS(phone, otp) {
    // Implement your SMS service here
    console.log(`Sending OTP: ${otp} to phone: ${phone}`);
    return true;
}

// Send OTP via Email
async function sendEmail(email, otp) {
    return emailService.sendOTPEmail(email, otp);
}

// Send OTP
exports.sendOTP = async (req, res) => {
    try {
        const { method, phone, email, purpose, userId } = req.body;

        if (!userId || !purpose || !method || !(phone || email)) {
            return res.status(400).json({
                success: false,
                message: 'User ID, purpose, method (phone/email), and phone/email are required'
            });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Normalize contact info
        const normalizedPhone = phone ? phone.replace(/\D/g, '') : null;
        const normalizedEmail = email ? email.toLowerCase().trim() : null;

        // Check if method matches provided contact info
        if (method === 'phone' && !normalizedPhone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required for phone verification'
            });
        }
        if (method === 'email' && !normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email is required for email verification'
            });
        }

        // Check cooldown
        const existingOTP = await OTP.findOne({
            userId,
            method,
            isVerified: false,
            createdAt: { $gt: new Date(Date.now() - 60000) } // Within last 60 seconds
        });

        if (existingOTP) {
            const timeLeft = Math.ceil((existingOTP.createdAt.getTime() + 60000 - Date.now()) / 1000);
            return res.status(400).json({
                success: false,
                message: `Please wait ${timeLeft} seconds before requesting a new OTP`
            });
        }

        // Generate new OTP
        const otp = generateOTP();

        // Invalidate previous unverified OTPs
        await OTP.updateMany(
            {
                userId,
                method,
                isVerified: false
            },
            { isVerified: true }
        );

        // Create new OTP record
        const otpRecord = await OTP.create({
            userId,
            phone: normalizedPhone,
            email: normalizedEmail,
            otp,
            method,
            purpose
        });

        // Send OTP based on method
        let sent = false;
        if (method === 'phone') {
            sent = await sendSMS(normalizedPhone, otp);
        } else {
            sent = await sendEmail(normalizedEmail, otp);
        }

        if (!sent) {
            await otpRecord.delete();
            return res.status(500).json({
                success: false,
                message: `Failed to send OTP via ${method}`
            });
        }

        // Create notification
        await NotificationService.createNotification({
            userId,
            type: 'security_alert', // Using security_alert as it's a security-related verification
            category: 'account',
            title: 'OTP Sent',
            message: `Verification code sent to your ${method}: ${method === 'phone' ? normalizedPhone : normalizedEmail}`,
            recipientRole: user.role || 'customer',
            priority: 'high',
            metadata: {
                method,
                purpose,
                timestamp: new Date()
            }
        });

        res.json({
            success: true,
            message: `OTP sent successfully via ${method}`,
            method,
            contact: method === 'phone' ? normalizedPhone : normalizedEmail
        });

    } catch (error) {
        console.error('Send OTP error:', {
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        res.status(500).json({
            success: false,
            message: 'Error sending OTP',
            error: error.message || error
        });
    }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
    try {
        const { otp, method, phone, email, userId } = req.body;

        // Check for missing required fields
        const missingFields = [];
        if (!otp) missingFields.push('otp');
        if (!method) missingFields.push('method');
        if (!userId) missingFields.push('userId');
        if (!phone && !email) missingFields.push('phone/email');
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate method value
        if (!['phone', 'email'].includes(method)) {
            return res.status(400).json({
                success: false,
                message: "Method must be either 'phone' or 'email'"
            });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Normalize contact info
        const normalizedPhone = phone ? phone.replace(/\D/g, '') : null;
        const normalizedEmail = email ? email.toLowerCase().trim() : null;

        // Log the verification attempt
        console.log('Verifying OTP with:', {
            userId,
            method,
            contact: method === 'phone' ? normalizedPhone : normalizedEmail,
            providedOtp: otp,
            searchTime: new Date(Date.now() - 300000)
        });

        // Find the latest OTP record
        const otpDoc = await OTP.findOne({
            userId,
            method,
            [method === 'phone' ? 'phone' : 'email']: method === 'phone' ? normalizedPhone : normalizedEmail,
            isVerified: false,
            createdAt: { $gt: new Date(Date.now() - 300000) } // Within last 5 minutes
        }).sort({ createdAt: -1 });

        // Log what we found or didn't find
        if (otpDoc) {
            console.log('Found OTP record:', {
                storedOtp: otpDoc.otp,
                storedContact: method === 'phone' ? otpDoc.phone : otpDoc.email,
                method: otpDoc.method,
                createdAt: otpDoc.createdAt,
                isVerified: otpDoc.isVerified,
                attempts: otpDoc.attempts
            });
        } else {
            console.log('No matching OTP found');
        }

        if (!otpDoc) {
            return res.status(400).json({
                success: false,
                message: 'OTP expired or not found'
            });
        }

        // Check if max attempts reached
        if (otpDoc.isMaxAttemptsReached()) {
            return res.status(400).json({
                success: false,
                message: 'Maximum verification attempts reached. Please request a new OTP',
                maxAttemptsReached: true
            });
        }

        // Increment attempts
        otpDoc.attempts += 1;

        // Verify OTP
        if (otpDoc.otp !== otp) {
            await otpDoc.save();
            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${3 - otpDoc.attempts} attempts remaining`,
                attemptsLeft: 3 - otpDoc.attempts
            });
        }

        // Mark OTP as verified
        otpDoc.isVerified = true;
        await otpDoc.save();

        // Update user verification status
        if (method === 'phone') {
            user.isPhoneVerified = true;
        } else {
            user.isEmailVerified = true;
        }
        await user.save();

        // Send success email if email was verified
        if (method === 'email') {
            await emailService.sendVerificationSuccessEmail(normalizedEmail);
        }

        // Create verification success notification
        await NotificationService.createNotification({
            userId,
            type: method === 'phone' ? 'phone_verified' : 'email_verified',
            category: 'account',
            title: `${method === 'phone' ? 'Phone' : 'Email'} Verified`,
            message: `Your ${method} has been verified successfully`,
            recipientRole: user.role || 'customer',
            priority: 'low'
        });

        res.json({
            success: true,
            message: `${method === 'phone' ? 'Phone' : 'Email'} verified successfully`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isPhoneVerified: user.isPhoneVerified,
                isEmailVerified: user.isEmailVerified
            }
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying OTP',
            error: error.message
        });
    }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
    try {
        const { method, phone, email, purpose, userId } = req.body;

        if (!method || !purpose || !userId || !(phone || email)) {
            return res.status(400).json({
                success: false,
                message: 'User ID, purpose, method (phone/email), and phone/email are required'
            });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Normalize contact info
        const normalizedPhone = phone ? phone.replace(/\D/g, '') : null;
        const normalizedEmail = email ? email.toLowerCase().trim() : null;

        // Check if method matches provided contact info
        if (method === 'phone' && !normalizedPhone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required for phone verification'
            });
        }
        if (method === 'email' && !normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email is required for email verification'
            });
        }

        // Check if previous OTP exists and not expired
        const existingOTP = await OTP.findOne({
            userId,
            method,
            isVerified: false,
            createdAt: { $gt: new Date(Date.now() - 60000) } // Within last 60 seconds
        });

        if (existingOTP) {
            const timeLeft = Math.ceil((existingOTP.createdAt.getTime() + 60000 - Date.now()) / 1000);
            return res.status(400).json({
                success: false,
                message: `Please wait ${timeLeft} seconds before requesting a new OTP`
            });
        }

        // Generate new OTP
        const otp = generateOTP();

        // Create new OTP record
        const otpRecord = await OTP.create({
            userId,
            phone: normalizedPhone,
            email: normalizedEmail,
            otp,
            method,
            purpose,
            isVerified: false
        });

        // Send OTP based on method
        let sent = false;
        if (method === 'phone') {
            sent = await sendSMS(normalizedPhone, otp);
        } else {
            sent = await sendEmail(normalizedEmail, otp);
        }

        if (!sent) {
            await otpRecord.delete();
            return res.status(500).json({
                success: false,
                message: `Failed to send OTP via ${method}`
            });
        }

        // Create notification
        await NotificationService.createNotification({
            userId,
            type: 'otp_resent',
            category: 'account',
            title: 'OTP Resent',
            message: `New verification code sent to your ${method}`,
            recipientRole: user.role,
            priority: 'low',
            metadata: {
                method,
                purpose,
                timestamp: new Date()
            }
        });

        res.json({
            success: true,
            message: `OTP resent successfully via ${method}`,
            method,
            contact: method === 'phone' ? normalizedPhone : normalizedEmail
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resending OTP',
            error: error.message
        });
    }
};

// Request new OTP
exports.requestNewOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if phone is already verified
    if (user.isPhoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already verified'
      });
    }

    // Check cooldown for this specific user
    const cooldown = await checkOTPCooldown(userId);
    if (cooldown.onCooldown) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${cooldown.timeLeft} seconds before requesting a new OTP`
      });
    }

    // Generate new OTP
    const otp = await generateOTP();
    
    // Invalidate user's previous OTPs
    await OTP.updateMany(
      {
        userId,
        isVerified: false,
        purpose: 'registration'
      },
      { isVerified: true }
    );

    // Create new OTP record
    const otpRecord = await OTP.create({
      userId,
      phone: user.phone,
      otp,
      purpose: 'registration'
    });

    // Send OTP via SMS
    await sendSMS(user.phone, `Your verification code is: ${otp}`);
    console.log('Sending OTP:', otp, 'to phone:', user.phone);

    res.json({
      success: true,
      message: 'New OTP sent successfully'
    });

  } catch (error) {
    console.error('Request new OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending new OTP'
    });
  }
};

module.exports = exports;
