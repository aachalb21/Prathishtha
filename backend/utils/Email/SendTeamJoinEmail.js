import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send team join details with QR code to team leader
 * @param {string} to - Recipient's email address
 * @param {Object} teamData - Team information
 * @param {Buffer} qrBuffer - QR code image buffer
 * @returns {Promise}
 */
export async function sendTeamJoinEmail(to, teamData, qrBuffer = null) {
  try {
    const { teamName, joinToken, eventName, teamSize, leaderName } = teamData;

    // Read the HTML template
    const templatePath = path.join(__dirname, 'templates', 'teamJoin.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholders
    htmlTemplate = htmlTemplate
      .replace(/{{LEADER_NAME}}/g, leaderName || 'Team Leader')
      .replace(/{{TEAM_NAME}}/g, teamName)
      .replace(/{{EVENT_NAME}}/g, eventName)
      .replace(/{{JOIN_TOKEN}}/g, joinToken)
      .replace(/{{TEAM_SIZE}}/g, teamSize)
      .replace(/{{QR_CODE_URL}}/g, qrBuffer ? 'cid:teamQrCode' : '') // Use embedded image
      .replace(/{{FRONTEND_URL}}/g, process.env.FRONTEND_URL || 'http://localhost:3000');
    
    const mailOptions = {
      from: {
        name: 'Pratishtha 2026 - SAKECFEST',
        address: process.env.EMAIL_ADDRESS
      },
      to,
      subject: `🎯 Team "${teamName}" Created Successfully - ${eventName}`,
      html: htmlTemplate,
      text: `
Team Created Successfully!

Hello ${leaderName},

Your team "${teamName}" has been created for the event: ${eventName}

Team Join Token: ${joinToken}
Team Size: ${teamSize} members

IMPORTANT INFORMATION:

1. TEAM MEMBERS: Share the join token (${joinToken}) with your team members so they can join.
   They can join by going to the event page, clicking "Register Now", selecting "Join Team", and entering the token.

2. QR CODE: The QR code attached to this email is for EVENT CHECK-IN/ATTENDANCE.
   - Present this QR code at the event venue to event organizers
   - It can only be scanned ONCE for registration verification
   - Keep it safe and don't share it publicly
   - Bring this email or a screenshot on event day

Best of luck!

--
Pratishtha 2026 Team
SAKEC
      `.trim()
    };
    
    // Attach QR code as embedded image if provided
    if (qrBuffer) {
      mailOptions.attachments = [
        {
          filename: 'team-qr-code.png',
          content: qrBuffer,
          cid: 'teamQrCode' // Same CID as in HTML template
        }
      ];
    }
    
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending team join email:', error);
    throw error;
  }
}

export default sendTeamJoinEmail;
