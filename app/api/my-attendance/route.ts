import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all QR scans for this user with event details
    const { data: scans, error: scansError } = await supabaseAdmin
      .from('qr_code_scans')
      .select(`
        id,
        scanned_at,
        scan_success,
        qr_code_id,
        event_qr_codes!inner(
          event_id,
          events!inner(
            id,
            title,
            description,
            date,
            start_time,
            end_time,
            event_status,
            location_id,
            organizer_id,
            format_id,
            hide_location,
            hide_organizer,
            locations:event_locations(
              locations(
                id,
                name,
                address
              )
            ),
            organizers:event_organizers(
              organizers(
                id,
                name
              )
            ),
            formats(
              id,
              name
            ),
            speakers:event_speakers(
              speakers(
                id,
                name,
                role
              )
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('scan_success', true)
      .order('scanned_at', { ascending: false });

    if (scansError) {
      console.error('Error fetching attendance:', scansError);
      return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
    }

    // Transform the data to a more usable format
    const attendanceRecords = (scans || []).map((scan: any) => {
      const event = scan.event_qr_codes?.events;
      if (!event) return null;

      // Extract locations
      const locations = event.locations?.map((el: any) => ({
        id: el.locations?.id,
        name: el.locations?.name,
        address: el.locations?.address
      })).filter((l: any) => l.id) || [];

      // Extract organizers
      const organizers = event.organizers?.map((eo: any) => ({
        id: eo.organizers?.id,
        name: eo.organizers?.name
      })).filter((o: any) => o.id) || [];

      // Extract speakers
      const speakers = event.speakers?.map((es: any) => ({
        id: es.speakers?.id,
        name: es.speakers?.name,
        role: es.speakers?.role
      })).filter((s: any) => s.id) || [];

      return {
        scanId: scan.id,
        scannedAt: scan.scanned_at,
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date,
          startTime: event.start_time,
          endTime: event.end_time,
          eventStatus: event.event_status,
          format: event.formats ? {
            id: event.formats.id,
            name: event.formats.name
          } : null,
          locations: locations,
          organizers: organizers,
          speakers: speakers,
          hideLocation: event.hide_location,
          hideOrganizer: event.hide_organizer
        }
      };
    }).filter((record: any) => record !== null);

    return NextResponse.json({
      attendanceRecords,
      totalRecords: attendanceRecords.length
    });
  } catch (error) {
    console.error('Error in my-attendance API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

