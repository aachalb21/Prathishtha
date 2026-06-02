import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure your transporter (update with your credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_ADDRESS, // TODO: Replace with your email
    pass: process.env.EMAIL_PASSWORD     // TODO: Replace with your app password
  }
});

/**
 * Send an OTP email to a user
 * @param {string} to - Recipient's email address
 * @param {string} otp - The OTP code to send
 * @returns {Promise}
 */
function sendOTP(to, otp) {
  try {
    // Read the HTML template
    const templatePath = path.join(__dirname, 'templates', 'verification.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    
    // Replace the OTP placeholder with actual OTP
    htmlTemplate = htmlTemplate.replace('{{OTP_CODE}}', otp);
    
    const mailOptions = {
      from: {
        name: 'Pratishtha 2026 - SAKECFEST',
        address: process.env.EMAIL_ADDRESS
      },
      to,
      subject: '🔐 Pratishtha 2026 - Account Verification Code',
      html: htmlTemplate,
      text: `Your Pratishtha 2026 verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\n--\nPratishtha 2026 Team\nSAKEC`
    };
    
    return transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error reading email template:', error);
    
    // Fallback to simple text email if template fails
    const mailOptions = {
      from: {
        name: 'Pratishtha 2026 - SAKECFEST',
        address: process.env.EMAIL_ADDRESS
      },
      to,
      subject: '🔐 Pratishtha 2026 - Account Verification Code',
      text: `Your Pratishtha 2026 verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\n--\nPratishtha 2026 Team\nSAKEC`
    };
    
    return transporter.sendMail(mailOptions);
  }
}

export default sendOTP;