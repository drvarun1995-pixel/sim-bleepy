'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { ToolCallHandler } from '@humeai/voice-react'
import {
  findingFromPreview,
  findingFromUtterance,
  resolveStationFinding,
} from '@/lib/hume-tools'
import {
  diagnoseStationRequest,
  isToolLeakSpeech,
  normalizeFindingTrigger,
  type FindingsPreviewAction,
  type StationFinding,
} from '@/utils/stationFindings'
import {
  formatFindingsDiagnosticLog,
  STATION_DEV_TOOLS,
  type FindingsDiagnosticEvent,
} from '@/utils/findingsDiagnostics'

type FindingsContextValue = {
  stationId: string
  findings: StationFinding[]
  activeId: string | null
  setActiveId: (id: string | null) => void
  dismissActive: () => void
  clearFindings: () => void
  pushPreview: (action: FindingsPreviewAction) => void
  ingestUtterance: (
    text: string,
    source?: 'doctor' | 'patient'
  ) => StationFinding | null
  handleToolCall: ToolCallHandler
  diagnosticLog: FindingsDiagnosticEvent[]
  copyDiagnosticLog: () => Promise<string>
  clearDiagnosticLog: () => void
}

const FindingsContext = createContext<FindingsContextValue | null>(null)

function humeParams(message: { parameters?: string | Record<string, unknown> }): string {
  if (typeof message.parameters === 'string') return message.parameters
  if (message.parameters && typeof message.parameters === 'object') {
    try {
      return JSON.stringify(message.parameters)
    } catch {
      return String(message.parameters)
    }
  }
  return ''
}

