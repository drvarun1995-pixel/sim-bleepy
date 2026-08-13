import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { requireSimulationFellowshipUser } from '@/lib/simulation-fellowship-access'
import {
  SIMULATION_FELLOWSHIP_ALLOWED_TYPES,
  SIMULATION_FELLOWSHIP_MAX_FILE_SIZE,
  SIMULATION_FELLOWSHIP_STORAGE_BUCKET,
  requirementByKey,
  simulationFellowshipStoragePath,
} from '@/lib/simulation-fellowship'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const access = await requireSimulationFellowshipUser()
    if (access.error) return access.error

    const formData = await request.formData()
    const requirementKey = String(formData.get('requirementKey') || '').trim()
    const notesRaw = formData.get('notes')
    const notes = typeof notesRaw === 'string' && notesRaw.trim() ? notesRaw.trim() : null
    const file = formData.get('file')
    const uploadedFile = file instanceof File && file.size > 0 ? file : null

    const requirement = requirementByKey(requirementKey)
    if (!requirement) {
      return NextResponse.json({ error: 'Unknown requirement' }, { status: 400 })
    }
    if (!uploadedFile) {
      return NextResponse.json({ error: 'Please attach evidence' }, { status: 400 })
    }
    if (uploadedFile.size > SIMULATION_FELLOWSHIP_MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 25MB limit' }, { status: 400 })
    }
    if (!SIMULATION_FELLOWSHIP_ALLOWED_TYPES.includes(uploadedFile.type)) {
      return NextResponse.json({ error: 'File type not supported' }, { status: 400 })
    }

    const userName = access.session.user.name || access.session.user.email?.split('@')[0] || 'user'
    const fileExtension = uploadedFile.name.split('.').pop() || 'bin'
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`
    const storagePath = simulationFellowshipStoragePath(userName, requirement.folder, filename)

    const buffer = Buffer.from(await uploadedFile.arrayBuffer())
    const { error: uploadError } = await supabaseAdmin.storage
      .from(SIMULATION_FELLOWSHIP_STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: uploadedFile.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Simulation fellowship storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file to storage', details: uploadError.message },
        { status: 500 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('simulation_fellowship_files')
      .insert({
        user_id: access.session.user.id,
        requirement_key: requirementKey,
        filename,
        original_filename: uploadedFile.name,
        file_size: uploadedFile.size,
        file_type: fileExtension,
        mime_type: uploadedFile.type,
        file_path: storagePath,
        notes,
      })
      .select()
      .single()

    if (error) {
      console.error('Simulation fellowship database error:', error)
      return NextResponse.json(
        { error: 'Failed to save file info', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, file: data }, { status: 200 })
  } catch (error) {
    console.error('Simulation fellowship upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
