// =====================================================
// FRONTEND ORGANIZERS DEBUG SCRIPT
// =====================================================
// Run this in your browser console to debug organizers
// =====================================================

console.log('🔍 Debugging Organizers in Frontend...');

// 1. Check what events are being loaded
fetch('/api/events')
  .then(response => response.json())
  .then(events => {
    console.log('📊 Total events loaded:', events.length);
    
    // Find Grand Round events
    const grandRounds = events.filter(event => 
      event.title && event.title.toLowerCase().includes('grand round')
    );
    
    console.log('🎯 Grand Round events found:', grandRounds.length);
    
    grandRounds.forEach((event, index) => {
      console.log(`\n📅 Event ${index + 1}: ${event.title}`);
      console.log('   Main Organizer:', event.organizer_name || 'None');
      console.log('   Other Organizers:', event.other_organizers || 'None');
      console.log('   Combined Organizers:', event.organizers || 'None');
      console.log('   All Organizers Array:', event.allOrganizers || 'None');
    });
    
    // Check if any events have additional organizers
    const eventsWithAdditional = events.filter(event => 
      event.other_organizers && 
      Array.isArray(event.other_organizers) && 
      event.other_organizers.length > 0
    );
    
    console.log('\n✅ Events with additional organizers:', eventsWithAdditional.length);
    
    if (eventsWithAdditional.length > 0) {
      console.log('🎉 Found events with additional organizers!');
      eventsWithAdditional.forEach(event => {
        console.log(`   ${event.title}: ${event.other_organizers.length} additional organizers`);
      });
    } else {
      console.log('❌ No events found with additional organizers');
    }
  })
  .catch(error => {
    console.error('❌ Error fetching events:', error);
  });

// 2. Check the events_with_details view directly
console.log('\n🔍 Checking events_with_details view...');
fetch('/api/events')
  .then(response => response.json())
  .then(events => {
    const sampleEvent = events[0];
    if (sampleEvent) {
      console.log('📋 Sample event structure:');
      console.log('   Available fields:', Object.keys(sampleEvent));
      console.log('   Organizer fields:', {
        organizer_name: sampleEvent.organizer_name,
        other_organizers: sampleEvent.other_organizers,
        organizers: sampleEvent.organizers,
        allOrganizers: sampleEvent.allOrganizers
      });
    }
  })
  .catch(error => {
    console.error('❌ Error checking event structure:', error);
  });


