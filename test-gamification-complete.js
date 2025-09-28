// Complete gamification test script
// Run this in your browser console after completing a scenario

console.log('🚀 Starting Complete Gamification Test...');

// Test 1: Check if user exists in database
async function testUserExists() {
  try {
    console.log('👤 Testing user existence...');
    const response = await fetch('/api/user/stats');
    const data = await response.json();
    
    if (data.stats) {
      console.log('✅ User exists in database');
      console.log('📊 User stats:', data.stats);
      return true;
    } else {
      console.log('❌ User not found in database');
      return false;
    }
  } catch (error) {
    console.error('❌ User check failed:', error);
    return false;
  }
}

// Test 2: Check gamification API
async function testGamificationAPI() {
  try {
    console.log('📡 Testing gamification API...');
    const response = await fetch('/api/user/gamification');
    const data = await response.json();
    
    console.log('📊 Gamification API Response:', data);
    
    if (data.error) {
      console.error('❌ Gamification API Error:', data.error);
      return false;
    } else {
      console.log('✅ Gamification API working');
      return true;
    }
  } catch (error) {
    console.error('❌ Gamification API failed:', error);
    return false;
  }
}

// Test 3: Check if gamification functions exist in database
async function testDatabaseFunctions() {
  try {
    console.log('🗄️ Testing database functions...');
    
    // This would require a direct database call, which we can't do from the browser
    // Instead, we'll check if the API returns proper data
    const response = await fetch('/api/user/gamification');
    const data = await response.json();
    
    if (data.gamification && data.gamification.level) {
      console.log('✅ Database functions appear to be working');
      console.log('📊 Current level:', data.gamification.level.current_level);
      console.log('📊 Total XP:', data.gamification.level.total_xp);
      return true;
    } else {
      console.log('❌ Database functions may not be working');
      return false;
    }
  } catch (error) {
    console.error('❌ Database function test failed:', error);
    return false;
  }
}

// Test 4: Simulate scenario completion
async function testScenarioCompletion() {
  try {
    console.log('🎮 Testing scenario completion...');
    
    // This simulates what happens when a scenario is completed
    const testData = {
      attemptId: 'test-attempt-' + Date.now(),
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
    
    console.log('📤 Sending test scenario completion:', testData);
    
    const response = await fetch('/api/attempts', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('📥 Scenario completion response:', result);
    
    if (response.ok) {
      console.log('✅ Scenario completion test passed');
      return true;
    } else {
      console.log('❌ Scenario completion test failed:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Scenario completion test error:', error);
    return false;
  }
}

// Test 5: Check for console logs during scenario completion
function checkConsoleLogs() {
  console.log('🔍 Checking for gamification console logs...');
  console.log('📝 When you complete a scenario, look for these messages:');
  console.log('   - "🎮 Starting gamification rewards process..."');
  console.log('   - "🎯 Gamification data:"');
  console.log('   - "🏆 Awarding scenario XP..."');
  console.log('   - "✅ Gamification rewards completed successfully!"');
  console.log('   - "❌ Error in gamification rewards:"');
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Running Complete Gamification Test Suite...');
  console.log('='.repeat(50));
  
  const results = {
    userExists: await testUserExists(),
    gamificationAPI: await testGamificationAPI(),
    databaseFunctions: await testDatabaseFunctions(),
    scenarioCompletion: await testScenarioCompletion()
  };
  
  console.log('='.repeat(50));
  console.log('📊 Test Results:');
  console.log('👤 User exists:', results.userExists ? '✅' : '❌');
  console.log('📡 Gamification API:', results.gamificationAPI ? '✅' : '❌');
  console.log('🗄️ Database functions:', results.databaseFunctions ? '✅' : '❌');
  console.log('🎮 Scenario completion:', results.scenarioCompletion ? '✅' : '❌');
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('🎉 All tests passed! Gamification system should be working.');
  } else {
    console.log('⚠️ Some tests failed. Check the issues above.');
  }
  
  checkConsoleLogs();
  
  return results;
}

// Run the tests
runAllTests();

