import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('🎮 Setting up gamification tables...')

    // Create user_levels table
    const { error: levelsError } = await supabaseAdmin
      .from('user_levels')
      .select('id')
      .limit(1)

    if (levelsError && levelsError.code === '42P01') {
      // Table doesn't exist, create it
      console.log('Creating user_levels table...')
      // We'll need to use raw SQL for table creation
      const createLevelsSQL = `
        CREATE TABLE user_levels (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          current_level INTEGER NOT NULL DEFAULT 1,
          total_xp INTEGER NOT NULL DEFAULT 0,
          level_progress DECIMAL(5,2) NOT NULL DEFAULT 0.00,
          title VARCHAR(50) DEFAULT 'Medical Student',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `
      
      // For now, let's just return success and let the user apply the schema manually
      return NextResponse.json({ 
        success: false,
        message: 'Gamification tables need to be created manually. Please run the create-gamification-schema-safe.sql file in your Supabase SQL editor.',
        instructions: [
          '1. Go to your Supabase project dashboard',
          '2. Navigate to the SQL Editor',
          '3. Copy and paste the contents of create-gamification-schema-safe.sql',
          '4. Run the SQL script'
        ]
      })
    }

    // Check if gamification functions exist
    const { data: functions, error: functionsError } = await supabaseAdmin
      .rpc('award_xp', { 
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_xp_amount: 0,
        p_transaction_type: 'test'
      })

    if (functionsError && functionsError.code === '42883') {
      return NextResponse.json({ 
        success: false,
        message: 'Gamification functions not found. Please apply the gamification schema first.',
        instructions: [
          '1. Go to your Supabase project dashboard',
          '2. Navigate to the SQL Editor', 
          '3. Copy and paste the contents of create-gamification-schema-safe.sql',
          '4. Run the SQL script'
        ]
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Gamification system is properly set up!'
    })

  } catch (error) {
    console.error('Error checking gamification setup:', error)
    return NextResponse.json({ 
      error: 'Failed to check gamification setup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
