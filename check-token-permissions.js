// Check what permissions the current access token has
// Run with: node check-token-permissions.js

require('dotenv').config({ path: '.env.local' });
const https = require('https');

async function checkTokenPermissions() {
  console.log('Checking access token permissions...');
  console.log('AZURE_ACCESS_TOKEN:', process.env.AZURE_ACCESS_TOKEN ? '***hidden***' : 'NOT SET');
  
  if (!process.env.AZURE_ACCESS_TOKEN) {
    console.error('❌ Access token not set!');
    return;
  }

  // Decode the JWT token to see what permissions it has
  try {
    const token = process.env.AZURE_ACCESS_TOKEN;
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    console.log('✅ Token decoded successfully!');
    console.log('Token contains roles:', payload.roles || 'No roles found');
    console.log('Token scopes:', payload.scp || 'No scopes found');
    console.log('Token audience:', payload.aud);
    console.log('Token issuer:', payload.iss);
    console.log('Token expires:', new Date(payload.exp * 1000).toISOString());
    
    if (payload.roles && payload.roles.includes('Mail.Send')) {
      console.log('✅ Mail.Send permission is present in token');
    } else {
      console.log('❌ Mail.Send permission is NOT present in token');
    }
    
    if (payload.roles && payload.roles.includes('User.Read.All')) {
      console.log('✅ User.Read.All permission is present in token');
    } else {
      console.log('❌ User.Read.All permission is NOT present in token');
    }
    
  } catch (error) {
    console.error('❌ Failed to decode token:', error.message);
  }
}

checkTokenPermissions();
