import { randomUUID } from 'crypto'
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

type EvidenceBundle = { v: 1; files: TeachingPortfolioEvidence[] }

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

function parseEvidenceBundle(description: string | null | undefined): TeachingPortfolioEvidence[] {
  if (!description) return []
  try {
    const parsed = JSON.parse(description) as EvidenceBundle
    if (parsed?.v === 1 && Array.isArray(parsed.files)) return parsed.files
  } catch {
    // description may be older free text
  }
  return []
}

function serializeEvidenceBundle(files: TeachingPortfolioEvidence[]): string | null {
  if (files.length === 0) return null
  return JSON.stringify({ v: 1, files } satisfies EvidenceBundle)
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
    description: serializeEvidenceBundle(files),
    updated_at: new Date().toISOString(),
  }
}

export function evidenceFromEntry(entry: {
  id: string
  description?: string | null
  filename?: string | null
  original_filename?: string | null
  file_size?: number | null
  file_type?: string | null
  mime_type?: string | null
  file_path?: string | null
  created_at?: string
}): TeachingPortfolioEvidence[] {
  const fromJson = parseEvidenceBundle(entry.description)
  if (fromJson.length > 0) return fromJson
  if (entry.file_path) {
    return [
      {
        id: entry.id,
        entry_id: entry.id,
        filename: entry.filename || 'evidence',
        original_filename: entry.original_filename || null,
        file_size: entry.file_size || 0,
        file_type: entry.file_type || null,
        mime_type: entry.mime_type || null,
        file_path: entry.file_path,
        created_at: entry.created_at || new Date().toISOString(),
      },
    ]
  }
  return []
}

export function withEvidence(entries: TeachingPortfolioEntry[]): TeachingPortfolioEntry[] {
  return entries.map((entry) => ({
    ...entry,
    evidence: evidenceFromEntry(entry),
  }))
}

export async function appendEvidenceToEntry(params: {
  entry: TeachingPortfolioEntry
  userId: string
  files: StoredEvidenceFile[]
}): Promise<TeachingPortfolioEvidence[]> {
  const existing = evidenceFromEntry(params.entry)
  const added: TeachingPortfolioEvidence[] = params.files.map((file) => ({
    id: randomUUID(),
    entry_id: params.entry.id,
    filename: file.filename,
    original_filename: file.original_filename,
    file_size: file.file_size,
    file_type: file.file_type,
    mime_type: file.mime_type,
    file_path: file.file_path,
    created_at: new Date().toISOString(),
  }))
  const next = [...existing, ...added]
  const { error } = await supabaseAdmin
    .from('teaching_portfolio_files')
    .update(primaryFields(next))
    .eq('id', params.entry.id)
    .eq('user_id', params.userId)
  if (error) throw error
  return added
}

export async function replaceEntryEvidence(params: {
  entryId: string
  userId: string
  files: TeachingPortfolioEvidence[]
}) {
  const { error } = await supabaseAdmin
    .from('teaching_portfolio_files')
    .update(primaryFields(params.files))
    .eq('id', params.entryId)
    .eq('user_id', params.userId)
  if (error) throw error
}

export async function findEvidenceForUser(
  userId: string,
  evidenceId: string
): Promise<{ entry: TeachingPortfolioEntry; file: TeachingPortfolioEvidence } | null> {
  const { data, error } = await supabaseAdmin
    .from('teaching_portfolio_files')
    .select('*')
    .eq('user_id', userId)
  if (error || !data) return null
  for (const entry of data as TeachingPortfolioEntry[]) {
    const file = evidenceFromEntry(entry).find((row) => row.id === evidenceId)
    if (file) return { entry, file }
  }
  return null
}

export async function removeStoragePaths(paths: string[]) {
  const unique = Array.from(new Set(paths.filter(Boolean)))
  if (unique.length === 0) return
  const { error } = await supabaseAdmin.storage.from('teaching-portfolio').remove(unique)
  if (error) console.error('Storage delete error:', error)
}
