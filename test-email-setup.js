// Test your current Microsoft Graph API email setup
const https = require('https');

async function testEmailSetup() {
  console.log('🔍 Testing Microsoft Graph API Email Setup...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('  - AZURE_TENANT_ID:', process.env.AZURE_TENANT_ID ? '✅ Set' : '❌ Missing');
  console.log('  - AZURE_CLIENT_ID:', process.env.AZURE_CLIENT_ID ? '✅ Set' : '❌ Missing');
  console.log('  - AZURE_CLIENT_SECRET:', process.env.AZURE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('  - SMTP_USER:', process.env.SMTP_USER ? `✅ ${process.env.SMTP_USER}` : '❌ Missing');
  console.log('  - NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL ? '✅ Set' : '❌ Missing');
  
  console.log('\n📧 Email Configuration:');
  console.log('  - Sender Email:', process.env.SMTP_USER || 'Not configured');
  console.log('  - App URL:', process.env.NEXT_PUBLIC_APP_URL || 'Not configured');
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Add SPF record to Cloudflare DNS');
  console.log('2. Add DMARC record to Cloudflare DNS');
  console.log('3. Get DKIM record from Microsoft 365 Admin Center');
  console.log('4. Test email delivery');
  
  console.log('\n📋 DNS Records to Add in Cloudflare:');
  console.log('SPF Record:');
  console.log('  Type: TXT');
  console.log('  Name: @');
  console.log('  Content: v=spf1 include:spf.protection.outlook.com ~all');
  console.log('');
  console.log('DMARC Record:');
  console.log('  Type: TXT');
  console.log('  Name: _dmarc');
  console.log('  Content: v=DMARC1; p=quarantine; rua=mailto:dmarc@bleepy.co.uk; ruf=mailto:dmarc@bleepy.co.uk; fo=1');
  console.log('');
  console.log('DKIM Record:');
  console.log('  Type: CNAME');
  console.log('  Name: selector1._domainkey');
  console.log('  Content: selector1-bleepy-co-uk._domainkey.outlook.com');
  console.log('  (Get exact values from Microsoft 365 Admin Center)');
}

testEmailSetup().catch(console.error);




