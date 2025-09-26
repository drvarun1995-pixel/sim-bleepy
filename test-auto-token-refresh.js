require('dotenv').config({ path: '.env.local' });

const { sendVerificationEmail } = require('./lib/email.ts');

async function testAutoTokenRefresh() {
  console.log('Testing automatic token refresh...');
  console.log('AZURE_TENANT_ID:', process.env.AZURE_TENANT_ID);
  console.log('AZURE_CLIENT_ID:', process.env.AZURE_CLIENT_ID);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  
  try {
    await sendVerificationEmail({
      email: 'test@example.com',
      name: 'Test User',
      verificationUrl: 'https://sim.bleepy.co.uk/auth/verify?token=test123'
    });
    console.log('✅ Email sent successfully with automatic token refresh!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAutoTokenRefresh();
