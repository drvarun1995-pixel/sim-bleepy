import https from 'https';

// Cache for storing access token and expiry
let tokenCache = {
  accessToken: null as string | null,
  expiresAt: null as number | null
};

// Get fresh access token from Microsoft Entra ID
const getFreshAccessToken = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const tokenUrl = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;
    
    const postData = new URLSearchParams({
      client_id: process.env.AZURE_CLIENT_ID!,
      client_secret: process.env.AZURE_CLIENT_SECRET!,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData.toString())
      }
    };

    const req = https.request(tokenUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.access_token) {
            // Cache the token with expiry time
            tokenCache.accessToken = response.access_token;
            tokenCache.expiresAt = Date.now() + (response.expires_in * 1000) - 60000; // 1 minute buffer
            resolve(response.access_token);
          } else {
            reject(new Error(`Token request failed: ${data}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse token response: ${error}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData.toString());
    req.end();
  });
};

// Get valid access token (refresh if needed)
const getValidAccessToken = async (): Promise<string> => {
  // Check if we have a valid cached token
  if (tokenCache.accessToken && tokenCache.expiresAt && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }
  
  // Get fresh token
  console.log('Getting fresh Azure access token...');
  return await getFreshAccessToken();
};

// Send email using Microsoft Graph API with automatic token refresh
const sendEmailViaGraphAPI = async (to: string, subject: string, htmlContent: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get valid access token
      const accessToken = await getValidAccessToken();
      
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
          'Authorization': `Bearer ${accessToken}`,
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
    } catch (error) {
      reject(error);
    }
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
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">
            <img src="https://sim.bleepy.co.uk/Bleepy-Logo-1-1.webp" alt="Bleepy Simulator" style="width: 60px; height: auto; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Bleepy Simulator</div>
          </div>
          <h1 style="margin: 0; font-size: 28px;">Welcome to Bleepy Simulator!</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Hi ${data.name}!</h2>
          <p style="color: #555; margin-bottom: 20px;">Thank you for signing up for Bleepy Simulator - your AI-powered medical training platform.</p>
          <p style="color: #555; margin-bottom: 30px;">To complete your registration and start practicing clinical scenarios, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">Verify Email Address</a>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="color: #333; font-weight: 600; margin-bottom: 15px;">What's next?</p>
            <ul style="color: #555; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">✅ Practice with AI patients in realistic scenarios</li>
              <li style="margin-bottom: 8px;">✅ Get detailed feedback on your clinical skills</li>
              <li style="margin-bottom: 8px;">✅ Track your progress over time</li>
              <li style="margin-bottom: 8px;">✅ Access new scenarios as they're added</li>
            </ul>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 30px 0;">
            <p style="color: #856404; margin-bottom: 10px; font-weight: 600;">Alternative Verification Method:</p>
            <p style="color: #856404; margin-bottom: 10px;">If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; color: #333; border: 1px solid #ddd;">${data.verificationUrl}</p>
          </div>
          
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 30px 0;">
            <p style="color: #0c5460; margin: 0; font-weight: 600;">Important:</p>
            <p style="color: #0c5460; margin: 5px 0 0 0;">This verification link will expire in 48 hours for security reasons.</p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
          <p style="margin-bottom: 10px;">If you didn't create an account with Bleepy Simulator, you can safely ignore this email.</p>
          <p style="margin: 0;">© 2024 Bleepy Simulator. All rights reserved.</p>
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
          <div class="logo">
            <img src="https://sim.bleepy.co.uk/Bleepy-Logo-1-1.webp" alt="Bleepy Simulator" style="width: 60px; height: auto; margin-bottom: 10px;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Bleepy Simulator</div>
          </div>
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
