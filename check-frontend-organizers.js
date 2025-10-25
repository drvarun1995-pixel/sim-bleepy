// =====================================================
// CHECK FRONTEND FOR GRAND ROUNDS ADDITIONAL ORGANIZERS
// =====================================================
// Run this in your browser console to check organizers
// =====================================================

console.log('🔍 Checking Grand Rounds for Additional Organizers...');

fetch('/api/events')
  .then(response => response.json())
  .then(events => {
    // Filter for Grand Rounds
    const grandRounds = events.filter(event => 
      event.title && event.title.toLowerCase().includes('grand round')
    );
    
    console.log(`📊 Found ${grandRounds.length} Grand Round events`);
    
    if (grandRounds.length === 0) {
      console.log('❌ No Grand Round events found');
      return;
    }
    
    // Check each Grand Round
    grandRounds.forEach((event, index) => {
      console.log(`\n📅 Grand Round ${index + 1}: ${event.title}`);
      console.log(`   Date: ${event.date}`);
      console.log(`   Main Organizer: ${event.organizer_name || 'None'}`);
      
      // Check organizers field
      if (event.organizers && Array.isArray(event.organizers)) {
        console.log(`   Total Organizers: ${event.organizers.length}`);
        console.log(`   Organizers:`, event.organizers);
        
        // Check for additional organizers
        const additionalOrganizers = event.organizers.filter(org => !org.is_main);
        console.log(`   Additional Organizers: ${additionalOrganizers.length}`);
        
        if (additionalOrganizers.length > 0) {
          console.log('   ✅ HAS ADDITIONAL ORGANIZERS:', additionalOrganizers.map(org => org.name));
        } else {
          console.log('   ❌ NO ADDITIONAL ORGANIZERS');
        }
      } else {
        console.log('   ❌ No organizers data found');
      }
      
      // Check other_organizers field
      if (event.other_organizers && Array.isArray(event.other_organizers)) {
        console.log(`   Other Organizers: ${event.other_organizers.length}`);
        if (event.other_organizers.length > 0) {
          console.log('   ✅ HAS OTHER ORGANIZERS:', event.other_organizers.map(org => org.name));
        }
      }
      
      // Check allOrganizers field (from frontend transformation)
      if (event.allOrganizers && Array.isArray(event.allOrganizers)) {
        console.log(`   All Organizers: ${event.allOrganizers.length}`);
        console.log('   All Organizers Names:', event.allOrganizers);
      }
    });
    
    // Summary
    const eventsWithAdditional = grandRounds.filter(event => {
      if (event.organizers && Array.isArray(event.organizers)) {
        return event.organizers.some(org => !org.is_main);
      }
      return false;
    });
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total Grand Rounds: ${grandRounds.length}`);
    console.log(`   With Additional Organizers: ${eventsWithAdditional.length}`);
    console.log(`   Without Additional Organizers: ${grandRounds.length - eventsWithAdditional.length}`);
    
    if (eventsWithAdditional.length > 0) {
      console.log('\n✅ Grand Rounds WITH additional organizers:');
      eventsWithAdditional.forEach(event => {
        const additional = event.organizers.filter(org => !org.is_main);
        console.log(`   ${event.title}: ${additional.map(org => org.name).join(', ')}`);
      });
    }
    
    if (grandRounds.length - eventsWithAdditional.length > 0) {
      console.log('\n❌ Grand Rounds WITHOUT additional organizers:');
      grandRounds.filter(event => {
        if (event.organizers && Array.isArray(event.organizers)) {
          return !event.organizers.some(org => !org.is_main);
        }
        return true;
      }).forEach(event => {
        console.log(`   ${event.title}`);
      });
    }
  })
  .catch(error => {
    console.error('❌ Error checking organizers:', error);
  });


