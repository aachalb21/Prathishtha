export const passwordResetTemplate = (name, resetURL, prn) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Pratishtha 2026</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 0;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #8b5cf6, #ec4899);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 30px;
        }
        .welcome {
            font-size: 18px;
            margin-bottom: 20px;
            color: #374151;
        }
        .message {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 20px;
            color: #4b5563;
        }
        .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #8b5cf6, #ec4899);
            color: white;
            text-decoration: none;
            padding: 14px 35px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
            margin: 20px 0;
        }
        .info-box {
            background: #f8fafc;
            border-left: 4px solid #8b5cf6;
            border-radius: 0 8px 8px 0;
            padding: 20px;
            margin: 20px 0;
        }
        .info-box strong {
            color: #8b5cf6;
        }
        .warning {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #991b1b;
            font-size: 14px;
        }
        .footer {
            background: #f9fafb;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 5px 0;
            color: #6b7280;
            font-size: 14px;
        }
        .event-info {
            color: #8b5cf6;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 5px;
        }
        .link-text {
            word-break: break-all;
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 13px;
            margin: 15px 0;
            border: 1px solid #e5e7eb;
            color: #4b5563;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            .content {
                padding: 20px;
            }
            .header {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔑 Password Reset</h1>
            <p>Pratishtha 2026 - SAKEC Festival</p>
        </div>
        
        <div class="content">
            <div class="welcome">Hello ${name}! 👋</div>
            
            <div class="message">
                We received a request to reset the password for your Pratishtha 2026 account.
            </div>

            <div class="info-box">
                <strong>📋 Account Details:</strong><br><br>
                🎫 PRN: ${prn}<br>
                👤 Name: ${name}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetURL}" class="reset-button">
                    🔐 Reset Your Password
                </a>
            </div>

            <div class="warning">
                <strong>⚠️ Important Security Information:</strong><br><br>
                • This link will expire in 15 minutes<br>
                • If you didn't request this reset, please ignore this email<br>
                • Never share this link with anyone
            </div>

            <div class="message">
                If the button above doesn't work, copy and paste this link into your browser:
            </div>
            
            <div class="link-text">
                ${resetURL}
            </div>
        </div>
        
        <div class="footer">
            <p class="event-info">Pratishtha 2026 - Where AI Meets Creativity</p>
            <p>Shah & Anchor Kutchhi Engineering College (SAKEC)</p>
            <p>This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
  `.trim();
};