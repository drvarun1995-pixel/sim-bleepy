// Test script to check API response for events
// Run this in browser console on the events page

console.log('=== Testing Events API Response ===');

// Test 1: Check if test event is in the raw API response
fetch('/api/events')
  .then(response => response.json())
  .then(data => {
    console.log('Total events from API:', data.length);
    
    // Look for test event
    const testEvent = data.find(event => event.title.toLowerCase().includes('test'));
    if (testEvent) {
      console.log('✅ Test event found in API response:', testEvent);
      console.log('Test event categories:', testEvent.categories);
      console.log('Test event booking_enabled:', testEvent.booking_enabled);
    } else {
      console.log('❌ Test event NOT found in API response');
    }
    
    // Check all events with booking enabled
    const bookingEvents = data.filter(event => event.booking_enabled);
    console.log('Events with booking enabled:', bookingEvents.length);
    console.log('Booking events:', bookingEvents.map(e => ({ title: e.title, booking_enabled: e.booking_enabled })));
  })
  .catch(error => {
    console.error('Error fetching events:', error);
  });

// Test 2: Check user profile
fetch('/api/user/profile')
  .then(response => response.json())
  .then(data => {
    console.log('User profile:', data);
  })
  .catch(error => {
    console.error('Error fetching user profile:', error);
  });

// Test 3: Check if filtering is working correctly
console.log('=== Testing Event Filtering ===');

// Simulate the filtering logic
const testEvent = {
  id: 'test-id',
  title: 'Test Event',
  categories: [
    { name: 'UCL', color: '#10B981' },
    { name: 'UCL Year 6', color: '#10B981' },
    { name: 'Foundation Year Doctor', color: '#F59E0B' },
    { name: 'Foundation Year 1', color: '#F59E0B' },
    { name: 'Foundation Year 2', color: '#F59E0B' }
  ],
  booking_enabled: true
};

const testUserProfile = {
  role_type: 'medical_student',
  university: 'UCL',
  study_year: '6',
  profile_completed: true
};

console.log('Test event:', testEvent);
console.log('Test user profile:', testUserProfile);

// Check if UCL categories match
const categoryNames = testEvent.categories.map(cat => cat.name.toLowerCase());
const hasUniversityMatch = categoryNames.some(cat => 
  cat.includes(testUserProfile.university.toLowerCase())
);
console.log('Has university match:', hasUniversityMatch);

// Check if year categories match
const hasYearMatch = categoryNames.some(cat => 
  cat.includes(`year ${testUserProfile.study_year}`) ||
  cat.includes(`year${testUserProfile.study_year}`) ||
  cat.includes(`y${testUserProfile.study_year}`)
);
console.log('Has year match:', hasYearMatch);

// Check role keywords
const roleKeywords = ['student', 'medical student', 'undergraduate'];
const hasRoleMatch = roleKeywords.some(keyword => 
  categoryNames.some(cat => cat.includes(keyword))
);
console.log('Has role match:', hasRoleMatch);
console.log('Role keywords:', roleKeywords);
console.log('Category names:', categoryNames);



