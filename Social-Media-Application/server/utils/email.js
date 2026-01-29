import nodemailer from "nodemailer";

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Function to send email
export const sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

// Function to send welcome email
export const sendWelcomeEmail = async (userEmail, userName) => {
    const htmlContent = `
        <h2>Welcome to Social Media!</h2>
        <p>Hi ${userName},</p>
        <p>Thanks for signing up. Your account is now active!</p>
        <p>Start connecting with friends and sharing your moments.</p>
        <p>Best regards,<br>Social Media Team</p>
    `;

    return sendEmail(userEmail, "Welcome to Social Media", htmlContent);
};

// Function to send password reset email
export const sendPasswordResetEmail = async (userEmail, resetLink) => {
    const htmlContent = `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
    `;

    return sendEmail(userEmail, "Password Reset", htmlContent);
};

// Function to send OTP email
export const sendOTPEmail = async (userEmail, otp) => {
    const htmlContent = `
        <h2>Your OTP Code</h2>
        <p>Your One-Time Password is:</p>
        <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>Do not share this code with anyone.</p>
        <p>If you didn't request this, please ignore this email.</p>
    `;

    return sendEmail(userEmail, "Your OTP Code", htmlContent);
};

export default { sendEmail, sendWelcomeEmail, sendPasswordResetEmail, sendOTPEmail };
