// Simple test to debug email sending
const https = require('https');

async function testEmailSending() {
  console.log('Testing email sending directly...');
  
  // Test the Microsoft Graph API directly
  const accessToken = process.env.AZURE_ACCESS_TOKEN;
  const smtpUser = process.env.SMTP_USER;
  
  if (!accessToken) {
    console.error('❌ AZURE_ACCESS_TOKEN not found in environment');
    return;
  }
  
  if (!smtpUser) {
    console.error('❌ SMTP_USER not found in environment');
    return;
  }
  
  console.log('✅ Environment variables found');
  console.log('SMTP_USER:', smtpUser);
  console.log('Access Token (first 20 chars):', accessToken.substring(0, 20) + '...');
  
  // Test email content
  const emailData = {
    message: {
      subject: "Test Password Reset - Bleepy Simulator",
      body: {
        contentType: "HTML",
        content: `
          <h2>Password Reset Request</h2>
          <p>Hello Dr. Varun,</p>
          <p>You requested a password reset for your Bleepy Simulator account.</p>
          <p>Click the link below to reset your password:</p>
          <p><a href="http://localhost:3000/auth/reset-password?token=test123">Reset Password</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>Bleepy Simulator Team</p>
        `
      },
      toRecipients: [
        {
          emailAddress: {
            address: "drvarun1995@gmail.com"
          }
        }
      ]
    }
  };
  
  const options = {
    hostname: 'graph.microsoft.com',
    port: 443,
    path: '/v1.0/me/sendMail',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 202) {
        console.log('✅ Email sent successfully!');
        console.log('Check drvarun1995@gmail.com for the test email.');
      } else {
        console.log('❌ Email sending failed:');
        console.log('Response:', data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Request error:', error);
  });
  
  req.write(JSON.stringify(emailData));
  req.end();
}

testEmailSending();
