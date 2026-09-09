import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { requireTeachingPortfolioUser } from '@/lib/teaching-portfolio-access'
import {
  TEACHING_PORTFOLIO_MAX_FILES,
  type TeachingEntryKind,
} from '@/lib/teaching-portfolio'
import {
  countEvidenceForEntry,
  insertEvidenceRows,
  storeTeachingEvidenceFile,
  withEvidence,
  type StoredEvidenceFile,
} from '@/lib/teaching-portfolio-server'

export const dynamic = 'force-dynamic'

const TAUGHT_TO = new Set(['medical_students', 'foundation_year', 'postgraduates', 'mixed', 'other'])
const LEARNING_TYPES = new Set(['course', 'conference', 'workshop', 'e-learning', 'other'])

function asKind(value: FormDataEntryValue | null): TeachingEntryKind | null {
  return value === 'taught' || value === 'learnt' ? value : null
}

function optionalText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function filesFromForm(formData: FormData): File[] {
  return formData
    .getAll('file')
    .concat(formData.getAll('files'))
    .filter((value): value is File => value instanceof File && value.size > 0)
}

async function storeMany(
  userName: string,
  kind: TeachingEntryKind,
  files: File[]
): Promise<{ stored: StoredEvidenceFile[] } | { error: NextResponse }> {
  const stored: StoredEvidenceFile[] = []
  for (const file of files) {
    const result = await storeTeachingEvidenceFile(userName, kind, file)
    if ('error' in result) {
      return { error: NextResponse.json({ error: result.error }, { status: result.status }) }
    }
    stored.push(result.stored)
  }
  return { stored }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireTeachingPortfolioUser()
    if (access.error) return access.error

    const formData = await request.formData()
    const entryId = optionalText(formData.get('entryId'))
    const uploadedFiles = filesFromForm(formData)
    const userName = access.session.user.name || access.session.user.email?.split('@')[0] || 'user'
    const userId = access.session.user.id

    if (entryId) {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('teaching_portfolio_files')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', userId)
        .single()

      if (fetchError || !existing) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
      }
      if (uploadedFiles.length === 0) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      const already = await countEvidenceForEntry(userId, entryId)
      if (already + uploadedFiles.length > TEACHING_PORTFOLIO_MAX_FILES) {
        return NextResponse.json(
          { error: `You can attach up to ${TEACHING_PORTFOLIO_MAX_FILES} files per entry` },
          { status: 400 }
        )
      }

      const kind = existing.entry_kind === 'learnt' ? 'learnt' : 'taught'
      const stored = await storeMany(userName, kind, uploadedFiles)
      if ('error' in stored) return stored.error

      const evidence = await insertEvidenceRows({
        entryId,
        userId,
        files: stored.stored,
      })
      return NextResponse.json({ success: true, evidence }, { status: 200 })
    }

    const entryKind = asKind(formData.get('entryKind'))
    const sessionTitle = optionalText(formData.get('sessionTitle'))
    const activityDate = optionalText(formData.get('activityDate'))
    const sessionTime = optionalText(formData.get('sessionTime'))
    const taughtTo = optionalText(formData.get('taughtTo'))
    const learningType = optionalText(formData.get('learningType'))
    const provider = optionalText(formData.get('provider'))

    if (!entryKind) {
      return NextResponse.json({ error: 'Entry type is required' }, { status: 400 })
    }
    if (!sessionTitle) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!activityDate) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }
    if (entryKind === 'taught' && (!taughtTo || !TAUGHT_TO.has(taughtTo))) {
      return NextResponse.json({ error: 'Taught to is required' }, { status: 400 })
    }
    if (entryKind === 'learnt' && learningType && !LEARNING_TYPES.has(learningType)) {
      return NextResponse.json({ error: 'Invalid learning type' }, { status: 400 })
    }
    if (uploadedFiles.length > TEACHING_PORTFOLIO_MAX_FILES) {
      return NextResponse.json(
        { error: `You can attach up to ${TEACHING_PORTFOLIO_MAX_FILES} files per entry` },
        { status: 400 }
      )
    }

    let storedFiles: StoredEvidenceFile[] = []
    if (uploadedFiles.length > 0) {
      const stored = await storeMany(userName, entryKind, uploadedFiles)
      if ('error' in stored) return stored.error
      storedFiles = stored.stored
    }

    const { data, error } = await supabaseAdmin
      .from('teaching_portfolio_files')
      .insert({
        user_id: userId,
        display_name: sessionTitle,
        category: 'others',
        activity_date: activityDate,
        entry_kind: entryKind,
        session_title: sessionTitle,
        session_time: sessionTime,
        taught_to: entryKind === 'taught' ? taughtTo : null,
        learning_type: entryKind === 'learnt' ? learningType : null,
        provider: entryKind === 'learnt' ? provider : null,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save entry', details: error.message, code: error.code },
        { status: 500 }
      )
    }

    if (storedFiles.length > 0) {
      await insertEvidenceRows({
        entryId: data.id,
        userId,
        files: storedFiles,
      })
    }

    const [entry] = await withEvidence(userId, [data])
    return NextResponse.json({ success: true, file: entry }, { status: 200 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
