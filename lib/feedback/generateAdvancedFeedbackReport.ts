import OpenAI from 'openai'
import type { FormResponsePayload } from '@/lib/feedback/formResponseData'
import {
  renderAdvancedFeedbackPdf,
  type AdvancedFeedbackReport,
  type ReportChart,
  type ReportColumn,
  type ReportDonut,
  type ReportGroupedChart,
  type ReportHighlightPanel,
  type ReportKpi,
  type ReportSection,
  pdfSafe
} from '@/lib/feedback/advancedReportPdf'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const MAX_COMMENTS_PER_QUESTION = 80
const MAX_COMMENT_CHARS = 400
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function isIdentityQuestion(question: string): boolean {
  const normalised = question.toLowerCase().replace(/[^a-z0-9\s@._-]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!normalised) return false
  if (/^(your\s+)?e-?mails?(\s+address)?$/.test(normalised)) return true
  if (/\b(e-?mail address|contact e-?mail)\b/.test(normalised)) return true
  if (/^(your\s+)?(full\s+name|first\s+name|last\s+name|surname|forename|given\s+name)$/.test(normalised)) return true
  if (/^(your\s+)?name$/.test(normalised)) return true
  if (/^(respondent|learner|attendee|participant|student)\s+name$/.test(normalised)) return true
  return false
}

function collectRespondentIdentifiers(data: FormResponsePayload): string[] {
  const identifiers = new Set<string>()

  for (const row of data.responses) {
    const email = row.user?.email?.trim()
    if (email) identifiers.add(email)

    const name = row.user?.name?.trim()
    if (!name || /^anonymous$/i.test(name)) continue

    identifiers.add(name)
    name
      .split(/[\s,]+/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 3)
      .forEach((part) => identifiers.add(part))
  }

  return Array.from(identifiers).sort((a, b) => b.length - a.length)
}

