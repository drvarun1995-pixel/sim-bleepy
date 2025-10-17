import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import JSZip from 'jszip'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('Starting download all files request')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('No session or user ID found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has CTF or Admin role
    const userRole = (session.user as any)?.role
    if (userRole !== 'ctf' && userRole !== 'admin') {
      return NextResponse.json({ 
        error: 'Access Denied',
        message: 'IMT Portfolio is only accessible to CTF and Admin users.'
      }, { status: 403 })
    }

    console.log('User ID:', session.user.id)

    // Get all files for the user
    const { data: files, error } = await supabaseAdmin
      .from('portfolio_files')
      .select('*')
      .eq('user_id', session.user.id)
      .order('category', { ascending: true })
      .order('subcategory', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json({ error: 'Failed to fetch files', details: error.message }, { status: 500 })
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files found' }, { status: 404 })
    }

    console.log(`Found ${files.length} files to download`)

    // Create a new ZIP file
    const zip = new JSZip()

    // Category and subcategory labels for folder naming
    const categoryLabels: Record<string, string> = {
      'postgraduate': 'Postgraduate',
      'presentations': 'Presentations', 
      'publications': 'Publications',
      'teaching-experience': 'Teaching Experience',
      'training-in-teaching': 'Training in Teaching',
      'qi': 'QI'
    }

    const subcategoryLabels: Record<string, Record<string, string>> = {
      'postgraduate': {
        'phd': 'PhD',
        'md': 'MD',
        'other-masters': 'Other Masters',
        'other-diploma': 'Other PG Diploma'
      },
      'presentations': {
        'poster': 'Poster',
        'oral': 'Oral',
        'workshop': 'Workshop',
        'other': 'Other'
      },
      'publications': {
        'pubmed-original': 'PubMed Original',
        'pubmed-case-reports': 'PubMed Case Reports',
        'pubmed-letters': 'PubMed Letters',
        'book-medicine': 'Book in Medicine',
        'non-pubmed': 'Non-PubMed'
      },
      'teaching-experience': {
        'organised-taught': 'Organised + Taught',
        'taught': 'Taught',
        'occasional-teaching': 'Occasional Teaching'
      },
      'training-in-teaching': {
        'pg-cert': 'PG Cert',
        'pg-diploma': 'PG Diploma',
        'others': 'Others'
      },
      'qi': {
        'audit': 'Audit',
        'quality-improvement': 'Quality Improvement',
        'service-evaluation': 'Service Evaluation'
      }
    }

    // Download and add files to ZIP
    for (const file of files) {
      try {
        // Skip files without file_path (e.g., publication links)
        if (!file.file_path) {
          console.log(`Skipping file without path: ${file.original_filename || file.display_name}`)
          continue
        }

        console.log(`Downloading file: ${file.file_path}`)

        // Download file from Supabase Storage
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
          .from('IMT Portfolio')
          .download(file.file_path)

        if (downloadError || !fileData) {
          console.error(`Failed to download file ${file.file_path}:`, downloadError)
          continue
        }

        // Convert file to buffer
        const fileBuffer = await fileData.arrayBuffer()
        
        // Create folder structure: Category/Subcategory/Filename
        const categoryLabel = categoryLabels[file.category] || file.category
        const subcategoryLabel = subcategoryLabels[file.category]?.[file.subcategory] || file.subcategory || 'General'
        
        // Use custom subsection if available, otherwise use subcategory
        const folderName = file.custom_subsection || subcategoryLabel
        
        // Clean folder and filename for filesystem compatibility
        const cleanCategory = categoryLabel.replace(/[<>:"/\\|?*]/g, '_')
        const cleanFolder = folderName.replace(/[<>:"/\\|?*]/g, '_')
        const cleanFilename = (file.original_filename || file.display_name || 'file').replace(/[<>:"/\\|?*]/g, '_')
        
        // Create the path in ZIP
        const zipPath = `${cleanCategory}/${cleanFolder}/${cleanFilename}`
        
        // Add file to ZIP
        zip.file(zipPath, fileBuffer)
        
        console.log(`Added to ZIP: ${zipPath}`)

      } catch (fileError) {
        console.error(`Error processing file ${file.id}:`, fileError)
        continue
      }
    }

    // Generate ZIP file
    console.log('Generating ZIP file...')
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    
    console.log(`ZIP file generated, size: ${zipBuffer.length} bytes`)

    // Get user name for filename
    const userName = session.user.name || session.user.email?.split('@')[0] || 'user'
    const cleanUserName = userName.replace(/[<>:"/\\|?*]/g, '_')
    const zipFilename = `IMT_Portfolio_${cleanUserName}_${new Date().toISOString().split('T')[0]}.zip`

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Content-Length': zipBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Download all error:', error)
    return NextResponse.json({ 
      error: 'Failed to create ZIP file', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}










