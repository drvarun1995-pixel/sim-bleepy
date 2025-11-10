import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ensureUserAvatar, loadAvatarLibrary, resolveLibrarySelection, pickDeterministicAvatar } from '@/lib/avatars'
import { ensureUserSlug } from '@/lib/profiles'
import { sendAdminMededTeamProfileNotification } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id, email, name, role, university, year, created_at,
        role_type, study_year, foundation_year, hospital_trust, specialty,
        profile_completed, interests, onboarding_completed_at,
        profile_skipped_at, last_profile_prompt, show_all_events,
        profile_picture_url, profile_picture_updated_at, about_me, tagline,
        is_public, public_display_name, allow_messages, public_slug,
        avatar_type, avatar_asset, avatar_thumbnail
      `)
      .eq('email', session.user.email)
      .single()

    if (userError) {
      console.error('Error fetching user profile:', userError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('pause_connection_requests, email_notifications, show_all_events')
      .eq('user_id', user.id)
      .maybeSingle()

    const isMededTeamProfile = user.role_type === 'meded_team'

    let showAllEvents = user.show_all_events || false

    if (isMededTeamProfile && !showAllEvents) {
      try {
        const { error: showAllUpdateError } = await supabase
          .from('users')
          .update({ show_all_events: true, updated_at: new Date().toISOString() })
          .eq('id', user.id)

        if (showAllUpdateError) {
          console.error('Failed to auto-enable show_all_events for MedEd Team profile:', showAllUpdateError)
        } else {
          showAllEvents = true
        }
      } catch (autoEnableError) {
        console.error('Unexpected error auto-enabling show_all_events for MedEd Team profile:', autoEnableError)
      }
    }

    const avatarLibrary = await loadAvatarLibrary(supabase)
    const publicSlug = await ensureUserSlug(
      supabase,
      user.id,
      user.name,
      user.public_slug
    )
    const derivedAvatarType = user.avatar_type ?? (user.profile_picture_url ? 'upload' : null)
    const derivedAvatarAsset = user.avatar_asset ?? user.profile_picture_url ?? null

    const ensuredAvatar = await ensureUserAvatar(
      supabase,
      user.id,
      derivedAvatarType,
      derivedAvatarAsset,
      avatarLibrary
    )

    const avatarType = ensuredAvatar?.avatar_type ?? derivedAvatarType ?? 'library'
    const avatarAsset = ensuredAvatar?.avatar_asset ?? derivedAvatarAsset ?? null
    const avatarThumbnail = user.avatar_thumbnail ?? null

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role || 'student',
        university: user.university || '',
        year: user.year || '',
        createdAt: user.created_at,
        // New onboarding fields
        role_type: user.role_type,
        study_year: user.study_year,
        foundation_year: user.foundation_year,
        hospital_trust: user.hospital_trust,
        specialty: user.specialty,
        profile_completed: user.profile_completed || false,
        interests: user.interests || [],
        onboarding_completed_at: user.onboarding_completed_at,
        profile_skipped_at: user.profile_skipped_at,
        last_profile_prompt: user.last_profile_prompt,
        show_all_events: showAllEvents,
        // Profile picture and bio fields
        profile_picture_url: user.profile_picture_url,
        profile_picture_updated_at: user.profile_picture_updated_at,
        about_me: user.about_me,
        tagline: user.tagline,
        is_public: user.is_public || false,
        public_display_name: user.public_display_name || null,
        allow_messages: user.allow_messages ?? true,
        public_slug: publicSlug ?? user.public_slug,
        avatar_type: avatarType,
        avatar_asset: avatarAsset,
        avatar_thumbnail: avatarThumbnail,
        pause_connection_requests: preferences?.pause_connection_requests ?? false,
      },
      avatarLibrary: avatarLibrary.map((option) => ({
        slug: option.slug,
        file_path: option.file_path,
        display_name: option.display_name || null
      }))
    })

  } catch (error) {
    console.error('Error in GET /api/user/profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      university,
      year,
      role_type,
      study_year,
      foundation_year,
      hospital_trust,
      specialty,
      interests,
      profile_completed,
      onboarding_completed_at,
      show_all_events,
      about_me,
      tagline,
      pause_connection_requests,
    } = body

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select(`
        id, name, role_type, is_public, public_display_name, allow_messages,
        avatar_type, avatar_asset, avatar_thumbnail, public_slug, profile_picture_url
      `)
      .eq('email', session.user.email)
      .single()

    if (currentUserError || !currentUser) {
      console.error('Error fetching current user for profile update:', currentUserError)
      return NextResponse.json({ error: 'Failed to load current profile' }, { status: 500 })
    }

    const avatarLibrary = await loadAvatarLibrary(supabase)

    const { data: currentPreferences } = await supabase
      .from('user_preferences')
      .select('pause_connection_requests')
      .eq('user_id', currentUser.id)
      .maybeSingle()

    // Build update object (only include provided fields)
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    const sanitizeString = (value: any) => {
      if (typeof value !== 'string') return null
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : null
    }

    const nextRoleType = role_type ?? currentUser.role_type

    if (name !== undefined) updateData.name = sanitizeString(name)

    if (university !== undefined) updateData.university = sanitizeString(university)
    if (year !== undefined) updateData.year = year || null
    if (role_type !== undefined) updateData.role_type = role_type || null
    if (study_year !== undefined) updateData.study_year = study_year || null
    if (foundation_year !== undefined) updateData.foundation_year = foundation_year || null
    if (hospital_trust !== undefined) updateData.hospital_trust = sanitizeString(hospital_trust)
    if (specialty !== undefined) updateData.specialty = sanitizeString(specialty)
    if (interests !== undefined) updateData.interests = interests || null
    if (profile_completed !== undefined) updateData.profile_completed = profile_completed
    if (onboarding_completed_at !== undefined) updateData.onboarding_completed_at = onboarding_completed_at
    if (nextRoleType === 'meded_team') {
      updateData.show_all_events = true
    } else if (show_all_events !== undefined) {
      updateData.show_all_events = show_all_events
    }
    if (about_me !== undefined) updateData.about_me = sanitizeString(about_me)
    if (tagline !== undefined) updateData.tagline = sanitizeString(tagline)

    if (body.is_public !== undefined) {
      updateData.is_public = !!body.is_public
    }

    if (body.allow_messages !== undefined) {
      updateData.allow_messages = !!body.allow_messages
    }

    if (body.public_display_name !== undefined) {
      const desiredDisplayName = sanitizeString(body.public_display_name)
      const nextIsPublic = body.is_public !== undefined ? !!body.is_public : currentUser.is_public

      if (nextIsPublic && !desiredDisplayName) {
        return NextResponse.json({ error: 'Public display name is required for public profiles.' }, { status: 400 })
      }

      if (desiredDisplayName && desiredDisplayName !== currentUser.public_display_name) {
        const { data: conflict } = await supabase
          .from('users')
          .select('id')
          .eq('public_display_name', desiredDisplayName)
          .eq('is_public', true)
          .neq('id', currentUser.id)
          .limit(1)

        if (conflict && conflict.length > 0) {
          return NextResponse.json(
            { error: 'That display name is already taken. Please choose another one.' },
            { status: 409 }
          )
        }
      }

      updateData.public_display_name = desiredDisplayName
    }

    if (body.use_default_avatar) {
      const choice = pickDeterministicAvatar(currentUser.id, avatarLibrary)
      if (choice) {
        updateData.avatar_type = 'library'
        updateData.avatar_asset = choice.file_path
        updateData.avatar_thumbnail = choice.file_path
      }
    } else if (body.avatar_type) {
      const requestedType = String(body.avatar_type)
      if (!['library', 'upload'].includes(requestedType)) {
        return NextResponse.json({ error: 'Invalid avatar type.' }, { status: 400 })
      }

      if (requestedType === 'library') {
        const selection = resolveLibrarySelection(
          avatarLibrary,
          body.avatar_slug || body.avatar_asset
        )

        if (!selection) {
          return NextResponse.json({ error: 'Invalid avatar selection.' }, { status: 400 })
        }

        updateData.avatar_type = 'library'
        updateData.avatar_asset = selection.file_path
        updateData.avatar_thumbnail = selection.file_path
      } else if (requestedType === 'upload') {
        const uploadPath = sanitizeString(body.avatar_asset)
        if (uploadPath) {
          updateData.avatar_type = 'library'
          updateData.avatar_asset = uploadPath
          updateData.avatar_thumbnail = uploadPath
        }
      }
    } else if (body.avatar_asset !== undefined) {
      // Allow explicit clearing or reassignment when type not provided
      const asset = sanitizeString(body.avatar_asset)
      updateData.avatar_asset = asset
      updateData.avatar_thumbnail = asset
    }

    if (pause_connection_requests !== undefined) {
      const preferenceUpdate = {
        user_id: currentUser.id,
        pause_connection_requests: Boolean(pause_connection_requests),
        updated_at: new Date().toISOString(),
      }

      const { error: prefsError } = await supabase
        .from('user_preferences')
        .upsert(preferenceUpdate, { onConflict: 'user_id' })

      if (prefsError) {
        console.error('Failed to update pause connection preference:', prefsError)
      }
    }

    // Note: profile_completed is stored in the users table, not user_preferences
    // The profile_completed field is handled in the main user update above
    // Removed the user_preferences update as that column doesn't exist there

    // Update user profile (role is not updated to prevent privilege escalation)
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('email', session.user.email)
      .select(`
        id, email, name, role, university, year, created_at,
        role_type, study_year, foundation_year, hospital_trust, specialty,
        profile_completed, interests, onboarding_completed_at,
        show_all_events, profile_picture_url, profile_picture_updated_at,
        about_me, tagline,
        is_public, public_display_name, allow_messages,
        avatar_type, avatar_asset, public_slug
      `)
      .single()

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    if (
      currentUser.avatar_type === 'upload' &&
      updatedUser.avatar_type !== 'upload'
    ) {
      try {
        const { data: files } = await supabase.storage
          .from('profile-pictures')
          .list(currentUser.id)

        if (files && files.length > 0) {
          const filesToDelete = files.map((f) => `${currentUser.id}/${f.name}`)
          await supabase.storage.from('profile-pictures').remove(filesToDelete)
        }
      } catch (storageError) {
        console.error('Failed to delete previous profile picture:', storageError)
      }
    }

    const publicSlug =
      (await ensureUserSlug(
        supabase,
        currentUser.id,
        updatedUser.name,
        currentUser.public_slug
      )) ?? currentUser.public_slug ?? updatedUser.public_slug ?? null

    if (
      body.role_type === 'meded_team' &&
      currentUser.role_type !== 'meded_team'
    ) {
      sendAdminMededTeamProfileNotification({
        userName: updatedUser.name || session.user.name || session.user.email || 'Unknown user',
        userEmail: session.user.email || 'unknown@user',
        publicSlug,
      }).catch((emailError) => {
        console.error('Failed to send MedEd team profile notification:', emailError)
      })
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        ...updatedUser,
        public_slug: publicSlug,
        show_all_events: nextRoleType === 'meded_team' ? true : updatedUser.show_all_events || false,
        pause_connection_requests:
          pause_connection_requests !== undefined
            ? Boolean(pause_connection_requests)
            : currentPreferences?.pause_connection_requests ?? false,
      }
    })

  } catch (error) {
    console.error('Error in PUT /api/user/profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
