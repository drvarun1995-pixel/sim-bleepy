// Test script to check announcements API
// Run this in browser console on http://localhost:3000/dashboard/announcements

console.log('Testing Announcements API...');

// Test 1: Get all announcements
async function testGetAnnouncements() {
  try {
    const response = await fetch('/api/announcements');
    const data = await response.json();
    console.log('GET /api/announcements:', response.status, data);
    return data.announcements || [];
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
}

// Test 2: Create a test announcement
async function testCreateAnnouncement() {
  try {
    const response = await fetch('/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Announcement',
        content: 'This is a test announcement to verify the API is working.',
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
    console.log('POST /api/announcements:', response.status, data);
    return data.announcement;
  } catch (error) {
    console.error('Error creating announcement:', error);
    return null;
  }
}

// Test 3: Update an announcement
async function testUpdateAnnouncement(announcementId) {
  try {
    const response = await fetch(`/api/announcements/${announcementId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Updated Test Announcement',
        content: 'This announcement has been updated successfully!'
      })
    });
    const data = await response.json();
    console.log('PATCH /api/announcements:', response.status, data);
    return data.announcement;
  } catch (error) {
    console.error('Error updating announcement:', error);
    return null;
  }
}

// Run all tests
async function runTests() {
  console.log('=== Starting Announcements API Tests ===');
  
  // Test 1: Get announcements
  const announcements = await testGetAnnouncements();
  console.log('Found announcements:', announcements.length);
  
  if (announcements.length > 0) {
    // Test 3: Update first announcement
    const firstAnnouncement = announcements[0];
    console.log('Testing update on announcement:', firstAnnouncement.id);
    await testUpdateAnnouncement(firstAnnouncement.id);
  } else {
    // Test 2: Create test announcement
    console.log('No announcements found, creating test announcement...');
    const newAnnouncement = await testCreateAnnouncement();
    if (newAnnouncement) {
      console.log('Created announcement:', newAnnouncement.id);
      // Test update on the new announcement
      await testUpdateAnnouncement(newAnnouncement.id);
    }
  }
  
  console.log('=== Tests Complete ===');
}

// Run the tests
runTests();
