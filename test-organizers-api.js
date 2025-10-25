// =====================================================
// TEST ORGANIZERS API ENDPOINTS
// =====================================================
// Run this in your browser console to test the API
// =====================================================

console.log('🔍 Testing Organizers API Endpoints...');

// Get a Grand Round event ID first
fetch('/api/events')
  .then(response => response.json())
  .then(events => {
    const grandRound = events.find(event => 
      event.title && event.title.toLowerCase().includes('grand round')
    );
    
    if (!grandRound) {
      console.log('❌ No Grand Round event found');
      return;
    }
    
    console.log('🎯 Testing with event:', grandRound.title, 'ID:', grandRound.id);
    
    // Test 1: Get organizers for the event
    return fetch(`/api/events/${grandRound.id}/organizers`);
  })
  .then(response => {
    console.log('📡 GET organizers response status:', response.status);
    return response.json();
  })
  .then(organizers => {
    console.log('✅ Current organizers:', organizers);
    
    // Test 2: Add an organizer (if we have available organizers)
    const availableOrganizers = [
      'Sarah', 'Varun', 'Hannah-Maria', 'Thanuji', 'Simran'
    ];
    
    // Find an organizer that's not already assigned
    const organizerToAdd = availableOrganizers.find(name => 
      !organizers.some(org => org.organizers?.name === name)
    );
    
    if (organizerToAdd) {
      console.log('➕ Adding organizer:', organizerToAdd);
      
      // This would require the organizer ID, so we'll just show the structure
      console.log('📝 To add an organizer, you would POST to:');
      console.log(`   /api/events/${grandRound.id}/organizers`);
      console.log('   Body: { "organizer_id": "organizer-uuid", "is_main_organizer": false }');
    } else {
      console.log('ℹ️ All test organizers are already assigned');
    }
  })
  .catch(error => {
    console.error('❌ API Test Error:', error);
  });

// Test the events_with_details view directly
console.log('\n🔍 Testing events_with_details view...');
fetch('/api/events')
  .then(response => response.json())
  .then(events => {
    const grandRounds = events.filter(event => 
      event.title && event.title.toLowerCase().includes('grand round')
    );
    
    console.log('📊 Grand Rounds with organizer data:');
    grandRounds.forEach(event => {
      console.log(`   ${event.title}:`);
      console.log(`     Main Organizer: ${event.organizer_name}`);
      console.log(`     Total Organizers: ${event.organizers?.length || 0}`);
      console.log(`     Additional Organizers: ${event.other_organizers?.length || 0}`);
      console.log(`     Organizers JSON:`, event.organizers);
    });
  })
  .catch(error => {
    console.error('❌ Events view test error:', error);
  });