export function FindingsProvider({
  stationId,
  children,
}: {
  stationId: string
  children: ReactNode
}) {
  const [findings, setFindings] = useState<StationFinding[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [diagnosticLog, setDiagnosticLog] = useState<FindingsDiagnosticEvent[]>([])
  const findingsRef = useRef<StationFinding[]>([])
  findingsRef.current = findings
  const lastDoctorRef = useRef<{ text: string; at: number } | null>(null)
  const lastRequestRef = useRef<{ code: string; at: number; utteranceNorm: string } | null>(
    null
  )
  const dismissedRef = useRef<
    Map<string, { requestAt: number; dismissedAt: number; utteranceNorm: string }>
  >(new Map())
  const seqRef = useRef(0)

  const pushLog = useCallback((event: Omit<FindingsDiagnosticEvent, 'seq' | 'at'>) => {
    if (!STATION_DEV_TOOLS) return
    seqRef.current += 1
    const entry: FindingsDiagnosticEvent = {
      seq: seqRef.current,
      at: new Date().toISOString(),
      ...event,
    }
    setDiagnosticLog((prev) => [...prev, entry].slice(-200))
    console.log('[findings]', entry)
  }, [])

  const ingest = useCallback(
    (
      finding: StationFinding,
      source: 'speech' | 'tool' | 'preview',
      triggerText = ''
    ) => {
      const existing = findingsRef.current.find((item) => item.code === finding.code)
      if (existing) {
        pushLog({
          kind: 'skipped',
          text: triggerText,
          decision: `already_showing:${finding.code}`,
          opened: null,
          alreadyShowing: existing.code,
        })
        setActiveId(existing.instanceId)
        return existing
      }

      const utteranceNorm = normalizeFindingTrigger(triggerText)
      const lastRequest = lastRequestRef.current
      const dismissed = dismissedRef.current.get(finding.code)

      if (source === 'tool' && dismissed && lastRequest && dismissed.requestAt === lastRequest.at) {
        pushLog({
          kind: 'skipped',
          text: triggerText,
          decision: `hume_retry_after_dismiss:${finding.code}`,
          opened: null,
        })
        return findingsRef.current[0] ?? null
      }

      if (
        source === 'speech' &&
        dismissed &&
        utteranceNorm &&
        utteranceNorm === dismissed.utteranceNorm &&
        Date.now() - dismissed.dismissedAt < 8_000
      ) {
        pushLog({
          kind: 'skipped',
          text: triggerText,
          decision: `late_stt_echo_after_dismiss:${finding.code}`,
          opened: null,
        })
        return findingsRef.current[0] ?? null
      }

      if (source === 'speech') {
        lastRequestRef.current = {
          code: finding.code,
          at: Date.now(),
          utteranceNorm,
        }
      } else if (source === 'tool' && !lastRequestRef.current) {
        lastRequestRef.current = {
          code: finding.code,
          at: Date.now(),
          utteranceNorm,
        }
      }

      dismissedRef.current.delete(finding.code)
      setFindings((prev) => [finding, ...prev.filter((item) => item.code !== finding.code)])
      findingsRef.current = [finding, ...findingsRef.current.filter((item) => item.code !== finding.code)]
      setActiveId(finding.instanceId)
      pushLog({
        kind: source === 'preview' ? 'preview' : 'opened',
        text: triggerText,
        decision: `opened_from_${source}:${finding.code}`,
        opened: finding.code,
      })
      return finding
    },
    [pushLog]
  )

  const ingestUtterance = useCallback(
    (text: string, source: 'doctor' | 'patient' = 'doctor') => {
      const diagnosis = diagnoseStationRequest(stationId, text)
      if (source === 'doctor') {
        lastDoctorRef.current = { text, at: Date.now() }
      }

      pushLog({
        kind: 'speech',
        speaker: source,
        text,
        lastDoctor: lastDoctorRef.current?.text ?? null,
        diagnosis,
        decision: diagnosis.matched
          ? `speech_match:${diagnosis.code}`
          : `speech_no_match:${diagnosis.reason}`,
        opened: null,
      })

      const finding = findingFromUtterance(stationId, text)
      if (!finding) return null
      if (source === 'patient') {
        if (!isToolLeakSpeech(text)) return null
        const recentDoctor = lastDoctorRef.current
        const spoken =
          recentDoctor && Date.now() - recentDoctor.at < 25_000
            ? findingFromUtterance(stationId, recentDoctor.text)
            : null
        if (!spoken) {
          pushLog({
            kind: 'skipped',
            speaker: 'patient',
            text,
            diagnosis,
            decision: 'patient_tool_leak_without_recent_doctor_order',
            opened: null,
          })
          return null
        }
        return ingest(finding, 'tool', recentDoctor.text)
      }
      return ingest(finding, 'speech', text)
    },
    [ingest, pushLog, stationId]
  )

  const handleToolCall: ToolCallHandler = useCallback(
    async (message, send) => {
      try {
        const humeFinding = resolveStationFinding(stationId, message)
        const recentDoctor = lastDoctorRef.current
        const spokenDiagnosis = recentDoctor
          ? diagnoseStationRequest(stationId, recentDoctor.text)
          : null
        const recentOrder =
          lastRequestRef.current && Date.now() - lastRequestRef.current.at < 20_000
            ? lastRequestRef.current
            : null
        const spoken =
          recentDoctor && Date.now() - recentDoctor.at < 25_000
            ? findingFromUtterance(stationId, recentDoctor.text)
            : null
        const ageMs = recentDoctor ? Date.now() - recentDoctor.at : null
        const acceptHumeFromRecentOrder =
          !spoken && recentOrder && recentOrder.code === humeFinding.code

        let decision = `ignored_hume_${humeFinding.code}:last_doctor_not_an_order`
        if (spoken && spoken.code === humeFinding.code) {
          decision = `hume_agrees_with_speech:${humeFinding.code}`
        } else if (spoken) {
          decision = `hume_${humeFinding.code}_overridden_by_speech_${spoken.code}`
        } else if (acceptHumeFromRecentOrder) {
          decision = `hume_matches_recent_order:${humeFinding.code}`
        } else if (ageMs != null && ageMs >= 25_000) {
          decision = `ignored_hume_${humeFinding.code}:last_doctor_too_old_${ageMs}ms`
        }

        pushLog({
          kind: 'hume_tool',
          text: recentDoctor?.text,
          lastDoctor: recentDoctor?.text ?? null,
          hume: {
            name: String(message.name || humeFinding.requestedCode || 'unknown'),
            params: humeParams(message),
            code: humeFinding.code,
            toolCallId: humeFinding.toolCallId,
          },
          diagnosis: spokenDiagnosis ?? undefined,
          decision,
          opened: null,
        })

        if (spoken) {
          ingest(
            spoken.code === humeFinding.code ? humeFinding : spoken,
            'tool',
            recentDoctor!.text
          )
        } else if (acceptHumeFromRecentOrder) {
          ingest(humeFinding, 'tool', recentDoctor?.text ?? '')
        }

        return send.success(
          'Okay. Do not say anything else. Do not answer an earlier question. Do not describe findings.'
        )
      } catch (error) {
        console.error('Findings tool call failed:', error)
        pushLog({
          kind: 'skipped',
          decision: `hume_tool_error:${error instanceof Error ? error.message : 'unknown'}`,
          opened: null,
        })
        return send.error({
          error: 'findings_lookup_failed',
          code: 'findings_lookup_failed',
          level: 'warn',
          content: '',
        })
      }
    },
    [ingest, pushLog, stationId]
  )

  const pushPreview = useCallback(
    (action: FindingsPreviewAction) => {
      ingest(findingFromPreview(stationId, action.tool, action.key), 'preview')
    },
    [ingest, stationId]
  )

  const dismissActive = useCallback(() => {
    const current =
      findingsRef.current.find((item) => item.instanceId === activeId) ??
      findingsRef.current[0]
    if (current) {
      dismissedRef.current.set(current.code, {
        requestAt:
          lastRequestRef.current?.code === current.code
            ? lastRequestRef.current.at
            : Date.now(),
        dismissedAt: Date.now(),
        utteranceNorm: lastRequestRef.current?.utteranceNorm ?? '',
      })
      pushLog({
        kind: 'dismissed',
        decision: `dismissed:${current.code}`,
        opened: null,
        alreadyShowing: current.code,
      })
      const remaining = findingsRef.current.filter((item) => item.instanceId !== current.instanceId)
      findingsRef.current = remaining
      setFindings(remaining)
      setActiveId(remaining[0]?.instanceId ?? null)
      return
    }
    setActiveId(null)
    setFindings([])
  }, [activeId, pushLog])

  const clearFindings = useCallback(() => {
    setFindings([])
    setActiveId(null)
    lastDoctorRef.current = null
    lastRequestRef.current = null
    dismissedRef.current.clear()
  }, [])

  const copyDiagnosticLog = useCallback(async () => {
    const text = formatFindingsDiagnosticLog(diagnosticLog, stationId)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      console.log(text)
    }
    return text
  }, [diagnosticLog, stationId])

  const clearDiagnosticLog = useCallback(() => {
    seqRef.current = 0
    setDiagnosticLog([])
  }, [])

  const value = useMemo(
    () => ({
      stationId,
      findings,
      activeId,
      setActiveId,
      dismissActive,
      clearFindings,
      pushPreview,
      ingestUtterance,
      handleToolCall,
      diagnosticLog,
      copyDiagnosticLog,
      clearDiagnosticLog,
    }),
    [
      activeId,
      clearDiagnosticLog,
      clearFindings,
      copyDiagnosticLog,
      diagnosticLog,
      dismissActive,
      findings,
      handleToolCall,
      ingestUtterance,
      pushPreview,
      stationId,
    ]
  )

  return (
    <FindingsContext.Provider value={value}>{children}</FindingsContext.Provider>
  )
}

export function useFindings(): FindingsContextValue {
  const ctx = useContext(FindingsContext)
  if (!ctx) {
    throw new Error('useFindings must be used inside FindingsProvider')
  }
  return ctx
}
