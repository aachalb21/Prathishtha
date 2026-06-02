import Joi from 'joi';
import sendContactEmail from '../../utils/Email/SendContactEmail.js';

// Validation schema for contact form
const contactSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
  
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  phone: Joi.string()
    .trim()
    .pattern(/^[+]?[\d\s\-\(\)]{10,15}$/)
    .allow('')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  subject: Joi.string()
    .trim()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Subject is required',
      'string.min': 'Subject must be at least 5 characters long',
      'string.max': 'Subject cannot exceed 200 characters',
      'any.required': 'Subject is required'
    }),
  
  message: Joi.string()
    .trim()
    .min(20)
    .max(2000)
    .required()
    .messages({
      'string.empty': 'Message is required',
      'string.min': 'Message must be at least 20 characters long',
      'string.max': 'Message cannot exceed 2000 characters',
      'any.required': 'Message is required'
    })
});

/**
 * Handle contact form submission
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const submitContactForm = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = contactSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path[0],
          message: detail.message
        }))
      });
    }
    
    const { name, email, phone, subject, message } = value;

    console.log('Contact form submission received:', { name, email, phone, subject, message });
    
    // Basic spam protection - check for common spam patterns
    const spamPatterns = [
      /bitcoin|crypto|investment|loan|debt|casino|gambling/i,
      /click here|visit now|act now|limited time/i,
      /free money|get rich|make money fast/i
    ];
    
    const fullText = `${subject} ${message}`.toLowerCase();
    const isSpam = spamPatterns.some(pattern => pattern.test(fullText));
    
    if (isSpam) {
      return res.status(400).json({
        success: false,
        message: 'Message rejected due to spam detection'
      });
    }
    
    // Prepare contact data
    const contactData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      subject: subject.trim(),
      message: message.trim()
    };
    
    // Send emails
    await sendContactEmail(contactData);
    
    // Log successful contact submission (you can extend this to save to database if needed)
    console.log(`📧 New contact message from ${contactData.name} (${contactData.email}): ${contactData.subject}`);
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Thank you for your message! We have received your inquiry and will get back to you soon.',
      data: {
        name: contactData.name,
        email: contactData.email,
        subject: contactData.subject,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Contact form submission error:', error);
    
    // Check if it's an email sending error
    if (error.code === 'EAUTH' || error.code === 'ENOTFOUND' || error.response) {
      return res.status(500).json({
        success: false,
        message: 'Unable to send email at the moment. Please try again later or contact us directly.',
        error: 'Email service unavailable'
      });
    }
    
    // Generic error response
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};