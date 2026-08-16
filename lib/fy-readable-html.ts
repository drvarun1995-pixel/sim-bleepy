/**
 * Turn dense FY guide paragraphs into shorter prose and scannable lists
 * without changing clinical wording.
 */

export type ReadableHtmlOptions = {
  /** Split every multi-sentence paragraph. Default: only longer paragraphs. */
  splitAllSentences?: boolean
  /** Character threshold for optional sentence splitting. Default 280. */
  minCharsToSplit?: number
}

const SKIP_BLOCKS =
  /(<blockquote\b[\s\S]*?<\/blockquote>|<figure\b[\s\S]*?<\/figure>|<table\b[\s\S]*?<\/table>|<pre\b[\s\S]*?<\/pre>|<details\b[\s\S]*?<\/details>|<aside\b[\s\S]*?<\/aside>)/gi

const INCLUDE_CUE =
  /\b(?:factors include|features include|presentations include|commonly includes?|includes?|including|comprise[sd]?|consists?\s+of|such as)\b/i

const ENTITY_RE = /&(?:[a-zA-Z][a-zA-Z0-9]+|#\d+|#x[0-9a-fA-F]+);/g

const STEP_VERB =
  /^(stop|treat|check|review|consider|continue|add|monitor|repeat|give|start|seek|escalate|call|get|send|request|obtain|insert|remove|withhold|reduce|increase|reassess|watch|confirm|arrange|involve|convert|use|keep|attach|offer|calculate|protect)\b/i

function stripTags(s: string) {
  return s.replace(/<[^>]+>/g, '')
}

function hasBlockContent(inner: string) {
  return /<(ul|ol|table|figure|img|blockquote|div|aside|section|pre|details)/i.test(inner)
}

/** Split sentences without treating "C. Send" / "A. ABCDE" as two sentences. */
export function splitSentences(inner: string): string[] {
  const parts: string[] = []
  let last = 0
  const re = /[.!?]+(?=\s+[A-Z])/g
  let match: RegExpExecArray | null
  while ((match = re.exec(inner))) {
    const before = stripTags(inner.slice(0, match.index)).replace(/\s+$/, '')
    if (match[0] === '.' && /(?:^|\s)[A-Z]$/.test(before)) continue
    const sentence = inner.slice(last, match.index + match[0].length).trim()
    if (sentence) parts.push(sentence)
    last = match.index + match[0].length
    while (inner[last] === ' ' || inner[last] === '\n') last += 1
  }
  const tail = inner.slice(last).trim()
  if (tail) parts.push(tail)
  return parts.filter(Boolean)
}

function isLabelledItem(html: string) {
  const t = stripTags(html).trim()
  const idx = t.indexOf(': ')
  return idx > 8 && idx < 90 && !t.slice(0, idx).includes('.')
}

function ensureColon(lead: string) {
  const trimmed = lead.replace(/\s+$/, '')
  if (/[:：]$/.test(trimmed)) return trimmed
  if (/[?!.]$/.test(trimmed)) return trimmed
  return `${trimmed}:`
}

function cleanItem(item: string) {
  return item
    .replace(/^and\s+/i, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*[.]$/, '')
    .trim()
}

function protectEntities(text: string): { text: string; slots: string[] } {
  const slots: string[] = []
  const out = text.replace(ENTITY_RE, (m) => {
    const i = slots.length
    slots.push(m)
    return `%%ENT${i}%%`
  })
  return { text: out, slots }
}

function restoreSlots(text: string, slots: string[], prefix: string) {
  return text.replace(new RegExp(`%%${prefix}(\\d+)%%`, 'g'), (_, n) => slots[Number(n)] || '')
}

function peelTrailingFromRest(rest: string): { rest: string; trailing: string } {
  const re = /[.!?]\s+(?=[A-Z][a-z])/g
  let match: RegExpExecArray | null
  while ((match = re.exec(rest))) {
    const before = stripTags(rest.slice(0, match.index)).replace(/\s+$/, '')
    if (rest[match.index] === '.' && /(?:^|\s)[A-Z]$/.test(before)) continue
    const listRest = rest.slice(0, match.index + 1)
    let i = match.index + 1
    while (rest[i] === ' ') i += 1
    return { rest: listRest, trailing: rest.slice(i) }
  }
  return { rest, trailing: '' }
}

function protectIncludingClauses(text: string): { text: string; slots: string[] } {
  const slots: string[] = []
  const out = text.replace(
    /\bincluding\s+[^,;]+(?:,\s+[^,;]+){0,3}\s+and\s+[^,;]+/gi,
    (m) => {
      const i = slots.length
      slots.push(m)
      return `%%SLOT${i}%%`
    }
  )
  return { text: out, slots }
}

function splitCommaItems(rest: string): string[] {
  const { text, slots } = protectIncludingClauses(rest)
  return text
    .split(/\s*,\s*/)
    .map((part) =>
      cleanItem(part.replace(/%%SLOT(\d+)%%/g, (_, n) => slots[Number(n)] || ''))
    )
    .filter((s) => s.length > 1)
}

function splitSemiItems(rest: string): string[] {
  const { text, slots } = protectEntities(rest)
  return text
    .split(/\s*;\s*/)
    .map((part) => cleanItem(restoreSlots(part, slots, 'ENT')))
    .filter((s) => s.length > 1)
}

function isOrderedList(items: string[]) {
  if (items.length < 3) return false
  const n = items.filter((item) => STEP_VERB.test(stripTags(item).trim())).length
  return n >= Math.ceil(items.length * 0.6)
}

function renderList(lead: string | null, items: string[], trailing: string): string {
  const ordered = isOrderedList(items)
  const tag = ordered ? 'ol' : 'ul'
  const list = `<${tag} class="fy-scan-list">${items
    .map((item) => `<li>${item}</li>`)
    .join('')}</${tag}>`
  const leadHtml = lead ? `<p>${ensureColon(lead)}</p>\n` : ''
  const trailHtml = trailing ? `\n${formatParagraph(trailing, { splitAllSentences: true })}` : ''
  return `${leadHtml}${list}${trailHtml}`
}

function findListCue(inner: string): { lead: string; rest: string } | null {
  const emDash = inner.match(/^(.*?)\s+[—–-]\s+([\s\S]+)$/)
  if (emDash && splitSemiItems(emDash[2]).length >= 3) {
    return { lead: emDash[1].trim(), rest: emDash[2].trim() }
  }

  const colon = inner.match(/^(.*?):\s+([\s\S]+)$/)
  if (colon && stripTags(colon[1]).length < 220) {
    return { lead: colon[1].trim(), rest: colon[2].trim() }
  }

  const include = inner.match(
    new RegExp(`^([\\s\\S]*?${INCLUDE_CUE.source})\\s+([\\s\\S]+)$`, 'i')
  )
  if (include && stripTags(include[1]).length < 220) {
    return { lead: include[1].trim(), rest: include[2].trim() }
  }

  return null
}

function hasSentenceBeforeCue(inner: string, restStart: number) {
  const before = inner.slice(0, restStart)
  const re = /[.!?]+(?=\s+[A-Z])/g
  let match: RegExpExecArray | null
  while ((match = re.exec(before))) {
    const prefix = stripTags(before.slice(0, match.index)).replace(/\s+$/, '')
    if (match[0] === '.' && /(?:^|\s)[A-Z]$/.test(prefix)) continue
    return true
  }
  return false
}

function realSemiCount(html: string) {
  const { text } = protectEntities(html)
  return (text.match(/;/g) || []).length
}

export function tryListify(inner: string): string | null {
  const plain = stripTags(inner).replace(/\s+/g, ' ').trim()
  if (plain.length < 80) return null
  if (hasBlockContent(inner)) return null

  const cue = findListCue(inner)
  if (cue) {
    const restStart = inner.length - cue.rest.length
    if (hasSentenceBeforeCue(inner, restStart)) return null

    const peeled = peelTrailingFromRest(cue.rest)
    const semi = splitSemiItems(peeled.rest)
    const comma = splitCommaItems(peeled.rest)
    const items = semi.length >= 3 ? semi : comma.length >= 5 ? comma : []
    if (items.length >= 3 && (semi.length >= 3 || comma.length >= 5)) {
      return renderList(cue.lead, items, peeled.trailing)
    }
  }

  if (realSemiCount(inner) >= 3) {
    const peeled = peelTrailingFromRest(inner)
    const wholeSemi = splitSemiItems(peeled.rest)
    if (wholeSemi.length >= 3) {
      return renderList(null, wholeSemi, peeled.trailing)
    }
  }

  return null
}

function formatParagraph(inner: string, opts: ReadableHtmlOptions = {}): string {
  const trimmed = inner.trim()
  if (!trimmed) return ''
  if (hasBlockContent(trimmed)) return `<p>${trimmed}</p>`
  if (/^<em>Educational note:/i.test(stripTags(trimmed))) return `<p>${trimmed}</p>`

  const listed = tryListify(trimmed)
  if (listed) return listed

  const sentences = splitSentences(trimmed)
  const minChars = opts.minCharsToSplit ?? 280
  const shouldSplit =
    sentences.length > 1 &&
    (opts.splitAllSentences ||
      stripTags(trimmed).length >= minChars ||
      sentences.length >= 3)

  if (!shouldSplit) return `<p>${trimmed}</p>`

  const out: string[] = []
  let i = 0
  while (i < sentences.length) {
    if (isLabelledItem(sentences[i])) {
      const items: string[] = []
      while (i < sentences.length && isLabelledItem(sentences[i])) {
        items.push(sentences[i])
        i += 1
      }
      if (items.length >= 2) {
        out.push(
          `<ul class="fy-scan-list">${items.map((s) => `<li>${s}</li>`).join('')}</ul>`
        )
      } else {
        const listedItem = tryListify(items[0])
        out.push(listedItem || `<p>${items[0]}</p>`)
      }
      continue
    }
    const listedSentence = tryListify(sentences[i])
    out.push(listedSentence || `<p>${sentences[i]}</p>`)
    i += 1
  }
  return out.join('\n')
}

/** Split long multi-sentence paragraphs; turn list-like clinical prose into bullets. */
export function formatReadableHtml(html: string, opts: ReadableHtmlOptions = {}): string {
  if (!html) return html
  return html
    .split(SKIP_BLOCKS)
    .map((part) => {
      if (!part) return part
      if (/^<(blockquote|figure|table|pre|details|aside)\b/i.test(part)) return part
      return part.replace(/<p(\b[^>]*)>([\s\S]*?)<\/p>/gi, (full, attrs: string, inner: string) => {
        if (/\bfy-image-source\b|\bfy-callout\b|\bfy-scan-list\b/i.test(attrs)) return full
        const formatted = formatParagraph(inner, opts)
        if (!formatted || formatted === `<p>${inner}</p>`) return full
        if (attrs && attrs.trim()) {
          return formatted.replace(/<p>/, `<p${attrs}>`)
        }
        return formatted
      })
    })
    .join('')
}
