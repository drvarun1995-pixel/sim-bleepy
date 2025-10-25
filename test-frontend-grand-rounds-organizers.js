// Browser console script to test Grand Rounds organizers on frontend
// Run this in the browser console on your events page

console.log('🔍 Testing Grand Rounds organizers on frontend...');

// 1. Test the API endpoint directly
fetch('/api/events')
  .then(response => response.json())
  .then(data => {
    console.log('📊 API Response:', data);
    
    // Filter for Grand Rounds events
    const grandRounds = data.filter(event => 
      event.title.toLowerCase().includes('grand round')
    );
    
    console.log(`🎯 Found ${grandRounds.length} Grand Rounds events`);
    
    // Check each Grand Rounds event for organizers
    grandRounds.forEach((event, index) => {
      console.log(`\n📅 Event ${index + 1}: ${event.title}`);
      console.log(`📅 Date: ${event.date}`);
      console.log(`👤 Main Organizer: ${event.organizer_name || 'None'}`);
      console.log(`👥 Additional Organizers:`, event.organizers || []);
      console.log(`🔗 All Organizers:`, event.organizers || []);
      
      // Check if organizers array has data
      if (event.organizers && event.organizers.length > 0) {
        console.log(`✅ Has ${event.organizers.length} organizers`);
        event.organizers.forEach((org, i) => {
          console.log(`   ${i + 1}. ${org.name} (ID: ${org.id})`);
        });
      } else {
        console.log(`❌ No organizers found`);
      }
    });
    
    // Summary
    const withOrganizers = grandRounds.filter(event => 
      event.organizers && event.organizers.length > 0
    );
    
    console.log(`\n📈 Summary:`);
    console.log(`Total Grand Rounds: ${grandRounds.length}`);
    console.log(`With Organizers: ${withOrganizers.length}`);
    console.log(`Without Organizers: ${grandRounds.length - withOrganizers.length}`);
    
  })
  .catch(error => {
    console.error('❌ Error fetching events:', error);
  });

// 2. Test the frontend transformation
console.log('\n🔍 Testing frontend transformation...');

// This will test if the frontend is correctly building allOrganizers
setTimeout(() => {
  // Check if events are loaded in the DOM
  const eventElements = document.querySelectorAll('[data-event-id]');
  console.log(`📊 Found ${eventElements.length} event elements in DOM`);
  
  // Look for organizer display in the UI
  const organizerElements = document.querySelectorAll('[class*="organizer"], [class*="UserCircle"]');
  console.log(`👥 Found ${organizerElements.length} organizer elements in UI`);
  
  // Check for Grand Rounds specific elements
  const grandRoundsElements = document.querySelectorAll('[class*="grand"], [class*="round"]');
  console.log(`🎯 Found ${grandRoundsElements.length} Grand Rounds elements in UI`);
}, 2000);