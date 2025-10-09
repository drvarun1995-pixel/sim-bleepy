// Test script for the specific failing email: zakira.klico@ucl.ac.uk

const https = require('https');

// Email validation
function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim());
}

// Check email format issues
function analyzeEmail(email) {
  console.log(`\n🔍 Analyzing email: ${email}`);
  
  const issues = [];
  
  if (!email) {
    issues.push('Email is empty');
    return { valid: false, issues };
  }
  
  if (!validateEmail(email)) {
    issues.push('Invalid email format');
  }
  
  // Check for specific issues
  if (email.includes('..')) {
    issues.push('Contains consecutive dots');
  }
  
  if (email.startsWith('.') || email.endsWith('.')) {
    issues.push('Starts or ends with dot');
  }
  
  const [localPart, domain] = email.split('@');
  
  if (localPart && localPart.length > 64) {
    issues.push('Local part too long (>64 chars)');
  }
  
  if (domain && domain.length > 253) {
    issues.push('Domain too long (>253 chars)');
  }
  
  // Check for common typos
  if (domain === 'ucl.ac.uk') {
    console.log('✅ Domain is valid: ucl.ac.uk');
  }
  
  if (localPart === 'zakira.klico') {
    console.log('✅ Local part format looks correct: zakira.klico');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    localPart,
    domain,
    analysis: {
      isUniversityEmail: domain === 'ucl.ac.uk',
      hasDotInLocal: localPart.includes('.'),
      length: email.length
    }
  };
}

// Test the specific failing email
function testFailingEmail() {
  const failingEmail = 'zakira.klico@ucl.ac.uk';
  
  console.log('🚀 Testing the failing email from your image');
  console.log('=' .repeat(50));
  
  const analysis = analyzeEmail(failingEmail);
  
  console.log('\n📊 ANALYSIS RESULTS:');
  console.log(`Valid format: ${analysis.valid ? '✅ Yes' : '❌ No'}`);
  console.log(`Local part: ${analysis.localPart}`);
  console.log(`Domain: ${analysis.domain}`);
  console.log(`Length: ${analysis.analysis.length} characters`);
  console.log(`University email: ${analysis.analysis.isUniversityEmail ? 'Yes' : 'No'}`);
  console.log(`Has dot in local part: ${analysis.analysis.hasDotInLocal ? 'Yes' : 'No'}`);
  
  if (analysis.issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    analysis.issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('\n✅ EMAIL FORMAT IS VALID');
  }
  
  console.log('\n🔍 POSSIBLE CAUSES OF DELIVERY FAILURE:');
  console.log('1. Email address does not exist at ucl.ac.uk');
  console.log('2. UCL email server is blocking external emails');
  console.log('3. Recipient mailbox is full or disabled');
  console.log('4. UCL has strict email filtering rules');
  console.log('5. Typo in email address (zakira.klico vs zakira.kliko)');
  console.log('6. Azure Graph API authentication issues');
  console.log('7. Rate limiting or quota exceeded');
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('1. Verify the correct spelling with the recipient');
  console.log('2. Check if UCL allows external emails to this domain');
  console.log('3. Try sending to a different email address first');
  console.log('4. Check Azure Graph API logs for detailed error messages');
  console.log('5. Contact UCL IT support if this is a legitimate user');
  
  // Test alternative email formats
  console.log('\n🧪 TESTING ALTERNATIVE FORMATS:');
  const alternatives = [
    'zakira.kliko@ucl.ac.uk',  // Common typo: liko vs klico
    'zakira@ucl.ac.uk',        // Without dot
    'z.klico@ucl.ac.uk',       // Abbreviated
  ];
  
  alternatives.forEach(alt => {
    const altAnalysis = analyzeEmail(alt);
    console.log(`   ${alt}: ${altAnalysis.valid ? '✅ Valid' : '❌ Invalid'}`);
  });
  
  return analysis;
}

// Run the test
const result = testFailingEmail();

console.log('\n🎯 NEXT STEPS:');
console.log('1. Contact the user to verify their correct email address');
console.log('2. Check if they have an alternative email (Gmail, etc.)');
console.log('3. Monitor your Azure Graph API logs for more detailed errors');
console.log('4. Consider implementing email verification before sending notifications');

console.log('\n✅ Email analysis completed!');
