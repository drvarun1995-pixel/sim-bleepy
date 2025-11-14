import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import {
  ConnectionListItem,
  ConnectionRecord,
  ConnectionType,
  buildProfileSummary,
  isStaffRole,
} from '@/lib/connections'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const parseConnectionType = (value: string | null): ConnectionType | 'all' => {
  if (value === 'friend' || value === 'mentor') return value
  return 'all'
}

const parseStatusFilter = (value: string | null): 'pending' | 'accepted' | 'blocked' | 'all' => {
  if (value === 'pending' || value === 'accepted' || value === 'blocked') return value
  return 'all'
}

const buildExclusionList = (ids: string[]): string | null => {
  if (!ids.length) return null
  const unique = Array.from(new Set(ids))
  const quoted = unique.map(id => `"${id}"`)
  return `(${quoted.join(',')})`
}

const buildMutualCounts = (
  viewerId: string,
  connections: ConnectionRecord[],
  acceptedMap: Record<string, Set<string>>
) => {
  const viewerSet = acceptedMap[viewerId] ?? new Set<string>()

  return connections.map((connection) => {
    const counterpartId = connection.requester_id === viewerId
      ? connection.addressee_id
      : connection.requester_id

    const otherSet = acceptedMap[counterpartId] ?? new Set<string>()
    const mutual: string[] = []

    viewerSet.forEach((id) => {
      if (id !== viewerId && id !== counterpartId && otherSet.has(id)) {
        mutual.push(id)
      }
    })

    return {
      connectionId: connection.id,
      mutualIds: mutual.slice(0, 10),
      mutualCount: mutual.length,
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: viewer, error: viewerError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        role_type,
        university,
        specialty,
        public_display_name,
        public_slug,
        avatar_type,
        avatar_asset,
        avatar_thumbnail,
        profile_picture_url,
        profile_picture_updated_at,
        is_public,
        allow_messages
      `)
      .eq('email', session.user.email)
      .single()

    if (viewerError || !viewer) {
      console.error('Failed to load viewer for connections', viewerError)
      return NextResponse.json({ error: 'Unable to load current user' }, { status: 500 })
    }

    const viewerIsStaff = isStaffRole(viewer.role)

    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('pause_connection_requests, email_notifications')
      .eq('user_id', viewer.id)
      .maybeSingle()

    if (prefError) {
      console.error('Failed to load viewer preferences', prefError)
    }

    const searchParams = request.nextUrl.searchParams
    const typeFilter = parseConnectionType(searchParams.get('type'))
    const statusFilter = parseStatusFilter(searchParams.get('status'))
    const searchQuery = searchParams.get('q')?.trim().toLowerCase() ?? ''

    const connectionSelect = `
      id,
      requester_id,
      addressee_id,
      connection_type,
      status,
      initiated_by_requester,
      requested_at,
      responded_at,
      snoozed_until,
      notes,
      requester:users!user_connections_requester_id_fkey (
        id,
        name,
        public_display_name,
        public_slug,
        is_public,
        allow_messages,
        avatar_type,
        avatar_asset,
        avatar_thumbnail,
        profile_picture_url,
        profile_picture_updated_at,
        role,
        role_type,
        university,
        specialty
      ),
      addressee:users!user_connections_addressee_id_fkey (
        id,
        name,
        public_display_name,
        public_slug,
        is_public,
        allow_messages,
        avatar_type,
        avatar_asset,
        avatar_thumbnail,
        profile_picture_url,
        profile_picture_updated_at,
        role,
        role_type,
        university,
        specialty
      )
    `

    let query = supabase
      .from('user_connections')
      .select(connectionSelect)
      .or(`requester_id.eq.${viewer.id},addressee_id.eq.${viewer.id}`)
      .order('requested_at', { ascending: false })

    if (typeFilter !== 'all') {
      query = query.eq('connection_type', typeFilter)
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data: rawConnections, error: connectionsError } = await query

    if (connectionsError) {
      console.error('Failed to load connections list', connectionsError)
      return NextResponse.json({ error: 'Unable to load connections' }, { status: 500 })
    }

    const connections: ConnectionRecord[] = (rawConnections ?? []) as unknown as ConnectionRecord[]

    const acceptedConnectionsIds = new Set<string>()
    const counterpartIds = new Set<string>()

    for (const connection of connections) {
      if (connection.status === 'accepted') {
        const otherId = connection.requester_id === viewer.id ? connection.addressee_id : connection.requester_id
        acceptedConnectionsIds.add(otherId)
      }
      const otherId = connection.requester_id === viewer.id ? connection.addressee_id : connection.requester_id
      counterpartIds.add(otherId)
    }

    const acceptedMap: Record<string, Set<string>> = {}

    const viewerRelated = await supabase
      .from('user_connections')
      .select('requester_id, addressee_id, status')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${viewer.id},addressee_id.eq.${viewer.id}`)

    if (!viewerRelated.error) {
      for (const entry of viewerRelated.data ?? []) {
        acceptedMap[entry.requester_id] = acceptedMap[entry.requester_id] ?? new Set<string>()
        acceptedMap[entry.addressee_id] = acceptedMap[entry.addressee_id] ?? new Set<string>()
        acceptedMap[entry.requester_id].add(entry.addressee_id)
        acceptedMap[entry.addressee_id].add(entry.requester_id)
      }
    }

    const counterpartList = Array.from(counterpartIds).filter((id) => id !== viewer.id)
    if (counterpartList.length > 0) {
      const exclusion = buildExclusionList(counterpartList)
      if (exclusion) {
        const { data: acceptedForCounterparts, error: counterpartConnectionsError } = await supabase
          .from('user_connections')
          .select('requester_id, addressee_id, status')
          .eq('status', 'accepted')
          .or(`requester_id.in.${exclusion},addressee_id.in.${exclusion}`)

        if (!counterpartConnectionsError) {
          for (const entry of acceptedForCounterparts ?? []) {
            acceptedMap[entry.requester_id] = acceptedMap[entry.requester_id] ?? new Set<string>()
            acceptedMap[entry.addressee_id] = acceptedMap[entry.addressee_id] ?? new Set<string>()
            acceptedMap[entry.requester_id].add(entry.addressee_id)
            acceptedMap[entry.addressee_id].add(entry.requester_id)
          }
        } else {
          console.error('Failed to load accepted connections for counterparts', counterpartConnectionsError)
        }
      }
    }

    const mutualInfo = buildMutualCounts(viewer.id, connections, acceptedMap)
    const mutualIndex = new Map(mutualInfo.map((entry) => [entry.connectionId, entry]))

    const transformed: ConnectionListItem[] = connections.map(connection => {
      const viewerIsRequester = connection.requester_id === viewer.id
      const counterpartProfile = viewerIsRequester
        ? (connection as any).addressee
        : (connection as any).requester

      const mutual = mutualIndex.get(connection.id)

      return {
        ...connection,
        counterpart: buildProfileSummary(counterpartProfile),
        initiated_by_viewer: viewerIsRequester,
        mutual_connection_count: mutual?.mutualCount ?? 0,
        mutual_connection_ids: mutual?.mutualIds ?? [],
      }
    })

    const filtered = searchQuery
      ? transformed.filter(item => {
          const counterpartName = item.counterpart.public_display_name || item.counterpart.name || ''
          return counterpartName.toLowerCase().includes(searchQuery)
        })
      : transformed

    const pending = filtered.filter(item => item.status === 'pending' || item.status === 'snoozed')
    const accepted = filtered.filter(item => item.status === 'accepted')
    const blocked = filtered.filter(item => item.status === 'blocked')

    const pendingIncoming = pending.filter(item => !item.initiated_by_viewer)
    const pendingOutgoing = pending.filter(item => item.initiated_by_viewer)

    const friends = accepted.filter(item => item.connection_type === 'friend')
    const mentors = accepted.filter(item => item.connection_type === 'mentor')

    const exclusionIds = buildExclusionList([
      viewer.id,
      ...transformed.map(item => item.counterpart.id),
    ])

    let suggestionQuery = supabase
      .from('users')
      .select(`
        id,
        name,
        public_display_name,
        public_slug,
        is_public,
        allow_messages,
        avatar_type,
        avatar_asset,
        avatar_thumbnail,
        profile_picture_url,
        profile_picture_updated_at,
        role,
        role_type,
        university,
        specialty
      `)
      .neq('id', viewer.id)
      .eq('is_public', true)
      .eq('allow_messages', true)
      .limit(24);

    if (exclusionIds) {
      suggestionQuery = suggestionQuery.not('id', 'in', exclusionIds)
    }

    const { data: suggestionCandidates, error: suggestionError } = await suggestionQuery

    if (suggestionError) {
      console.error('Failed to load connection suggestions', suggestionError)
    }

    const suggestionIds = (suggestionCandidates ?? []).map(candidate => candidate.id)
    const suggestionExclusion = buildExclusionList(suggestionIds)

    if (suggestionExclusion) {
      const { data: suggestionConnections, error: suggestionConnectionsError } = await supabase
        .from('user_connections')
        .select('requester_id, addressee_id, status')
        .eq('status', 'accepted')
        .or(`requester_id.in.${suggestionExclusion},addressee_id.in.${suggestionExclusion}`)

      if (!suggestionConnectionsError) {
        for (const entry of suggestionConnections ?? []) {
          acceptedMap[entry.requester_id] = acceptedMap[entry.requester_id] ?? new Set<string>()
          acceptedMap[entry.addressee_id] = acceptedMap[entry.addressee_id] ?? new Set<string>()
          acceptedMap[entry.requester_id].add(entry.addressee_id)
          acceptedMap[entry.addressee_id].add(entry.requester_id)
        }
      } else {
        console.error('Failed to load accepted connections for suggestion candidates', suggestionConnectionsError)
      }
    }

    const scoredSuggestions = (suggestionCandidates ?? []).map(candidate => {
      let score = 0
      if (candidate.university && candidate.university === viewer.university) score += 3
      if (candidate.specialty && candidate.specialty === viewer.specialty) score += 2
      if (candidate.role_type && candidate.role_type === viewer.role_type) score += 1
      if (candidate.is_public) score += 1
      if (candidate.allow_messages) score += 1
      if (acceptedConnectionsIds.has(candidate.id)) score -= 5

      const viewerConnections = acceptedMap[viewer.id] ?? new Set<string>()
      const candidateConnections = acceptedMap[candidate.id] ?? new Set<string>()
      let mutualCount = 0
      viewerConnections.forEach((id) => {
        if (id !== viewer.id && candidateConnections.has(id)) {
          mutualCount += 1
        }
      })

      return {
        profile: buildProfileSummary(candidate),
        score,
        mutualCount,
      }
    })
      .filter(item => item.score > -1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(item => ({
        ...item.profile,
        mutual_connection_count: item.mutualCount,
      }))

    const metrics = {
      pendingTotal: pending.length,
      pendingIncoming: pendingIncoming.length,
      pendingOutgoing: pendingOutgoing.length,
      friends: friends.length,
      mentors: mentors.length,
      blocked: blocked.length,
    }

    return NextResponse.json({
      viewer: {
        id: viewer.id,
        name: viewer.name,
        role: viewer.role,
        public_display_name: viewer.public_display_name,
        isStaff: viewerIsStaff,
        isPublic: viewer.is_public ?? false,
        pauseConnectionRequests: preferences?.pause_connection_requests ?? false,
      },
      metrics,
      connections: {
        pending,
        friends,
        mentors,
        blocked,
        accepted,
      },
      suggestions: scoredSuggestions,
    })
  } catch (error) {
    console.error('Unhandled error fetching connections', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
