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

// Email validation function
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

// Send email using Microsoft Graph API with automatic token refresh and improved error handling
const sendEmailViaGraphAPI = async (to: string, subject: string, htmlContent: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate email format
      if (!isValidEmail(to)) {
        const error = new Error(`Invalid email format: ${to}`);
        console.error('Email validation failed:', error.message);
        reject(error);
        return;
      }

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
                address: to.trim()
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

      console.log(`Sending email to: ${to}, subject: ${subject}`);

      const req = https.request(graphUrl, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log(`Email API response for ${to}:`, {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });

          if (res.statusCode === 202) {
            const messageId = res.headers['x-ms-request-id'];
            console.log(`Email sent successfully to ${to}, messageId: ${messageId}`);
            resolve({ 
              success: true, 
              messageId,
              recipient: to,
              statusCode: res.statusCode
            });
          } else {
            const error = new Error(`HTTP ${res.statusCode}: ${data}`);
            console.error(`Email delivery failed for ${to}:`, {
              statusCode: res.statusCode,
              response: data,
              recipient: to
            });
            reject(error);
          }
        });
      });
      
      req.on('error', (error) => {
        console.error(`Network error sending email to ${to}:`, error);
        reject(error);
      });
      
      req.write(postData);
      req.end();
    } catch (error) {
      console.error(`Error in sendEmailViaGraphAPI for ${to}:`, error);
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
            color: #ffffff;
            text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6), 0 0 8px rgba(0, 0, 0, 0.4);
            background: rgba(0, 0, 0, 0.15);
            padding: 8px 16px;
            border-radius: 6px;
            display: inline-block;
          }
          .welcome-text {
            font-size: 28px;
            margin: 0;
            color: #ffffff;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 0, 0, 0.5);
            font-weight: 700;
            background: rgba(0, 0, 0, 0.2);
            padding: 10px 20px;
            border-radius: 8px;
            display: inline-block;
            margin-top: 15px;
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

export interface AccountCreatedData {
  name: string;
  email: string;
  role: string;
  password: string;
  loginUrl: string;
}

// Retry mechanism for email sending
const sendEmailWithRetry = async (to: string, subject: string, htmlContent: string, maxRetries = 2) => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Email attempt ${attempt}/${maxRetries} for ${to}`);
      const result = await sendEmailViaGraphAPI(to, subject, htmlContent);
      console.log(`Email sent successfully on attempt ${attempt} to ${to}`);
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`Email attempt ${attempt} failed for ${to}:`, error);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Retrying email to ${to} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Email sending failed after all retries');
};

export async function sendAccountApprovalEmail(data: AccountApprovalData) {
  try {
    console.log(`Sending account approval email to: ${data.email}`);
    
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
            color: #ffffff;
            text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6), 0 0 8px rgba(0, 0, 0, 0.4);
            background: rgba(0, 0, 0, 0.15);
            padding: 8px 16px;
            border-radius: 6px;
            display: inline-block;
          }
          .welcome-text {
            font-size: 28px;
            margin: 0;
            color: #ffffff;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 0, 0, 0.5);
            font-weight: 700;
            background: rgba(0, 0, 0, 0.2);
            padding: 10px 20px;
            border-radius: 8px;
            display: inline-block;
            margin-top: 15px;
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
              <a href="https://sim.bleepy.co.uk/dashboard" class="cta-button" style="color: white; text-decoration: none;" rel="noopener noreferrer">ACCESS YOUR DASHBOARD</a>
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
              <p style="margin: 5px 0 0 0;">Check out our <a href="https://sim.bleepy.co.uk/tutorials" style="color: #004085;" rel="noopener noreferrer">tutorials</a> or contact our support team if you have any questions.</p>
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

    const result = await sendEmailWithRetry(data.email, 'Account Approved - Welcome to Bleepy!', htmlContent);
    console.log('Account approval email sent successfully:', result);
    
    return result;
  } catch (error) {
    console.error('Account approval email failed:', error);
    throw new Error(`Failed to send account approval email to ${data.email}: ${error}`);
  }
}

export async function sendRoleChangeEmail(data: RoleChangeData) {
  try {
    console.log(`Sending role change email to: ${data.email}`);
    
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
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .logo {
            width: 60px;
            height: auto;
            margin-bottom: 10px;
            display: block;
            margin-left: auto;
            margin-right: auto;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
          }
          .logo-text {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #ffffff;
            text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6), 0 0 8px rgba(0, 0, 0, 0.4);
            background: rgba(0, 0, 0, 0.15);
            padding: 8px 16px;
            border-radius: 6px;
            display: inline-block;
          }
          .welcome-text {
            font-size: 28px;
            margin: 0;
            color: #ffffff;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 0, 0, 0.5);
            font-weight: 700;
            background: rgba(0, 0, 0, 0.2);
            padding: 10px 20px;
            border-radius: 8px;
            display: inline-block;
            margin-top: 15px;
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
              <a href="https://sim.bleepy.co.uk/dashboard" class="cta-button" style="color: white; text-decoration: none;" rel="noopener noreferrer">ACCESS YOUR DASHBOARD</a>
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

    const result = await sendEmailWithRetry(data.email, `Role Updated to ${getRoleDisplayName(data.newRole)} - Bleepy`, htmlContent);
    console.log('Role change email sent successfully:', result);
    
    return result;
  } catch (error) {
    console.error('Role change email failed:', error);
    throw new Error(`Failed to send role change email to ${data.email}: ${error}`);
  }
}

export async function sendAdminContactFormNotification({
  contactId,
  name,
  email,
  subject,
  category,
  message,
  submissionTime
}: {
  contactId: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  submissionTime: string;
}) {
  try {
    const adminEmail = 'drvarun1995@gmail.com';
    const emailSubject = `New Contact Form Submission - ${subject}`;

    const submissionDate = new Date(submissionTime).toLocaleString('en-GB', {
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
        <title>New Contact Form Submission</title>
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
            background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
          }
          .content {
            padding: 30px;
          }
          .info-grid {
            display: grid;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-item {
            background-color: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #8b5cf6;
          }
          .info-label {
            font-weight: bold;
            color: #374151;
            margin-bottom: 5px;
          }
          .info-value {
            color: #6b7280;
          }
          .message-section {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .message-text {
            color: #374151;
            line-height: 1.6;
            white-space: pre-wrap;
          }
          .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .category-badge {
            display: inline-block;
            padding: 4px 12px;
            background-color: #ddd6fe;
            color: #5b21b6;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            text-transform: capitalize;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: Arial, sans-serif;">
        <div class="email-container">
          <div class="header">
            <h1>📧 New Contact Form Submission</h1>
          </div>
          
          <div class="content">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">From:</div>
                <div class="info-value">${name} (${email})</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Subject:</div>
                <div class="info-value">${subject}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Category:</div>
                <div class="info-value"><span class="category-badge">${category.replace('_', ' ')}</span></div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Submitted:</div>
                <div class="info-value">${submissionDate}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Message ID:</div>
                <div class="info-value">${contactId}</div>
              </div>
            </div>
            
            <div class="message-section">
              <div class="info-label" style="margin-bottom: 15px;">Message:</div>
              <div class="message-text">${message}</div>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from Bleepy.</p>
            <p>You can view and manage this message in the admin dashboard.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmailViaGraphAPI(adminEmail, emailSubject, htmlContent);
    console.log(`Contact form notification sent to admin for message: ${contactId}`);
    return true;
  } catch (error) {
    console.error('Failed to send contact form notification:', error);
    return false;
  }
}

export async function sendAccountCreatedEmail(data: AccountCreatedData) {
  try {
    console.log(`Sending account created email to: ${data.email}`);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Created - Bleepy</title>
        <style>
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            font-family: Arial, sans-serif;
            background-color: #f8f9fa;
            padding: 20px;
          }
          .header {
            background: #007bff;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .logo {
            width: 80px;
            height: auto;
            margin: 0 auto 20px;
            display: block;
          }
          .logo-text {
            font-size: 32px;
            font-weight: bold;
            color: #007bff;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }
          .welcome-text {
            font-size: 28px;
            margin: 0;
            color: #ffffff;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            font-weight: 700;
            margin-top: 15px;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .credentials-section {
            background: #e7f3ff;
            border: 1px solid #b3d9ff;
            color: #004085;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .credential-item {
            background: #ffffff;
            border: 1px solid #dee2e6;
            color: #212529;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            text-align: left;
          }
          .credential-label {
            font-weight: bold;
            color: #495057;
            margin-bottom: 5px;
          }
          .credential-value {
            font-family: monospace;
            background: #f8f9fa;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
            color: #212529;
            font-size: 14px;
          }
          .password-value {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            font-weight: bold;
          }
          .cta-button {
            display: inline-block;
            background: #007bff !important;
            color: #ffffff !important;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            border: 2px solid #007bff;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #dee2e6;
            border-radius: 0 0 10px 10px;
            color: #6c757d;
            font-size: 12px;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
        <div class="email-container">
          <div class="header">
            <img src="https://sim.bleepy.co.uk/Bleepy-Logo-1-1.webp" alt="Bleepy" class="logo">
            <h1 class="welcome-text">Account Created!</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Your account has been created</p>
          </div>

          <div class="content">
            <h2 style="color: #212529; font-size: 24px; margin-bottom: 20px; font-weight: 600;">Hello ${data.name}!</h2>

            <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Your Bleepy account has been successfully created by an administrator. 
              You now have access to our comprehensive medical education platform.
            </p>

            <div class="credentials-section">
              <h3 style="margin: 0 0 15px 0; color: #004085;">Your Login Credentials</h3>
              
              <div class="credential-item">
                <div class="credential-label">Email:</div>
                <div class="credential-value">${data.email}</div>
              </div>
              
              <div class="credential-item">
                <div class="credential-label">Password:</div>
                <div class="credential-value password-value">${data.password}</div>
              </div>
              
              <div class="credential-item">
                <div class="credential-label">Role:</div>
                <div class="credential-value">${data.role.charAt(0).toUpperCase() + data.role.slice(1)}</div>
              </div>
            </div>

            <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              You can now log in to your account using the credentials above. 
              <strong>Important:</strong> You will be required to change your password on first login for security.
            </p>

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${data.loginUrl}" class="cta-button" style="background: #007bff !important; color: #ffffff !important;">Login to Your Account</a>
            </div>

            <div class="warning">
              <p style="color: #856404; font-size: 14px; margin: 0; font-weight: 500;">
                <strong>Security Notice:</strong> Please keep your login credentials secure and change your password immediately after first login.
              </p>
            </div>

            <h3 style="color: #212529; font-size: 18px; margin-bottom: 15px; font-weight: 600;">What's Next?</h3>

            <ul style="color: #495057; font-size: 14px; line-height: 1.6; margin-bottom: 25px; padding-left: 20px;">
              <li>Complete your account setup by setting a password</li>
              <li>Explore the platform and familiarize yourself with the features</li>
              <li>Access teaching events, resources, and portfolio management tools</li>
              <li>Join the community of medical professionals using Bleepy</li>
            </ul>

            <p style="color: #6c757d; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>
          </div>

          <div class="footer">
            <p style="color: #6c757d; font-size: 12px; margin: 0 0 10px 0;">
              This email was sent because an administrator created an account for you on Bleepy.
            </p>
            <p style="color: #adb5bd; font-size: 11px; margin: 0;">
              © 2025 Bleepy. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmailWithRetry(data.email, 'Your Bleepy Account Has Been Created', htmlContent);
    console.log('Account created email sent successfully:', result);
    
    return result;
  } catch (error) {
    console.error('Account created email failed:', error);
    throw new Error(`Failed to send account created email to ${data.email}: ${error}`);
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
            color: #ffffff;
            text-shadow: 0 2px 6px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.4);
            font-weight: 600;
            background: rgba(0, 0, 0, 0.15);
            padding: 8px 16px;
            border-radius: 6px;
            display: inline-block;
            margin-top: 10px;
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
              <a href="https://sim.bleepy.co.uk/admin-users" class="admin-button" style="color: white; text-decoration: none;" rel="noopener noreferrer">View User Management</a>
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
            <p style="margin: 0;"><a href="https://sim.bleepy.co.uk" rel="noopener noreferrer">sim.bleepy.co.uk</a></p>
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

export interface CertificateEmailData {
  recipientEmail: string;
  recipientName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation?: string;
  eventDuration?: string;
  certificateUrl: string;
  certificateId: string;
}

export async function sendCertificateEmail(data: CertificateEmailData) {
  try {
    console.log(`Sending certificate email to: ${data.recipientEmail}`);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Certificate - ${data.eventTitle}</title>
        <style>
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            font-family: Arial, sans-serif;
            background-color: #f8f9fa;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            color: #ffffff;
            text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
            background: rgba(0, 0, 0, 0.15);
            padding: 8px 16px;
            border-radius: 6px;
            display: inline-block;
          }
          .welcome-text {
            font-size: 28px;
            margin: 0;
            color: #ffffff;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
            font-weight: 700;
            background: rgba(0, 0, 0, 0.2);
            padding: 10px 20px;
            border-radius: 8px;
            display: inline-block;
            margin-top: 15px;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .congrats-section {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .download-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          .event-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .certificate-id {
            background: #e7f3ff;
            border: 1px solid #b3d9ff;
            color: #004085;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
        <div class="email-container">
          <div class="header">
            <img src="https://sim.bleepy.co.uk/Bleepy-Logo-1-1.webp" alt="Bleepy" class="logo">
            <div class="logo-text">Bleepy</div>
            <h1 class="welcome-text">🎉 Congratulations!</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${data.recipientName}!</h2>
            
            <div class="congrats-section">
              <p style="margin: 0; font-size: 18px; font-weight: bold;">You successfully attended</p>
              <p style="margin: 10px 0; font-size: 20px; color: #155724;">"${data.eventTitle}"</p>
              <p style="margin: 0;">on ${data.eventDate}</p>
            </div>
            
            <p style="color: #555; margin-bottom: 20px; font-size: 16px;">We're pleased to present your certificate of attendance.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.certificateUrl}" class="download-button" style="color: white; text-decoration: none;" target="_blank" rel="noopener noreferrer">📥 Download Certificate</a>
            </div>
            
            <div class="event-details">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 15px;">Event Details:</h3>
              <ul style="color: #555; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li><strong>Title:</strong> ${data.eventTitle}</li>
                <li><strong>Date:</strong> ${data.eventDate}</li>
                ${data.eventLocation ? `<li><strong>Location:</strong> ${data.eventLocation}</li>` : ''}
                ${data.eventDuration ? `<li><strong>Duration:</strong> ${data.eventDuration}</li>` : ''}
              </ul>
            </div>
            
            <p style="color: #555; margin-bottom: 15px;">You can also view your certificate anytime in your <a href="https://sim.bleepy.co.uk/mycertificates" style="color: #667eea; text-decoration: none; font-weight: bold;" rel="noopener noreferrer">dashboard</a>.</p>
            
            <div class="certificate-id">
              <p style="margin: 0; font-size: 12px; color: #6c757d;">Certificate ID</p>
              <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 14px; font-weight: bold; color: #004085;">${data.certificateId}</p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;"><strong>💡 Tip:</strong> Keep this certificate for your professional portfolio and CPD records.</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p style="margin-bottom: 10px;">Thank you for attending this event!</p>
            <p style="margin: 0;">© 2025 Bleepy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmailWithRetry(
      data.recipientEmail,
      `Your Certificate for ${data.eventTitle}`,
      htmlContent
    );
    
    console.log('Certificate email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Certificate email failed:', error);
    throw new Error(`Failed to send certificate email to ${data.recipientEmail}: ${error}`);
  }
}
