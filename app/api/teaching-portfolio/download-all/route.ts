import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import JSZip from 'jszip'
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx'
import * as XLSX from 'xlsx'
import { requireTeachingPortfolioUser } from '@/lib/teaching-portfolio-access'
import {
  evidenceZipFilename,
  LEARNING_TYPE_OPTIONS,
  TAUGHT_TO_OPTIONS,
  teachingEntryKind,
  teachingEntryTitle,
  teachingOptionLabel,
  type TeachingPortfolioEntry,
} from '@/lib/teaching-portfolio'

export const dynamic = 'force-dynamic'

const TEAL = '0F766E'
const TEAL_SOFT = 'CCFBF1'
const ROW_ALT = 'F8FAFC'
const WHITE = 'FFFFFF'
const INK = '111827'
const MUTED = '4B5563'
const LINE = 'D1D5DB'
const FONT = 'Calibri'

function byDateAsc(a: TeachingPortfolioEntry, b: TeachingPortfolioEntry) {
  const da = a.activity_date || '9999-12-31'
  const db = b.activity_date || '9999-12-31'
  if (da !== db) return da.localeCompare(db)
  return teachingEntryTitle(a).localeCompare(teachingEntryTitle(b))
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function evidenceLabel(entry: TeachingPortfolioEntry) {
  return entry.file_path ? evidenceZipFilename(entry) : 'No evidence'
}

const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: LINE }
const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }

function textCell(
  text: string,
  width: number,
  opts?: { header?: boolean; alt?: boolean; bold?: boolean; muted?: boolean; italic?: boolean }
) {
  const header = !!opts?.header
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: {
      type: ShadingType.CLEAR,
      fill: header ? TEAL : opts?.alt ? ROW_ALT : WHITE,
    },
    borders: cellBorders,
    margins: { top: 70, bottom: 70, left: 90, right: 90 },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text || '—',
            bold: header || opts?.bold,
            italics: opts?.italic || opts?.muted,
            font: FONT,
            size: header ? 20 : 20,
            color: header ? WHITE : opts?.muted ? MUTED : INK,
          }),
        ],
      }),
    ],
  })
}

function styledTable(headers: string[], widths: number[], rows: string[][]) {
  const header = new TableRow({
    tableHeader: true,
    children: headers.map((label, i) => textCell(label, widths[i], { header: true })),
  })
  const body =
    rows.length > 0
      ? rows.map(
          (row, index) =>
            new TableRow({
              children: row.map((value, i) =>
                textCell(value, widths[i], {
                  alt: index % 2 === 1,
                  muted: value === 'No evidence' || value === '—',
                })
              ),
            })
        )
      : [
          new TableRow({
            children: [
              textCell('None recorded', widths[0], { muted: true, italic: true }),
              ...widths.slice(1).map((width) => textCell(' ', width, { muted: true })),
            ],
          }),
        ]

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...body],
  })
}

function heading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: TEAL, space: 4 } },
    children: [new TextRun({ text, bold: true, font: FONT, size: 28, color: TEAL })],
  })
}

function metaLine(label: string, value: string) {
  return new Paragraph({
    spacing: { after: 40 },
    children: [
      new TextRun({ text: `${label}  `, bold: true, font: FONT, size: 21, color: MUTED }),
      new TextRun({ text: value, font: FONT, size: 21, color: INK }),
    ],
  })
}

function countChip(label: string, count: number) {
  return new TableCell({
    width: { size: 33, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: TEAL_SOFT },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: TEAL },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: TEAL },
      left: { style: BorderStyle.SINGLE, size: 4, color: TEAL },
      right: { style: BorderStyle.SINGLE, size: 4, color: TEAL },
    },
    margins: { top: 120, bottom: 120, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: label, font: FONT, size: 18, color: MUTED })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40 },
        children: [new TextRun({ text: String(count), bold: true, font: FONT, size: 32, color: TEAL })],
      }),
    ],
  })
}

function excelSheet(
  title: string,
  subtitle: string[],
  headers: string[],
  rows: string[][],
  widths: number[]
) {
  const data = [[title], subtitle, [], headers, ...(rows.length ? rows : [['None recorded']])]
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = widths.map((wch) => ({ wch }))
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }]
  const lastCol = String.fromCharCode(65 + headers.length - 1)
  const headerRow = 4
  const lastRow = Math.max(headerRow, headerRow + Math.max(rows.length, 1) - 1)
  ws['!autofilter'] = { ref: `A${headerRow}:${lastCol}${lastRow}` }
  ws['!freeze'] = { xSplit: 0, ySplit: headerRow }
  return ws
}

