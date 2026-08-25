import {
  getStationPatientMeta,
  lookupFindingTemplate,
  matchStationRequest,
  type StationFinding,
} from '@/utils/stationFindings'

export type HumeToolCallLike = {
  name?: string
  toolCallId?: string
  tool_call_id?: string
  parameters?: string | Record<string, unknown>
}

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `finding-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function parseParameters(
  parameters: HumeToolCallLike['parameters']
): Record<string, unknown> {
  if (!parameters) return {}
  if (typeof parameters === 'object') return parameters
  try {
    const parsed = JSON.parse(parameters)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) return ''
  return String(value)
}

export function resolveStationFinding(
  stationId: string,
  message: HumeToolCallLike
): StationFinding {
  const raw = message as HumeToolCallLike & {
    toolCall?: HumeToolCallLike
    tool_call?: HumeToolCallLike
  }
  const nested = raw.toolCall || raw.tool_call
  const name = asString(message.name || nested?.name).trim() || 'unknown_tool'
  const args = {
    ...parseParameters(nested?.parameters),
    ...parseParameters(message.parameters),
  }
  const requestedCode =
    asString(args.region) ||
    asString(args.test) ||
    asString(args.investigation) ||
    asString(args.exam) ||
    ''

  const template = lookupFindingTemplate(stationId, name, requestedCode)
  const meta = getStationPatientMeta(stationId)
  const toolCallId =
    asString(message.toolCallId) ||
    asString(message.tool_call_id) ||
    asString(nested?.toolCallId) ||
    asString(nested?.tool_call_id) ||
    `preview-${newId()}`

  return {
    ...template,
    instanceId: newId(),
    toolCallId,
    stationId,
    requestedCode: requestedCode || template.code,
    openedAt: new Date().toISOString(),
    patientName: meta.patientName,
    patientLine: meta.patientLine,
  }
}

export function findingFromPreview(
  stationId: string,
  tool: 'show_examination' | 'show_investigation',
  key: string
): StationFinding {
  return resolveStationFinding(stationId, {
    name: tool,
    parameters: tool === 'show_examination' ? { region: key } : { test: key },
    toolCallId: `preview-${tool}-${key}-${Date.now()}`,
  })
}

export function extractHumeMessageContent(msg: unknown): string {
  const m = msg as Record<string, unknown>
  const nested = m?.message as Record<string, unknown> | undefined
  if (typeof nested?.content === 'string' && nested.content) return nested.content
  if (typeof m?.content === 'string' && m.content) return m.content
  if (typeof nested?.text === 'string' && nested.text) return nested.text
  if (typeof m?.text === 'string' && m.text) return m.text
  return ''
}

export function findingFromUtterance(
  stationId: string,
  text: string
): StationFinding | null {
  const match = matchStationRequest(stationId, text)
  if (!match) return null
  return resolveStationFinding(stationId, {
    name: match.tool,
    parameters:
      match.tool === 'show_examination'
        ? { region: match.template.code }
        : { test: match.template.code },
    toolCallId: `speech-${match.template.code}-${Date.now()}`,
  })
}
