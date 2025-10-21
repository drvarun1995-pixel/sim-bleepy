import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Helper function to extract storage path from various URL formats
function extractStoragePath(imagePath: string): string | null {
  if (!imagePath || imagePath.startsWith('data:')) {
    return null // Skip base64 data URLs
  }

  // Handle signed URLs
  if (imagePath.includes('/storage/v1/object/sign/certificates/')) {
    const urlParts = imagePath.split('/storage/v1/object/sign/certificates/')[1]
    return urlParts.split('?')[0]
  }

  // Handle public URLs
  if (imagePath.includes('/storage/v1/object/public/certificates/')) {
    return imagePath.split('/storage/v1/object/public/certificates/')[1]
  }

  // Handle direct storage paths
  if (imagePath.startsWith('template-images/')) {
    return imagePath
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create templates
    const allowedRoles = ['admin', 'meded_team', 'ctf']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only admin, meded_team, and ctf can create templates.' },
        { status: 403 }
      )
    }

    // Get the template data from the request
    const templateData = await request.json()

    // Validate required fields
    if (!templateData.name || (!templateData.background_image && !templateData.image_path) || !templateData.fields) {
      return NextResponse.json(
        { error: 'Missing required fields: name, background_image or image_path, fields' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Generate signed URL if image_path is provided and it's not already a signed URL
    let signedUrl = templateData.image_path
    if (templateData.image_path && !templateData.image_path.startsWith('http')) {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('certificates')
        .createSignedUrl(templateData.image_path, 86400) // Valid for 24 hours
      
      if (!signedUrlError && signedUrlData) {
        signedUrl = signedUrlData.signedUrl
      }
    }

    // Insert the template
    const { data, error } = await supabase
      .from('certificate_templates')
      .insert([{
        id: templateData.id || `template-${Date.now()}`,
        name: templateData.name,
        background_image: templateData.background_image, // Keep for backward compatibility
        image_path: signedUrl, // Store signed URL instead of path
        fields: templateData.fields,
        canvas_size: templateData.canvas_size || { width: 800, height: 600 },
        created_by: session.user.id
      }])
      .select()
      .single()

    if (error) {
      console.error('Error inserting template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, template: data }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/certificates/templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get templates based on user role
    let query = supabase
      .from('certificate_templates')
      .select('*')
      .order('created_at', { ascending: false })

    // If not admin, only show user's own templates
    if (session.user.role !== 'admin') {
      query = query.eq('created_by', session.user.id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, templates: data || [] }, { status: 200 })

  } catch (error) {
    console.error('Error in GET /api/certificates/templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to delete templates
    const allowedRoles = ['admin', 'meded_team', 'ctf']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only admin, meded_team, and ctf can delete templates.' },
        { status: 403 }
      )
    }

    // Get the template ID from the request
    const { templateId } = await request.json()

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if template exists and user has permission to delete it
    const { data: template, error: fetchError } = await supabase
      .from('certificate_templates')
      .select('id, created_by, image_path')
      .eq('id', templateId)
      .single()

    if (fetchError) {
      console.error('Error fetching template:', fetchError)
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Only admins can delete templates created by others
    if (session.user.role !== 'admin' && template.created_by !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own templates' },
        { status: 403 }
      )
    }

    // Delete the associated image file from storage if it exists
    if (template.image_path) {
      try {
        const storagePath = extractStoragePath(template.image_path)
        
        if (storagePath) {
          console.log('Deleting storage file:', storagePath)
          const { error: storageError } = await supabase.storage
            .from('certificates')
            .remove([storagePath])

          if (storageError) {
            console.error('Error deleting storage file:', storageError)
            // Don't fail the template deletion if storage deletion fails
          } else {
            console.log('Successfully deleted storage file:', storagePath)
          }
        } else {
          console.log('No storage file to delete (base64 or invalid path):', template.image_path)
        }
      } catch (storageDeleteError) {
        console.error('Error during storage cleanup:', storageDeleteError)
        // Don't fail the template deletion if storage cleanup fails
      }
    }

    // Delete the template from database
    const { error } = await supabase
      .from('certificate_templates')
      .delete()
      .eq('id', templateId)

    if (error) {
      console.error('Error deleting template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Template deleted successfully' }, { status: 200 })

  } catch (error) {
    console.error('Error in DELETE /api/certificates/templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


