// Test script to verify consent data is stored during registration
require('dotenv').config({ path: '.env.local' });

async function testConsentRegistration() {
  console.log('🧪 Testing Consent Registration...\n');
  
  // Test data
  const testUser = {
    email: 'test.consent@ucl.ac.uk',
    name: 'Test Consent User',
    password: 'TestPassword123!',
    consent: true,
    marketing: false,
    analytics: true
  };
  
  console.log('📝 Test user data:');
  console.log('Email:', testUser.email);
  console.log('Name:', testUser.name);
  console.log('Consent:', testUser.consent);
  console.log('Marketing:', testUser.marketing);
  console.log('Analytics:', testUser.analytics);
  console.log('\n');
  
  try {
    console.log('🚀 Sending registration request...');
    
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });
    
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Registration successful!');
      console.log('🔍 Check your Supabase database for the new user with consent data.');
    } else {
      console.log('❌ Registration failed:', data.error);
    }
    
  } catch (error) {
    console.error('💥 Error during test:', error);
  }
}

// Run the test
testConsentRegistration();
