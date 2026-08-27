import type { StationRequestDiagnosis } from '@/utils/stationFindings'

/** Preview buttons and findings diagnostic log. Never true on Vercel production. */
export const STATION_DEV_TOOLS = process.env.NODE_ENV !== 'production'

export type FindingsDiagnosticEvent = {
  seq: number
  at: string
  kind: 'speech' | 'hume_tool' | 'opened' | 'skipped' | 'dismissed' | 'preview'
  speaker?: 'doctor' | 'patient'
  text?: string
  hume?: {
    name: string
    params: string
    code: string
    toolCallId: string
  }
  lastDoctor?: string | null
  diagnosis?: StationRequestDiagnosis
  decision: string
  opened?: string | null
  alreadyShowing?: string | null
}

export function formatFindingsDiagnosticLog(
  events: FindingsDiagnosticEvent[],
  stationId: string
): string {
  const lines = [
    `Bleepy findings diagnostic log`,
    `station: ${stationId}`,
    `events: ${events.length}`,
    '',
  ]

  for (const event of events) {
    const time = event.at.slice(11, 23)
    const bits = [`#${event.seq}`, time, event.kind.toUpperCase()]
    if (event.speaker) bits.push(event.speaker)
    if (event.hume) bits.push(`hume:${event.hume.name}(${event.hume.code})`)
    if (event.opened) bits.push(`opened:${event.opened}`)
    lines.push(bits.join(' | '))
    lines.push(`  decision: ${event.decision}`)
    if (event.text) lines.push(`  said: ${event.text}`)
    if (event.lastDoctor) lines.push(`  lastDoctor: ${event.lastDoctor}`)
    if (event.diagnosis) {
      lines.push(
        `  matcher: ${event.diagnosis.reason}` +
          (event.diagnosis.code ? ` code=${event.diagnosis.code}` : '') +
          (event.diagnosis.blockedBy ? ` blocked=${event.diagnosis.blockedBy}` : '')
      )
      const flagHits = Object.entries(event.diagnosis.flags)
        .filter(([, value]) => value)
        .map(([key]) => key)
      if (flagHits.length) lines.push(`  flags: ${flagHits.join(', ')}`)
      if (event.diagnosis.investigationHit) {
        lines.push(`  investigationHit: ${event.diagnosis.investigationHit}`)
      }
      if (event.diagnosis.examHit) lines.push(`  examHit: ${event.diagnosis.examHit}`)
    }
    if (event.hume) {
      lines.push(`  humeParams: ${event.hume.params}`)
      lines.push(`  humeCallId: ${event.hume.toolCallId}`)
    }
    if (event.alreadyShowing) lines.push(`  alreadyShowing: ${event.alreadyShowing}`)
    lines.push('')
  }

  return lines.join('\n').trim()
}