export function stripRespondentPii(text: string, identifiers: string[] = []): string {
  let out = String(text ?? '').replace(EMAIL_REGEX, '[redacted]')

  for (const identifier of identifiers) {
    const trimmed = identifier.trim()
    if (trimmed.length < 3) continue
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = trimmed.includes('@')
      ? new RegExp(escaped, 'gi')
      : new RegExp(`\\b${escaped}\\b`, 'gi')
    out = out.replace(pattern, '[redacted]')
  }

  return out
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function formatDate(value?: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ratingDistribution(values: Array<string | number>, scale = 5): Record<string, number> {
  const counts: Record<string, number> = {}
  for (let i = 1; i <= scale; i += 1) counts[String(i)] = 0
  values.forEach((value) => {
    const numeric = Number(value)
    if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= scale) {
      counts[String(numeric)] += 1
    }
  })
  return counts
}

function percentHigh(counts: Record<string, number>, scale = 5): number | null {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
  if (!total) return null
  let high = 0
  for (let score = Math.max(4, scale - 1); score <= scale; score += 1) {
    high += counts[String(score)] || 0
  }
  return Math.round((high / total) * 100)
}

type AnonymisedQuestion = {
  question: string
  type: string
  n: number
  scale?: number
  average?: number | null
  distribution?: Record<string, number>
  percentRatedHigh?: number | null
  optionCounts?: Record<string, number>
  comments?: string[]
}

export function buildAnonymisedFeedbackPayload(data: FormResponsePayload) {
  const identifiers = collectRespondentIdentifiers(data)
  const event = data.linkedEvent
  const questions: AnonymisedQuestion[] = []

  for (const question of data.form.questions) {
    if (isIdentityQuestion(question.question || '')) continue

    const summary = data.summary.questionSummaries[question.id]
    const responses = summary?.responses || []
    const scale = question.scale || 5
    const type = question.type
    const questionLabel = stripRespondentPii(question.question, identifiers)

    if (type === 'rating') {
      const counts = ratingDistribution(responses, scale)
      questions.push({
        question: questionLabel,
        type,
        scale,
        n: responses.length,
        average: summary?.averageRating ?? null,
        distribution: counts,
        percentRatedHigh: percentHigh(counts, scale)
      })
      continue
    }

    if (type === 'yes_no' || type === 'multiple_choice') {
      const optionCounts: Record<string, number> = {}
      Object.entries(summary?.optionCounts || {}).forEach(([option, count]) => {
        optionCounts[stripRespondentPii(option, identifiers)] = count
      })
      questions.push({
        question: questionLabel,
        type,
        n: responses.length,
        optionCounts
      })
      continue
    }

    const comments = responses
      .map((value) => (Array.isArray(value) ? value.join(', ') : String(value)).trim())
      .map((value) => stripRespondentPii(value, identifiers))
      .filter((value) => value && value !== '[redacted]')
      .slice(0, MAX_COMMENTS_PER_QUESTION)
      .map((value) => value.slice(0, MAX_COMMENT_CHARS))

    questions.push({
      question: questionLabel,
      type,
      n: comments.length,
      comments
    })
  }

  return {
    formName: stripRespondentPii(data.form.formName, identifiers),
    event: event
      ? {
          title: stripRespondentPii(event.title, identifiers),
          date: formatDate(event.date),
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.locationName ? stripRespondentPii(event.locationName, identifiers) : null
        }
      : null,
    coverage: data.coverage,
    totalResponses: data.summary.totalResponses,
    overallAverageRating: headlineAverage(questions),
    ratingNote:
      'overallAverageRating excludes pre-session / "before" baseline questions. Do not treat those scores as usefulness or overall satisfaction.',
    questions
  }
}

function isPreSessionQuestion(question: string): boolean {
  return /\bbefore\b/i.test(question)
}

function headlineAverage(questions: AnonymisedQuestion[]): number | null {
  const eligible = questions.filter(
    (question) =>
      question.type === 'rating' &&
      question.average != null &&
      (question.n || 0) > 0 &&
      !isPreSessionQuestion(question.question)
  )
  if (!eligible.length) return null
  const totalN = eligible.reduce((sum, question) => sum + (question.n || 0), 0)
  if (!totalN) return null
  const weighted = eligible.reduce((sum, question) => sum + (question.average || 0) * (question.n || 0), 0)
  return Number((weighted / totalN).toFixed(2))
}

function parseReportJson(raw: string): AdvancedFeedbackReport {
  let parsed: any = {}
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    parsed = {}
  }

  const kpis: ReportKpi[] = asArray<any>(parsed.kpis)
    .map((kpi) => ({
      label: asString(kpi?.label),
      value: asString(kpi?.value),
      hint: asString(kpi?.hint) || undefined
    }))
    .filter((kpi) => kpi.label && kpi.value)

  const charts: ReportChart[] = asArray<any>(parsed.charts)
    .map((chart) => ({
      title: asString(chart?.title),
      bars: asArray<any>(chart?.bars)
        .map((bar) => ({
          label: asString(bar?.label),
          value: Number(bar?.value) || 0
        }))
        .filter((bar) => bar.label)
    }))
    .filter((chart) => chart.title && chart.bars.length)

  const parsedColumns: ReportColumn[] = asArray<any>(parsed.columns)
    .map((col) => ({
      heading: asString(col?.heading),
      items: asArray<any>(col?.items).map((item) => asString(item)).filter(Boolean)
    }))
    .filter((col) => col.heading && col.items.length)

  const sections: ReportSection[] = asArray<any>(parsed.sections)
    .map((section) => ({
      heading: asString(section?.heading) || undefined,
      body: asString(section?.body) || undefined,
      items: asArray<any>(section?.items).map((item) => asString(item)).filter(Boolean)
    }))
    .filter((section) => section.heading || section.body || (section.items && section.items.length))

  const donuts: ReportDonut[] = asArray<any>(parsed.donuts)
    .map((donut) => ({
      label: asString(donut?.label),
      value: asString(donut?.value),
      percent: Number(donut?.percent) || 0,
      hint: asString(donut?.hint) || undefined
    }))
    .filter((donut) => donut.label && donut.value)

  const quotes = asArray<any>(parsed.quotes).map((item) => asString(item)).filter(Boolean)
  const recommendations = asArray<any>(parsed.recommendations).map((item) => asString(item)).filter(Boolean)
  const strengths = asArray<any>(parsed.strengths).map((item) => asString(item)).filter(Boolean)
  const improvements = asArray<any>(parsed.improvements).map((item) => asString(item)).filter(Boolean)
  const columns = parsedColumns.length
    ? parsedColumns
    : [
        strengths.length ? { heading: 'What learners valued', items: strengths } : null,
        improvements.length ? { heading: 'Opportunities for improvement', items: improvements } : null
      ].filter((col): col is ReportColumn => Boolean(col))

  return {
    title: asString(parsed.title, 'Teaching Feedback Report'),
    subtitle: asString(parsed.subtitle) || undefined,
    responseCountLabel: asString(parsed.responseCountLabel) || undefined,
    sourceLabel: asString(parsed.sourceLabel, 'Bleepy teaching feedback summary') || undefined,
    kpis,
    donuts: donuts.length ? donuts : undefined,
    chartsHeading: asString(parsed.chartsHeading) || undefined,
    charts,
    summary: (() => {
      const body = asString(parsed.summary?.body || (typeof parsed.summary === 'string' ? parsed.summary : ''))
      if (!body) return undefined
      return {
        heading: asString(parsed.summary?.heading) || undefined,
        body
      }
    })(),
    keyOutcome: parsed.keyOutcome?.heading
      ? {
          label: asString(parsed.keyOutcome.label) || undefined,
          heading: asString(parsed.keyOutcome.heading),
          body: asString(parsed.keyOutcome.body) || undefined
        }
      : undefined,
    columns,
    recommendations,
    quotes,
    sections,
    footer: asString(parsed.footer) || undefined
  }
}

