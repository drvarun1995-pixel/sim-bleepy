// Simple test for announcements API
// Run this in browser console on http://localhost:3000/dashboard/announcements

console.log('🧪 Testing Announcements API...');

// Test 1: Get announcements
async function testGetAnnouncements() {
  try {
    const response = await fetch('/api/announcements');
    const data = await response.json();
    console.log('✅ GET /api/announcements:', response.status, data);
    return data.announcements || [];
  } catch (error) {
    console.error('❌ Error fetching announcements:', error);
    return [];
  }
}

// Test 2: Create a test announcement
async function testCreateAnnouncement() {
  try {
    const response = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Announcement - ' + new Date().toLocaleTimeString(),
        content: 'This is a test announcement to verify the API is working properly.',
        target_audience: {
          type: 'all',
          roles: [],
          years: [],
          universities: [],
          specialties: []
        },
        priority: 'normal',
        is_active: true
      })
    });
    const data = await response.json();
    console.log('✅ POST /api/announcements:', response.status, data);
    return data.announcement;
  } catch (error) {
    console.error('❌ Error creating announcement:', error);
    return null;
  }
}

// Test 3: Update an announcement
async function testUpdateAnnouncement(announcementId) {
  try {
    const response = await fetch(`/api/announcements/${announcementId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated Test Announcement - ' + new Date().toLocaleTimeString(),
        content: 'This announcement has been successfully updated!'
      })
    });
    const data = await response.json();
    console.log('✅ PATCH /api/announcements:', response.status, data);
    return data.announcement;
  } catch (error) {
    console.error('❌ Error updating announcement:', error);
    return null;
  }
}

// Test 4: Test dashboard announcements
async function testDashboardAnnouncements() {
  try {
    const response = await fetch('/api/announcements/dashboard');
    const data = await response.json();
    console.log('✅ GET /api/announcements/dashboard:', response.status, data);
    return data.announcements || [];
  } catch (error) {
    console.error('❌ Error fetching dashboard announcements:', error);
    return [];
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive announcements test...');
  
  // Test 1: Get existing announcements
  const existingAnnouncements = await testGetAnnouncements();
  console.log(`📊 Found ${existingAnnouncements.length} existing announcements`);
  
  // Test 2: Create new announcement
  const newAnnouncement = await testCreateAnnouncement();
  if (newAnnouncement) {
    console.log('✅ Created announcement:', newAnnouncement.id);
    
    // Test 3: Update the new announcement
    await testUpdateAnnouncement(newAnnouncement.id);
  }
  
  // Test 4: Test dashboard endpoint
  await testDashboardAnnouncements();
  
  console.log('🎉 All tests completed!');
}

// Run the tests
runAllTests();
