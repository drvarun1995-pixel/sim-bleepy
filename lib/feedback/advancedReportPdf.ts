import { existsSync, readFileSync } from 'fs'
import path from 'path'
import sharp from 'sharp'
import { PDFDocument, PDFFont, PDFImage, PDFPage, rgb, StandardFonts } from 'pdf-lib'

export type ReportKpi = {
  label: string
  value: string
  hint?: string
  accent?: 'blue' | 'green'
}

export type ReportChart = {
  title: string
  bars: Array<{ label: string; value: number }>
}

export type ReportGroupedChart = {
  title?: string
  subtitle?: string
  series: Array<{
    label: string
    bars: Array<{ label: string; value: number }>
  }>
}

export type ReportHighlightPanel = {
  title: string
  subtitle?: string
  percent: number
  valueLabel: string
  keyOutcomeHeading: string
  keyOutcomeBody?: string
  footnote?: string
}

export type ReportLikert = {
  title: string
  bars: Array<{ label: string; value: number }>
}

export type ReportDonut = {
  label: string
  value: string
  percent: number
  hint?: string
}

export type ReportAttendance = {
  booked: number
  attended: number
  responses: number
  attendanceRatePercent: number | null
  responseRatePercent: number | null
}

export type ReportColumn = {
  heading: string
  items: string[]
}

export type ReportSection = {
  heading?: string
  body?: string
  items?: string[]
}

export type AdvancedFeedbackReport = {
  title: string
  subtitle?: string
  responseCountLabel?: string
  sourceLabel?: string
  attendance?: ReportAttendance
  kpis?: ReportKpi[]
  donuts?: ReportDonut[]
  likert?: ReportLikert[]
  chartsHeading?: string
  charts?: ReportChart[]
  groupedChart?: ReportGroupedChart
  highlight?: ReportHighlightPanel
  summary?: { heading?: string; body: string }
  keyOutcome?: { label?: string; heading: string; body?: string }
  columns?: ReportColumn[]
  recommendations?: string[]
  quotes?: string[]
  sections?: ReportSection[]
  footer?: string
}

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 28

const NAVY = rgb(15 / 255, 31 / 255, 61 / 255)
const NAVY_DEEP = rgb(11 / 255, 23 / 255, 46 / 255)
const BLUE = rgb(37 / 255, 99 / 255, 235 / 255)
const BLUE_MID = rgb(59 / 255, 130 / 255, 246 / 255)
const GREEN = rgb(22 / 255, 163 / 255, 74 / 255)
const GREEN_SOFT = rgb(220 / 255, 252 / 255, 231 / 255)
const GREEN_INK = rgb(21 / 255, 128 / 255, 61 / 255)
const AMBER = rgb(194 / 255, 65 / 255, 12 / 255)
const AMBER_SOFT = rgb(255 / 255, 237 / 255, 213 / 255)
const SLATE = rgb(15 / 255, 23 / 255, 42 / 255)
const MUTED = rgb(100 / 255, 116 / 255, 139 / 255)
const LINE = rgb(226 / 255, 232 / 255, 240 / 255)
const WHITE = rgb(1, 1, 1)
const PAGE_TINT = rgb(241 / 255, 245 / 255, 249 / 255)
const SHADOW = rgb(15 / 255, 23 / 255, 42 / 255)
const BAR_SHADES = [
  rgb(191 / 255, 219 / 255, 254 / 255),
  rgb(147 / 255, 197 / 255, 253 / 255),
  rgb(96 / 255, 165 / 255, 250 / 255),
  rgb(37 / 255, 99 / 255, 235 / 255),
  rgb(30 / 255, 58 / 255, 95 / 255)
]

export function pdfSafe(text: string): string {
  return String(text ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2022\u00B7]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00a0/g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '')
    .trim()
}

