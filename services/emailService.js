const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    // Send email OTP
    async sendOTPEmail(email, otp) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Email - Call Karigar',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Verify Your Email Address</h2>
                    <p>Your email verification code is:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p>This code will expire in 5 minutes.</p>
                    <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #888; font-size: 12px;">Call Karigar - Professional Services at Your Doorstep</p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('OTP email sent to:', email);
            return true;
        } catch (error) {
            console.error('Error sending OTP email:', error);
            return false;
        }
    }

    // Generic send email method
    async sendEmail(to, subject, text, html) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html: html || text.replace(/\n/g, '<br>')
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Email sent to:', to);
            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    }

    // Send welcome email
    async sendWelcomeEmail(email, name) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to Call Karigar!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome to Call Karigar!</h2>
                    <p>Dear ${name},</p>
                    <p>Thank you for joining Call Karigar. We're excited to have you on board!</p>
                    <p>With Call Karigar, you can:</p>
                    <ul>
                        <li>Book professional services</li>
                        <li>Track your bookings in real-time</li>
                        <li>Rate and review service providers</li>
                        <li>Access 24/7 customer support</li>
                    </ul>
                    <p>If you have any questions, feel free to reach out to our support team.</p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #888; font-size: 12px;">Call Karigar - Professional Services at Your Doorstep</p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Welcome email sent to:', email);
            return true;
        } catch (error) {
            console.error('Error sending welcome email:', error);
            return false;
        }
    }

    // Send email verification success email
    async sendVerificationSuccessEmail(email) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verified Successfully - Call Karigar',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Email Verified Successfully!</h2>
                    <p>Your email address has been successfully verified.</p>
                    <p>You can now access all features of Call Karigar.</p>
                    <div style="background-color: #f4f4f4; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0;">Start exploring our services now!</p>
                    </div>
                    <hr style="margin: 20px 0;">
                    <p style="color: #888; font-size: 12px;">Call Karigar - Professional Services at Your Doorstep</p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Verification success email sent to:', email);
            return true;
        } catch (error) {
            console.error('Error sending verification success email:', error);
            return false;
        }
    }
}

module.exports = new EmailService();
