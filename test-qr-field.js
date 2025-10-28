const { createClient } = require('@supabase/supabase-js');

async function testQrField() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔍 Testing QR attendance field...');
    
    // Test 1: Check if field exists in events table
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('id, title, qr_attendance_enabled, booking_enabled')
      .limit(3);
    
    if (eventsError) {
      console.log('❌ Error querying events table:', eventsError.message);
    } else {
      console.log('✅ Events table query successful');
      console.log('Sample events data:', eventsData);
    }
    
    // Test 2: Check if field exists in events_with_details view
    const { data: viewData, error: viewError } = await supabase
      .from('events_with_details')
      .select('id, title, qr_attendance_enabled, booking_enabled')
      .limit(3);
    
    if (viewError) {
      console.log('❌ Error querying events_with_details view:', viewError.message);
    } else {
      console.log('✅ Events_with_details view query successful');
      console.log('Sample view data:', viewData);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testQrField();
