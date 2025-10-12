const https = require('https');

// Email delivery monitoring script
class EmailMonitor {
  constructor() {
    this.baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    this.adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',')[0]?.trim() || 'drvarun1995@gmail.com';
  }

  // Test email validation
  async testEmailValidation(email) {
    console.log(`\n🔍 Testing email validation for: ${email}`);
    
    try {
      const response = await fetch(`${this.baseUrl}/api/test-email/debug`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': await this.getAuthCookie() // You'd need to implement this
        },
        body: JSON.stringify({
          email: email,
          testType: 'validation'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Validation test completed');
        console.log('Format valid:', result.tests.formatValidation.valid);
        if (!result.tests.formatValidation.valid) {
          console.log('Issues:', result.tests.formatValidation.issues);
        }
        console.log('Environment configured:', result.tests.environment.allConfigured);
        return result;
      } else {
        console.log('❌ Validation test failed:', result.error);
        return null;
      }
    } catch (error) {
      console.log('❌ Validation test error:', error.message);
      return null;
    }
  }

  // Test actual email sending
  async testEmailSending(email) {
    console.log(`\n📧 Testing email sending to: ${email}`);
    
    try {
      const response = await fetch(`${this.baseUrl}/api/test-email/debug`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': await this.getAuthCookie() // You'd need to implement this
        },
        body: JSON.stringify({
          email: email,
          testType: 'send'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        if (result.tests.emailSend?.success) {
          console.log('✅ Email sent successfully');
          console.log('Duration:', result.tests.emailSend.duration);
        } else {
          console.log('❌ Email sending failed:', result.tests.emailSend?.error);
        }
        return result;
      } else {
        console.log('❌ Email sending test failed:', result.error);
        return null;
      }
    } catch (error) {
      console.log('❌ Email sending test error:', error.message);
      return null;
    }
  }

  // Monitor email delivery for specific addresses
  async monitorEmails(emails) {
    console.log('🚀 Starting Email Delivery Monitoring\n');
    
    const results = [];
    
    for (const email of emails) {
      console.log(`\n--- Monitoring: ${email} ---`);
      
      // Test validation
      const validationResult = await this.testEmailValidation(email);
      
      // Test sending (only if validation passes)
      let sendResult = null;
      if (validationResult?.tests?.formatValidation?.valid) {
        sendResult = await this.testEmailSending(email);
      }
      
      results.push({
        email,
        validation: validationResult,
        sending: sendResult
      });
      
      // Wait between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Generate summary report
    this.generateReport(results);
    
    return results;
  }

  // Generate monitoring report
  generateReport(results) {
    console.log('\n📊 EMAIL DELIVERY MONITORING REPORT');
    console.log('='.repeat(50));
    
    let validEmails = 0;
    let sentEmails = 0;
    let failedEmails = 0;
    
    results.forEach(result => {
      const isValid = result.validation?.tests?.formatValidation?.valid;
      const wasSent = result.sending?.tests?.emailSend?.success;
      
      if (isValid) validEmails++;
      if (wasSent) sentEmails++;
      if (isValid && !wasSent) failedEmails++;
      
      console.log(`\n📧 ${result.email}`);
      console.log(`   Format: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`   Sent: ${wasSent ? '✅ Success' : '❌ Failed'}`);
      
      if (!isValid && result.validation?.tests?.formatValidation?.issues) {
        console.log(`   Issues: ${result.validation.tests.formatValidation.issues.join(', ')}`);
      }
      
      if (isValid && !wasSent && result.sending?.tests?.emailSend?.error) {
        console.log(`   Error: ${result.sending.tests.emailSend.error}`);
      }
    });
    
    console.log('\n📈 SUMMARY:');
    console.log(`Total emails tested: ${results.length}`);
    console.log(`Valid formats: ${validEmails}/${results.length}`);
    console.log(`Successfully sent: ${sentEmails}/${validEmails}`);
    console.log(`Failed to send: ${failedEmails}/${validEmails}`);
    
    if (failedEmails > 0) {
      console.log('\n⚠️ FAILED EMAILS ANALYSIS:');
      results.forEach(result => {
        if (result.validation?.tests?.formatValidation?.valid && 
            !result.sending?.tests?.emailSend?.success) {
          console.log(`\n❌ ${result.email}:`);
          console.log(`   Error: ${result.sending?.tests?.emailSend?.error}`);
          
          // Provide specific recommendations
          if (result.email.includes('ucl.ac.uk')) {
            console.log('   💡 Recommendation: University domains often block external emails');
          }
          if (result.sending?.tests?.emailSend?.error?.includes('not found')) {
            console.log('   💡 Recommendation: Email address may not exist');
          }
          if (result.sending?.tests?.emailSend?.error?.includes('quota')) {
            console.log('   💡 Recommendation: Check Azure email sending limits');
          }
        }
      });
    }
    
    console.log('\n✅ Monitoring completed!');
  }

  // Mock auth cookie (you'd need to implement proper authentication)
  async getAuthCookie() {
    // This is a placeholder - you'd need to implement proper session handling
    return '';
  }
}

// Usage example
async function runEmailMonitoring() {
  const monitor = new EmailMonitor();
  
  // Test emails to monitor
  const testEmails = [
    'zakira.klico@ucl.ac.uk', // The failing email from your image
    'drvarun1995@gmail.com',   // Your admin email
    'test@example.com',        // Invalid domain
    'invalid-email',           // Invalid format
  ];
  
  try {
    await monitor.monitorEmails(testEmails);
  } catch (error) {
    console.error('Monitoring failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  runEmailMonitoring();
}

module.exports = EmailMonitor;