async function embedBleepyLogo(doc: PDFDocument): Promise<PDFImage | null> {
  const candidates = [
    path.join(process.cwd(), 'public', 'Bleepy-Logo-128.webp'),
    path.join(process.cwd(), 'public', 'Bleepy-Logo-1-1.webp')
  ]
  const file = candidates.find((candidate) => existsSync(candidate))
  if (!file) return null
  try {
    const png = await sharp(readFileSync(file))
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    return doc.embedPng(png)
  } catch (error) {
    console.error('Failed to embed Bleepy logo in feedback report:', error)
    return null
  }
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const safe = pdfSafe(text)
  if (!safe) return []
  const paragraphs = safe.split(/\n+/)
  const lines: string[] = []

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/)
    let current = ''
    for (const word of words) {
      const test = current ? `${current} ${word}` : word
      if (font.widthOfTextAtSize(test, size) <= maxWidth) {
        current = test
        continue
      }
      if (current) lines.push(current)
      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        current = word
        continue
      }
      let chunk = ''
      for (const ch of word) {
        const next = chunk + ch
        if (font.widthOfTextAtSize(next, size) <= maxWidth) {
          chunk = next
        } else {
          if (chunk) lines.push(chunk)
          chunk = ch
        }
      }
      current = chunk
    }
    if (current) lines.push(current)
  }

  return lines
}

function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2)
  return [
    `M ${x + rr} ${y}`,
    `L ${x + w - rr} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + rr}`,
    `L ${x + w} ${y + h - rr}`,
    `Q ${x + w} ${y + h} ${x + w - rr} ${y + h}`,
    `L ${x + rr} ${y + h}`,
    `Q ${x} ${y + h} ${x} ${y + h - rr}`,
    `L ${x} ${y + rr}`,
    `Q ${x} ${y} ${x + rr} ${y}`,
    'Z'
  ].join(' ')
}

class ReportPainter {
  doc: PDFDocument
  page: PDFPage
  font: PDFFont
  bold: PDFFont
  logo: PDFImage | null
  y: number
  pageNumber = 1
  footerText = ''

  constructor(doc: PDFDocument, font: PDFFont, bold: PDFFont, logo: PDFImage | null) {
    this.doc = doc
    this.font = font
    this.bold = bold
    this.logo = logo
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    this.paintPageBackdrop()
    this.y = PAGE_HEIGHT - MARGIN
  }

  get contentWidth() {
    return PAGE_WIDTH - MARGIN * 2
  }

