import OpenAI from 'openai'
import type { FormResponsePayload } from '@/lib/feedback/formResponseData'
import {
  renderAdvancedFeedbackPdf,
  type AdvancedFeedbackReport,
  type ReportChart,
  type ReportColumn,
  type ReportDonut,
  type ReportKpi,
  type ReportLikert,
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
    overallAverageRating: data.summary.averageRating,
    questions
  }
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

type AnonymisedPayload = ReturnType<typeof buildAnonymisedFeedbackPayload>

function applyMeasuredBlocks(report: AdvancedFeedbackReport, payload: AnonymisedPayload): AdvancedFeedbackReport {
  const coverage = payload.coverage
  if (coverage && (coverage.booked > 0 || coverage.attended > 0 || coverage.responses > 0)) {
    report.attendance = coverage
  }

  const ratingQuestions = payload.questions.filter((question) => question.type === 'rating' && question.distribution)
  if (ratingQuestions.length) {
    const likert: ReportLikert[] = ratingQuestions.slice(0, 3).map((question) => ({
      title: question.question,
      bars: Object.entries(question.distribution || {})
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([label, value]) => ({ label, value: Number(value) || 0 }))
    }))
    report.likert = likert
    if (!report.charts?.length) {
      report.chartsHeading = report.chartsHeading || 'Rating distribution'
      report.charts = likert.map((item) => ({ title: item.title, bars: item.bars }))
    }
  }

  const donuts: ReportDonut[] = []
  if (coverage?.responseRatePercent != null) {
    donuts.push({
      label: 'Feedback response rate',
      value: `${coverage.responseRatePercent}%`,
      percent: coverage.responseRatePercent,
      hint: `${coverage.responses} of ${coverage.attended || coverage.booked || coverage.responses}`
    })
  }
  payload.questions
    .filter((question) => question.type === 'yes_no')
    .slice(0, 2)
    .forEach((question) => {
      const yes = Number(question.optionCounts?.Yes || 0)
      const no = Number(question.optionCounts?.No || 0)
      const n = yes + no
      if (!n) return
      const percent = Math.round((yes / n) * 100)
      donuts.push({
        label: question.question,
        value: `${percent}% Yes`,
        percent,
        hint: `${yes} of ${n}`
      })
    })
  if (donuts.length) report.donuts = donuts.slice(0, 3)

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
        content: `You write professional NHS medical education teaching feedback reports for faculty and medical education officers.

You receive anonymised, aggregated feedback from a teaching session. Decide the most useful report for THIS dataset. Do not force a rigid template. If the form has ratings, show them. If it has yes/no confidence or similar, highlight the standout outcome. If it has free text, synthesise themes. If a question type is missing, omit it.

Rules:
- Use only the provided numbers and comments. Never invent counts, averages, or quotes.
- Never include respondent names, emails, or other identifiers. If any appear in the source text, omit them.
- Do not mention MedTribe, ChatGPT, OpenAI, or that you are an AI.
- Brand the source as a Bleepy teaching feedback summary.
- Tone: concise, professional, suitable to share with a medical education officer.
- Synthesise free-text into clear themes rather than dumping every comment. You may include a few short anonymised quotes if they are distinctive.
- Percentages must match the counts you were given.
- Include a short session summary and practical recommendations only when the comments support them.
- Omit any block that the data does not support. Do not invent a strengths panel, improvement panel, quotes, or recommendations if there are no comments or themes to back them.

Return JSON only, with this shape (include only useful fields; omit empty ones):
{
  "title": "string",
  "subtitle": "Topic or event | date | venue if known",
  "responseCountLabel": "e.g. 29 RESPONSES",
  "sourceLabel": "Bleepy teaching feedback summary",
  "kpis": [{ "label": "USEFULNESS", "value": "4.45/5", "hint": "86% rated 4-5" }],
  "chartsHeading": "Rating distribution",
  "charts": [{ "title": "Usefulness", "bars": [{ "label": "1", "value": 0 }, { "label": "5", "value": 13 }] }],
  "summary": { "heading": "optional", "body": "one short faculty-facing paragraph" },
  "keyOutcome": { "label": "KEY OUTCOME", "heading": "short headline", "body": "one or two sentences" },
  "strengths": ["theme"],
  "improvements": ["theme"],
  "recommendations": ["practical next step"],
  "quotes": ["optional short comment"],
  "sections": [{ "heading": "optional extra heading", "body": "optional paragraph", "items": ["optional bullet"] }],
  "footer": "Anonymous summary ... prepared from N submitted responses"
}`
      },
      {
        role: 'user',
        content: `Create an advanced teaching feedback report from this session data:\n${stripRespondentPii(JSON.stringify(payload), identifiers)}`
      }
    ]
  })

  const raw = completion.choices[0]?.message?.content || '{}'
  const report = applyMeasuredBlocks(parseReportJson(raw), payload)

  if (!report.responseCountLabel) {
    report.responseCountLabel = `${payload.totalResponses} RESPONSES`
  }
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
