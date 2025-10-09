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
        <style>
          /* Fallback styles for email clients */
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            font-family: Arial, sans-serif;
            background-color: #f8f9fa;
            padding: 20px;
          }
          .header {
            background-color: #667eea;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .logo {
            width: 60px;
            height: auto;
            margin-bottom: 10px;
            display: block;
            margin-left: auto;
            margin-right: auto;
          }
          .logo-text {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            color: white;
          }
          .welcome-text {
            font-size: 28px;
            margin: 0;
            color: white;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .verify-button {
            display: inline-block;
            background-color: #667eea;
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
          }
          .verify-button:hover {
            background-color: #5a67d8;
          }
          .section {
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .features {
            background-color: #f8f9fa;
          }
          .alternative {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
          }
          .important {
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
        <div class="email-container">
          <div class="header">
            <img src="https://sim.bleepy.co.uk/Bleepy-Logo-1-1.webp" alt="Bleepy" class="logo">
            <div class="logo-text">Bleepy</div>
            <h1 class="welcome-text">Welcome to Bleepy!</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${data.name}!</h2>
            <p style="color: #555; margin-bottom: 20px;">Thank you for signing up for Bleepy - your AI-powered medical training platform.</p>
            <p style="color: #555; margin-bottom: 30px;">To complete your registration and start practicing clinical scenarios, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.verificationUrl}" class="verify-button" style="color: white; text-decoration: none;">VERIFY EMAIL ADDRESS</a>
            </div>
            
            <div class="section features">
              <p style="color: #333; font-weight: bold; margin-bottom: 15px;">What's next?</p>
              <ul style="color: #555; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">✅ Practice with AI patients in realistic scenarios</li>
                <li style="margin-bottom: 8px;">✅ Get detailed feedback on your clinical skills</li>
                <li style="margin-bottom: 8px;">✅ Track your progress over time</li>
                <li style="margin-bottom: 8px;">✅ Access new scenarios as they're added</li>
              </ul>
            </div>
            
            <div class="section alternative">
              <p style="color: #856404; margin-bottom: 10px; font-weight: bold;">Alternative Verification Method:</p>
              <p style="color: #856404; margin-bottom: 10px;">If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; color: #333; border: 1px solid #ddd; margin: 0;">${data.verificationUrl}</p>
            </div>
            
            <div class="section important">
              <p style="color: #0c5460; margin: 0; font-weight: bold;">Important:</p>
              <p style="color: #0c5460; margin: 5px 0 0 0;">This verification link will expire in 48 hours for security reasons.</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p style="margin-bottom: 10px;">If you didn't create an account with Bleepy, you can safely ignore this email.</p>
            <p style="margin: 0;">© 2024 Bleepy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmailViaGraphAPI(data.email, 'Verify your email - Bleepy', htmlContent);
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
            <img src="https://sim.bleepy.co.uk/Bleepy-Logo-1-1.webp" alt="Bleepy" style="width: 60px; height: auto; margin-bottom: 10px;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Bleepy</div>
          </div>
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hi ${data.name}!</h2>
          <p>We received a request to reset your password for your Bleepy account.</p>
          
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
          <p>© 2024 Bleepy. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmailViaGraphAPI(data.email, 'Reset your password - Bleepy', htmlContent);
    console.log('Password reset email sent via Graph API:', result);
    
    return result;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send password reset email');
  }
}

export interface AccountApprovalData {
  email: string;
  name: string;
}

export interface RoleChangeData {
  email: string;
  name: string;
  oldRole: string;
  newRole: string;
}

