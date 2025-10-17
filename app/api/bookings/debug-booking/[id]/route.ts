import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;

    // Get the booking with all columns
    const { data: booking, error } = await supabaseAdmin
      .from('event_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      return NextResponse.json({ error: 'Failed to fetch booking', details: error }, { status: 500 });
    }

    return NextResponse.json({ 
      booking,
      columns: booking ? Object.keys(booking) : [],
      message: 'Booking fetched successfully'
    });

  } catch (error) {
    console.error('Error in GET /api/bookings/debug-booking/[id]:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