  paintPageBackdrop() {
    this.page.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      color: PAGE_TINT
    })
  }

  ensure(height: number) {
    if (this.y - height < 40) {
      this.drawFooter()
      this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      this.paintPageBackdrop()
      this.pageNumber += 1
      this.page.drawRectangle({
        x: 0,
        y: PAGE_HEIGHT - 8,
        width: PAGE_WIDTH,
        height: 8,
        color: NAVY
      })
      this.y = PAGE_HEIGHT - 24
    }
  }

  card(x: number, y: number, w: number, h: number) {
    this.page.drawSvgPath(roundedRectPath(x + 0.8, y - 1.4, w, h, 8), {
      color: SHADOW,
      opacity: 0.08
    })
    this.page.drawSvgPath(roundedRectPath(x, y, w, h, 8), {
      color: WHITE,
      borderColor: LINE,
      borderWidth: 0.8
    })
  }

  drawFooter(text?: string) {
    if (text) this.footerText = text
    const line = wrapText(this.footerText, this.font, 8, this.contentWidth)[0] || ''
    if (line) {
      const width = this.font.widthOfTextAtSize(line, 8)
      this.page.drawText(line, {
        x: (PAGE_WIDTH - width) / 2,
        y: 16,
        size: 8,
        font: this.font,
        color: MUTED
      })
    }
  }

  drawHeader(report: AdvancedFeedbackReport) {
    const title = report.title || 'Teaching Feedback Report'
    const titleSize = title.length > 46 ? 16 : 20
    const titleWidth = this.contentWidth - 168
    const titleLines = wrapText(title, this.bold, titleSize, titleWidth)
    const subtitleLines = report.subtitle ? wrapText(report.subtitle, this.font, 10, titleWidth) : []
    const bandHeight = Math.max(88, 36 + titleLines.length * (titleSize + 5) + subtitleLines.length * 14 + 16)

    this.page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - bandHeight,
      width: PAGE_WIDTH,
      height: bandHeight,
      color: NAVY_DEEP
    })

    let cursor = PAGE_HEIGHT - 28
    titleLines.forEach((line) => {
      this.page.drawText(line, {
        x: MARGIN,
        y: cursor - titleSize,
        size: titleSize,
        font: this.bold,
        color: WHITE
      })
      cursor -= titleSize + 5
    })
    subtitleLines.forEach((line) => {
      this.page.drawText(line, {
        x: MARGIN,
        y: cursor - 10,
        size: 10,
        font: this.font,
        color: rgb(203 / 255, 213 / 255, 225 / 255)
      })
      cursor -= 14
    })

    const countLabel = pdfSafe(report.responseCountLabel || '')
    const sourceLabel = pdfSafe(report.sourceLabel || 'Bleepy feedback summary')
    const rightX = PAGE_WIDTH - MARGIN
    let brandTop = PAGE_HEIGHT - 26
    if (this.logo) {
      const logoSize = 28
      this.page.drawImage(this.logo, {
        x: rightX - logoSize,
        y: PAGE_HEIGHT - 22 - logoSize,
        width: logoSize,
        height: logoSize
      })
      brandTop = PAGE_HEIGHT - 22 - logoSize - 8
    }
    if (countLabel) {
      const countWidth = this.bold.widthOfTextAtSize(countLabel, 10)
      this.page.drawText(countLabel, {
        x: rightX - countWidth,
        y: brandTop - 10,
        size: 10,
        font: this.bold,
        color: WHITE
      })
      brandTop -= 16
    }
    if (sourceLabel) {
      const source = wrapText(sourceLabel, this.font, 8, 150)[0] || ''
      const sourceWidth = this.font.widthOfTextAtSize(source, 8)
      this.page.drawText(source, {
        x: rightX - sourceWidth,
        y: brandTop - 8,
        size: 8,
        font: this.font,
        color: rgb(203 / 255, 213 / 255, 225 / 255)
      })
    }

    this.y = PAGE_HEIGHT - bandHeight - 16
  }

  drawKpis(kpis: ReportKpi[]) {
    const visible = kpis.slice(0, 4)
    if (!visible.length) return
    const gap = 10
    const cardWidth = (this.contentWidth - gap * (visible.length - 1)) / visible.length
    const cardHeight = 74
    this.ensure(cardHeight + 10)

    visible.forEach((kpi, index) => {
      const x = MARGIN + index * (cardWidth + gap)
      const y = this.y - cardHeight
      const accent = kpi.accent === 'green' || /%/.test(kpi.value) ? GREEN : BLUE
      this.card(x, y, cardWidth, cardHeight)
      this.page.drawRectangle({
        x,
        y,
        width: 5,
        height: cardHeight,
        color: accent
      })
      const labelLines = wrapText(pdfSafe(kpi.label).toUpperCase(), this.bold, 7, cardWidth - 22).slice(0, 2)
      labelLines.forEach((line, lineIndex) => {
        this.page.drawText(line, {
          x: x + 14,
          y: y + cardHeight - 18 - lineIndex * 9,
          size: 7,
          font: this.bold,
          color: MUTED
        })
      })
      const value = wrapText(kpi.value, this.bold, 18, cardWidth - 22)[0] || ''
      this.page.drawText(value, {
        x: x + 14,
        y: y + 26,
        size: 18,
        font: this.bold,
        color: SLATE
      })
      if (kpi.hint) {
        const hint = wrapText(kpi.hint, this.font, 7.5, cardWidth - 22)[0] || ''
        this.page.drawText(hint, {
          x: x + 14,
          y: y + 12,
          size: 7.5,
          font: this.font,
          color: MUTED
        })
      }
    })
    this.y -= cardHeight + 14
  }

  drawGroupedChart(chart: ReportGroupedChart, x: number, y: number, w: number, h: number) {
    this.card(x, y, w, h)
    const title = chart.title || 'Rating distribution'
    this.page.drawText(title, {
      x: x + 14,
      y: y + h - 20,
      size: 11,
      font: this.bold,
      color: SLATE
    })
    if (chart.subtitle) {
      this.page.drawText(wrapText(chart.subtitle, this.font, 8, w - 28)[0] || '', {
        x: x + 14,
        y: y + h - 32,
        size: 8,
        font: this.font,
        color: MUTED
      })
    }

    const series = chart.series.slice(0, 3)
    const plotLeft = x + 16
    const plotRight = x + w - 14
    const plotBottom = y + 34
    const plotTop = y + h - 44
    const plotHeight = Math.max(40, plotTop - plotBottom)
    const groupWidth = series.length ? (plotRight - plotLeft) / series.length : plotRight - plotLeft
    const maxVal = Math.max(1, ...series.flatMap((item) => item.bars.map((bar) => Number(bar.value) || 0)))

    series.forEach((item, seriesIndex) => {
      const bars = item.bars.slice(0, 5)
      const gx = plotLeft + seriesIndex * groupWidth
      const inner = groupWidth - 16
      const barGap = 3
      const barWidth = bars.length ? (inner - barGap * (bars.length - 1)) / bars.length : 8
      bars.forEach((bar, barIndex) => {
        const value = Math.max(0, Number(bar.value) || 0)
        const bh = (value / maxVal) * plotHeight
        const bx = gx + 8 + barIndex * (barWidth + barGap)
        this.page.drawRectangle({
          x: bx,
          y: plotBottom,
          width: barWidth,
          height: plotHeight,
          color: rgb(248 / 255, 250 / 255, 252 / 255)
        })
        this.page.drawRectangle({
          x: bx,
          y: plotBottom,
          width: barWidth,
          height: Math.max(bh, value > 0 ? 3 : 0),
          color: BAR_SHADES[barIndex] || BLUE
        })
        if (value > 0) {
          const label = String(value)
          this.page.drawText(label, {
            x: bx + Math.max(0, (barWidth - this.bold.widthOfTextAtSize(label, 6.5)) / 2),
            y: plotBottom + bh + 2,
            size: 6.5,
            font: this.bold,
            color: NAVY
          })
        }
      })
      const axis = wrapText(item.label, this.bold, 8, groupWidth - 8)[0] || ''
      this.page.drawText(axis, {
        x: gx + Math.max(4, (groupWidth - this.bold.widthOfTextAtSize(axis, 8)) / 2),
        y: y + 20,
        size: 8,
        font: this.bold,
        color: SLATE
      })
    })

    BAR_SHADES.forEach((color, index) => {
      const lx = x + 14 + index * 28
      this.page.drawRectangle({ x: lx, y: y + 8, width: 8, height: 8, color })
      this.page.drawText(String(index + 1), {
        x: lx + 10,
        y: y + 9,
        size: 7,
        font: this.font,
        color: MUTED
      })
    })
  }

  drawHighlight(panel: ReportHighlightPanel, x: number, y: number, w: number, h: number) {
    this.card(x, y, w, h)
    this.page.drawText(wrapText(panel.title, this.bold, 11, w - 28)[0] || '', {
      x: x + 14,
      y: y + h - 20,
      size: 11,
      font: this.bold,
      color: SLATE
    })
    if (panel.subtitle) {
      this.page.drawText(wrapText(panel.subtitle, this.font, 8, w - 28)[0] || '', {
        x: x + 14,
        y: y + h - 32,
        size: 8,
        font: this.font,
        color: MUTED
      })
    }

    const cx = x + 58
    const cy = y + h / 2 - 6
    const radius = 34
    const thickness = 9
    this.page.drawCircle({
      x: cx,
      y: cy,
      size: radius,
      borderColor: rgb(187 / 255, 247 / 255, 208 / 255),
      borderWidth: thickness
    })
    const total = 88
    const filled = Math.round((Math.max(0, Math.min(100, panel.percent)) / 100) * total)
    for (let i = 0; i < filled; i += 1) {
      const t = (i / total) * Math.PI * 2
      const a = Math.PI / 2 - t
      this.page.drawCircle({
        x: cx + Math.cos(a) * radius,
        y: cy + Math.sin(a) * radius,
        size: thickness / 2,
        color: GREEN
      })
    }

    const boxX = x + 108
    const boxW = w - 122
    const headingLines = wrapText(panel.keyOutcomeHeading, this.bold, 10, boxW - 20)
    const bodyLines = panel.keyOutcomeBody ? wrapText(panel.keyOutcomeBody, this.font, 8, boxW - 20) : []
    const boxH = Math.min(88, 28 + headingLines.length * 13 + bodyLines.length * 11)
    const boxY = cy - boxH / 2 + 8
    this.page.drawSvgPath(roundedRectPath(boxX, boxY, boxW, boxH, 6), { color: GREEN_SOFT })
    this.page.drawText('KEY OUTCOME', {
      x: boxX + 10,
      y: boxY + boxH - 14,
      size: 7,
      font: this.bold,
      color: GREEN_INK
    })
    let cursor = boxY + boxH - 28
    headingLines.slice(0, 3).forEach((line) => {
      this.page.drawText(line, {
        x: boxX + 10,
        y: cursor,
        size: 10,
        font: this.bold,
        color: SLATE
      })
      cursor -= 13
    })
    bodyLines.slice(0, 3).forEach((line) => {
      this.page.drawText(line, {
        x: boxX + 10,
        y: cursor,
        size: 8,
        font: this.font,
        color: MUTED
      })
      cursor -= 11
    })

    const percentLabel = `${Math.round(panel.percent)}%`
    const percentWidth = this.bold.widthOfTextAtSize(percentLabel, 12)
    this.page.drawText(percentLabel, {
      x: cx - percentWidth / 2,
      y: cy - 4,
      size: 12,
      font: this.bold,
      color: GREEN_INK
    })

    if (panel.footnote) {
      wrapText(panel.footnote, this.font, 7, w - 28).slice(0, 2).forEach((line, index) => {
        this.page.drawText(line, {
          x: x + 14,
          y: y + 14 - index * 9,
          size: 7,
          font: this.font,
          color: MUTED
        })
      })
    }
  }

  drawMiddle(report: AdvancedFeedbackReport) {
    const hasChart = Boolean(report.groupedChart?.series?.length)
    const hasHighlight = Boolean(report.highlight)
    if (!hasChart && !hasHighlight) return

    const height = 188
    this.ensure(height + 8)
    const y = this.y - height
    const gap = 10

    if (hasChart && hasHighlight) {
      const col = (this.contentWidth - gap) / 2
      this.drawGroupedChart(report.groupedChart!, MARGIN, y, col, height)
      this.drawHighlight(report.highlight!, MARGIN + col + gap, y, col, height)
    } else if (hasChart) {
      this.drawGroupedChart(report.groupedChart!, MARGIN, y, this.contentWidth, height)
    } else if (hasHighlight) {
      this.drawHighlight(report.highlight!, MARGIN, y, this.contentWidth, height)
    }
    this.y -= height + 14
  }

  drawColumns(columns: ReportColumn[]) {
    const pair = columns.slice(0, 2)
    if (!pair.length) return
    const gap = 10
    const colWidth = (this.contentWidth - gap * (pair.length - 1)) / pair.length
    const heights = pair.map((col) => {
      const itemLines = (col.items || []).slice(0, 5).flatMap((item) => wrapText(item, this.font, 9, colWidth - 32))
      return 42 + itemLines.length * 13
    })
    const height = Math.max(120, ...heights)
    this.ensure(height + 8)

    pair.forEach((col, index) => {
      const x = MARGIN + index * (colWidth + gap)
      const y = this.y - height
      const isSecond = index === 1
      this.card(x, y, colWidth, height)
      this.page.drawRectangle({
        x,
        y: y + height - 28,
        width: colWidth,
        height: 28,
        color: isSecond ? AMBER_SOFT : GREEN_SOFT
      })
      this.page.drawText(wrapText(col.heading, this.bold, 11, colWidth - 24)[0] || '', {
        x: x + 12,
        y: y + height - 19,
        size: 11,
        font: this.bold,
        color: isSecond ? AMBER : GREEN_INK
      })
      let cursor = y + height - 44
      ;(col.items || []).slice(0, 5).forEach((item) => {
        const lines = wrapText(item, this.font, 9, colWidth - 32)
        lines.forEach((line, lineIndex) => {
          if (lineIndex === 0) {
            this.page.drawCircle({
              x: x + 16,
              y: cursor + 3,
              size: 2,
              color: isSecond ? AMBER : GREEN
            })
          }
          this.page.drawText(line, {
            x: x + 24,
            y: cursor,
            size: 9,
            font: this.font,
            color: SLATE
          })
          cursor -= 12
        })
        cursor -= 4
      })
    })
    this.y -= height + 12
  }
}

export async function renderAdvancedFeedbackPdf(report: AdvancedFeedbackReport): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const logo = await embedBleepyLogo(doc)
  const painter = new ReportPainter(doc, font, bold, logo)

  painter.drawHeader(report)
  if (report.kpis?.length) painter.drawKpis(report.kpis)
  painter.drawMiddle(report)
  if (report.columns?.length) painter.drawColumns(report.columns)

  const footer = report.footer || 'Anonymous summary of teaching feedback prepared from submitted responses'
  painter.drawFooter(footer)
  return doc.save()
}
