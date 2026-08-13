import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { requireTeachingPortfolioUser } from '@/lib/teaching-portfolio-access'
import {
  TEACHING_PORTFOLIO_ALLOWED_TYPES,
  TEACHING_PORTFOLIO_MAX_FILE_SIZE,
  type TeachingEntryKind,
} from '@/lib/teaching-portfolio'

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

async function storeEvidenceFile(
  userName: string,
  kind: TeachingEntryKind,
  file: File
) {
  if (file.size > TEACHING_PORTFOLIO_MAX_FILE_SIZE) {
    return { error: NextResponse.json({ error: 'File size exceeds 25MB limit' }, { status: 400 }) }
  }
  if (!TEACHING_PORTFOLIO_ALLOWED_TYPES.includes(file.type)) {
    return { error: NextResponse.json({ error: 'File type not supported' }, { status: 400 }) }
  }

  const sanitizedUserName = userName.replace(/[^a-zA-Z0-9-_]/g, '_')
  const timestamp = Date.now()
  const fileExtension = file.name.split('.').pop() || 'bin'
  const filename = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`
  const storagePath = `${sanitizedUserName}/${kind}/${filename}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await supabaseAdmin.storage
    .from('teaching-portfolio')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return {
      error: NextResponse.json(
        { error: 'Failed to upload file to storage', details: uploadError.message },
        { status: 500 }
      ),
    }
  }

  return {
    filename,
    original_filename: file.name,
    file_size: file.size,
    file_type: fileExtension,
    mime_type: file.type,
    file_path: storagePath,
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireTeachingPortfolioUser()
    if (access.error) return access.error

    const formData = await request.formData()
    const entryId = optionalText(formData.get('entryId'))
    const file = formData.get('file')
    const uploadedFile = file instanceof File && file.size > 0 ? file : null

    const userName = access.session.user.name || access.session.user.email?.split('@')[0] || 'user'

    if (entryId) {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('teaching_portfolio_files')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', access.session.user.id)
        .single()

      if (fetchError || !existing) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
      }
      if (!uploadedFile) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }
      if (existing.file_path) {
        return NextResponse.json({ error: 'Evidence already uploaded for this entry' }, { status: 400 })
      }

      const stored = await storeEvidenceFile(
        userName,
        existing.entry_kind === 'learnt' ? 'learnt' : 'taught',
        uploadedFile
      )
      if ('error' in stored) return stored.error

      const { data, error } = await supabaseAdmin
        .from('teaching_portfolio_files')
        .update({
          filename: stored.filename,
          original_filename: stored.original_filename,
          file_size: stored.file_size,
          file_type: stored.file_type,
          mime_type: stored.mime_type,
          file_path: stored.file_path,
          evidence_type: 'document',
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId)
        .eq('user_id', access.session.user.id)
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ error: 'Failed to save file info', details: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, file: data }, { status: 200 })
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

    let fileFields: Record<string, string | number | null> = {
      filename: null,
      original_filename: null,
      file_size: 0,
      file_type: null,
      mime_type: null,
      file_path: null,
      evidence_type: null,
    }

    if (uploadedFile) {
      const stored = await storeEvidenceFile(userName, entryKind, uploadedFile)
      if ('error' in stored) return stored.error
      fileFields = {
        filename: stored.filename!,
        original_filename: stored.original_filename!,
        file_size: stored.file_size!,
        file_type: stored.file_type!,
        mime_type: stored.mime_type!,
        file_path: stored.file_path!,
        evidence_type: 'document',
      }
    }

    const { data, error } = await supabaseAdmin
      .from('teaching_portfolio_files')
      .insert({
        user_id: access.session.user.id,
        display_name: sessionTitle,
        category: 'others',
        description: null,
        activity_date: activityDate,
        entry_kind: entryKind,
        session_title: sessionTitle,
        session_time: entryKind === 'taught' ? sessionTime : sessionTime,
        taught_to: entryKind === 'taught' ? taughtTo : null,
        learning_type: entryKind === 'learnt' ? learningType : null,
        provider: entryKind === 'learnt' ? provider : null,
        ...fileFields,
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

    return NextResponse.json({ success: true, file: data }, { status: 200 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
