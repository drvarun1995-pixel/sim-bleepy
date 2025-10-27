// Simple test for contact messages API
// Run this in browser console on http://localhost:3000/contact-messages

console.log('🧪 Testing Contact Messages API...');

// Test 1: Submit a contact message
async function testSubmitContactMessage() {
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Contact Message - ' + new Date().toLocaleTimeString(),
        category: 'General Inquiry',
        message: 'This is a test contact message to verify the API is working properly. Please ignore this message.'
      })
    });
    const data = await response.json();
    console.log('✅ POST /api/contact:', response.status, data);
    return data.id;
  } catch (error) {
    console.error('❌ Error submitting contact message:', error);
    return null;
  }
}

// Test 2: Get all contact messages (admin only)
async function testGetContactMessages() {
  try {
    const response = await fetch('/api/admin/contact-messages');
    const data = await response.json();
    console.log('✅ GET /api/admin/contact-messages:', response.status, data);
    return data.messages || [];
  } catch (error) {
    console.error('❌ Error fetching contact messages:', error);
    return [];
  }
}

// Test 3: Update a contact message status
async function testUpdateContactMessage(messageId) {
  try {
    const response = await fetch('/api/admin/contact-messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: messageId,
        status: 'read',
        admin_notes: 'Test update - ' + new Date().toLocaleTimeString()
      })
    });
    const data = await response.json();
    console.log('✅ PATCH /api/admin/contact-messages:', response.status, data);
    return data;
  } catch (error) {
    console.error('❌ Error updating contact message:', error);
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive contact messages test...');
  
  // Test 1: Submit a contact message
  const messageId = await testSubmitContactMessage();
  if (messageId) {
    console.log('✅ Created contact message:', messageId);
    
    // Test 3: Update the contact message
    await testUpdateContactMessage(messageId);
  }
  
  // Test 2: Get all contact messages (requires admin role)
  const messages = await testGetContactMessages();
  console.log(`📊 Found ${messages.length} contact messages`);
  
  console.log('🎉 All tests completed!');
}

// Run the tests
runAllTests();




