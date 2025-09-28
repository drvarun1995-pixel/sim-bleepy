// Complete gamification test script
// Run this in your browser console after applying the SQL script

console.log('🎮 Testing complete gamification system...');

async function testGamificationSystem() {
  try {
    // 1. Test the gamification API
    console.log('📡 Testing gamification API...');
    const response = await fetch('/api/user/gamification');
    const data = await response.json();
    
    console.log('📊 Gamification API Response:', data);
    
    if (data.gamification) {
      console.log('✅ Gamification API working');
      console.log('🎮 Current level:', data.gamification.level.current_level);
      console.log('🎮 Total XP:', data.gamification.level.total_xp);
      console.log('🎮 Achievements:', data.gamification.achievements);
      console.log('🎮 Streak:', data.gamification.streak.current_streak);
    } else {
      console.log('❌ No gamification data found');
    }
    
    // 2. Test the test-gamification API
    console.log('🔧 Testing gamification system diagnostics...');
    const testResponse = await fetch('/api/test-gamification');
    const testData = await testResponse.json();
    
    console.log('📊 System Diagnostics:', testData);
    
    if (testData.success) {
      console.log('✅ Gamification system diagnostics completed');
      
      // Check tables
      console.log('📊 Tables status:');
      Object.entries(testData.tables).forEach(([table, status]) => {
        console.log(`   ${table}: ${status.exists ? '✅' : '❌'} ${status.error || 'OK'}`);
      });
      
      // Check functions
      console.log('🔧 Functions status:');
      console.log(`   award_xp: ${testData.functions.award_xp.exists ? '✅' : '❌'} ${testData.functions.award_xp.error || 'OK'}`);
      console.log(`   check_achievements: ${testData.functions.check_achievements.exists ? '✅' : '❌'} ${testData.functions.check_achievements.error || 'OK'}`);
      
      // Check data
      console.log('📊 Data status:');
      console.log(`   Users: ${testData.data.users.count} (${testData.data.users.error || 'OK'})`);
      console.log(`   Attempts: ${testData.data.attempts.count} (${testData.data.attempts.error || 'OK'})`);
      console.log(`   User Levels: ${testData.data.userLevels.count} (${testData.data.userLevels.error || 'OK'})`);
      
    } else {
      console.log('❌ Gamification system diagnostics failed:', testData.error);
    }
    
    // 3. Test manual XP award (simulate scenario completion)
    console.log('🎯 Testing manual XP award...');
    
    const manualTestData = {
      attemptId: 'test-attempt-' + Date.now(),
      endTime: new Date().toISOString(),
      duration: 300, // 5 minutes
      scores: {
        totalScore: 8,
        maxScore: 12,
        status: 'PASS'
      },
      overallBand: 'PASS',
      transcript: []
    };
    
    console.log('📤 Sending test scenario completion...');
    const attemptResponse = await fetch('/api/attempts', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(manualTestData)
    });
    
    const attemptResult = await attemptResponse.json();
    console.log('📥 Attempt response:', attemptResult);
    
    if (attemptResponse.ok) {
      console.log('✅ Test scenario completion successful');
      
      // Wait a moment and check gamification data again
      setTimeout(async () => {
        console.log('🔄 Checking gamification data after test...');
        const newResponse = await fetch('/api/user/gamification');
        const newData = await newResponse.json();
        
        if (newData.gamification) {
          console.log('📊 Updated gamification data:');
          console.log('🎮 Level:', newData.gamification.level.current_level);
          console.log('🎮 XP:', newData.gamification.level.total_xp);
          console.log('🎮 Recent XP:', newData.gamification.recentXP);
        }
      }, 2000);
      
    } else {
      console.log('❌ Test scenario completion failed:', attemptResult);
    }
    
  } catch (error) {
    console.error('❌ Error testing gamification system:', error);
  }
}

// Run the test
testGamificationSystem();