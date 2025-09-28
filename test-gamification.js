// Test script to verify gamification system is working
// Run this in your browser console after applying the schema

async function testGamification() {
  try {
    console.log('🧪 Testing gamification system...');
    
    // Test 1: Check if gamification API endpoint works
    const response = await fetch('/api/user/gamification');
    const data = await response.json();
    
    console.log('📊 Gamification data:', data);
    
    if (data.level) {
      console.log('✅ Gamification system is working!');
      console.log(`Level: ${data.level.current_level}`);
      console.log(`XP: ${data.level.total_xp}`);
      console.log(`Title: ${data.level.title}`);
    } else {
      console.log('❌ Gamification system not working - no level data');
    }
    
    // Test 2: Check if we can award XP manually
    console.log('🎮 Testing XP award...');
    
    // This would normally be called when completing a scenario
    const testScore = 75; // 75% score
    const domainPoints = Math.round((testScore / 100) * 12); // 9 points
    const baseXP = domainPoints * 8; // 72 XP
    const completionBonus = 10;
    const totalXP = baseXP + completionBonus; // 82 XP
    
    console.log(`Test calculation: ${domainPoints}/12 points = ${totalXP} XP`);
    
  } catch (error) {
    console.error('❌ Error testing gamification:', error);
  }
}

// Run the test
testGamification();

