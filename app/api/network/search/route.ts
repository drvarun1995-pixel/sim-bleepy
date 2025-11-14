import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { buildProfileSummary } from '@/lib/connections'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const buildInClause = (ids: string[]): string | null => {
  if (!ids.length) return null
  const unique = Array.from(new Set(ids))
  const quoted = unique.map((id) => `"${id}"`)
  return `(${quoted.join(',')})`
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const query = request.nextUrl.searchParams.get('query')?.trim() ?? ''
    if (query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: viewer, error: viewerError } = await supabase
      .from('users')
      .select('id, role, university, specialty')
      .eq('email', session.user.email)
      .single()

    if (viewerError || !viewer) {
      console.error('Failed to load viewer for search', viewerError)
      return NextResponse.json({ error: 'Unable to load current user' }, { status: 500 })
    }

    const { data: viewerConnections, error: viewerConnectionsError } = await supabase
      .from('user_connections')
      .select('requester_id, addressee_id, status')
      .or(`requester_id.eq.${viewer.id},addressee_id.eq.${viewer.id}`)

    if (viewerConnectionsError) {
      console.error('Failed to load viewer connections for search', viewerConnectionsError)
      return NextResponse.json({ error: 'Unable to load viewer connections' }, { status: 500 })
    }

    const exclusionSet = new Set<string>([viewer.id])
    const acceptedSet = new Set<string>()

    for (const connection of viewerConnections ?? []) {
      const otherId = connection.requester_id === viewer.id ? connection.addressee_id : connection.requester_id
      exclusionSet.add(otherId)
      if (connection.status === 'accepted') {
        acceptedSet.add(otherId)
      }
    }

    const { data: candidates, error: candidateError } = await supabase
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
      .or(`public_display_name.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(20)

    if (candidateError) {
      console.error('Failed to search users for connections', candidateError)
      return NextResponse.json({ error: 'Unable to search users' }, { status: 500 })
    }

    const filteredCandidates = (candidates ?? []).filter((candidate) => !exclusionSet.has(candidate.id))
    const candidateIds = filteredCandidates.map((candidate) => candidate.id)
    const candidateClause = buildInClause(candidateIds)

    const acceptedMap: Record<string, Set<string>> = {}

    if (candidateClause) {
      const { data: candidateConnections, error: candidateConnectionsError } = await supabase
        .from('user_connections')
        .select('requester_id, addressee_id, status')
        .eq('status', 'accepted')
        .or(`requester_id.in.${candidateClause},addressee_id.in.${candidateClause}`)

      if (!candidateConnectionsError) {
        for (const row of candidateConnections ?? []) {
          acceptedMap[row.requester_id] = acceptedMap[row.requester_id] ?? new Set<string>()
          acceptedMap[row.addressee_id] = acceptedMap[row.addressee_id] ?? new Set<string>()
          acceptedMap[row.requester_id].add(row.addressee_id)
          acceptedMap[row.addressee_id].add(row.requester_id)
        }
      } else {
        console.error('Failed to load accepted connections for search candidates', candidateConnectionsError)
      }
    }

    const viewerAccepted = acceptedSet

    const results = filteredCandidates.map((candidate) => {
      const candidateConnections = acceptedMap[candidate.id] ?? new Set<string>()
      let mutualCount = 0
      viewerAccepted.forEach((id) => {
        if (id !== viewer.id && candidateConnections.has(id)) {
          mutualCount += 1
        }
      })

      return {
        ...buildProfileSummary(candidate),
        mutual_connection_count: mutualCount,
      }
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Unhandled error searching connections', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
