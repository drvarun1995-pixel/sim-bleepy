import https from 'https';

// Send email using Microsoft Graph API
const sendEmailViaGraphAPI = async (to: string, subject: string, htmlContent: string) => {
  return new Promise((resolve, reject) => {
    const graphUrl = `https://graph.microsoft.com/v1.0/users/${process.env.SMTP_USER}/sendMail`;
    
    const messagePayload = {
      message: {
        subject: subject,
        body: {
          contentType: 'HTML',
          content: htmlContent
        },
        toRecipients: [
          {
            emailAddress: {
              address: to
            }
          }
        ]
      }
    };

    const postData = JSON.stringify(messagePayload);

    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AZURE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(graphUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 202) {
          resolve({ success: true, messageId: res.headers['x-ms-request-id'] });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
};

export interface EmailVerificationData {
  email: string;
  name: string;
  verificationUrl: string;
}

export interface PasswordResetData {
  email: string;
  name: string;
  resetUrl: string;
}

export async function sendVerificationEmail(data: EmailVerificationData) {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🏥 Bleepy Simulator</div>
          <h1>Welcome to Bleepy Simulator!</h1>
        </div>
        <div class="content">
          <h2>Hi ${data.name}!</h2>
          <p>Thank you for signing up for Bleepy Simulator - your AI-powered medical training platform.</p>
          <p>To complete your registration and start practicing clinical scenarios, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
          </div>
          
          <p><strong>What's next?</strong></p>
          <ul>
            <li>✅ Practice with AI patients in realistic scenarios</li>
            <li>✅ Get detailed feedback on your clinical skills</li>
            <li>✅ Track your progress over time</li>
            <li>✅ Access new scenarios as they're added</li>
          </ul>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px; font-family: monospace;">${data.verificationUrl}</p>
          
          <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
        </div>
        <div class="footer">
          <p>If you didn't create an account with Bleepy Simulator, you can safely ignore this email.</p>
          <p>© 2024 Bleepy Simulator. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmailViaGraphAPI(data.email, 'Verify your email - Bleepy Simulator', htmlContent);
    console.log('Verification email sent via Graph API:', result);
    
    return result;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send verification email');
  }
}

export async function sendPasswordResetEmail(data: PasswordResetData) {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🏥 Bleepy Simulator</div>
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hi ${data.name}!</h2>
          <p>We received a request to reset your password for your Bleepy Simulator account.</p>
          
          <div style="text-align: center;">
            <a href="${data.resetUrl}" class="button">Reset Password</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px; font-family: monospace;">${data.resetUrl}</p>
          
          <p><strong>Important:</strong> This password reset link will expire in 1 hour for security reasons.</p>
        </div>
        <div class="footer">
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p>© 2024 Bleepy Simulator. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmailViaGraphAPI(data.email, 'Reset your password - Bleepy Simulator', htmlContent);
    console.log('Password reset email sent via Graph API:', result);
    
    return result;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send password reset email');
  }
}
