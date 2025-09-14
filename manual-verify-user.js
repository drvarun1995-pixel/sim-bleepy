// Manual User Verification Script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyUser(email) {
  try {
    console.log(`Verifying user: ${email}`);
    
    // Update user to verified
    const { data, error } = await supabase
      .from('users')
      .update({ 
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase())
      .select();

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ User verified successfully:', data);
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

// Usage: node manual-verify-user.js user@example.com
const email = process.argv[2];
if (email) {
  verifyUser(email);
} else {
  console.log('Usage: node manual-verify-user.js user@example.com');
}
