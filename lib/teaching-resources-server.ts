import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canAccessTeachingResources } from '@/lib/roles'
import { TEACHING_RESOURCES_BUCKET } from '@/lib/teaching-resources'
import { supabaseAdmin } from '@/utils/supabase'

export type TeachingResourcesProfile = {
  id: string
  role: string
  email: string
  name?: string | null
}

export async function getTeachingResourcesActor(): Promise<
  | { profile: TeachingResourcesProfile; error?: undefined; status?: undefined }
  | { profile?: undefined; error: string; status: number }
> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return { error: 'Unauthorized', status: 401 }
  }

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('id, role, email, name')
    .eq('email', session.user.email)
    .single()

  if (!profile || !canAccessTeachingResources(profile.role)) {
    return {
      error: 'This library is only available to CTFs, MedEd, educators, and admins.',
      status: 403,
    }
  }

  return {
    profile: {
      id: profile.id,
      role: profile.role,
      email: profile.email || session.user.email,
      name: profile.name || session.user.name || session.user.email,
    },
  }
}

export function canEditTeachingResource(
  role: string,
  uploadedBy: string | null,
  actorId: string
) {
  if (role === 'admin' || role === 'meded_team') return true
  return !!uploadedBy && uploadedBy === actorId
}

export async function ensureTeachingResourcesBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  if (buckets?.some((bucket) => bucket.id === TEACHING_RESOURCES_BUCKET)) {
    return
  }

  const { error } = await supabaseAdmin.storage.createBucket(TEACHING_RESOURCES_BUCKET, {
    public: false,
    fileSizeLimit: 52_428_800,
  })

  if (error && !/already exists/i.test(error.message)) {
    throw error
  }
}
