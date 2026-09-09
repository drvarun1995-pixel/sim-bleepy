import { supabaseAdmin } from '@/utils/supabase'
import {
  TEACHING_PORTFOLIO_MAX_FILE_SIZE,
  isAllowedTeachingPortfolioFile,
  type TeachingEntryKind,
  type TeachingPortfolioEntry,
  type TeachingPortfolioEvidence,
} from '@/lib/teaching-portfolio'

export type StoredEvidenceFile = {
  filename: string
  original_filename: string
  file_size: number
  file_type: string
  mime_type: string
  file_path: string
}

export async function storeTeachingEvidenceFile(
  userName: string,
  kind: TeachingEntryKind,
  file: File
): Promise<{ stored: StoredEvidenceFile } | { error: string; status: number }> {
  if (file.size > TEACHING_PORTFOLIO_MAX_FILE_SIZE) {
    return { error: 'File size exceeds 25MB limit', status: 400 }
  }
  if (!isAllowedTeachingPortfolioFile(file)) {
    return { error: 'File type not supported', status: 400 }
  }

  const sanitizedUserName = userName.replace(/[^a-zA-Z0-9-_]/g, '_')
  const fileExtension = file.name.split('.').pop() || 'bin'
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`
  const storagePath = `${sanitizedUserName}/${kind}/${filename}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await supabaseAdmin.storage
    .from('teaching-portfolio')
    .upload(storagePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return { error: 'Failed to upload file to storage', status: 500 }
  }

  return {
    stored: {
      filename,
      original_filename: file.name,
      file_size: file.size,
      file_type: fileExtension,
      mime_type: file.type,
      file_path: storagePath,
    },
  }
}

function primaryFields(files: TeachingPortfolioEvidence[]) {
  const first = files[0]
  return {
    filename: first?.filename || null,
    original_filename: first?.original_filename || null,
    file_size: first?.file_size || 0,
    file_type: first?.file_type || null,
    mime_type: first?.mime_type || null,
    file_path: first?.file_path || null,
    evidence_type: first ? 'document' : null,
    updated_at: new Date().toISOString(),
  }
}

export async function listEvidenceForEntries(
  userId: string,
  entryIds: string[]
): Promise<Map<string, TeachingPortfolioEvidence[]>> {
  const map = new Map<string, TeachingPortfolioEvidence[]>()
  if (entryIds.length === 0) return map

  const { data, error } = await supabaseAdmin
    .from('teaching_portfolio_evidence')
    .select('*')
    .eq('user_id', userId)
    .in('entry_id', entryIds)
    .order('created_at', { ascending: true })

  if (error) throw error

  for (const row of (data || []) as TeachingPortfolioEvidence[]) {
    const list = map.get(row.entry_id) || []
    list.push(row)
    map.set(row.entry_id, list)
  }
  return map
}

export async function withEvidence(
  userId: string,
  entries: TeachingPortfolioEntry[]
): Promise<TeachingPortfolioEntry[]> {
  const map = await listEvidenceForEntries(
    userId,
    entries.map((entry) => entry.id)
  )
  return entries.map((entry) => ({
    ...entry,
    evidence: map.get(entry.id) || [],
  }))
}

export async function countEvidenceForEntry(userId: string, entryId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('teaching_portfolio_evidence')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('entry_id', entryId)

  if (error) throw error
  return count || 0
}

export async function listEvidencePathsForEntry(userId: string, entryId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('teaching_portfolio_evidence')
    .select('file_path')
    .eq('user_id', userId)
    .eq('entry_id', entryId)

  if (error) throw error
  return (data || []).map((row) => row.file_path).filter(Boolean)
}

export async function syncEntryPrimaryEvidence(entryId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from('teaching_portfolio_evidence')
    .select('*')
    .eq('entry_id', entryId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error

  const { error: updateError } = await supabaseAdmin
    .from('teaching_portfolio_files')
    .update(primaryFields((data || []) as TeachingPortfolioEvidence[]))
    .eq('id', entryId)
    .eq('user_id', userId)

  if (updateError) throw updateError
}

export async function insertEvidenceRows(params: {
  entryId: string
  userId: string
  files: StoredEvidenceFile[]
}): Promise<TeachingPortfolioEvidence[]> {
  if (params.files.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('teaching_portfolio_evidence')
    .insert(
      params.files.map((file) => ({
        entry_id: params.entryId,
        user_id: params.userId,
        filename: file.filename,
        original_filename: file.original_filename,
        file_size: file.file_size,
        file_type: file.file_type,
        mime_type: file.mime_type,
        file_path: file.file_path,
      }))
    )
    .select()

  if (error) throw error
  await syncEntryPrimaryEvidence(params.entryId, params.userId)
  return (data || []) as TeachingPortfolioEvidence[]
}

export async function findEvidenceForUser(
  userId: string,
  evidenceId: string
): Promise<{ entry: TeachingPortfolioEntry; file: TeachingPortfolioEvidence } | null> {
  const { data: file, error } = await supabaseAdmin
    .from('teaching_portfolio_evidence')
    .select('*')
    .eq('id', evidenceId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !file) return null

  const { data: entry, error: entryError } = await supabaseAdmin
    .from('teaching_portfolio_files')
    .select('*')
    .eq('id', file.entry_id)
    .eq('user_id', userId)
    .maybeSingle()

  if (entryError || !entry) return null
  return { entry: entry as TeachingPortfolioEntry, file: file as TeachingPortfolioEvidence }
}

export async function deleteEvidenceForUser(userId: string, evidenceId: string) {
  const found = await findEvidenceForUser(userId, evidenceId)
  if (!found) return null

  const { error } = await supabaseAdmin
    .from('teaching_portfolio_evidence')
    .delete()
    .eq('id', evidenceId)
    .eq('user_id', userId)

  if (error) throw error
  await syncEntryPrimaryEvidence(found.entry.id, userId)
  await removeStoragePaths([found.file.file_path])
  return found
}

export async function removeStoragePaths(paths: string[]) {
  const unique = Array.from(new Set(paths.filter(Boolean)))
  if (unique.length === 0) return
  const { error } = await supabaseAdmin.storage.from('teaching-portfolio').remove(unique)
  if (error) console.error('Storage delete error:', error)
}