function shortMetricLabel(question: string): string {
  const cleaned = question.replace(/[?]+$/, '').trim()
  const lower = cleaned.toLowerCase()
  if (/\buseful/.test(lower)) return 'Usefulness'
  if (/\binteract/.test(lower)) return 'Interactivity'
  if (/\bafter/.test(lower) && /\bclear/.test(lower)) return 'Clarity after'
  if (/\bbefore/.test(lower) && /\bclear/.test(lower)) return 'Clarity before'
  if (/\bafter/.test(lower) && /\bconfiden/.test(lower)) return 'Confidence'
  if (/\bconfiden/.test(lower)) return 'Confidence'
  if (/\boverall/.test(lower) || /\brating/.test(lower)) return 'Overall'
  const words = cleaned.split(/\s+/).slice(0, 3).join(' ')
  return words.length <= 22 ? words : `${words.slice(0, 19).trim()}...`
}

function distributionBars(distribution?: Record<string, number>) {
  return ['1', '2', '3', '4', '5'].map((label) => ({
    label,
    value: Number(distribution?.[label] || 0)
  }))
}

function applyFacultyLayout(
  report: AdvancedFeedbackReport,
  payload: ReturnType<typeof buildAnonymisedFeedbackPayload>
): AdvancedFeedbackReport {
  const postRatings = payload.questions.filter(
    (question) => question.type === 'rating' && question.distribution && !isPreSessionQuestion(question.question)
  )

  const kpis: ReportKpi[] = []
  postRatings.forEach((question) => {
    if (question.average == null) return
    kpis.push({
      label: shortMetricLabel(question.question).toUpperCase(),
      value: `${question.average.toFixed(2)}/5`,
      hint: question.percentRatedHigh == null ? undefined : `${question.percentRatedHigh}% rated 4-5`,
      accent: 'blue'
    })
  })
  if (payload.overallAverageRating != null && !kpis.some((kpi) => /overall/i.test(kpi.label))) {
    const combined = postRatings.reduce<Record<string, number>>((acc, question) => {
      Object.entries(question.distribution || {}).forEach(([score, count]) => {
        acc[score] = (acc[score] || 0) + Number(count || 0)
      })
      return acc
    }, {})
    const high = percentHigh(combined)
    kpis.push({
      label: 'OVERALL RATING',
      value: `${payload.overallAverageRating.toFixed(2)}/5`,
      hint: high == null ? undefined : `${high}% rated 4-5`,
      accent: 'blue'
    })
  }

  const yesNo = payload.questions.find((question) => question.type === 'yes_no')
  if (yesNo) {
    const yes = Number(yesNo.optionCounts?.Yes || yesNo.optionCounts?.yes || 0)
    const no = Number(yesNo.optionCounts?.No || yesNo.optionCounts?.no || 0)
    const n = yes + no
    if (n > 0 && kpis.length < 4) {
      const percent = Math.round((yes / n) * 100)
      kpis.push({
        label: shortMetricLabel(yesNo.question).toUpperCase(),
        value: `${percent}%`,
        hint: `${yes} of ${n} responses`,
        accent: 'green'
      })
    }
  }
  report.kpis = kpis.slice(0, 4)

  const grouped: ReportGroupedChart = {
    title: 'Rating distribution',
    subtitle: 'Number of responses by score (1-5)',
    series: postRatings.slice(0, 3).map((question) => ({
      label: shortMetricLabel(question.question),
      bars: distributionBars(question.distribution)
    }))
  }
  if (grouped.series.length) report.groupedChart = grouped

  const highlightSource =
    yesNo ||
    postRatings.find((question) => /\bconfiden/.test(question.question.toLowerCase())) ||
    postRatings[0]

  if (highlightSource) {
    let percent = 0
    let valueLabel = ''
    let footnote = ''
    let heading = report.keyOutcome?.heading || report.highlight?.keyOutcomeHeading || ''

    if (highlightSource.type === 'yes_no') {
      const yes = Number(highlightSource.optionCounts?.Yes || highlightSource.optionCounts?.yes || 0)
      const no = Number(highlightSource.optionCounts?.No || highlightSource.optionCounts?.no || 0)
      const n = yes + no
      percent = n ? Math.round((yes / n) * 100) : 0
      valueLabel = `${percent}% ${shortMetricLabel(highlightSource.question).toLowerCase()}`
      footnote = no ? `${no} learner${no === 1 ? '' : 's'} answered No.` : ''
      if (!heading) heading = `${yes} of ${n} learners answered yes.`
    } else {
      percent = highlightSource.percentRatedHigh || 0
      const highCount = [4, 5].reduce((sum, score) => sum + Number(highlightSource.distribution?.[String(score)] || 0), 0)
      valueLabel = `${percent}% rated 4-5`
      footnote = `Based on ${highlightSource.n} responses for ${shortMetricLabel(highlightSource.question).toLowerCase()}.`
      if (!heading) heading = `${highCount} learners rated ${shortMetricLabel(highlightSource.question).toLowerCase()} 4 or 5.`
    }

    const highlight: ReportHighlightPanel = {
      title: shortMetricLabel(highlightSource.question),
      subtitle: highlightSource.type === 'yes_no' ? 'Yes responses' : 'Learners rating 4-5',
      percent,
      valueLabel,
      keyOutcomeHeading: heading,
      keyOutcomeBody: report.keyOutcome?.body,
      footnote: footnote || undefined
    }
    report.highlight = highlight
  }

  if (report.columns?.length) {
    report.columns = report.columns.slice(0, 2).map((col, index) => ({
      heading: col.heading || (index === 0 ? 'What learners valued' : 'Opportunities for improvement'),
      items: col.items.slice(0, 5)
    }))
  }

  delete report.quotes
  delete report.recommendations
  delete report.summary
  delete report.sections
  delete report.charts
  delete report.donuts

  return report
}

