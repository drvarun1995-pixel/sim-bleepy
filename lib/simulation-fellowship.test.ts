import { describe, expect, it } from 'vitest'
import {
  SIMULATION_FELLOWSHIP_REQUIREMENTS,
  SIMULATION_FELLOWSHIP_TOTAL_HOURS,
  simulationFellowshipProgress,
  type SimulationFellowshipFile,
} from '@/lib/simulation-fellowship'

function file(key: string): SimulationFellowshipFile {
  return {
    id: key,
    requirement_key: key,
    filename: 'evidence.pdf',
    original_filename: 'evidence.pdf',
    file_size: 12,
    file_type: 'pdf',
    mime_type: 'application/pdf',
    file_path: `simulation-fellowship/${key}/evidence.pdf`,
    notes: null,
    created_at: '2026-08-13T00:00:00.000Z',
    updated_at: '2026-08-13T00:00:00.000Z',
  }
}

describe('simulation fellowship checklist', () => {
  it('totals 60 hours across nine requirements', () => {
    expect(SIMULATION_FELLOWSHIP_REQUIREMENTS).toHaveLength(9)
    expect(SIMULATION_FELLOWSHIP_TOTAL_HOURS).toBe(60)
  })

  it('marks a requirement done only when evidence is attached', () => {
    const progress = simulationFellowshipProgress([file('elfh-modules')])
    expect(progress.completeCount).toBe(1)
    expect(progress.hoursDone).toBe(12)
    expect(progress.pending.map((item) => item.key)).not.toContain('elfh-modules')
    expect(progress.done.map((item) => item.key)).toEqual(['elfh-modules'])
  })

  it('keeps rows without a file path as pending', () => {
    const progress = simulationFellowshipProgress([
      { ...file('observe-vr'), file_path: null },
    ])
    expect(progress.completeCount).toBe(0)
    expect(progress.pending).toHaveLength(9)
  })
})
