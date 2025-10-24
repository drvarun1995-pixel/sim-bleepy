// Test Resend API with your existing email
const { Resend } = require('resend');

// Initialize Resend with your API key
const resend = new Resend('re_AupNBHdW_BMD5xnDvWwT3ZVFUbp8PWAmW');

async function testResendEmail() {
  try {
    console.log('🧪 Testing Resend API with support@bleepy.co.uk...\n');
    
    // Test email configuration
    const testEmail = {
      from: 'Bleepy <support@bleepy.co.uk>',
      to: ['VT334@student.aru.ac.uk'], // ARU test email
      subject: 'Test Email from Resend - Bleepy',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">🧪 Resend API Test</h2>
          <p>This is a test email sent via Resend API from support@bleepy.co.uk</p>
          <p><strong>Purpose:</strong> Testing email delivery without security warnings</p>
          <p><strong>Service:</strong> Resend API</p>
          <p><strong>From:</strong> support@bleepy.co.uk</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            If you receive this email without security warnings, Resend is working correctly!
          </p>
        </div>
      `
    };
    
    console.log('📧 Sending test email...');
    console.log('  From: support@bleepy.co.uk');
    console.log('  To: VT334@student.aru.ac.uk');
    console.log('  Subject: Test Email from Resend - Bleepy\n');
    
    // Send the email
    const result = await resend.emails.send(testEmail);
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Full result:', JSON.stringify(result, null, 2));
    console.log('📧 Email ID:', result.data?.id);
    console.log('📊 Status: Sent via Resend API');
    console.log('\n🎯 Next steps:');
    console.log('1. Check your test email inbox');
    console.log('2. Verify no security warnings appear');
    console.log('3. If successful, we can integrate Resend into your app');
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your Resend API key');
    console.log('2. Verify your Resend account is active');
    console.log('3. Check your email limits (3,000/month on free tier)');
  }
}

// Run the test
testResendEmail();
