const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testGamificationFunctions() {
  console.log('🔍 Testing gamification functions...');
  
  try {
    // Test if award_xp function exists
    console.log('Testing award_xp function...');
    const { data: awardXpData, error: awardXpError } = await supabase.rpc('award_xp', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_xp_amount: 0,
      p_transaction_type: 'test',
      p_source_id: null,
      p_source_type: null,
      p_description: 'Test function call'
    });
    
    if (awardXpError) {
      console.log('❌ award_xp function error:', awardXpError.message);
      console.log('❌ Error code:', awardXpError.code);
    } else {
      console.log('✅ award_xp function exists and works');
    }
    
    // Test if check_achievements function exists
    console.log('Testing check_achievements function...');
    const { data: checkAchievementsData, error: checkAchievementsError } = await supabase.rpc('check_achievements', {
      p_user_id: '00000000-0000-0000-0000-000000000000'
    });
    
    if (checkAchievementsError) {
      console.log('❌ check_achievements function error:', checkAchievementsError.message);
      console.log('❌ Error code:', checkAchievementsError.code);
    } else {
      console.log('✅ check_achievements function exists and works');
    }
    
    // Check if gamification tables exist
    console.log('Checking gamification tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('user_levels')
      .select('*')
      .limit(1);
    
    if (tablesError) {
      console.log('❌ user_levels table error:', tablesError.message);
    } else {
      console.log('✅ user_levels table exists');
    }
    
  } catch (error) {
    console.error('❌ Error testing functions:', error);
  }
}

testGamificationFunctions();
