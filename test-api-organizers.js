// =====================================================
// API ORGANIZERS TEST SCRIPT
// =====================================================
// Run this in your browser console to test the API directly
// =====================================================

console.log('🔍 Testing API for Organizers...');

// Test the authenticated API
fetch('/api/events')
  .then(response => {
    console.log('📡 API Response Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('📊 API Response Data:', data);
    
    if (Array.isArray(data)) {
      console.log('✅ Received array of events:', data.length);
      
      // Find Grand Round events
      const grandRounds = data.filter(event => 
        event.title && event.title.toLowerCase().includes('grand round')
      );
      
      console.log('🎯 Grand Round events in API response:', grandRounds.length);
      
      grandRounds.forEach((event, index) => {
        console.log(`\n📅 Grand Round ${index + 1}:`);
        console.log('   Title:', event.title);
        console.log('   Main Organizer:', event.organizer_name);
        console.log('   Other Organizer IDs:', event.other_organizer_ids);
        console.log('   Other Organizers:', event.other_organizers);
        console.log('   Combined Organizers:', event.organizers);
        console.log('   All Organizers:', event.allOrganizers);
      });
      
      // Check if any events have the organizers field
      const eventsWithOrganizers = data.filter(event => 
        event.organizers && Array.isArray(event.organizers) && event.organizers.length > 0
      );
      
      console.log('\n✅ Events with organizers field:', eventsWithOrganizers.length);
      
      if (eventsWithOrganizers.length > 0) {
        console.log('🎉 Found events with organizers!');
        eventsWithOrganizers.forEach(event => {
          console.log(`   ${event.title}:`, event.organizers);
        });
      }
    } else {
      console.log('❌ API returned non-array data:', data);
    }
  })
  .catch(error => {
    console.error('❌ API Error:', error);
  });


