// Comprehensive gamification debug test
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testGamificationSystem() {
  console.log('🔍 Testing gamification system...');
  console.log('Environment check:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
  
  try {
    // 1. Check if gamification tables exist
    console.log('\n📊 Checking gamification tables...');
    
    const tables = ['user_levels', 'achievements', 'user_achievements', 'user_streaks', 'xp_transactions'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: exists`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
    // 2. Check if gamification functions exist
    console.log('\n🔧 Checking gamification functions...');
    
    // Test award_xp function
    try {
      const { data, error } = await supabase.rpc('award_xp', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_xp_amount: 0,
        p_transaction_type: 'test',
        p_source_id: null,
        p_source_type: null,
        p_description: 'Test function call'
      });
      
      if (error) {
        console.log('❌ award_xp function:', error.message);
        console.log('   Code:', error.code);
        console.log('   Hint:', error.hint);
      } else {
        console.log('✅ award_xp function: exists and works');
      }
    } catch (err) {
      console.log('❌ award_xp function error:', err.message);
    }
    
    // Test check_achievements function
    try {
      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: '00000000-0000-0000-0000-000000000000'
      });
      
      if (error) {
        console.log('❌ check_achievements function:', error.message);
        console.log('   Code:', error.code);
        console.log('   Hint:', error.hint);
      } else {
        console.log('✅ check_achievements function: exists and works');
      }
    } catch (err) {
      console.log('❌ check_achievements function error:', err.message);
    }
    
    // 3. Check if there are any users in the database
    console.log('\n👥 Checking users...');
    try {
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email, name')
        .limit(5);
      
      if (userError) {
        console.log('❌ Users table error:', userError.message);
      } else {
        console.log(`✅ Found ${users.length} users`);
        users.forEach(user => {
          console.log(`   - ${user.email} (${user.name})`);
        });
      }
    } catch (err) {
      console.log('❌ Users check error:', err.message);
    }
    
    // 4. Check if there are any attempts
    console.log('\n📝 Checking attempts...');
    try {
      const { data: attempts, error: attemptError } = await supabase
        .from('attempts')
        .select('id, user_id, station_slug, scores, overall_band, created_at')
        .limit(5);
      
      if (attemptError) {
        console.log('❌ Attempts table error:', attemptError.message);
      } else {
        console.log(`✅ Found ${attempts.length} attempts`);
        attempts.forEach(attempt => {
          console.log(`   - Station: ${attempt.station_slug}, Scores: ${JSON.stringify(attempt.scores)}, Band: ${attempt.overall_band}`);
        });
      }
    } catch (err) {
      console.log('❌ Attempts check error:', err.message);
    }
    
    // 5. Check user levels
    console.log('\n🎮 Checking user levels...');
    try {
      const { data: levels, error: levelError } = await supabase
        .from('user_levels')
        .select('*')
        .limit(5);
      
      if (levelError) {
        console.log('❌ User levels error:', levelError.message);
      } else {
        console.log(`✅ Found ${levels.length} user levels`);
        levels.forEach(level => {
          console.log(`   - User: ${level.user_id}, Level: ${level.current_level}, XP: ${level.total_xp}`);
        });
      }
    } catch (err) {
      console.log('❌ User levels check error:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Error in gamification test:', error);
  }
}

testGamificationSystem();
