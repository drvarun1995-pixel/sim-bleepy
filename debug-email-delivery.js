const https = require('https');

// Email validation function
const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

// Check email format issues
function checkEmailFormat(email) {
  console.log(`\n🔍 Checking email format for: ${email}`);
  
  if (!email) {
    console.log('❌ Email is empty');
    return false;
  }
  
  if (!isValidEmail(email)) {
    console.log('❌ Invalid email format');
    return false;
  }
  
  // Check for common issues
  if (email.includes('..')) {
    console.log('❌ Email contains consecutive dots');
    return false;
  }
  
  if (email.startsWith('.') || email.endsWith('.')) {
    console.log('❌ Email starts or ends with a dot');
    return false;
  }
  
  const [localPart, domain] = email.split('@');
  if (localPart.length > 64) {
    console.log('❌ Local part is too long (>64 characters)');
    return false;
  }
  
  if (domain.length > 253) {
    console.log('❌ Domain is too long (>253 characters)');
    return false;
  }
  
  console.log('✅ Email format is valid');
  return true;
}

// Check domain issues
async function checkDomainIssues(email) {
  const domain = email.split('@')[1];
  console.log(`\n🌐 Checking domain: ${domain}`);
  
  try {
    // Try to resolve MX records
    const dns = require('dns').promises;
    const mxRecords = await dns.resolveMx(domain);
    
    if (mxRecords && mxRecords.length > 0) {
      console.log(`✅ MX records found: ${mxRecords.map(r => r.exchange).join(', ')}`);
      return true;
    } else {
      console.log('❌ No MX records found');
      return false;
    }
  } catch (error) {
    console.log(`❌ DNS resolution failed: ${error.message}`);
    return false;
  }
}

// Test Microsoft Graph API connectivity
async function testGraphAPIConnectivity() {
  console.log('\n🔗 Testing Microsoft Graph API connectivity...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.microsoft.com',
      port: 443,
      path: '/v1.0/me',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.AZURE_ACCESS_TOKEN || 'test-token'}`,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      console.log(`Graph API Status: ${res.statusCode}`);
      if (res.statusCode === 401) {
        console.log('❌ Authentication failed - check Azure credentials');
      } else if (res.statusCode === 200) {
        console.log('✅ Graph API is accessible');
      } else {
        console.log(`⚠️ Unexpected status: ${res.statusCode}`);
      }
      resolve(res.statusCode);
    });
    
    req.on('error', (error) => {
      console.log(`❌ Network error: ${error.message}`);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ Request timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

// Main diagnostic function
async function runEmailDiagnostics(testEmails = []) {
  console.log('🚀 Starting Email Delivery Diagnostics\n');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`SMTP_USER: ${process.env.SMTP_USER ? '✅ Set' : '❌ Missing'}`);
  console.log(`AZURE_CLIENT_ID: ${process.env.AZURE_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`AZURE_CLIENT_SECRET: ${process.env.AZURE_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`AZURE_TENANT_ID: ${process.env.AZURE_TENANT_ID ? '✅ Set' : '❌ Missing'}`);
  
  // Test Graph API connectivity
  try {
    await testGraphAPIConnectivity();
  } catch (error) {
    console.log(`Graph API test failed: ${error.message}`);
  }
  
  // Test specific emails if provided
  if (testEmails.length > 0) {
    console.log('\n📧 Testing specific email addresses:');
    
    for (const email of testEmails) {
      console.log(`\n--- Testing: ${email} ---`);
      
      // Check format
      const formatValid = checkEmailFormat(email);
      
      if (formatValid) {
        // Check domain
        await checkDomainIssues(email);
      }
    }
  }
  
  console.log('\n📊 Common Email Delivery Issues:');
  console.log('1. Invalid email format (typos, missing @, etc.)');
  console.log('2. Non-existent domains or missing MX records');
  console.log('3. Recipient server blocking or rejecting emails');
  console.log('4. Azure Graph API authentication issues');
  console.log('5. Rate limiting or quota exceeded');
  console.log('6. Recipient mailbox full or disabled');
  
  console.log('\n💡 Recommendations:');
  console.log('1. Verify email addresses before sending');
  console.log('2. Check recipient domain MX records');
  console.log('3. Monitor Azure Graph API logs for detailed errors');
  console.log('4. Implement email validation in your forms');
  console.log('5. Consider using a dedicated email service provider');
  
  console.log('\n✅ Diagnostics completed!');
}

// Example usage
const testEmails = [
  'zakira.klico@ucl.ac.uk', // The failing email from your image
  'drvarun1995@gmail.com',   // Your admin email
  'test@example.com'         // Invalid domain for testing
];

// Run diagnostics
runEmailDiagnostics(testEmails).catch(console.error);




