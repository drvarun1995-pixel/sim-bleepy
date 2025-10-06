import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user exists in database, create if not
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role, id')
      .eq('email', session.user.email)
      .single();

    // If user doesn't exist, create them
    if (profileError || !profile) {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          email: session.user.email,
          name: session.user.name || session.user.email,
          role: 'student' // Default role, will need to be updated by admin
        })
        .select('role, id')
        .single();

      if (createError || !newUser) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
      }

      profile = newUser;
    }

    // Check if user is admin or educator
    if (!profile || !['admin', 'educator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions. Only admins and educators can upload resources.' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    let description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const customCategory = formData.get('customCategory') as string;
    const teachingDate = formData.get('teachingDate') as string;
    const taughtBy = formData.get('taughtBy') as string;

    // If category is "others" and customCategory is provided, prepend it to description
    if (category === 'others' && customCategory) {
      description = description 
        ? `[Format: ${customCategory}] ${description}`
        : `Format: ${customCategory}`;
    }

    if (!file || !title || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 });
    }

    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${category}/${fileName}`;

    // Upload file to Supabase Storage using admin client
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('resources')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file: ' + uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('resources')
      .getPublicUrl(filePath);

    // Insert metadata into database using admin client (bypasses RLS)
    const { data: resourceData, error: dbError } = await supabaseAdmin
      .from('resources')
      .insert({
        title,
        description: description || null,
        category,
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type || fileExt || 'unknown',
        teaching_date: teachingDate || null,
        taught_by: taughtBy || null,
        uploaded_by: profile.id,
        uploaded_by_name: session.user.name || session.user.email
      })
      .select()
      .single();

    if (dbError) {
      // If database insert fails, delete the uploaded file
      await supabaseAdmin.storage.from('resources').remove([filePath]);
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to save resource metadata: ' + dbError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      resource: resourceData 
    }, { status: 201 });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

