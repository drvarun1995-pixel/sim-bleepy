import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib'

export type ReportKpi = {
  label: string
  value: string
  hint?: string
}

export type ReportChart = {
  title: string
  bars: Array<{ label: string; value: number }>
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
const MARGIN = 40
const TEAL = rgb(15 / 255, 118 / 255, 110 / 255)
const TEAL_DARK = rgb(17 / 255, 94 / 255, 89 / 255)
const TEAL_SOFT = rgb(240 / 255, 253 / 255, 250 / 255)
const SLATE = rgb(15 / 255, 23 / 255, 42 / 255)
const MUTED = rgb(100 / 255, 116 / 255, 139 / 255)
const LINE = rgb(226 / 255, 232 / 255, 240 / 255)
const WHITE = rgb(1, 1, 1)
const AMBER_SOFT = rgb(255 / 255, 251 / 255, 235 / 255)
const AMBER = rgb(180 / 255, 83 / 255, 9 / 255)

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

class ReportPainter {
  doc: PDFDocument
  page: PDFPage
  font: PDFFont
  bold: PDFFont
  y: number
  pageNumber = 1

  constructor(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
    this.doc = doc
    this.font = font
    this.bold = bold
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    this.y = PAGE_HEIGHT - MARGIN
  }

  get contentWidth() {
    return PAGE_WIDTH - MARGIN * 2
  }

  ensure(height: number) {
    if (this.y - height < MARGIN + 28) {
      this.drawFooter()
      this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      this.pageNumber += 1
      this.y = PAGE_HEIGHT - MARGIN
      this.page.drawRectangle({
        x: 0,
        y: PAGE_HEIGHT - 8,
        width: PAGE_WIDTH,
        height: 8,
        color: TEAL
      })
      this.y -= 12
    }
  }

  drawFooter(text?: string) {
    this.page.drawLine({
      start: { x: MARGIN, y: 28 },
      end: { x: PAGE_WIDTH - MARGIN, y: 28 },
      thickness: 0.5,
      color: LINE
    })
    if (text) {
      this.page.drawText(pdfSafe(text).slice(0, 110), {
        x: MARGIN,
        y: 16,
        size: 8,
        font: this.font,
        color: MUTED
      })
    }
    const label = String(this.pageNumber)
    this.page.drawText(label, {
      x: PAGE_WIDTH - MARGIN - this.font.widthOfTextAtSize(label, 8),
      y: 16,
      size: 8,
      font: this.font,
      color: MUTED
    })
  }

  gap(n = 10) {
    this.y -= n
  }

  text(value: string, opts: { size: number; font?: PDFFont; color?: ReturnType<typeof rgb>; maxWidth?: number; lineHeight?: number }) {
    const font = opts.font || this.font
    const maxWidth = opts.maxWidth ?? this.contentWidth
    const lines = wrapText(value, font, opts.size, maxWidth)
    const lineHeight = opts.lineHeight ?? opts.size + 4
    this.ensure(lines.length * lineHeight)
    for (const line of lines) {
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y - opts.size,
        size: opts.size,
        font,
        color: opts.color || SLATE
      })
      this.y -= lineHeight
    }
  }

  drawHeader(report: AdvancedFeedbackReport) {
    this.page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 8,
      width: PAGE_WIDTH,
      height: 8,
      color: TEAL
    })
    this.y = PAGE_HEIGHT - 28
    this.text(report.title || 'Teaching Feedback Report', {
      size: 20,
      font: this.bold,
      color: TEAL_DARK,
      lineHeight: 24
    })
    if (report.subtitle) {
      this.text(report.subtitle, { size: 11, color: MUTED, lineHeight: 15 })
    }
    this.gap(8)

    const countLabel = pdfSafe(report.responseCountLabel || '')
    const sourceLabel = pdfSafe(report.sourceLabel || 'Bleepy teaching feedback summary')
    if (countLabel) {
      const width = this.bold.widthOfTextAtSize(countLabel, 9) + 16
      this.ensure(22)
      this.page.drawRectangle({
        x: MARGIN,
        y: this.y - 18,
        width,
        height: 18,
        color: TEAL
      })
      this.page.drawText(countLabel, {
        x: MARGIN + 8,
        y: this.y - 13,
        size: 9,
        font: this.bold,
        color: WHITE
      })
      this.page.drawText(sourceLabel, {
        x: MARGIN + width + 10,
        y: this.y - 13,
        size: 9,
        font: this.font,
        color: MUTED
      })
      this.y -= 26
    } else {
      this.text(sourceLabel, { size: 9, color: MUTED, lineHeight: 14 })
    }
  }

  drawKpis(kpis: ReportKpi[]) {
    if (!kpis.length) return
    const gap = 8
    const perRow = Math.min(4, kpis.length)
    const cardWidth = (this.contentWidth - gap * (perRow - 1)) / perRow
    const cardHeight = 62

    for (let i = 0; i < kpis.length; i += perRow) {
      const row = kpis.slice(i, i + perRow)
      this.ensure(cardHeight + 8)
      row.forEach((kpi, index) => {
        const x = MARGIN + index * (cardWidth + gap)
        const y = this.y - cardHeight
        this.page.drawRectangle({
          x,
          y,
          width: cardWidth,
          height: cardHeight,
          color: TEAL_SOFT,
          borderColor: rgb(204 / 255, 251 / 255, 241 / 255),
          borderWidth: 1
        })
        this.page.drawText(pdfSafe(kpi.label).toUpperCase().slice(0, 22), {
          x: x + 8,
          y: y + cardHeight - 16,
          size: 7.5,
          font: this.bold,
          color: TEAL
        })
        const valueLines = wrapText(kpi.value, this.bold, 14, cardWidth - 16)
        this.page.drawText(valueLines[0] || '', {
          x: x + 8,
          y: y + 24,
          size: 14,
          font: this.bold,
          color: SLATE
        })
        if (kpi.hint) {
          const hint = wrapText(kpi.hint, this.font, 8, cardWidth - 16)[0] || ''
          this.page.drawText(hint, {
            x: x + 8,
            y: y + 10,
            size: 8,
            font: this.font,
            color: MUTED
          })
        }
      })
      this.y -= cardHeight + 10
    }
  }

  drawCharts(heading: string | undefined, charts: ReportChart[]) {
    if (!charts.length) return
    if (heading) {
      this.text(heading, { size: 12, font: this.bold, lineHeight: 16 })
      this.gap(4)
    }

    const visible = charts.slice(0, 4)
    const gap = 10
    const chartWidth = (this.contentWidth - gap * (visible.length - 1)) / visible.length
    const chartHeight = 118
    this.ensure(chartHeight + 8)

    visible.forEach((chart, index) => {
      const x = MARGIN + index * (chartWidth + gap)
      const y = this.y - chartHeight
      this.page.drawRectangle({
        x,
        y,
        width: chartWidth,
        height: chartHeight,
        color: WHITE,
        borderColor: LINE,
        borderWidth: 1
      })
      const title = wrapText(chart.title, this.bold, 8, chartWidth - 12)[0] || ''
      this.page.drawText(title, {
        x: x + 6,
        y: y + chartHeight - 14,
        size: 8,
        font: this.bold,
        color: SLATE
      })

      const bars = (chart.bars || []).slice(0, 8)
      const maxVal = Math.max(1, ...bars.map((bar) => Number(bar.value) || 0))
      const plotBottom = y + 18
      const plotTop = y + chartHeight - 30
      const plotHeight = Math.max(20, plotTop - plotBottom)
      const barGap = 4
      const barWidth = bars.length ? (chartWidth - 16 - barGap * (bars.length - 1)) / bars.length : 10

      bars.forEach((bar, barIndex) => {
        const value = Math.max(0, Number(bar.value) || 0)
        const h = (value / maxVal) * plotHeight
        const bx = x + 8 + barIndex * (barWidth + barGap)
        this.page.drawRectangle({
          x: bx,
          y: plotBottom,
          width: barWidth,
          height: Math.max(h, 0),
          color: TEAL
        })
        if (value > 0) {
          const label = String(value)
          this.page.drawText(label, {
            x: bx + Math.max(0, (barWidth - this.font.widthOfTextAtSize(label, 7)) / 2),
            y: plotBottom + h + 2,
            size: 7,
            font: this.font,
            color: MUTED
          })
        }
        const axis = pdfSafe(bar.label).slice(0, 6)
        this.page.drawText(axis, {
          x: bx + Math.max(0, (barWidth - this.font.widthOfTextAtSize(axis, 7)) / 2),
          y: y + 6,
          size: 7,
          font: this.font,
          color: MUTED
        })
      })
    })
    this.y -= chartHeight + 14
  }

  drawCallout(outcome: { label?: string; heading: string; body?: string }) {
    const headingLines = wrapText(outcome.heading, this.bold, 13, this.contentWidth - 28)
    const bodyLines = outcome.body ? wrapText(outcome.body, this.font, 9.5, this.contentWidth - 28) : []
    const height = 28 + headingLines.length * 16 + bodyLines.length * 13
    this.ensure(height)
    const y = this.y - height
    this.page.drawRectangle({
      x: MARGIN,
      y,
      width: this.contentWidth,
      height,
      color: TEAL_SOFT,
      borderColor: rgb(153 / 255, 246 / 255, 228 / 255),
      borderWidth: 1
    })
    let cursor = this.y - 14
    if (outcome.label) {
      this.page.drawText(pdfSafe(outcome.label).toUpperCase(), {
        x: MARGIN + 14,
        y: cursor,
        size: 8,
        font: this.bold,
        color: TEAL
      })
      cursor -= 14
    }
    headingLines.forEach((line) => {
      this.page.drawText(line, {
        x: MARGIN + 14,
        y: cursor,
        size: 13,
        font: this.bold,
        color: SLATE
      })
      cursor -= 16
    })
    bodyLines.forEach((line) => {
      this.page.drawText(line, {
        x: MARGIN + 14,
        y: cursor,
        size: 9.5,
        font: this.font,
        color: MUTED
      })
      cursor -= 13
    })
    this.y -= height + 12
  }

  drawColumns(columns: ReportColumn[]) {
    if (!columns.length) return
    const gap = 12
    const colWidth = (this.contentWidth - gap * (Math.min(columns.length, 2) - 1)) / Math.min(columns.length, 2)
    const pairs = []
    for (let i = 0; i < columns.length; i += 2) {
      pairs.push(columns.slice(i, i + 2))
    }

    for (const pair of pairs) {
      const heights = pair.map((col) => {
        const headingLines = wrapText(col.heading, this.bold, 11, colWidth - 24)
        const itemLines = (col.items || []).flatMap((item) => wrapText(`• ${item}`, this.font, 9.5, colWidth - 24))
        return 24 + headingLines.length * 14 + itemLines.length * 13
      })
      const height = Math.max(80, ...heights)
      this.ensure(height)
      pair.forEach((col, index) => {
        const x = MARGIN + index * (colWidth + gap)
        const y = this.y - height
        const isSecond = index === 1
        this.page.drawRectangle({
          x,
          y,
          width: colWidth,
          height,
          color: isSecond ? AMBER_SOFT : TEAL_SOFT,
          borderColor: isSecond ? rgb(253 / 255, 230 / 255, 138 / 255) : rgb(153 / 255, 246 / 255, 228 / 255),
          borderWidth: 1
        })
        let cursor = this.y - 18
        wrapText(col.heading, this.bold, 11, colWidth - 24).forEach((line) => {
          this.page.drawText(line, {
            x: x + 12,
            y: cursor,
            size: 11,
            font: this.bold,
            color: isSecond ? AMBER : TEAL_DARK
          })
          cursor -= 16
        })
        ;(col.items || []).forEach((item) => {
          wrapText(`• ${item}`, this.font, 9.5, colWidth - 24).forEach((line) => {
            this.page.drawText(line, {
              x: x + 12,
              y: cursor,
              size: 9.5,
              font: this.font,
              color: SLATE
            })
            cursor -= 13
          })
        })
      })
      this.y -= height + 12
    }
  }

  drawSection(section: ReportSection) {
    if (section.heading) {
      this.text(section.heading, { size: 12, font: this.bold, lineHeight: 16 })
      this.gap(2)
    }
    if (section.body) {
      this.text(section.body, { size: 10, color: SLATE, lineHeight: 14 })
      this.gap(4)
    }
    if (section.items?.length) {
      section.items.forEach((item) => {
        this.text(`• ${item}`, { size: 10, lineHeight: 14 })
      })
      this.gap(6)
    }
  }

  drawQuotes(quotes: string[]) {
    if (!quotes.length) return
    this.text('Learner comments', { size: 12, font: this.bold, lineHeight: 16 })
    this.gap(4)
    const gap = 8
    const cardWidth = (this.contentWidth - gap) / 2
    const items = quotes.slice(0, 8)

    for (let i = 0; i < items.length; i += 2) {
      const pair = items.slice(i, i + 2)
      const heights = pair.map((quote) => {
        const lines = wrapText(`"${quote}"`, this.font, 9, cardWidth - 28)
        return Math.max(48, 20 + lines.length * 12)
      })
      const height = Math.max(...heights)
      this.ensure(height + 6)
      pair.forEach((quote, index) => {
        const x = MARGIN + index * (cardWidth + gap)
        const y = this.y - height
        this.page.drawRectangle({
          x,
          y,
          width: cardWidth,
          height,
          color: WHITE,
          borderColor: LINE,
          borderWidth: 1
        })
        this.page.drawRectangle({
          x,
          y,
          width: 4,
          height,
          color: TEAL
        })
        let cursor = this.y - 16
        wrapText(`"${quote}"`, this.font, 9, cardWidth - 28).forEach((line) => {
          this.page.drawText(line, {
            x: x + 14,
            y: cursor,
            size: 9,
            font: this.font,
            color: SLATE
          })
          cursor -= 12
        })
      })
      this.y -= height + 8
    }
  }

  drawAttendance(attendance: ReportAttendance) {
    const items = [
      { label: 'BOOKED', value: String(attendance.booked) },
      { label: 'ATTENDED', value: String(attendance.attended) },
      { label: 'RESPONSES', value: String(attendance.responses) },
      {
        label: 'RESPONSE RATE',
        value: attendance.responseRatePercent == null ? 'n/a' : `${attendance.responseRatePercent}%`
      }
    ]
    const gap = 8
    const cardWidth = (this.contentWidth - gap * 3) / 4
    const cardHeight = 54
    this.text('Attendance and response rate', { size: 12, font: this.bold, lineHeight: 16 })
    this.gap(4)
    this.ensure(cardHeight + 18)
    items.forEach((item, index) => {
      const x = MARGIN + index * (cardWidth + gap)
      const y = this.y - cardHeight
      this.page.drawRectangle({
        x,
        y,
        width: cardWidth,
        height: cardHeight,
        color: WHITE,
        borderColor: LINE,
        borderWidth: 1
      })
      this.page.drawText(item.label, {
        x: x + 8,
        y: y + cardHeight - 16,
        size: 7,
        font: this.bold,
        color: MUTED
      })
      this.page.drawText(item.value, {
        x: x + 8,
        y: y + 12,
        size: 16,
        font: this.bold,
        color: SLATE
      })
    })
    this.y -= cardHeight + 8
    const rate = attendance.responseRatePercent
    if (rate != null) {
      this.ensure(12)
      this.page.drawRectangle({
        x: MARGIN,
        y: this.y - 8,
        width: this.contentWidth,
        height: 8,
        color: LINE
      })
      this.page.drawRectangle({
        x: MARGIN,
        y: this.y - 8,
        width: Math.max(4, (Math.min(100, rate) / 100) * this.contentWidth),
        height: 8,
        color: TEAL
      })
      this.y -= 16
    }
  }

  drawDonuts(donuts: ReportDonut[]) {
    if (!donuts.length) return
    const visible = donuts.slice(0, 3)
    const gap = 12
    const cardWidth = (this.contentWidth - gap * (visible.length - 1)) / visible.length
    const cardHeight = 92
    this.ensure(cardHeight + 8)

    visible.forEach((donut, index) => {
      const x = MARGIN + index * (cardWidth + gap)
      const y = this.y - cardHeight
      this.page.drawRectangle({
        x,
        y,
        width: cardWidth,
        height: cardHeight,
        color: WHITE,
        borderColor: LINE,
        borderWidth: 1
      })
      const cx = x + 36
      const cy = y + cardHeight / 2
      const percent = Math.max(0, Math.min(100, Number(donut.percent) || 0))
      const segments = 48
      const filled = Math.round((percent / 100) * segments)
      for (let i = 0; i < segments; i += 1) {
        const angle = (i / segments) * Math.PI * 2 - Math.PI / 2
        this.page.drawCircle({
          x: cx + Math.cos(angle) * 18,
          y: cy + Math.sin(angle) * 18,
          size: 2.2,
          color: i < filled ? TEAL : LINE
        })
      }
      const value = pdfSafe(donut.value).slice(0, 8)
      this.page.drawText(value, {
        x: cx - this.bold.widthOfTextAtSize(value, 8) / 2,
        y: cy - 3,
        size: 8,
        font: this.bold,
        color: SLATE
      })
      const labelLines = wrapText(donut.label, this.bold, 8, cardWidth - 80)
      let cursor = y + cardHeight - 28
      labelLines.slice(0, 3).forEach((line) => {
        this.page.drawText(line, {
          x: x + 62,
          y: cursor,
          size: 8,
          font: this.bold,
          color: SLATE
        })
        cursor -= 11
      })
      if (donut.hint) {
        wrapText(donut.hint, this.font, 8, cardWidth - 80).slice(0, 2).forEach((line) => {
          this.page.drawText(line, {
            x: x + 62,
            y: cursor,
            size: 8,
            font: this.font,
            color: MUTED
          })
          cursor -= 11
        })
      }
    })
    this.y -= cardHeight + 12
  }

  drawLikert(sets: ReportLikert[]) {
    if (!sets.length) return
    this.text('Likert distribution', { size: 12, font: this.bold, lineHeight: 16 })
    this.gap(2)
    sets.slice(0, 3).forEach((set) => {
      const bars = (set.bars || []).slice(0, 8)
      const maxVal = Math.max(1, ...bars.map((bar) => Number(bar.value) || 0))
      const rowHeight = 14
      const height = 22 + bars.length * rowHeight
      this.ensure(height)
      this.page.drawText(wrapText(set.title, this.bold, 9, this.contentWidth)[0] || '', {
        x: MARGIN,
        y: this.y - 10,
        size: 9,
        font: this.bold,
        color: SLATE
      })
      this.y -= 16
      bars.forEach((bar) => {
        const value = Math.max(0, Number(bar.value) || 0)
        const label = pdfSafe(bar.label).slice(0, 12)
        this.page.drawText(label, {
          x: MARGIN,
          y: this.y - 9,
          size: 8,
          font: this.font,
          color: MUTED
        })
        const barX = MARGIN + 28
        const barWidth = this.contentWidth - 70
        this.page.drawRectangle({
          x: barX,
          y: this.y - 10,
          width: barWidth,
          height: 8,
          color: LINE
        })
        this.page.drawRectangle({
          x: barX,
          y: this.y - 10,
          width: Math.max(value > 0 ? 4 : 0, (value / maxVal) * barWidth),
          height: 8,
          color: TEAL
        })
        this.page.drawText(String(value), {
          x: barX + barWidth + 6,
          y: this.y - 9,
          size: 8,
          font: this.font,
          color: MUTED
        })
        this.y -= rowHeight
      })
      this.gap(8)
    })
  }

  drawSummary(summary: { heading?: string; body: string }) {
    this.drawCallout({
      label: 'SESSION SUMMARY',
      heading: summary.heading || 'What this feedback shows',
      body: summary.body
    })
  }

  drawRecommendations(items: string[]) {
    if (!items.length) return
    this.text('Recommendations', { size: 12, font: this.bold, lineHeight: 16 })
    this.gap(4)
    items.slice(0, 8).forEach((item, index) => {
      const lines = wrapText(`${index + 1}. ${item}`, this.font, 10, this.contentWidth - 16)
      const height = Math.max(28, 10 + lines.length * 13)
      this.ensure(height)
      this.page.drawRectangle({
        x: MARGIN,
        y: this.y - height,
        width: this.contentWidth,
        height,
        color: WHITE,
        borderColor: LINE,
        borderWidth: 1
      })
      let cursor = this.y - 14
      lines.forEach((line) => {
        this.page.drawText(line, {
          x: MARGIN + 10,
          y: cursor,
          size: 10,
          font: this.font,
          color: SLATE
        })
        cursor -= 13
      })
      this.y -= height + 6
    })
  }
}

export async function renderAdvancedFeedbackPdf(report: AdvancedFeedbackReport): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const painter = new ReportPainter(doc, font, bold)

  painter.drawHeader(report)
  if (report.attendance) painter.drawAttendance(report.attendance)
  if (report.kpis?.length) painter.drawKpis(report.kpis.slice(0, 8))
  if (report.donuts?.length) painter.drawDonuts(report.donuts)
  if (report.likert?.length) painter.drawLikert(report.likert)
  if (report.charts?.length) painter.drawCharts(report.chartsHeading, report.charts)
  if (report.summary?.body) painter.drawSummary(report.summary)
  if (report.keyOutcome?.heading) painter.drawCallout(report.keyOutcome)
  if (report.columns?.length) painter.drawColumns(report.columns.slice(0, 4))
  if (report.recommendations?.length) painter.drawRecommendations(report.recommendations)
  if (report.quotes?.length) painter.drawQuotes(report.quotes)
  if (report.sections?.length) {
    report.sections.slice(0, 8).forEach((section) => painter.drawSection(section))
  }

  const footer = report.footer || 'Anonymous summary of teaching feedback prepared from submitted responses'
  painter.drawFooter(footer)
  return doc.save()
}
