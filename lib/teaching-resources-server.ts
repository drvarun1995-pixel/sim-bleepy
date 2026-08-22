import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canAccessTeachingResources } from '@/lib/roles'
import {
  TEACHING_RESOURCES_BUCKET,
  teachingPreviewStoragePath,
} from '@/lib/teaching-resources'
import { isSafeStoragePath } from '@/lib/secure-file-access'
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

export async function signTeachingPreviewUrls(
  rows: Array<{
    id?: string | null
    file_name?: string | null
    file_type?: string | null
    file_path?: string | null
    preview_path?: string | null
  }>,
  expiresIn = 600
) {
  const pathById = new Map<string, string>()
  for (const row of rows) {
    const id = String(row.id || '')
    const path = teachingPreviewStoragePath({
      fileName: row.file_name,
      fileType: row.file_type,
      filePath: row.file_path,
      previewPath: row.preview_path,
    })
    if (!id || !path || !isSafeStoragePath(path)) continue
    pathById.set(id, path)
  }

  const uniquePaths: string[] = []
  const seenPaths: Record<string, true> = {}
  pathById.forEach((path) => {
    if (!seenPaths[path]) {
      seenPaths[path] = true
      uniquePaths.push(path)
    }
  })

  const signedByPath = new Map<string, string>()
  if (uniquePaths.length) {
    const { data } = await supabaseAdmin.storage
      .from(TEACHING_RESOURCES_BUCKET)
      .createSignedUrls(uniquePaths, expiresIn)
    for (const item of data || []) {
      const url = item.signedUrl || item.signedURL
      if (item.path && url) signedByPath.set(item.path, url)
    }
  }

  const urls: Record<string, string> = {}
  pathById.forEach((path, id) => {
    const url = signedByPath.get(path)
    if (url) urls[id] = url
  })
  return urls
}
