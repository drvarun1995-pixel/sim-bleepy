import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import JSZip from 'jszip'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx'
import { IMT_SCORE_DOMAINS, IMT_SCORE_MAX, imtScoreTotal } from '@/lib/imt-scores'

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
        text: "IMT Portfolio Summary",
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

    const { data: savedScores } = await supabaseAdmin
      .from('imt_self_assessment_scores')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()

    const hasSelfAssessment =
      !!savedScores && IMT_SCORE_DOMAINS.some((domain) => Number(savedScores[domain.key]) > 0)

    if (hasSelfAssessment) {
      const total = Number(savedScores.total) || imtScoreTotal(savedScores)
      docParagraphs.push(
        new Paragraph({
          text: 'Self-assessment',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Working total for 2027: ${total} / ${IMT_SCORE_MAX}. This is a personal tracker, not official scoring.`,
            }),
          ],
          spacing: { after: 200 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('Domain')],
                  width: { size: 70, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph('Points')],
                  width: { size: 30, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            ...IMT_SCORE_DOMAINS.map(
              (domain) =>
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(domain.label)] }),
                    new TableCell({
                      children: [new Paragraph(String(Number(savedScores[domain.key]) || 0))],
                    }),
                  ],
                })
            ),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Total', bold: true })] })],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: `${total} / ${IMT_SCORE_MAX}`, bold: true })],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      )
    }

    // Add summary table
    const summaryTableRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Category")],
            width: { size: 30, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph("Subcategory")],
            width: { size: 30, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph("Evidence Type")],
            width: { size: 20, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph("File Name")],
            width: { size: 20, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ]

    // Add file rows
    files.forEach(file => {
      const categoryLabel = categoryLabels[file.category] || file.category
      const subcategoryLabel = subcategoryLabels[file.category]?.[file.subcategory] || file.subcategory || 'N/A'
      const evidenceTypeLabel = file.evidence_type || 'N/A'
      const fileName = file.display_name || file.original_filename || 'N/A'
      
      summaryTableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(categoryLabel)],
            }),
            new TableCell({
              children: [new Paragraph(subcategoryLabel)],
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
        const subcategoryLabel = subcategoryLabels[category]?.[file.subcategory] || file.subcategory || 'N/A'
        const evidenceTypeLabel = file.evidence_type || 'N/A'
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
                text: `Subcategory: ${subcategoryLabel} | Evidence Type: ${evidenceTypeLabel}`,
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
    const wordDocName = `IMT_Portfolio_Summary_${new Date().toISOString().split('T')[0]}.docx`
    zip.file(wordDocName, wordBuffer)

    // Generate ZIP file
    console.log('Generating ZIP file...')
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    
    console.log(`ZIP file generated, size: ${zipBuffer.length} bytes`)

    // Get user name for filename
    const cleanUserName = userName.replace(/[<>:"/\\|?*]/g, '_')
    const zipFilename = `IMT_Portfolio_${cleanUserName}_${new Date().toISOString().split('T')[0]}.zip`

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