export async function sendAccountApprovalEmail(data: AccountApprovalData) {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Approved - Bleepy</title>
        <style>
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            font-family: Arial, sans-serif;
            background-color: #f8f9fa;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .logo {
            width: 60px;
            height: auto;
            margin-bottom: 10px;
            display: block;
            margin-left: auto;
            margin-right: auto;
          }
          .logo-text {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            color: white;
          }
          .welcome-text {
            font-size: 28px;
            margin: 0;
            color: white;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .success-section {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .features {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
        <div class="email-container">
          <div class="header">
            <img src="https://sim.bleepy.co.uk/Bleepy-Logo-1-1.webp" alt="Bleepy" class="logo">
            <div class="logo-text">Bleepy</div>
            <h1 class="welcome-text">Account Approved!</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${data.name}!</h2>
            
            <div class="success-section">
              <h3 style="margin: 0 0 10px 0; color: #155724;">🎉 Great News!</h3>
              <p style="margin: 0; font-size: 18px; font-weight: bold;">Your Bleepy account has been approved!</p>
            </div>
            
            <p style="color: #555; margin-bottom: 20px;">You can now access all features of the platform and start practicing with our AI-powered clinical scenarios.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://sim.bleepy.co.uk/dashboard" class="cta-button" style="color: white; text-decoration: none;">ACCESS YOUR DASHBOARD</a>
            </div>
            
            <div class="features">
              <p style="color: #333; font-weight: bold; margin-bottom: 15px;">What you can do now:</p>
              <ul style="color: #555; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">✅ Practice with AI patients in realistic clinical scenarios</li>
                <li style="margin-bottom: 8px;">✅ Receive detailed feedback on your clinical skills</li>
                <li style="margin-bottom: 8px;">✅ Track your progress and improvement over time</li>
                <li style="margin-bottom: 8px;">✅ Access new scenarios as they're added</li>
                <li style="margin-bottom: 8px;">✅ Join educational events and workshops</li>
              </ul>
            </div>
            
            <div style="background: #e7f3ff; border: 1px solid #b3d9ff; color: #004085; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Need Help Getting Started?</p>
              <p style="margin: 5px 0 0 0;">Check out our <a href="https://sim.bleepy.co.uk/tutorials" style="color: #004085;">tutorials</a> or contact our support team if you have any questions.</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p style="margin-bottom: 10px;">Welcome to the Bleepy community!</p>
            <p style="margin: 0;">© 2025 Bleepy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmailViaGraphAPI(data.email, 'Account Approved - Welcome to Bleepy!', htmlContent);
    console.log('Account approval email sent:', result);
    
    return result;
  } catch (error) {
    console.error('Account approval email error:', error);
    throw new Error('Failed to send account approval email');
  }
}

export async function sendRoleChangeEmail(data: RoleChangeData) {
  try {
    const getRoleDisplayName = (role: string) => {
      switch (role.toLowerCase()) {
        case 'admin': return 'Administrator';
        case 'educator': return 'Educator';
        case 'student': return 'Student';
        default: return role;
      }
    };

    const getRoleDescription = (role: string) => {
      switch (role.toLowerCase()) {
        case 'admin': return 'Full administrative access to manage users, content, and system settings';
        case 'educator': return 'Ability to create announcements, manage educational content, and view student progress';
        case 'student': return 'Access to clinical scenarios, practice sessions, and learning resources';
        default: return 'Access to platform features based on your role';
      }
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Role Updated - Bleepy</title>
        <style>
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            font-family: Arial, sans-serif;
            background-color: #f8f9fa;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #007bff 0%, #6610f2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .logo {
            width: 60px;
            height: auto;
            margin-bottom: 10px;
            display: block;
            margin-left: auto;
            margin-right: auto;
          }
          .logo-text {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            color: white;
          }
          .welcome-text {
            font-size: 28px;
            margin: 0;
            color: white;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .role-change-section {
            background: #e7f3ff;
            border: 1px solid #b3d9ff;
            color: #004085;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .old-role {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
          }
          .new-role {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
          }
          .features {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #007bff 0%, #6610f2 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
        <div class="email-container">
          <div class="header">
            <img src="https://sim.bleepy.co.uk/Bleepy-Logo-1-1.webp" alt="Bleepy" class="logo">
            <div class="logo-text">Bleepy</div>
            <h1 class="welcome-text">Role Updated!</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${data.name}!</h2>
            
            <div class="role-change-section">
              <h3 style="margin: 0 0 15px 0; color: #004085;">Your account role has been updated</h3>
              
              <div class="old-role">
                <p style="margin: 0; font-weight: bold;">Previous Role:</p>
                <p style="margin: 5px 0 0 0; font-size: 18px;">${getRoleDisplayName(data.oldRole)}</p>
              </div>
              
              <div style="text-align: center; margin: 15px 0; font-size: 24px;">⬇️</div>
              
              <div class="new-role">
                <p style="margin: 0; font-weight: bold;">New Role:</p>
                <p style="margin: 5px 0 0 0; font-size: 18px;">${getRoleDisplayName(data.newRole)}</p>
              </div>
            </div>
            
            <div class="features">
              <p style="color: #333; font-weight: bold; margin-bottom: 15px;">What this means for you:</p>
              <p style="color: #555; margin-bottom: 15px;">${getRoleDescription(data.newRole)}</p>
              
              <ul style="color: #555; margin: 0; padding-left: 20px;">
                ${data.newRole.toLowerCase() === 'admin' ? `
                <li style="margin-bottom: 8px;">✅ Full access to user management and system administration</li>
                <li style="margin-bottom: 8px;">✅ Ability to approve new user registrations</li>
                <li style="margin-bottom: 8px;">✅ Access to analytics and platform insights</li>
                <li style="margin-bottom: 8px;">✅ Content management and system configuration</li>
                ` : data.newRole.toLowerCase() === 'educator' ? `
                <li style="margin-bottom: 8px;">✅ Create and manage announcements for students</li>
                <li style="margin-bottom: 8px;">✅ Access to student progress and performance data</li>
                <li style="margin-bottom: 8px;">✅ Create and manage educational content</li>
                <li style="margin-bottom: 8px;">✅ All student features plus educator tools</li>
                ` : `
                <li style="margin-bottom: 8px;">✅ Access to clinical scenarios and practice sessions</li>
                <li style="margin-bottom: 8px;">✅ Progress tracking and performance analytics</li>
                <li style="margin-bottom: 8px;">✅ Educational events and workshops</li>
                <li style="margin-bottom: 8px;">✅ Learning resources and tutorials</li>
                `}
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://sim.bleepy.co.uk/dashboard" class="cta-button" style="color: white; text-decoration: none;">ACCESS YOUR DASHBOARD</a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Need Help?</p>
              <p style="margin: 5px 0 0 0;">If you have any questions about your new role or need assistance, please contact our support team.</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p style="margin-bottom: 10px;">Thank you for being part of the Bleepy community!</p>
            <p style="margin: 0;">© 2025 Bleepy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmailViaGraphAPI(data.email, `Role Updated to ${getRoleDisplayName(data.newRole)} - Bleepy`, htmlContent);
    console.log('Role change email sent:', result);
    
    return result;
  } catch (error) {
    console.error('Role change email error:', error);
    throw new Error('Failed to send role change email');
  }
}

export async function sendAdminNewUserNotification({ 
  userEmail, 
  userName, 
  signupTime, 
  consentGiven, 
  marketingConsent, 
  analyticsConsent 
}: { 
  userEmail: string; 
  userName: string; 
  signupTime: string; 
  consentGiven: boolean; 
  marketingConsent: boolean; 
  analyticsConsent: boolean; 
}) {
  try {
    const adminEmail = 'drvarun1995@gmail.com';
    const subject = 'New User Registration - Bleepy';

    const signupDate = new Date(signupTime).toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New User Registration</title>
        <style>
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          .logo {
            height: 60px;
            margin-bottom: 20px;
          }
          .logo-text {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .welcome-text {
            margin: 0;
            font-size: 20px;
          }
          .content {
            padding: 30px;
          }
          .user-details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #28a745;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .consent-details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .admin-button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .admin-button:hover {
            background-color: #0056b3;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f8f9fa;">
        <div class="email-container">
          <div class="header">
            <img src="https://sim.bleepy.co.uk/Bleepy-Logo-1-1.webp" alt="Bleepy" class="logo">
            <div class="logo-text">Bleepy</div>
            <h1 class="welcome-text">New User Registration</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #171717; margin-top: 0;">A new user has registered!</h2>
            
            <div class="user-details">
              <h3 style="color: #28a745; margin-top: 0;">User Details</h3>
              <p><strong>Name:</strong> ${userName}</p>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Registration Time:</strong> ${signupDate}</p>
            </div>

            <div class="consent-details">
              <h3 style="color: #007bff; margin-top: 0;">Consent Preferences</h3>
              <p><strong>Terms & Privacy:</strong> ${consentGiven ? '✅ Agreed' : '❌ Not agreed'}</p>
              <p><strong>Marketing:</strong> ${marketingConsent ? '✅ Opted in' : '❌ Opted out'}</p>
              <p><strong>Analytics:</strong> ${analyticsConsent ? '✅ Opted in' : '❌ Opted out'}</p>
            </div>

            <div style="text-align: center;">
              <a href="https://sim.bleepy.co.uk/admin/users" class="admin-button" style="color: white; text-decoration: none;">View User Management</a>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>The user will receive a verification email</li>
                <li>You can manually approve them from the admin panel if needed</li>
                <li>Monitor their consent preferences for GDPR compliance</li>
              </ul>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px; color: #666; font-size: 14px;">
            <p style="margin-bottom: 10px;">This is an automated notification from Bleepy.</p>
            <p style="margin: 0;"><a href="https://sim.bleepy.co.uk">sim.bleepy.co.uk</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmailViaGraphAPI(adminEmail, subject, htmlContent);
    console.log('Admin notification email sent:', result);
    
    return result;
  } catch (error) {
    console.error('Admin notification email error:', error);
    throw new Error('Failed to send admin notification email');
  }
}
