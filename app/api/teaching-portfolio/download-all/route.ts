import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import JSZip from 'jszip'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx'

export const dynamic = 'force-dynamic'

const categoryLabels: Record<string, string> = {
  'bedside-teaching': 'Bedside Teaching',
  'twilight-teaching': 'Twilight Teaching',
  'core-teaching': 'Core Teaching',
  'osce-skills-teaching': 'OSCE Skills Teaching',
  'exams': 'Exams',
  'others': 'Others'
}

const evidenceTypeLabels: Record<string, string> = {
  'email': 'Email',
  'certificate': 'Certificate',
  'document': 'Document',
  'other': 'Other'
}

export async function GET(request: NextRequest) {
  try {
    console.log('Starting download all files request for Teaching Portfolio')
    
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
        message: 'Teaching Portfolio is only accessible to CTF and Admin users.'
      }, { status: 403 })
    }

    console.log('User ID:', session.user.id)

    // Get all files for the user
    const { data: files, error } = await supabaseAdmin
      .from('teaching_portfolio_files')
      .select('*')
      .eq('user_id', session.user.id)
      .order('category', { ascending: true })
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

    // Download and add files to ZIP
    for (const file of files) {
      try {
        // Skip files without file_path
        if (!file.file_path) {
          console.log(`Skipping file without path: ${file.original_filename || file.display_name}`)
          continue
        }

        console.log(`Downloading file: ${file.file_path}`)

        // Download file from Supabase Storage
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
          .from('teaching-portfolio')
          .download(file.file_path)

        if (downloadError || !fileData) {
          console.error(`Failed to download file ${file.file_path}:`, downloadError)
          continue
        }

        // Convert file to buffer
        const fileBuffer = await fileData.arrayBuffer()
        
        // Create folder structure: Category/Filename
        const categoryLabel = categoryLabels[file.category] || file.category
        
        // Clean folder and filename for filesystem compatibility
        const cleanCategory = categoryLabel.replace(/[<>:"/\\|?*]/g, '_')
        const cleanFilename = (file.original_filename || file.display_name || 'file').replace(/[<>:"/\\|?*]/g, '_')
        
        // Create the path in ZIP
        const zipPath = `${cleanCategory}/${cleanFilename}`
        
        // Add file to ZIP
        zip.file(zipPath, fileBuffer)
        
        console.log(`Added to ZIP: ${zipPath}`)

      } catch (fileError) {
        console.error(`Error processing file ${file.id}:`, fileError)
        continue
      }
    }

    // Generate Word document with portfolio summary
    console.log('Generating Word document...')
    const userName = session.user.name || session.user.email?.split('@')[0] || 'user'
    
    // Group files by category for the document
    const filesByCategory: Record<string, typeof files> = {}
    files.forEach(file => {
      if (!filesByCategory[file.category]) {
        filesByCategory[file.category] = []
      }
      filesByCategory[file.category].push(file)
    })

    // Create Word document content
    const docParagraphs: any[] = [
      new Paragraph({
        text: "Teaching Portfolio Summary",
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated for: ${userName}`,
            bold: true,
          }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
          }),
        ],
        spacing: { after: 400 },
      }),
    ]

    // Add summary table
    const summaryTableRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Category")],
            width: { size: 35, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph("Evidence Type")],
            width: { size: 25, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph("File Name")],
            width: { size: 40, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ]

    // Add file rows
    files.forEach(file => {
      const categoryLabel = categoryLabels[file.category] || file.category
      const evidenceTypeLabel = evidenceTypeLabels[file.evidence_type || ''] || file.evidence_type || 'N/A'
      const fileName = file.display_name || file.original_filename || 'N/A'
      
      summaryTableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(categoryLabel)],
            }),
            new TableCell({
              children: [new Paragraph(evidenceTypeLabel)],
            }),
            new TableCell({
              children: [new Paragraph(fileName)],
            }),
          ],
        })
      )
    })

    docParagraphs.push(
      new Paragraph({
        text: "Portfolio Files Summary",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      }),
      new Table({
        rows: summaryTableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    )

    // Add detailed breakdown by category
    Object.keys(filesByCategory).sort().forEach(category => {
      const categoryFiles = filesByCategory[category]
      const categoryLabel = categoryLabels[category] || category
      
      docParagraphs.push(
        new Paragraph({
          text: categoryLabel,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        })
      )

      categoryFiles.forEach(file => {
        const evidenceTypeLabel = evidenceTypeLabels[file.evidence_type || ''] || file.evidence_type || 'N/A'
        const fileName = file.display_name || file.original_filename || 'N/A'
        const description = file.description || 'No description'
        
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `File: ${fileName}`,
                bold: true,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Evidence Type: ${evidenceTypeLabel}`,
                italics: true,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Description: ${description}`,
              }),
            ],
            spacing: { after: 200 },
          })
        )
      })
    })

    // Add footer
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Total Files: ${files.length}`,
            bold: true,
          }),
        ],
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated by Bleepy on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`,
            italics: true,
            size: 20,
          }),
        ],
      })
    )

    // Generate Word document
    const doc = new Document({
      sections: [{
        properties: {},
        children: docParagraphs,
      }],
    })

    const wordBuffer = await Packer.toBuffer(doc)
    console.log(`Word document generated, size: ${wordBuffer.length} bytes`)

    // Add Word document to ZIP
    const wordDocName = `Teaching_Portfolio_Summary_${new Date().toISOString().split('T')[0]}.docx`
    zip.file(wordDocName, wordBuffer)

    // Generate ZIP file
    console.log('Generating ZIP file...')
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    
    console.log(`ZIP file generated, size: ${zipBuffer.length} bytes`)

    // Get user name for filename
    const cleanUserName = userName.replace(/[<>:"/\\|?*]/g, '_')
    const zipFilename = `Teaching_Portfolio_${cleanUserName}_${new Date().toISOString().split('T')[0]}.zip`

    // Return ZIP file
    return new NextResponse(zipBuffer as any, {
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

