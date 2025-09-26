// Test with delegated permissions (user context)
// Run with: node test-delegated-permissions.js

require('dotenv').config({ path: '.env.local' });

console.log('🔧 Microsoft Entra ID OAuth2 Setup Status:');
console.log('✅ App registration created');
console.log('✅ Client ID and Secret configured');
console.log('✅ Access token obtained');
console.log('❌ API permissions need to be fixed');
console.log('');

console.log('📋 Next Steps:');
console.log('1. Go to Azure Portal → Your App Registration → API permissions');
console.log('2. Make sure you have these permissions:');
console.log('   - Mail.Send (Application permission)');
console.log('   - User.Read.All (Application permission)');
console.log('3. Click "Grant admin consent"');
console.log('4. Wait 5-10 minutes for permissions to propagate');
console.log('5. Test again with: node test-graph-api.js');
console.log('');

console.log('🔧 Alternative: Use Gmail SMTP (Much Easier)');
console.log('If you want to avoid the complexity of Microsoft Entra ID OAuth2,');
console.log('you can switch to Gmail SMTP which is much simpler:');
console.log('1. Create a Gmail account for your application');
console.log('2. Enable 2FA and generate an app password');
console.log('3. Use Gmail SMTP settings');
console.log('4. Test with: node test-gmail-smtp.js');
console.log('');

console.log('🎯 Recommendation:');
console.log('For development and testing, Gmail SMTP is much more reliable');
console.log('and easier to set up than Microsoft Entra ID OAuth2.');
console.log('You can always switch back to Microsoft Entra ID later for production.');
