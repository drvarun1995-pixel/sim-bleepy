// Test script to check Grand Rounds organizers via API
// Run this in browser console or as a separate test

console.log('🔍 Testing Grand Rounds organizers via API...');

// Test the events API endpoint
async function testGrandRoundsOrganizers() {
  try {
    const response = await fetch('/api/events');
    const events = await response.json();
    
    console.log('📊 Total events received:', events.length);
    
    // Filter for Grand Rounds
    const grandRounds = events.filter(event => 
      event.title.toLowerCase().includes('grand round')
    );
    
    console.log(`🎯 Grand Rounds events found: ${grandRounds.length}`);
    
    // Analyze each Grand Rounds event
    const analysis = grandRounds.map(event => ({
      id: event.id,
      title: event.title,
      date: event.date,
      mainOrganizer: event.organizer_name,
      additionalOrganizers: event.organizers || [],
      hasAdditionalOrganizers: (event.organizers && event.organizers.length > 0),
      organizerCount: event.organizers ? event.organizers.length : 0
    }));
    
    console.log('📋 Analysis Results:');
    analysis.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.title}`);
      console.log(`   Date: ${item.date}`);
      console.log(`   Main: ${item.mainOrganizer || 'None'}`);
      console.log(`   Additional: ${item.organizerCount} organizers`);
      console.log(`   Status: ${item.hasAdditionalOrganizers ? '✅ Has organizers' : '❌ No organizers'}`);
    });
    
    // Summary statistics
    const withOrganizers = analysis.filter(item => item.hasAdditionalOrganizers);
    const withoutOrganizers = analysis.filter(item => !item.hasAdditionalOrganizers);
    
    console.log('\n📈 Summary:');
    console.log(`Total Grand Rounds: ${analysis.length}`);
    console.log(`With Additional Organizers: ${withOrganizers.length}`);
    console.log(`Without Additional Organizers: ${withoutOrganizers.length}`);
    
    if (withoutOrganizers.length > 0) {
      console.log('\n❌ Events without additional organizers:');
      withoutOrganizers.forEach(item => {
        console.log(`   - ${item.title} (${item.date})`);
      });
    }
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Error testing Grand Rounds organizers:', error);
    return null;
  }
}

// Run the test
testGrandRoundsOrganizers();

