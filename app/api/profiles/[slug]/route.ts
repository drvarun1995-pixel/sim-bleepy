import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { buildPublicProfilePayload, canViewProfile } from '@/lib/profiles'
import { fetchExistingConnection } from '@/lib/connections'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slugParam = params.slug?.toLowerCase()

    if (!slugParam) {
      return NextResponse.json({ error: 'Profile slug is required.' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)

    let viewerId = session?.user?.id ?? null
    let viewerRole = session?.user?.role ?? null
    let viewerEmail = session?.user?.email ?? null

    if ((!viewerId || !viewerRole) && viewerEmail) {
      const { data: viewerRecord, error: viewerRecordError } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .eq('email', viewerEmail)
        .maybeSingle()

      if (!viewerRecordError && viewerRecord) {
        viewerId = viewerId ?? viewerRecord.id
        viewerRole = viewerRole ?? viewerRecord.role
      }
    }

    const { data: record, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        public_slug,
        name,
        public_display_name,
        is_public,
        allow_messages,
        profile_picture_url,
        avatar_type,
        avatar_asset,
        avatar_thumbnail,
        created_at,
        role,
        role_type,
        university,
        study_year,
        foundation_year,
        hospital_trust,
        specialty,
        tagline,
        about_me,
        interests
      `)
      .eq('public_slug', slugParam)
      .maybeSingle()

    if (error) {
      console.error('Error loading public profile:', error)
      return NextResponse.json({ error: 'Failed to load profile.' }, { status: 500 })
    }

    if (!record) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
    }

    const connection = viewerId
      ? await fetchExistingConnection(viewerId, record.id, 'friend').then(async friendConnection => {
          if (friendConnection) return friendConnection
          return fetchExistingConnection(viewerId!, record.id, 'mentor')
        })
      : null

    let activeConnection = connection

    let relationshipStatus: {
      status: 'none' | 'self' | 'anonymous' | 'connected' | 'incoming-request' | 'outgoing-request' | 'snoozed' | 'blocked' | 'declined'
      connectionId?: string
      initiatedByViewer?: boolean
      connectionType?: string
      snoozedUntil?: string | null
    } = { status: 'none' }

    if (activeConnection && activeConnection.status === 'declined') {
      if (viewerId && activeConnection.requester_id === viewerId) {
        relationshipStatus = {
          status: 'declined',
          connectionId: activeConnection.id,
          initiatedByViewer: true,
          connectionType: activeConnection.connection_type,
        }
      } else {
        activeConnection = null
      }
    }

    const viewerIsConnection = Boolean(activeConnection && activeConnection.status === 'accepted')

    const viewerContext = {
      id: viewerId,
      role: viewerRole,
    }

    const isVisible = canViewProfile(record, viewerContext, { viewerIsConnection })

    if (!isVisible) {
      return NextResponse.json(
        {
          error: 'Profile is private.',
          profile: {
            slug: record.public_slug,
            isPublic: Boolean(record.is_public),
          },
        },
        { status: 403 }
      )
    }

    const payload = buildPublicProfilePayload(record, viewerContext, { viewerIsConnection })

    let relationship = relationshipStatus.status !== 'none' ? relationshipStatus : { status: viewerId ? 'none' : 'anonymous' }

    if (viewerId && viewerId === record.id) {
      relationship = { status: 'self' }
    } else if (viewerId && activeConnection) {
      if (activeConnection.status === 'accepted') {
        relationship = {
          status: 'connected',
          connectionId: activeConnection.id,
          connectionType: activeConnection.connection_type,
          initiatedByViewer: activeConnection.requester_id === viewerId,
        }
      } else if (activeConnection.status === 'pending') {
        relationship = {
          status: activeConnection.requester_id === viewerId ? 'outgoing-request' : 'incoming-request',
          connectionId: activeConnection.id,
          connectionType: activeConnection.connection_type,
          initiatedByViewer: activeConnection.requester_id === viewerId,
        }
      } else if (activeConnection.status === 'snoozed') {
        relationship = {
          status: 'snoozed',
          connectionId: activeConnection.id,
          connectionType: activeConnection.connection_type,
          initiatedByViewer: activeConnection.requester_id === viewerId,
          snoozedUntil: activeConnection.snoozed_until ?? null,
        }
      } else if (activeConnection.status === 'blocked') {
        relationship = {
          status: 'blocked',
          connectionId: activeConnection.id,
          connectionType: activeConnection.connection_type,
          initiatedByViewer: activeConnection.requester_id === viewerId,
        }
      }
    }

    const { data: targetPreferences } = await supabaseAdmin
      .from('user_preferences')
      .select('pause_connection_requests')
      .eq('user_id', record.id)
      .maybeSingle()

    return NextResponse.json({
      profile: payload.profile,
      viewer: payload.viewer,
      relationship,
      preferences: {
        pauseConnectionRequests: targetPreferences?.pause_connection_requests ?? false,
      },
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/profiles/[slug]:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}


