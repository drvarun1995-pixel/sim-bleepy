// Test script to send all email templates to admin email
// Run this with: node test-all-emails.js

require('dotenv').config({ path: '.env.local' });

const { 
  sendAccountApprovalEmail, 
  sendRoleChangeEmail, 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  sendAdminNewUserNotification 
} = require('./lib/email');

const adminEmail = 'drvarun1995@gmail.com';

async function testAllEmails() {
  console.log('🧪 Testing all email templates...\n');

  try {
    // Test 1: Account Approval Email
    console.log('1️⃣ Testing Account Approval Email...');
    await sendAccountApprovalEmail({
      email: adminEmail,
      name: 'Dr. Varun Tyagi'
    });
    console.log('✅ Account approval email sent successfully\n');

    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Role Change Email (Student to Educator)
    console.log('2️⃣ Testing Role Change Email (Student → Educator)...');
    await sendRoleChangeEmail({
      email: adminEmail,
      name: 'Dr. Varun Tyagi',
      oldRole: 'student',
      newRole: 'educator'
    });
    console.log('✅ Role change email sent successfully\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Role Change Email (Educator to Admin)
    console.log('3️⃣ Testing Role Change Email (Educator → Admin)...');
    await sendRoleChangeEmail({
      email: adminEmail,
      name: 'Dr. Varun Tyagi',
      oldRole: 'educator',
      newRole: 'admin'
    });
    console.log('✅ Role change email sent successfully\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Email Verification
    console.log('4️⃣ Testing Email Verification...');
    await sendVerificationEmail({
      email: adminEmail,
      name: 'Dr. Varun Tyagi',
      verificationUrl: 'https://sim.bleepy.co.uk/auth/verify?token=test-token-123'
    });
    console.log('✅ Email verification sent successfully\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 5: Password Reset
    console.log('5️⃣ Testing Password Reset...');
    await sendPasswordResetEmail({
      email: adminEmail,
      name: 'Dr. Varun Tyagi',
      resetUrl: 'https://sim.bleepy.co.uk/auth/reset?token=test-reset-token-123'
    });
    console.log('✅ Password reset email sent successfully\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 6: Admin New User Notification
    console.log('6️⃣ Testing Admin New User Notification...');
    await sendAdminNewUserNotification({
      userEmail: 'test.student@example.com',
      userName: 'Test Student',
      signupTime: new Date().toISOString(),
      consentGiven: true,
      marketingConsent: true,
      analyticsConsent: false
    });
    console.log('✅ Admin notification email sent successfully\n');

    console.log('🎉 All email tests completed successfully!');
    console.log('📧 Check your inbox at drvarun1995@gmail.com for all test emails');

  } catch (error) {
    console.error('❌ Error testing emails:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the tests
testAllEmails();
