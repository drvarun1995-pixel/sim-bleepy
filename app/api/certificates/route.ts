import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userRole = user.role
    if (!['admin', 'meded_team', 'ctf'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get certificates with related data
    const { data: certificates, error } = await supabaseAdmin
      .from('certificates')
      .select(`
        *,
        events (title, date, location_id, locations (name)),
        users!certificates_user_id_fkey (name, email),
        generated_by_user:users!certificates_generated_by_fkey (name)
      `)
      .order('generated_at', { ascending: false })

    if (error) {
      console.error('Error fetching certificates:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, certificates: certificates || [] }, { status: 200 })

  } catch (error) {
    console.error('Error in GET /api/certificates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the certificate data from the request
    const certificateData = await request.json()

    // Validate required fields
    if (!certificateData.user_id || !certificateData.event_id || !certificateData.certificate_id || !certificateData.certificate_path) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, event_id, certificate_id, certificate_path' },
        { status: 400 }
      )
    }

    // Insert the certificate
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .insert([{
        user_id: certificateData.user_id,
        event_id: certificateData.event_id,
        certificate_id: certificateData.certificate_id,
        certificate_path: certificateData.certificate_path,
        generated_by: session.user.id,
        generated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error inserting certificate:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, certificate: data }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/certificates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}








