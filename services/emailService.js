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
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f2f7fc; color:#1d2b48; padding: 35px 10px;">
                    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 15px; box-shadow: 0 12px 24px rgba(0,0,0,0.08); overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #0c7cbe, #28a745); padding: 20px 25px; text-align: center; color: white;">
                            <h1 style="font-size: 20px; margin: 0;">Call Karigar</h1>
                            <p style="margin: 8px 0 0; font-size: 13px; letter-spacing: 1px;">Email Verification Code</p>
                        </div>
                        <div style="padding: 25px;">
                            <p style="font-size: 15px; margin: 0 0 12px;">Hello,</p>
                            <p style="font-size: 15px; margin: 0 0 18px;">You have requested to verify your email address for your Call Karigar account. Use the OTP below to complete the verification process.</p>

                            <div style="background: #f9fafc; border: 1px dashed #dce3ef; padding: 17px 0; text-align: center; border-radius: 10px;">
                                <span style="font-size: 32px; letter-spacing: 8px; color: #1170eb; font-weight: 700;">${otp}</span>
                            </div>

                            <p style="font-size: 14px; margin: 18px 0; color: #65748b;">Valid for 5 minutes only. Do not share this code with anyone.</p>
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="display: inline-block; background: linear-gradient(90deg, #0c7cbe, #28a745); color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: 600;">Return to Call Karigar</a>

                            <p style="font-size: 12px; margin: 20px 0 0; color: #9aa3b0;">If you did not request this, please ignore this email. This will not affect your account.</p>
                        </div>
                        <div style="background: #f5f8fd; padding: 13px 20px; text-align: center; font-size: 12px; color: #7d8ba0;">
                            <p style="margin: 0;">Call Karigar - Professional services at your doorstep</p>
                        </div>
                    </div>
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
