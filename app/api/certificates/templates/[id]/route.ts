import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templateId = params.id

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

    // Get the template
    const { data, error } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error) {
      console.error('Error fetching template:', error)
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Always sign a fresh URL from storage path
    if (data.image_path) {
      const bucket = (data as any).bucket || 'certificates'
      try {
        const { data: signed } = await supabase
          .storage
          .from(bucket)
          .createSignedUrl(data.image_path, 1800) // 30 min
        if (signed?.signedUrl) {
          ;(data as any).background_image = signed.signedUrl
        } else {
          ;(data as any).background_image = null
        }
      } catch (e) {
        ;(data as any).background_image = null
      }
    }

    return NextResponse.json({ success: true, template: data }, { status: 200 })

  } catch (error) {
    console.error('Error in GET /api/certificates/templates/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update templates
    const allowedRoles = ['admin', 'meded_team', 'ctf', 'educator']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only admin, meded_team, ctf, and educator can update templates.' },
        { status: 403 }
      )
    }

    const templateId = params.id

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Get the update data from the request
    const updateData = await request.json()

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if template exists and user has permission to update it
    const { data: template, error: fetchError } = await supabase
      .from('certificate_templates')
      .select('id, created_by')
      .eq('id', templateId)
      .single()

    if (fetchError) {
      console.error('Error fetching template:', fetchError)
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Only admins can update templates created by others
    if (session.user.role !== 'admin' && template.created_by !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only update your own templates' },
        { status: 403 }
      )
    }

    // Convert camelCase to snake_case for database
    const dbUpdateData: any = {}
    if (updateData.isShared !== undefined) {
      dbUpdateData.is_shared = updateData.isShared
    }

    // Update the template
    const { data, error } = await supabase
      .from('certificate_templates')
      .update(dbUpdateData)
      .eq('id', templateId)
      .select()
      .single()

    if (error) {
      console.error('Error updating template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, template: data }, { status: 200 })

  } catch (error) {
    console.error('Error in PUT /api/certificates/templates/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const templateId = params.id

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
        console.log('Deleting template image from storage:', template.image_path)
        const { error: storageError } = await supabase.storage
          .from('certificates')
          .remove([template.image_path])
        
        if (storageError) {
          console.error('Error deleting template image from storage:', storageError)
          // Continue with database deletion even if storage deletion fails
        } else {
          console.log('Successfully deleted template image from storage')
        }
      } catch (storageDeleteError) {
        console.error('Error during template image storage cleanup:', storageDeleteError)
        // Continue with database deletion even if storage deletion fails
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
    console.error('Error in DELETE /api/certificates/templates/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
