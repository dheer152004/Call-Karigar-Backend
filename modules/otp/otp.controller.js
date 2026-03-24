const OTP = require('./otp.model');
const User = require('../user/user.model');
const emailService = require('../../services/emailService');
const NotificationService = require('../../services/notificationService');

function generateOTP() {
    return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
}

async function sendSMS(phone, otp) {
    console.log(`Sending OTP: ${otp} to phone: ${phone}`);
    return true;
}

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
                message: 'User ID, purpose, method, and phone/email are required'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const normalizedPhone = phone ? phone.replace(/\D/g, '') : null;
        const normalizedEmail = email ? email.toLowerCase().trim() : null;

        if (method === 'phone' && !normalizedPhone) {
            return res.status(400).json({ success: false, message: 'Phone number is required for phone verification' });
        }
        if (method === 'email' && !normalizedEmail) {
            return res.status(400).json({ success: false, message: 'Email is required for email verification' });
        }

        // Check cooldown
        const existingOTP = await OTP.findOne({
            userId,
            method,
            isVerified: false,
            createdAt: { $gt: new Date(Date.now() - 60000) }
        });

        if (existingOTP) {
            const timeLeft = Math.ceil((existingOTP.createdAt.getTime() + 60000 - Date.now()) / 1000);
            return res.status(400).json({
                success: false,
                message: `Please wait ${timeLeft} seconds before requesting a new OTP`
            });
        }

        const otp = generateOTP();

        // Invalidate previous OTPs
        await OTP.updateMany({ userId, method, isVerified: false }, { isVerified: true });

        const otpRecord = await OTP.create({
            userId,
            phone: normalizedPhone,
            email: normalizedEmail,
            otp,
            method,
            purpose
        });

        let sent = false;
        if (method === 'phone') {
            sent = await sendSMS(normalizedPhone, otp);
        } else {
            sent = await sendEmail(normalizedEmail, otp);
        }

        if (!sent) {
            await otpRecord.deleteOne(); // ✅ fixed from .delete()
            return res.status(500).json({ success: false, message: `Failed to send OTP via ${method}` });
        }

        await NotificationService.createNotification({
            userId,
            type: 'otp_sent',   // ✅ fixed from 'security_alert'
            category: 'account',
            title: 'OTP Sent',
            message: `Verification code sent to your ${method}`,
            recipientRole: user.role,
            priority: 'high',
            metadata: { method, purpose, timestamp: new Date() }
        });

        res.json({
            success: true,
            message: `OTP sent successfully via ${method}`,
            method,
            contact: method === 'phone' ? normalizedPhone : normalizedEmail
        });

    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending OTP',
            ...(process.env.NODE_ENV !== 'production' && { error: error.message })
        });
    }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
    try {
        const { otp, method, phone, email, userId } = req.body;

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

        if (!['phone', 'email'].includes(method)) {
            return res.status(400).json({ success: false, message: "Method must be 'phone' or 'email'" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const normalizedPhone = phone ? phone.replace(/\D/g, '') : null;
        const normalizedEmail = email ? email.toLowerCase().trim() : null;

        const otpDoc = await OTP.findOne({
            userId,
            method,
            [method === 'phone' ? 'phone' : 'email']: method === 'phone' ? normalizedPhone : normalizedEmail,
            isVerified: false,
            createdAt: { $gt: new Date(Date.now() - 300000) }
        }).sort({ createdAt: -1 });

        if (!otpDoc) {
            return res.status(400).json({ success: false, message: 'OTP expired or not found' });
        }

        if (otpDoc.isMaxAttemptsReached()) {
            return res.status(400).json({
                success: false,
                message: 'Maximum attempts reached. Please request a new OTP',
                maxAttemptsReached: true
            });
        }

        otpDoc.attempts += 1;

        if (otpDoc.otp !== otp) {
            await otpDoc.save();
            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${3 - otpDoc.attempts} attempts remaining`,
                attemptsLeft: 3 - otpDoc.attempts
            });
        }

        otpDoc.isVerified = true;
        await otpDoc.save();

        // ✅ updateOne — no pre-save middleware triggered
        await User.updateOne(
            { _id: userId },
            method === 'phone' ? { isPhoneVerified: true } : { isEmailVerified: true }
        );

        if (method === 'email') {
            await emailService.sendVerificationSuccessEmail(normalizedEmail);
        }

        await NotificationService.createNotification({
            userId,
            type: method === 'phone' ? 'phone_verified' : 'email_verified', // ✅ now in enum
            category: 'account',
            title: `${method === 'phone' ? 'Phone' : 'Email'} Verified`,
            message: `Your ${method} has been verified successfully`,
            recipientRole: user.role,
            priority: 'low'
        });

        // Fetch updated user to return fresh verification status
        const updatedUser = await User.findById(userId);

        res.json({
            success: true,
            message: `${method === 'phone' ? 'Phone' : 'Email'} verified successfully`,
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                role: updatedUser.role,
                isPhoneVerified: updatedUser.isPhoneVerified,
                isEmailVerified: updatedUser.isEmailVerified
            }
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying OTP',
            ...(process.env.NODE_ENV !== 'production' && { error: error.message })
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
                message: 'User ID, purpose, method, and phone/email are required'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const normalizedPhone = phone ? phone.replace(/\D/g, '') : null;
        const normalizedEmail = email ? email.toLowerCase().trim() : null;

        if (method === 'phone' && !normalizedPhone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }
        if (method === 'email' && !normalizedEmail) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Check cooldown
        const existingOTP = await OTP.findOne({
            userId,
            method,
            isVerified: false,
            createdAt: { $gt: new Date(Date.now() - 60000) }
        });

        if (existingOTP) {
            const timeLeft = Math.ceil((existingOTP.createdAt.getTime() + 60000 - Date.now()) / 1000);
            return res.status(400).json({
                success: false,
                message: `Please wait ${timeLeft} seconds before requesting a new OTP`
            });
        }

        // ✅ Invalidate old OTPs before creating new one
        await OTP.updateMany({ userId, method, isVerified: false }, { isVerified: true });

        const otp = generateOTP();

        const otpRecord = await OTP.create({
            userId,
            phone: normalizedPhone,
            email: normalizedEmail,
            otp,
            method,
            purpose,
            isVerified: false
        });

        let sent = false;
        if (method === 'phone') {
            sent = await sendSMS(normalizedPhone, otp);
        } else {
            sent = await sendEmail(normalizedEmail, otp);
        }

        if (!sent) {
            await otpRecord.deleteOne(); // ✅ fixed from .delete()
            return res.status(500).json({ success: false, message: `Failed to send OTP via ${method}` });
        }

        await NotificationService.createNotification({
            userId,
            type: 'otp_resent',     // ✅ now in enum
            category: 'account',
            title: 'OTP Resent',
            message: `New verification code sent to your ${method}`,
            recipientRole: user.role,
            priority: 'low',
            metadata: { method, purpose, timestamp: new Date() }
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
            ...(process.env.NODE_ENV !== 'production' && { error: error.message })
        });
    }
};

// Request new OTP
exports.requestNewOTP = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.isPhoneVerified) {
            return res.status(400).json({ success: false, message: 'Phone number is already verified' });
        }

        // ✅ Inline cooldown check — removed undefined checkOTPCooldown()
        const existingOTP = await OTP.findOne({
            userId,
            method: 'phone',
            isVerified: false,
            createdAt: { $gt: new Date(Date.now() - 60000) }
        });

        if (existingOTP) {
            const timeLeft = Math.ceil((existingOTP.createdAt.getTime() + 60000 - Date.now()) / 1000);
            return res.status(429).json({
                success: false,
                message: `Please wait ${timeLeft} seconds before requesting a new OTP`
            });
        }

        const otp = generateOTP();

        await OTP.updateMany(
            { userId, isVerified: false, purpose: 'registration' },
            { isVerified: true }
        );

        await OTP.create({
            userId,
            phone: user.phone,
            otp,
            method: 'phone',
            purpose: 'registration'
        });

        await sendSMS(user.phone, otp);

        res.json({ success: true, message: 'New OTP sent successfully' });

    } catch (error) {
        console.error('Request new OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending new OTP',
            ...(process.env.NODE_ENV !== 'production' && { error: error.message })
        });
    }
};

module.exports = exports;