export async function generateAdvancedFeedbackReport(data: FormResponsePayload): Promise<{
  bytes: Uint8Array
  filename: string
}> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI is not configured')
  }

  const payload = buildAnonymisedFeedbackPayload(data)
  const identifiers = collectRespondentIdentifiers(data)
  const dateStamp = formatDate(data.linkedEvent?.date) || formatDate(data.form.createdAt) || 'undated'
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.35,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You write the prose for a one-page NHS teaching feedback report. The PDF already has a fixed faculty layout (navy header, KPI cards, grouped rating chart, highlight panel, two theme columns). You only fill the words.

Rules:
- Use only the provided numbers and comments. Never invent counts, averages, or quotes.
- Do not fold "before today's session" / baseline ratings into usefulness or overall rating. Those scores are expected to be lower.
- Never include respondent names, emails, or other identifiers.
- Do not mention MedTribe, ChatGPT, OpenAI, or that you are an AI.
- Brand the source as Bleepy feedback summary.
- Synthesise free text into 3-4 short themes per column. No dumped comments.

Return JSON only:
{
  "title": "Teaching Feedback Report",
  "subtitle": "Topic or event | date | venue if known",
  "responseCountLabel": "e.g. 29 RESPONSES",
  "sourceLabel": "Bleepy feedback summary",
  "keyOutcome": { "heading": "one short finding", "body": "optional supporting sentence" },
  "strengths": ["what learners valued"],
  "improvements": ["opportunities for improvement"],
  "footer": "Anonymous summary of teaching feedback • Prepared from N submitted responses"
}`
      },
      {
        role: 'user',
        content: `Create an advanced teaching feedback report from this session data:\n${stripRespondentPii(JSON.stringify(payload), identifiers)}`
      }
    ]
  })

  const raw = completion.choices[0]?.message?.content || '{}'
  const report = applyFacultyLayout(parseReportJson(raw), payload)

  if (!report.responseCountLabel) {
    report.responseCountLabel = `${payload.totalResponses} RESPONSES`
  }
  report.sourceLabel = 'Bleepy feedback summary'
  if (!report.footer) {
    report.footer = `Anonymous summary of teaching feedback • Prepared from ${payload.totalResponses} submitted responses`
  }

  const bytes = await renderAdvancedFeedbackPdf(report)
  const slug = pdfSafe(data.form.formName || 'feedback')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  return {
    bytes,
    filename: `${slug || 'feedback'}-advanced-report-${String(dateStamp).replace(/\s+/g, '-')}.pdf`
  }
}
