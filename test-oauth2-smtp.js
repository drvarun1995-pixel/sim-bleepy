// Test Microsoft Entra ID OAuth2 SMTP
// Run with: node test-oauth2-smtp.js

require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testOAuth2SMTP() {
  console.log('Testing Microsoft Entra ID OAuth2 SMTP...');
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('AZURE_CLIENT_ID:', process.env.AZURE_CLIENT_ID);
  console.log('AZURE_CLIENT_SECRET:', process.env.AZURE_CLIENT_SECRET ? '***hidden***' : 'NOT SET');
  console.log('AZURE_TENANT_ID:', process.env.AZURE_TENANT_ID);
  
  if (!process.env.SMTP_USER || !process.env.AZURE_CLIENT_ID || !process.env.AZURE_CLIENT_SECRET || !process.env.AZURE_TENANT_ID) {
    console.error('❌ OAuth2 environment variables not set!');
    console.error('Please add to your .env.local file:');
    console.error('SMTP_USER=support@bleepy.co.uk');
    console.error('AZURE_CLIENT_ID=your-app-client-id');
    console.error('AZURE_CLIENT_SECRET=your-app-client-secret');
    console.error('AZURE_TENANT_ID=your-tenant-id');
    return;
  }

  // OAuth2 configuration for Microsoft Entra ID
  const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
      type: 'OAuth2',
      user: process.env.SMTP_USER,
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
      accessToken: process.env.AZURE_ACCESS_TOKEN,
      expires: parseInt(process.env.AZURE_TOKEN_EXPIRES),
      tenantId: process.env.AZURE_TENANT_ID,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test connection
    console.log('Verifying OAuth2 SMTP connection...');
    await transporter.verify();
    console.log('✅ OAuth2 SMTP connection successful!');

    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Bleepy Simulator" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: 'Bleepy Simulator - OAuth2 SMTP Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🏥 Bleepy Simulator</h1>
            <h2 style="margin: 10px 0 0 0; font-size: 18px;">OAuth2 SMTP Test Successful!</h2>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Your Microsoft Entra ID OAuth2 SMTP configuration is working correctly for <strong>support@bleepy.co.uk</strong>.</p>
            <p><strong>Authentication:</strong> OAuth2 with Microsoft Entra ID</p>
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
    console.log('\n🎉 OAuth2 SMTP is working! You can now use this for your application.');

  } catch (error) {
    console.error('❌ OAuth2 SMTP test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔧 OAuth2 Authentication failed. You need to:');
      console.error('1. Create an app registration in Azure AD');
      console.error('2. Configure API permissions (Mail.Send)');
      console.error('3. Generate a client secret');
      console.error('4. Get an access token');
    }
  }
}

testOAuth2SMTP();