export async function GET() {
  try {
    const access = await requireTeachingPortfolioUser()
    if (access.error) return access.error

    const session = await getServerSession(authOptions)
    const { data: files, error } = await supabaseAdmin
      .from('teaching_portfolio_files')
      .select('*')
      .eq('user_id', access.session.user.id)

    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json({ error: 'Failed to fetch files', details: error.message }, { status: 500 })
    }

    const entries = ((files || []) as TeachingPortfolioEntry[]).slice().sort(byDateAsc)
    const taught = entries.filter((entry) => teachingEntryKind(entry) === 'taught')
    const learnt = entries.filter((entry) => teachingEntryKind(entry) === 'learnt')
    const withEvidence = entries.filter((entry) => !!entry.file_path).length

    const zip = new JSZip()
    const usedNames = { taught: new Set<string>(), learnt: new Set<string>() }

    for (const entry of entries) {
      if (!entry.file_path) continue
      const kind = teachingEntryKind(entry)
      const folder = kind === 'learnt' ? 'learnt' : 'taught'
      let filename = evidenceZipFilename(entry)
      const used = usedNames[kind]
      if (used.has(filename)) {
        const dot = filename.lastIndexOf('.')
        const base = dot === -1 ? filename : filename.slice(0, dot)
        const ext = dot === -1 ? '' : filename.slice(dot)
        filename = `${base}_${entry.id.slice(0, 6)}${ext}`
      }
      used.add(filename)

      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('teaching-portfolio')
        .download(entry.file_path)

      if (downloadError || !fileData) {
        console.error(`Failed to download file ${entry.file_path}:`, downloadError)
        continue
      }

      zip.file(`${folder}/${filename}`, await fileData.arrayBuffer())
    }

    const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'user'
    const generated = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const taughtRows = taught.map((entry) => [
      teachingEntryTitle(entry),
      formatDate(entry.activity_date),
      entry.session_time || '—',
      teachingOptionLabel(TAUGHT_TO_OPTIONS, entry.taught_to) || '—',
      evidenceLabel(entry),
    ])
    const learntRows = learnt.map((entry) => [
      teachingEntryTitle(entry),
      formatDate(entry.activity_date),
      entry.session_time || '—',
      teachingOptionLabel(LEARNING_TYPE_OPTIONS, entry.learning_type) || '—',
      entry.provider || '—',
      evidenceLabel(entry),
    ])

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: FONT, size: 22, color: INK },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: 720, bottom: 720, left: 720, right: 720 },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: TEAL, space: 8 } },
                  spacing: { after: 120 },
                  children: [
                    new TextRun({ text: 'Bleepy  ', bold: true, font: FONT, size: 20, color: TEAL }),
                    new TextRun({ text: 'Teaching Portfolio', font: FONT, size: 20, color: MUTED }),
                  ],
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  border: { top: { style: BorderStyle.SINGLE, size: 8, color: LINE, space: 8 } },
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: 'Generated by Bleepy  ·  ', font: FONT, size: 16, color: MUTED }),
                    new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: MUTED }),
                  ],
                }),
              ],
            }),
          },
          children: [
            new Paragraph({
              spacing: { after: 80 },
              children: [new TextRun({ text: 'Teaching Portfolio', bold: true, font: FONT, size: 44, color: INK })],
            }),
            new Paragraph({
              spacing: { after: 280 },
              children: [
                new TextRun({
                  text: 'Sessions delivered and learning completed',
                  font: FONT,
                  size: 22,
                  color: MUTED,
                }),
              ],
            }),
            metaLine('Prepared for', userName),
            metaLine('Date', generated),
            new Paragraph({ spacing: { after: 200 }, children: [] }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    countChip('Taught', taught.length),
                    countChip('Learnt', learnt.length),
                    countChip('With evidence', withEvidence),
                  ],
                }),
              ],
            }),
            heading('Taught'),
            new Paragraph({
              spacing: { after: 160 },
              children: [
                new TextRun({
                  text: 'Teaching sessions delivered, oldest first.',
                  italics: true,
                  font: FONT,
                  size: 19,
                  color: MUTED,
                }),
              ],
            }),
            styledTable(
              ['Session', 'Date', 'Time', 'Taught to', 'Evidence'],
              [28, 16, 12, 20, 24],
              taughtRows
            ),
            heading('Learnt'),
            new Paragraph({
              spacing: { after: 160 },
              children: [
                new TextRun({
                  text: 'Courses and learning completed, oldest first.',
                  italics: true,
                  font: FONT,
                  size: 19,
                  color: MUTED,
                }),
              ],
            }),
            styledTable(
              ['Title', 'Date', 'Time', 'Type', 'Provider', 'Evidence'],
              [24, 14, 10, 14, 16, 22],
              learntRows
            ),
          ],
        },
      ],
    })

    zip.file('Teaching Portfolio.docx', await Packer.toBuffer(doc))

    const subtitle = [`Prepared for ${userName}`, generated]
    const summary = XLSX.utils.aoa_to_sheet([
      ['Teaching Portfolio'],
      ['Prepared for', userName],
      ['Date', generated],
      [],
      ['Section', 'Count'],
      ['Taught', taught.length],
      ['Learnt', learnt.length],
      ['With evidence', withEvidence],
      ['Total entries', entries.length],
      [],
      ['Notes'],
      ['Taught and Learnt sheets list rows in date order, oldest first.'],
      ['Evidence filenames match files in the taught/ and learnt/ folders.'],
      ['Rows with no evidence appear here only.'],
    ])
    summary['!cols'] = [{ wch: 22 }, { wch: 48 }]
    summary['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, summary, 'Summary')
    XLSX.utils.book_append_sheet(
      workbook,
      excelSheet(
        'Taught',
        subtitle,
        ['Session', 'Date', 'Time', 'Taught to', 'Evidence'],
        taughtRows,
        [36, 16, 12, 22, 40]
      ),
      'Taught'
    )
    XLSX.utils.book_append_sheet(
      workbook,
      excelSheet(
        'Learnt',
        subtitle,
        ['Title', 'Date', 'Time', 'Type', 'Provider', 'Evidence'],
        learntRows,
        [36, 16, 12, 16, 22, 40]
      ),
      'Learnt'
    )
    zip.file('Teaching Portfolio.xlsx', XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const cleanUserName = userName.replace(/[<>:"/\\|?*]/g, '_')
    const zipFilename = `Teaching_Portfolio_${cleanUserName}_${new Date().toISOString().split('T')[0]}.zip`

    return new NextResponse(zipBuffer as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Download all error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create ZIP file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
