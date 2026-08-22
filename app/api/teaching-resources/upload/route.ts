import { NextRequest, NextResponse } from 'next/server'
import {
  ensureTeachingResourcesBucket,
  getTeachingResourcesActor,
} from '@/lib/teaching-resources-server'
import {
  DEFAULT_TEACHING_LICENSE_NOTE,
  DEFAULT_TEACHING_LICENSE_SOURCE,
  TEACHING_RESOURCES_BUCKET,
  TEACHING_RESOURCES_MAX_FILE_BYTES,
  TEACHING_RESOURCES_MAX_PREVIEW_BYTES,
  CANVA_TEMPLATE_FILE_NAME,
  CANVA_TEMPLATE_FILE_TYPE,
  isAllowedPreviewImage,
  isAllowedTeachingFile,
  isTeachingResourceCategory,
  parseCanvaTemplateUrl,
  parseTeachingTags,
  teachingResourceMimeType,
} from '@/lib/teaching-resources'
import { createTeachingPreviewJpeg } from '@/lib/teaching-resource-preview-image'
import { applyFileSecurityHeaders, isSafeStoragePath } from '@/lib/secure-file-access'
import { supabaseAdmin } from '@/utils/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function uniqueStorageName(originalName: string) {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'bin'
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getTeachingResourcesActor()
    if (actor.error || !actor.profile) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: actor.error || 'Unauthorized' }, { status: actor.status || 401 })
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const title = String(formData.get('title') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const category = String(formData.get('category') || '').trim()
    const tags = parseTeachingTags(String(formData.get('tags') || ''))
    const licenseSource = String(formData.get('licenseSource') || DEFAULT_TEACHING_LICENSE_SOURCE).trim() || DEFAULT_TEACHING_LICENSE_SOURCE
    const licenseNote = String(formData.get('licenseNote') || DEFAULT_TEACHING_LICENSE_NOTE).trim() || DEFAULT_TEACHING_LICENSE_NOTE
    const sourceUrl = String(formData.get('sourceUrl') || '').trim()
    const previewFile = formData.get('preview')

    const canvaUrl = parseCanvaTemplateUrl(sourceUrl)
    const isCanvaLinkOnly = category === 'graphic-templates' && !!canvaUrl && !(file instanceof File)

    if (!title || !isTeachingResourceCategory(category) || (!(file instanceof File) && !isCanvaLinkOnly)) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Title, category, and file are required' }, { status: 400 })
      )
    }

    if (file instanceof File && !isAllowedTeachingFile(category, file.name)) {
      return applyFileSecurityHeaders(
        NextResponse.json(
          { error: 'That file type is not allowed for this category' },
          { status: 400 }
        )
      )
    }

    if (file instanceof File && file.size > TEACHING_RESOURCES_MAX_FILE_BYTES) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 })
      )
    }

    if (isCanvaLinkOnly && (!(previewFile instanceof File) || previewFile.size === 0)) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Canva templates need a preview image' }, { status: 400 })
      )
    }

    if (previewFile instanceof File && previewFile.size > 0) {
      if (!isAllowedPreviewImage(previewFile.name)) {
        return applyFileSecurityHeaders(
          NextResponse.json({ error: 'Preview must be a JPG, PNG, WEBP, or GIF' }, { status: 400 })
        )
      }
      if (previewFile.size > TEACHING_RESOURCES_MAX_PREVIEW_BYTES) {
        return applyFileSecurityHeaders(
          NextResponse.json({ error: 'Preview image must be under 8MB' }, { status: 400 })
        )
      }
    }

    await ensureTeachingResourcesBucket()

    let filePath = ''
    let contentType = CANVA_TEMPLATE_FILE_TYPE
    let storedFileName = CANVA_TEMPLATE_FILE_NAME
    let storedFileSize = 0

    let fileBuffer: Buffer | null = null
    if (file instanceof File) {
      filePath = `${category}/${uniqueStorageName(file.name)}`
      if (!isSafeStoragePath(filePath)) {
        return applyFileSecurityHeaders(
          NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
        )
      }

      contentType = teachingResourceMimeType(file.name, file.type)
      storedFileName = file.name
      storedFileSize = file.size
      fileBuffer = Buffer.from(await file.arrayBuffer())
      const { error: uploadError } = await supabaseAdmin.storage
        .from(TEACHING_RESOURCES_BUCKET)
        .upload(filePath, fileBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType,
        })

      if (uploadError) {
        console.error('Teaching resource upload error:', uploadError)
        return applyFileSecurityHeaders(
          NextResponse.json({ error: 'Failed to upload file: ' + uploadError.message }, { status: 500 })
        )
      }
    }

    let previewPath: string | null = null
    if (previewFile instanceof File && previewFile.size > 0) {
      previewPath = `${category}/previews/${uniqueStorageName(previewFile.name)}`
      const { error: previewError } = await supabaseAdmin.storage
        .from(TEACHING_RESOURCES_BUCKET)
        .upload(previewPath, await previewFile.arrayBuffer(), {
          cacheControl: '3600',
          upsert: false,
          contentType: teachingResourceMimeType(previewFile.name, previewFile.type),
        })

      if (previewError) {
        if (filePath) {
          await supabaseAdmin.storage.from(TEACHING_RESOURCES_BUCKET).remove([filePath])
        }
        return applyFileSecurityHeaders(
          NextResponse.json(
            { error: 'Failed to upload preview: ' + previewError.message },
            { status: 500 }
          )
        )
      }
    }

    if (!previewPath && fileBuffer && isAllowedTeachingFile('photos', storedFileName)) {
      try {
        const previewBuffer = await createTeachingPreviewJpeg(fileBuffer)
        previewPath = `${category}/previews/${uniqueStorageName('preview.jpg')}`
        const { error: generatedPreviewError } = await supabaseAdmin.storage
          .from(TEACHING_RESOURCES_BUCKET)
          .upload(previewPath, previewBuffer, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/jpeg',
          })
        if (generatedPreviewError) {
          previewPath = null
        }
      } catch (error) {
        console.error('Teaching resource preview generation error:', error)
        previewPath = null
      }
    }

    const { data: resource, error: dbError } = await supabaseAdmin
      .from('teaching_resources')
      .insert({
        title,
        description: description || null,
        category,
        file_name: storedFileName,
        file_path: filePath,
        file_url: canvaUrl || `private://${filePath}`,
        file_size: storedFileSize,
        file_type: contentType,
        preview_path: previewPath,
        tags,
        tags_text: tags.join(' '),
        license_source: licenseSource,
        license_note: licenseNote,
        source_url: canvaUrl || sourceUrl || null,
        uploaded_by: actor.profile.id,
        uploaded_by_name: actor.profile.name,
      })
      .select('id, title, category')
      .single()

    if (dbError || !resource) {
      const paths = [filePath, previewPath].filter(Boolean) as string[]
      if (paths.length) {
        await supabaseAdmin.storage.from(TEACHING_RESOURCES_BUCKET).remove(paths)
      }
      console.error('Teaching resource metadata error:', dbError)
      const missing = /teaching_resources|schema cache|does not exist/i.test(dbError?.message || '')
      return applyFileSecurityHeaders(
        NextResponse.json(
          {
            error: missing
              ? 'Teaching resources are not set up yet. Run migrations/create-teaching-resources-system.sql in Supabase.'
              : 'Failed to save resource metadata',
          },
          { status: 500 }
        )
      )
    }

    return applyFileSecurityHeaders(
      NextResponse.json({ success: true, resource }, { status: 201 })
    )
  } catch (error) {
    console.error('Teaching resource upload error:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
