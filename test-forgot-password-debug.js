// Test the forgot password API with detailed logging
const https = require('https');

async function testForgotPassword() {
  console.log('🔍 Testing forgot password API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'drvarun1995@gmail.com' })
    });
    
    const data = await response.json();
    console.log('📧 API Response:', data);
    
    if (data.resetUrl) {
      console.log('🔗 Reset URL (for development):', data.resetUrl);
      console.log('📝 You can use this URL to test the reset flow directly');
    }
    
  } catch (error) {
    console.error('❌ Error testing forgot password:', error);
  }
}

testForgotPassword();
