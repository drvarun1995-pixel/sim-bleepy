// Test Gmail SMTP (much more reliable)
// Run with: node test-gmail-smtp.js

require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testGmailSMTP() {
  console.log('Testing Gmail SMTP...');
  console.log('GMAIL_USER:', process.env.GMAIL_USER);
  console.log('GMAIL_PASSWORD:', process.env.GMAIL_PASSWORD ? '***hidden***' : 'NOT SET');
  
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
    console.error('❌ Gmail environment variables not set!');
    console.error('Please add to your .env.local file:');
    console.error('GMAIL_USER=your-gmail@gmail.com');
    console.error('GMAIL_PASSWORD=your-gmail-app-password');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test connection
    console.log('Verifying Gmail SMTP connection...');
    await transporter.verify();
    console.log('✅ Gmail SMTP connection successful!');

    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Bleepy Simulator" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: 'Bleepy Simulator - Gmail SMTP Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4285f4 0%, #34a853 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🏥 Bleepy Simulator</h1>
            <h2 style="margin: 10px 0 0 0; font-size: 18px;">Gmail SMTP Test Successful!</h2>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Your Gmail SMTP configuration is working correctly for <strong>${process.env.GMAIL_USER}</strong>.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>From:</strong> Bleepy Simulator &lt;${process.env.GMAIL_USER}&gt;</p>
            <p><strong>To:</strong> ${process.env.GMAIL_USER}</p>
            <p><strong>Status:</strong> ✅ Ready for production</p>
          </div>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Check your inbox for the test email.');
    console.log('\n🎉 Gmail SMTP is working! You can now use this for your application.');

  } catch (error) {
    console.error('❌ Gmail SMTP test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔧 Authentication failed. Try:');
      console.error('1. Enable 2FA on your Gmail account');
      console.error('2. Generate an app password');
      console.error('3. Use the app password in GMAIL_PASSWORD');
    }
  }
}

testGmailSMTP();
