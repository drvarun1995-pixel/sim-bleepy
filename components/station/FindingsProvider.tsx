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
import type { FindingsPreviewAction } from '@/utils/stationFindings'
import type { StationFinding } from '@/utils/stationFindings'

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
}

const FindingsContext = createContext<FindingsContextValue | null>(null)

export function FindingsProvider({
  stationId,
  children,
}: {
  stationId: string
  children: ReactNode
}) {
  const [findings, setFindings] = useState<StationFinding[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const findingsRef = useRef<StationFinding[]>([])
  findingsRef.current = findings
  const lastDoctorRef = useRef<{ text: string; at: number } | null>(null)

  const ingest = useCallback((finding: StationFinding) => {
    const current = findingsRef.current[0]
    const sameCall =
      current?.toolCallId === finding.toolCallId && current.code === finding.code
    if (sameCall) {
      setActiveId(current.instanceId)
      return current
    }

    setFindings([finding])
    setActiveId(finding.instanceId)
    return finding
  }, [])

  const ingestUtterance = useCallback(
    (text: string, source: 'doctor' | 'patient' = 'doctor') => {
      if (source === 'doctor') {
        lastDoctorRef.current = { text, at: Date.now() }
      }
      const finding = findingFromUtterance(stationId, text)
      if (!finding) return null
      return ingest(finding)
    },
    [ingest, stationId]
  )

  const handleToolCall: ToolCallHandler = useCallback(
    async (message, send) => {
      try {
        const humeFinding = resolveStationFinding(stationId, message)
        const recentDoctor = lastDoctorRef.current
        const spoken =
          recentDoctor && Date.now() - recentDoctor.at < 30_000
            ? findingFromUtterance(stationId, recentDoctor.text)
            : null

        if (spoken) {
          ingest(spoken.code === humeFinding.code ? humeFinding : spoken)
        } else {
          const guessedExam =
            humeFinding.kind === 'examination' ||
            humeFinding.kind === 'observations' ||
            humeFinding.code === 'observations'
          if (!guessedExam) {
            ingest(humeFinding)
          }
        }

        return send.success(
          'Okay. Do not say anything else. Do not answer an earlier question. Do not describe findings.'
        )
      } catch (error) {
        console.error('Findings tool call failed:', error)
        return send.error({
          error: 'findings_lookup_failed',
          code: 'findings_lookup_failed',
          level: 'warn',
          content: '',
        })
      }
    },
    [ingest, stationId]
  )

  const pushPreview = useCallback(
    (action: FindingsPreviewAction) => {
      ingest(findingFromPreview(stationId, action.tool, action.key))
    },
    [ingest, stationId]
  )

  const dismissActive = useCallback(() => {
    setActiveId(null)
    setFindings([])
  }, [])

  const clearFindings = useCallback(() => {
    setFindings([])
    setActiveId(null)
    lastDoctorRef.current = null
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
    }),
    [
      activeId,
      clearFindings,
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
