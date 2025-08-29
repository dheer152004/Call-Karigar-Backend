const OTP = require('../models/OTP');
const User = require('../models/User');

// Generate OTP - Always 6 digits with leading zeros if needed
function generateOTP() {
    // Generate a random number between 0 and 999999
    const otp = Math.floor(Math.random() * 1000000);
    // Pad with leading zeros to always make it 6 digits
    return otp.toString().padStart(6, '0');
}

// Send OTP (You'll need to implement your SMS service)
async function sendSMS(phone, otp) {
    // Implement your SMS service here
    console.log(`Sending OTP: ${otp} to phone: ${phone}`);
    return true;
}

// Send OTP for phone verification
exports.sendOTP = async (req, res) => {
    try {
        const { phone, purpose, userId } = req.body;

        if (!phone || !userId || !purpose) {
            return res.status(400).json({
                success: false,
                message: 'Phone number, user ID, and purpose are required'
            });
        }

        // Normalize phone number
        const normalizedPhone = phone.replace(/\D/g, '');

        // Check if OTP already exists and not expired for this specific user
        const existingOTP = await OTP.findOne({
            userId,
            phone: normalizedPhone,
            createdAt: { $gt: new Date(Date.now() - 300000) } // Within last 5 minutes
        });

        if (existingOTP) {
            const timeLeft = Math.ceil((existingOTP.createdAt.getTime() + 300000 - Date.now()) / 1000);
            return res.status(400).json({
                success: false,
                message: `Please wait ${timeLeft} seconds before requesting a new OTP`
            });
        }

        // Generate new OTP
        const otp = generateOTP();

        // Save OTP in database
        const savedOTP = await OTP.create({
            userId: userId,
            phone: normalizedPhone,
            otp,
            purpose,
            isVerified: false
        });

        console.log('Saved OTP record:', {
            userId: savedOTP.userId,
            phone: savedOTP.phone,
            otp: savedOTP.otp,
            createdAt: savedOTP.createdAt
        });

        // Send OTP via SMS
        await sendSMS(normalizedPhone, otp);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully'
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
        const { phone, otp, userId } = req.body;

        if (!phone || !otp || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Phone number, OTP, and user ID are required'
            });
        }

        // Normalize phone number
        const normalizedPhone = phone.replace(/\D/g, '');

        // Log the search parameters
        console.log('Verifying OTP with:', {
            userId,
            phone: normalizedPhone,
            providedOtp: otp,
            searchTime: new Date(Date.now() - 300000)
        });

        // Find all recent OTPs for debugging
        const allRecentOTPs = await OTP.find({
            userId,
            isVerified: false,
            createdAt: { $gt: new Date(Date.now() - 300000) }
        }).sort({ createdAt: -1 });

        console.log('All recent OTPs found:', allRecentOTPs.map(otp => ({
            phone: otp.phone,
            otp: otp.otp,
            createdAt: otp.createdAt
        })));

        // Find the latest OTP for this specific user and phone number
        const otpDoc = await OTP.findOne({
            userId,
            phone: normalizedPhone,
            isVerified: false,
            createdAt: { $gt: new Date(Date.now() - 300000) } // Within last 5 minutes
        }).sort({ createdAt: -1 });

        // Log what we found or didn't find
        if (otpDoc) {
            console.log('Found OTP record:', {
                storedOtp: otpDoc.otp,
                storedPhone: otpDoc.phone,
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
                message: 'Maximum verification attempts reached. Please request a new OTP'
            });
        }

        // Increment attempts
        otpDoc.attempts += 1;

        // Verify OTP
        if (otpDoc.otp !== otp) {
            await otpDoc.save();
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP',
                attemptsLeft: 3 - otpDoc.attempts
            });
        }

        // Mark OTP as verified
        otpDoc.isVerified = true;
        await otpDoc.save();

        // If this is for registration, update user's phone verification status
        if (otpDoc.purpose === 'registration') {
            await User.findOneAndUpdate(
                { phone: normalizedPhone },
                { isPhoneVerified: true }
            );
        }

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully'
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying OTP'
        });
    }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
    try {
        const { phone, purpose, userId } = req.body;

        if (!phone || !purpose) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and purpose are required'
            });
        }

        // Normalize phone number
        const normalizedPhone = phone.replace(/\D/g, '');

        // Check if previous OTP exists and not expired
        const existingOTP = await OTP.findOne({
            phone: normalizedPhone,
            createdAt: { $gt: new Date(Date.now() - 300000) } // Within last 5 minutes
        });

        if (existingOTP) {
            const timeLeft = Math.ceil((existingOTP.createdAt.getTime() + 300000 - Date.now()) / 1000);
            return res.status(400).json({
                success: false,
                message: `Please wait ${timeLeft} seconds before requesting a new OTP`
            });
        }

        // Generate new OTP
        const otp = generateOTP();

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Save new OTP
        await OTP.create({
            userId,
            phone: normalizedPhone,
            otp,
            purpose,
            isVerified: false
        });

        // Send OTP via SMS
        await sendSMS(normalizedPhone, otp);

        res.status(200).json({
            success: true,
            message: 'OTP resent successfully'
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resending OTP'
        });
    }
};

module.exports = exports;
