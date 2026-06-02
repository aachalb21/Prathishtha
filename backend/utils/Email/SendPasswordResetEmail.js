import nodemailer from 'nodemailer';
import { passwordResetTemplate } from './templates/passwordResetTemplate.js';

/**
 * Send password reset email to user
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.name - User name
 * @param {string} options.resetURL - Password reset URL
 * @param {string} options.prn - Student PRN
 */
export const sendPasswordResetEmail = async ({ email, name, resetURL, prn }) => {
  try {
    // Check email configuration
    if (!process.env.EMAIL_ADDRESS || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email configuration missing: EMAIL_ADDRESS or EMAIL_PASSWORD not set in environment variables');
    }

    // Create transporter using environment variables (matching existing email config)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_ADDRESS, // Match existing email config
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Create email content with fallback
    let htmlContent, textContent;
    
    try {
      // Try to use the HTML template
      htmlContent = passwordResetTemplate(name, resetURL, prn);
    } catch (templateError) {
      console.warn('Template error, using fallback:', templateError.message);
      // Fallback HTML content
      htmlContent = `
        <h1>Password Reset Request</h1>
        <p>Hello ${name},</p>
        <p>You requested a password reset for your Prathistha account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetURL}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Account: ${prn}</p>
      `;
    }

    textContent = `
Hello ${name},

You requested a password reset for your Prathistha account.

Reset your password by clicking this link:
${resetURL}

This link will expire in 15 minutes.

If you didn't request this reset, please ignore this email.

Account Details:
PRN: ${prn}
Name: ${name}

Best regards,
Prathistha Team
    `.trim();

    // Email options
    const mailOptions = {
      from: {
        name: 'Prathistha - Event Management',
        address: process.env.EMAIL_ADDRESS
      },
      to: email,
      subject: '🔐 Password Reset Request - Prathistha',
      html: htmlContent,
      text: textContent
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Password reset email sent successfully:', {
      messageId: info.messageId,
      recipient: email,
      prn: prn
    });

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Error sending password reset email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check EMAIL_ADDRESS and EMAIL_PASSWORD environment variables.');
    } else if (error.code === 'ECONNECTION') {
      throw new Error('Could not connect to email server. Please check your internet connection.');
    } else if (error.message.includes('configuration missing')) {
      throw new Error(error.message); // Pass through config errors
    } else {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }
};