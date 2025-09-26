// Test Microsoft Graph API for sending emails
// Run with: node test-graph-api.js

require('dotenv').config({ path: '.env.local' });
const https = require('https');

async function testGraphAPI() {
  console.log('Testing Microsoft Graph API for email sending...');
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('AZURE_ACCESS_TOKEN:', process.env.AZURE_ACCESS_TOKEN ? '***hidden***' : 'NOT SET');
  
  if (!process.env.SMTP_USER || !process.env.AZURE_ACCESS_TOKEN) {
    console.error('❌ Environment variables not set!');
    return;
  }

  // Microsoft Graph API endpoint for sending email
  const graphUrl = 'https://graph.microsoft.com/v1.0/users/support@bleepy.co.uk/sendMail';
  
  // Email message payload
  const messagePayload = {
    message: {
      subject: 'Bleepy Simulator - Graph API Test',
      body: {
        contentType: 'HTML',
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🏥 Bleepy Simulator</h1>
              <h2 style="margin: 10px 0 0 0; font-size: 18px;">Microsoft Graph API Test Successful!</h2>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Your Microsoft Graph API configuration is working correctly for <strong>support@bleepy.co.uk</strong>.</p>
              <p><strong>Authentication:</strong> OAuth2 with Microsoft Entra ID</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <p><strong>From:</strong> Bleepy Simulator &lt;support@bleepy.co.uk&gt;</p>
              <p><strong>To:</strong> support@bleepy.co.uk</p>
              <p><strong>Status:</strong> ✅ Ready for production</p>
            </div>
          </div>
        `
      },
      toRecipients: [
        {
          emailAddress: {
            address: 'support@bleepy.co.uk'
          }
        }
      ]
    }
  };

  const postData = JSON.stringify(messagePayload);

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.AZURE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(graphUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 202) {
          console.log('✅ Microsoft Graph API email sent successfully!');
          console.log('Status Code:', res.statusCode);
          console.log('Response:', data || 'No response body');
          console.log('Check your inbox for the test email.');
          console.log('\n🎉 Microsoft Graph API is working! You can use this for your application.');
          resolve();
        } else {
          console.error('❌ Microsoft Graph API test failed:');
          console.error('Status Code:', res.statusCode);
          console.error('Response:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

testGraphAPI().catch(console.error);
