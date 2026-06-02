import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure your transporter (using existing email configuration)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send a contact us email
 * @param {Object} contactData - Contact form data
 * @param {string} contactData.name - Sender's name
 * @param {string} contactData.email - Sender's email
 * @param {string} contactData.phone - Sender's phone number
 * @param {string} contactData.subject - Message subject
 * @param {string} contactData.message - Message content
 * @returns {Promise}
 */
function sendContactEmail(contactData) {
  try {
    const { name, email, phone, subject, message } = contactData;
    
    // Read the HTML template
    const templatePath = path.join(__dirname, 'templates', 'contact.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    
    // Get current timestamp
    const timestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // Replace all placeholders with actual data
    htmlTemplate = htmlTemplate
      .replace('{{SENDER_NAME}}', name || 'Not provided')
      .replace('{{SENDER_EMAIL}}', email)
      .replace('{{SENDER_PHONE}}', phone || 'Not provided')
      .replace('{{MESSAGE_SUBJECT}}', subject)
      .replace('{{MESSAGE_CONTENT}}', message)
      .replace('{{TIMESTAMP}}', timestamp);
    
    // Email to admin (you)
    const adminMailOptions = {
      from: {
        name: 'Pratishtha 2026 - Contact Form',
        address: process.env.EMAIL_ADDRESS
      },
      to: process.env.EMAIL_ADDRESS, // Your email to receive contact messages
      subject: `🔔 New Contact Message: ${subject}`,
      html: htmlTemplate,
      replyTo: email, // Allow direct reply to sender
      text: `New contact message from Pratishtha 2026 website:
      
Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Subject: ${subject}
Timestamp: ${timestamp}

Message:
${message}

--
This message was sent through the Pratishtha 2026 contact form.
Reply directly to this email to respond to the sender.`
    };
    
    // Confirmation email to sender
    const confirmationMailOptions = {
      from: {
        name: 'Pratishtha 2026 - SAKECFEST',
        address: process.env.EMAIL_ADDRESS
      },
      to: email,
      subject: '✅ Message Received - Pratishtha 2026',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px; }
                .highlight { background: #f0f9ff; padding: 15px; border-left: 4px solid #8b5cf6; margin: 20px 0; border-radius: 0 8px 8px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Message Received!</h1>
                    <p>Pratishtha 2026 - SAKEC Festival</p>
                </div>
                <div class="content">
                    <p>Dear <strong>${name}</strong>,</p>
                    <p>Thank you for contacting us! We have successfully received your message and our team will get back to you soon.</p>
                    
                    <div class="highlight">
                        <h3>📋 Your Message Summary:</h3>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Received:</strong> ${timestamp}</p>
                    </div>
                    
                    <p>We typically respond within 24-48 hours during business days. If your inquiry is urgent, please feel free to call us at <strong>+91 98765 43210</strong>.</p>
                    
                    <p>Thank you for your interest in Pratishtha 2026!</p>
                    
                    <p>Best regards,<br>
                    <strong>The Pratishtha 2026 Team</strong><br>
                    SAKEC Festival Committee</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `Dear ${name},

Thank you for contacting us! We have successfully received your message and our team will get back to you soon.

Your Message Summary:
Subject: ${subject}
Received: ${timestamp}

We typically respond within 24-48 hours during business days. If your inquiry is urgent, please feel free to call us at +91 98765 43210.

Thank you for your interest in Pratishtha 2026!

Best regards,
The Pratishtha 2026 Team
SAKEC Festival Committee`
    };
    
    // Send both emails
    return Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(confirmationMailOptions)
    ]);
    
  } catch (error) {
    console.error('Error reading email template:', error);
    
    // Fallback to simple text emails if template fails
    const adminFallbackOptions = {
      from: {
        name: 'Pratishtha 2026 - Contact Form',
        address: process.env.EMAIL_ADDRESS
      },
      to: process.env.EMAIL_ADDRESS,
      subject: `🔔 New Contact Message: ${contactData.subject}`,
      text: `New contact message from Pratishtha 2026 website:
      
Name: ${contactData.name}
Email: ${contactData.email}
Phone: ${contactData.phone || 'Not provided'}
Subject: ${contactData.subject}

Message:
${contactData.message}

--
This message was sent through the Pratishtha 2026 contact form.`,
      replyTo: contactData.email
    };
    
    const confirmationFallbackOptions = {
      from: {
        name: 'Pratishtha 2026 - SAKECFEST',
        address: process.env.EMAIL_ADDRESS
      },
      to: contactData.email,
      subject: '✅ Message Received - Pratishtha 2026',
      text: `Dear ${contactData.name},

Thank you for contacting us! We have successfully received your message and our team will get back to you soon.

We typically respond within 24-48 hours during business days.

Best regards,
The Pratishtha 2026 Team
SAKEC Festival Committee`
    };
    
    return Promise.all([
      transporter.sendMail(adminFallbackOptions),
      transporter.sendMail(confirmationFallbackOptions)
    ]);
  }
}

export default sendContactEmail;