const fetch = require('node-fetch');

async function testPasswordReset() {
  try {
    console.log('Testing password reset for drvarun1995@gmail.com...');
    
    const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'drvarun1995@gmail.com' })
    });
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (data.resetUrl) {
      console.log('Reset URL (for development):', data.resetUrl);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testPasswordReset();
