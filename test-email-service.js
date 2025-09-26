// Test the updated email service with OAuth2
// Run with: node test-email-service.js

require('dotenv').config({ path: '.env.local' });

// Import the email service
const { sendVerificationEmail } = require('./lib/email.ts');

async function testEmailService() {
  console.log('Testing updated email service with OAuth2...');
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('AZURE_CLIENT_ID:', process.env.AZURE_CLIENT_ID);
  console.log('AZURE_ACCESS_TOKEN:', process.env.AZURE_ACCESS_TOKEN ? '***hidden***' : 'NOT SET');
  
  if (!process.env.SMTP_USER || !process.env.AZURE_CLIENT_ID || !process.env.AZURE_ACCESS_TOKEN) {
    console.error('❌ Environment variables not set!');
    return;
  }

  try {
    // Test sending a verification email
    const emailData = {
      email: 'support@bleepy.co.uk',
      name: 'Test User',
      verificationUrl: 'https://bleepy.co.uk/auth/verify?token=test-token-123'
    };

    console.log('Sending verification email...');
    const result = await sendVerificationEmail(emailData);
    
    console.log('✅ Email service test successful!');
    console.log('Result:', result);
    console.log('Check your inbox for the verification email.');

  } catch (error) {
    console.error('❌ Email service test failed:');
    console.error('Error:', error.message);
  }
}

testEmailService();
