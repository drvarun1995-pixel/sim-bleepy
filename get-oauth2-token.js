// Get OAuth2 access token for Microsoft Entra ID
// Run with: node get-oauth2-token.js

require('dotenv').config({ path: '.env.local' });
const https = require('https');

async function getAccessToken() {
  console.log('Getting OAuth2 access token for Microsoft Entra ID...');
  console.log('AZURE_CLIENT_ID:', process.env.AZURE_CLIENT_ID);
  console.log('AZURE_CLIENT_SECRET:', process.env.AZURE_CLIENT_SECRET ? '***hidden***' : 'NOT SET');
  console.log('AZURE_TENANT_ID:', process.env.AZURE_TENANT_ID);
  
  if (!process.env.AZURE_CLIENT_ID || !process.env.AZURE_CLIENT_SECRET || !process.env.AZURE_TENANT_ID) {
    console.error('❌ OAuth2 environment variables not set!');
    return;
  }

  // OAuth2 token endpoint
  const tokenUrl = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;
  
  // Request body for client credentials flow (form data)
  const postData = new URLSearchParams({
    client_id: process.env.AZURE_CLIENT_ID,
    client_secret: process.env.AZURE_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  }).toString();

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(tokenUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.access_token) {
            console.log('✅ Access token obtained successfully!');
            console.log('Access Token:', response.access_token.substring(0, 20) + '...');
            console.log('Token Type:', response.token_type);
            console.log('Expires In:', response.expires_in, 'seconds');
            
            // Calculate expiration timestamp
            const expiresAt = new Date(Date.now() + (response.expires_in * 1000));
            console.log('Expires At:', expiresAt.toISOString());
            
            console.log('\n📝 Add these to your .env.local file:');
            console.log(`AZURE_ACCESS_TOKEN=${response.access_token}`);
            console.log(`AZURE_TOKEN_EXPIRES=${expiresAt.getTime()}`);
            
            resolve(response);
          } else {
            console.error('❌ Failed to get access token:');
            console.error('Error:', response.error);
            console.error('Description:', response.error_description);
            reject(new Error(response.error_description || 'Failed to get access token'));
          }
        } catch (error) {
          console.error('❌ Failed to parse response:');
          console.error('Response:', data);
          reject(error);
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

getAccessToken().catch(console.error);
