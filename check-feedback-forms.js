const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkFeedbackForms() {
  console.log('🔍 Checking feedback_forms table structure and data...\n')

  try {
    // 1. Check table structure
    console.log('📋 Table Structure:')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'feedback_forms')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    if (columnsError) {
      console.error('❌ Error fetching table structure:', columnsError)
    } else {
      console.table(columns)
    }

    console.log('\n📊 Current Data:')
    // 2. Check current data
    const { data: forms, error: formsError } = await supabase
      .from('feedback_forms')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (formsError) {
      console.error('❌ Error fetching feedback forms:', formsError)
    } else {
      console.log(`Found ${forms?.length || 0} feedback forms:`)
      console.table(forms)
    }

    console.log('\n🎯 Events with booking_enabled=true:')
    // 3. Check events that should be available for feedback forms
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, date, booking_enabled, status')
      .eq('booking_enabled', true)
      .eq('status', 'published')
      .order('date', { ascending: false })
      .limit(10)

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError)
    } else {
      console.log(`Found ${events?.length || 0} events with booking enabled:`)
      console.table(events)
    }

    console.log('\n👤 Users table:')
    // 4. Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .limit(5)

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
    } else {
      console.log(`Found ${users?.length || 0} users:`)
      console.table(users)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkFeedbackForms()
