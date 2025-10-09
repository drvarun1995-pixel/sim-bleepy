// Test script to send all email templates via API endpoints
// Run this with: node test-email-api.js

const adminEmail = 'drvarun1995@gmail.com';

async function testAllEmails() {
  console.log('🧪 Testing all email templates via API...\n');

  try {
    // Test 1: Account Approval Email
    console.log('1️⃣ Testing Account Approval Email...');
    const approvalResponse = await fetch('http://localhost:3000/api/test-email/approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        name: 'Dr. Varun Tyagi'
      })
    });
    
    if (approvalResponse.ok) {
      console.log('✅ Account approval email sent successfully\n');
    } else {
      console.log('❌ Account approval email failed:', await approvalResponse.text());
    }

    // Test 2: Role Change Email (Student to Educator)
    console.log('2️⃣ Testing Role Change Email (Student → Educator)...');
    const roleChangeResponse = await fetch('http://localhost:3000/api/test-email/role-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        name: 'Dr. Varun Tyagi',
        oldRole: 'student',
        newRole: 'educator'
      })
    });
    
    if (roleChangeResponse.ok) {
      console.log('✅ Role change email sent successfully\n');
    } else {
      console.log('❌ Role change email failed:', await roleChangeResponse.text());
    }

    // Test 3: Role Change Email (Educator to Admin)
    console.log('3️⃣ Testing Role Change Email (Educator → Admin)...');
    const roleChange2Response = await fetch('http://localhost:3000/api/test-email/role-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        name: 'Dr. Varun Tyagi',
        oldRole: 'educator',
        newRole: 'admin'
      })
    });
    
    if (roleChange2Response.ok) {
      console.log('✅ Role change email sent successfully\n');
    } else {
      console.log('❌ Role change email failed:', await roleChange2Response.text());
    }

    // Test 4: Email Verification
    console.log('4️⃣ Testing Email Verification...');
    const verificationResponse = await fetch('http://localhost:3000/api/test-email/verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        name: 'Dr. Varun Tyagi',
        verificationUrl: 'https://sim.bleepy.co.uk/auth/verify?token=test-token-123'
      })
    });
    
    if (verificationResponse.ok) {
      console.log('✅ Email verification sent successfully\n');
    } else {
      console.log('❌ Email verification failed:', await verificationResponse.text());
    }

    // Test 5: Password Reset
    console.log('5️⃣ Testing Password Reset...');
    const resetResponse = await fetch('http://localhost:3000/api/test-email/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        name: 'Dr. Varun Tyagi',
        resetUrl: 'https://sim.bleepy.co.uk/auth/reset?token=test-reset-token-123'
      })
    });
    
    if (resetResponse.ok) {
      console.log('✅ Password reset email sent successfully\n');
    } else {
      console.log('❌ Password reset email failed:', await resetResponse.text());
    }

    // Test 6: Admin New User Notification
    console.log('6️⃣ Testing Admin New User Notification...');
    const adminNotificationResponse = await fetch('http://localhost:3000/api/test-email/admin-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: 'test.student@example.com',
        userName: 'Test Student',
        signupTime: new Date().toISOString(),
        consentGiven: true,
        marketingConsent: true,
        analyticsConsent: false
      })
    });
    
    if (adminNotificationResponse.ok) {
      console.log('✅ Admin notification email sent successfully\n');
    } else {
      console.log('❌ Admin notification email failed:', await adminNotificationResponse.text());
    }

    console.log('🎉 All email tests completed!');
    console.log('📧 Check your inbox at drvarun1995@gmail.com for all test emails');

  } catch (error) {
    console.error('❌ Error testing emails:', error);
  }
}

// Run the tests
testAllEmails();
