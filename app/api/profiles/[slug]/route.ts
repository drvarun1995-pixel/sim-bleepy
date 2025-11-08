import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { buildPublicProfilePayload, canViewProfile } from '@/lib/profiles'

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
    const viewer = {
      id: session?.user?.id ?? null,
      role: session?.user?.role ?? null,
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
        created_at,
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

    const isVisible = canViewProfile(record, viewer)

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

    const payload = buildPublicProfilePayload(record, viewer)

    return NextResponse.json({
      profile: payload.profile,
      viewer: payload.viewer,
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/profiles/[slug]:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}


