export type FyFaqItem = {
  question: string
  answer: string
}

const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&#8211;': '–',
  '&#8212;': '—',
  '&#8216;': '‘',
  '&#8217;': '’',
  '&#8220;': '“',
  '&#8221;': '”',
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&[a-z]+;|&#\d+;|&#x[0-9a-f]+;/gi, (m) => ENTITY_MAP[m.toLowerCase()] || m)
}

export function stripHtmlToPlain(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, ' ')
      .replace(/<\/li>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

function looksLikeQuestion(heading: string): boolean {
  const h = heading.trim()
  if (!h || h.length < 8 || h.length > 140) return false
  if (/\?$/.test(h)) return true
  return /^(what|who|when|where|why|how|can|does|is|are|do|should|which|any)\b/i.test(h)
}

/**
 * Pull FAQ pairs from h2/h3 question headings + following body until the next heading.
 * Used for long public FY guides (visible FAQ block + FAQPage JSON-LD).
 */
export function extractFyFaqItems(
  html: string,
  opts?: { minAnswerChars?: number; maxItems?: number }
): FyFaqItem[] {
  if (!html) return []
  const minAnswer = opts?.minAnswerChars ?? 40
  const maxItems = opts?.maxItems ?? 8

  const parts = html.split(/(?=<h[23]\b[^>]*>)/i)
  const items: FyFaqItem[] = []
  const seen = new Set<string>()

  for (const part of parts) {
    const match = part.match(/^<h([23])\b[^>]*>([\s\S]*?)<\/h\1>([\s\S]*)$/i)
    if (!match) continue

    const question = stripHtmlToPlain(match[2])
    if (!looksLikeQuestion(question)) continue

    const answer = stripHtmlToPlain(match[3])
    if (answer.length < minAnswer) continue

    const key = question.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    items.push({
      question: question.endsWith('?') ? question : `${question}?`,
      answer: answer.length > 500 ? `${answer.slice(0, 497).trim()}…` : answer,
    })

    if (items.length >= maxItems) break
  }

  return items
}

/** Long guides only — avoid thin pages getting FAQ schema. */
export function shouldEmitFyFaqSchema(html: string, items: FyFaqItem[]): boolean {
  if (items.length < 3) return false
  const plainLen = stripHtmlToPlain(html).length
  return plainLen >= 2500
}

export function buildFaqPageJsonLd(items: FyFaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}
