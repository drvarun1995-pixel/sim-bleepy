// Test SMTP connection with Outlook
// Run with: node test-smtp.js

require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testSMTPConnection() {
  console.log('Testing SMTP connection for Bleepy Simulator...');
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***hidden***' : 'NOT SET');
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ Environment variables not set!');
    console.error('Please add to your .env.local file:');
    console.error('SMTP_USER=support@bleepy.co.uk');
    console.error('SMTP_PASSWORD=your-app-password-here');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com', // Outlook SMTP server
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
      ciphers: 'SSLv3'
    }
  });

  try {
    // Test connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Bleepy Simulator" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to support@bleepy.co.uk
      subject: 'Bleepy Simulator - SMTP Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🏥 Bleepy Simulator</h1>
            <h2 style="margin: 10px 0 0 0; font-size: 18px;">SMTP Test Successful!</h2>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Your Outlook SMTP configuration is working correctly for <strong>support@bleepy.co.uk</strong>.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>From:</strong> Bleepy Simulator &lt;support@bleepy.co.uk&gt;</p>
            <p><strong>To:</strong> ${process.env.SMTP_USER}</p>
            <p><strong>Status:</strong> ✅ Ready for production</p>
          </div>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Check your inbox for the test email.');

  } catch (error) {
    console.error('❌ SMTP test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔧 Authentication failed. Try:');
      console.error('1. Enable 2FA on your Outlook account');
      console.error('2. Generate an app password');
      console.error('3. Use the app password in SMTP_PASSWORD');
    } else if (error.code === 'ECONNECTION') {
      console.error('\n🔧 Connection failed. Try:');
      console.error('1. Check your internet connection');
      console.error('2. Verify SMTP settings');
      console.error('3. Check firewall settings');
    }
  }
}

testSMTPConnection();
