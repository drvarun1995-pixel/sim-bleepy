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

    // Get user details from database to get the proper user ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get certificates for this specific user
    const { data: certificates, error } = await supabaseAdmin
      .from('certificates')
      .select(`
        *,
        events (title, date, location_id, locations (name)),
        users!certificates_user_id_fkey (name, email),
        generated_by_user:users!certificates_generated_by_fkey (name)
      `)
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })

    if (error) {
      console.error('Error fetching user certificates:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, certificates: certificates || [] }, { status: 200 })

  } catch (error) {
    console.error('Error in GET /api/certificates/my:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}







