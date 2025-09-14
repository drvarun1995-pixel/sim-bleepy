// Test Resend API Key
const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResend() {
  try {
    console.log('Testing Resend API key:', process.env.RESEND_API_KEY ? '✅ Found' : '❌ Missing');
    
    const { data, error } = await resend.emails.send({
      from: 'Bleepy Simulator <onboarding@resend.dev>',
      to: ['drvarun1995@gmail.com'], // Your email for testing
      subject: 'Test Email from Bleepy Simulator',
      html: '<p>This is a test email to verify Resend is working!</p>',
    });

    if (error) {
      console.error('❌ Resend Error:', error);
    } else {
      console.log('✅ Email sent successfully:', data);
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

testResend();
