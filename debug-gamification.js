// Debug script to test gamification system
// Run this in your browser console after completing a scenario

console.log('🔍 Debugging gamification system...');

// Check if gamification API is working
async function testGamificationAPI() {
  try {
    console.log('📡 Testing gamification API...');
    const response = await fetch('/api/user/gamification');
    const data = await response.json();
    
    console.log('📊 API Response:', data);
    
    if (data.error) {
      console.error('❌ API Error:', data.error);
    } else {
      console.log('✅ API working, data:', data);
    }
  } catch (error) {
    console.error('❌ API Request failed:', error);
  }
}

// Check if user exists in database
async function checkUserInDatabase() {
  try {
    console.log('👤 Checking user in database...');
    const response = await fetch('/api/user/stats');
    const data = await response.json();
    
    console.log('📊 User stats:', data);
    
    if (data.stats) {
      console.log('✅ User exists in database');
    } else {
      console.log('❌ User not found in database');
    }
  } catch (error) {
    console.error('❌ User check failed:', error);
  }
}

// Test manual XP award (this would normally happen after completing a scenario)
async function testManualXPAward() {
  try {
    console.log('🎮 Testing manual XP award...');
    
    // This simulates what happens when a scenario is completed
    const testData = {
      attemptId: 'test-attempt-id',
      endTime: new Date().toISOString(),
      duration: 300, // 5 minutes
      scores: {
        totalScore: 6,
        maxScore: 12,
        status: 'PASS'
      },
      overallBand: 'PASS',
      transcript: []
    };
    
    console.log('📤 Sending test data:', testData);
    
    const response = await fetch('/api/attempts', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('📥 Response:', result);
    
    if (response.ok) {
      console.log('✅ Manual XP test completed');
    } else {
      console.log('❌ Manual XP test failed:', result);
    }
  } catch (error) {
    console.error('❌ Manual XP test error:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting gamification debug tests...');
  
  await testGamificationAPI();
  await checkUserInDatabase();
  
  console.log('🔍 Check browser console for gamification logs when completing a scenario');
  console.log('📝 Look for messages like:');
  console.log('   - "🎮 Starting gamification rewards process..."');
  console.log('   - "🎯 Gamification data:"');
  console.log('   - "🏆 Awarding scenario XP..."');
  console.log('   - "✅ Gamification rewards completed successfully!"');
}

// Run the tests
runAllTests();

