import { NextResponse } from 'next/server'
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
import { requireSimulationFellowshipUser } from '@/lib/simulation-fellowship-access'
import {
  SIMULATION_FELLOWSHIP_REQUIREMENTS,
  SIMULATION_FELLOWSHIP_STORAGE_BUCKET,
  evidenceZipFilename,
  filesForRequirement,
  simulationFellowshipProgress,
  type SimulationFellowshipFile,
} from '@/lib/simulation-fellowship'

export const dynamic = 'force-dynamic'

const TEAL = '0F766E'
const TEAL_SOFT = 'CCFBF1'
const ROW_ALT = 'F8FAFC'
const WHITE = 'FFFFFF'
const INK = '111827'
const MUTED = '4B5563'
const LINE = 'D1D5DB'
const FONT = 'Calibri'

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
            size: 20,
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
                  muted: value === 'Pending' || value === 'No evidence' || value === '—',
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

function uniqueName(used: Set<string>, filename: string, id: string) {
  if (!used.has(filename)) {
    used.add(filename)
    return filename
  }
  const dot = filename.lastIndexOf('.')
  const base = dot === -1 ? filename : filename.slice(0, dot)
  const ext = dot === -1 ? '' : filename.slice(dot)
  const next = `${base}_${id.slice(0, 6)}${ext}`
  used.add(next)
  return next
}

export async function GET() {
  try {
    const access = await requireSimulationFellowshipUser()
    if (access.error) return access.error

    const { data: rows, error } = await supabaseAdmin
      .from('simulation_fellowship_files')
      .select('*')
      .eq('user_id', access.session.user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Simulation fellowship export query error:', error)
      return NextResponse.json({ error: 'Failed to fetch files', details: error.message }, { status: 500 })
    }

    const files = (rows || []) as SimulationFellowshipFile[]
    const progress = simulationFellowshipProgress(files)
    const zip = new JSZip()
    const usedNames = new Set<string>()

    for (const requirement of SIMULATION_FELLOWSHIP_REQUIREMENTS) {
      const evidence = filesForRequirement(files, requirement.key)
      for (const file of evidence) {
        if (!file.file_path) continue
        const filename = uniqueName(usedNames, evidenceZipFilename(file), file.id)
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
          .from(SIMULATION_FELLOWSHIP_STORAGE_BUCKET)
          .download(file.file_path)
        if (downloadError || !fileData) {
          console.error(`Failed to download file ${file.file_path}:`, downloadError)
          continue
        }
        zip.file(`${requirement.folder}/${filename}`, await fileData.arrayBuffer())
      }
    }

    const userName = access.session.user.name || access.session.user.email?.split('@')[0] || 'user'
    const generated = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const checklistRows = SIMULATION_FELLOWSHIP_REQUIREMENTS.map((item) => {
      const evidence = filesForRequirement(files, item.key)
      return [
        item.title,
        String(item.hours),
        item.bsafeVr ? 'BSAFE / VR' : '—',
        evidence.length ? 'Done' : 'Pending',
        item.evidence,
        item.alsoCounts || '—',
        evidence.length ? evidence.map((file) => evidenceZipFilename(file)).join('; ') : 'No evidence',
      ]
    })
    const pendingRows = progress.pending.map((item) => [item.title, String(item.hours), item.evidence])
    const doneRows = progress.done.map((item) => [
      item.title,
      String(item.hours),
      filesForRequirement(files, item.key)
        .map((file) => evidenceZipFilename(file))
        .join('; ') || '—',
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
                    new TextRun({ text: 'Simulation Fellowship', font: FONT, size: 20, color: MUTED }),
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
              children: [new TextRun({ text: 'Simulation Fellowship', bold: true, font: FONT, size: 44, color: INK })],
            }),
            new Paragraph({
              spacing: { after: 280 },
              children: [
                new TextRun({
                  text: '60-hour competency checklist with attached evidence',
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
                    countChip('Complete', progress.completeCount),
                    countChip('Pending', progress.pending.length),
                    countChip('Hours evidenced', progress.hoursDone),
                  ],
                }),
              ],
            }),
            heading('Checklist'),
            new Paragraph({
              spacing: { after: 160 },
              children: [
                new TextRun({
                  text: 'A requirement is done when at least one evidence file is attached.',
                  italics: true,
                  font: FONT,
                  size: 19,
                  color: MUTED,
                }),
              ],
            }),
            styledTable(
              ['Requirement', 'Hours', 'Track', 'Status', 'Evidence needed', 'Also counts', 'Files'],
              [22, 8, 10, 10, 16, 16, 18],
              checklistRows
            ),
            heading('Pending'),
            styledTable(['Requirement', 'Hours', 'Evidence needed'], [60, 12, 28], pendingRows),
            heading('Done'),
            styledTable(['Requirement', 'Hours', 'Files'], [60, 12, 28], doneRows),
          ],
        },
      ],
    })

    zip.file('Simulation Fellowship.docx', await Packer.toBuffer(doc))

    const subtitle = [`Prepared for ${userName}`, generated]
    const summary = XLSX.utils.aoa_to_sheet([
      ['Simulation Fellowship'],
      ['Prepared for', userName],
      ['Date', generated],
      [],
      ['Section', 'Count'],
      ['Complete', progress.completeCount],
      ['Pending', progress.pending.length],
      ['Hours evidenced', `${progress.hoursDone} / ${progress.hoursTotal}`],
      ['Evidence files', files.filter((file) => file.file_path).length],
      [],
      ['Notes'],
      ['A requirement is done when at least one evidence file is attached.'],
      ['Evidence files are in folders named after each requirement, next to the Word and Excel files.'],
    ])
    summary['!cols'] = [{ wch: 22 }, { wch: 56 }]
    summary['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, summary, 'Summary')
    XLSX.utils.book_append_sheet(
      workbook,
      excelSheet(
        'Checklist',
        subtitle,
        ['Requirement', 'Hours', 'Track', 'Status', 'Evidence needed', 'Also counts', 'Files'],
        checklistRows,
        [48, 10, 14, 12, 28, 36, 40]
      ),
      'Checklist'
    )
    XLSX.utils.book_append_sheet(
      workbook,
      excelSheet('Pending', subtitle, ['Requirement', 'Hours', 'Evidence needed'], pendingRows, [56, 10, 40]),
      'Pending'
    )
    XLSX.utils.book_append_sheet(
      workbook,
      excelSheet('Done', subtitle, ['Requirement', 'Hours', 'Files'], doneRows, [56, 10, 48]),
      'Done'
    )
    zip.file('Simulation Fellowship.xlsx', XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const cleanUserName = userName.replace(/[<>:"/\\|?*]/g, '_')
    const zipFilename = `Simulation_Fellowship_${cleanUserName}_${new Date().toISOString().split('T')[0]}.zip`

    return new NextResponse(zipBuffer as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Simulation fellowship download all error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create ZIP file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
