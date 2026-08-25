import { describe, expect, it } from 'vitest'
import { findingFromUtterance, resolveStationFinding } from '@/lib/hume-tools'
import {
  isPatientFillerSpeech,
  isToolLeakSpeech,
  lookupFindingTemplate,
  matchStationRequest,
  normalizeTest,
  scrubPatientUtterance,
  visibleStationTranscript,
} from '@/utils/stationFindings'

describe('station findings', () => {
  it('maps a urine dip tool call to the UTI slip', () => {
    const finding = resolveStationFinding('abdominal-pain', {
      name: 'show_investigation',
      toolCallId: 'call_dip_1',
      parameters: JSON.stringify({ test: 'urine_dip' }),
    })
    expect(finding.title).toBe('Urine dipstick')
    expect(finding.kind).toBe('labs')
    expect(finding.spokenAck).toMatch(/dip/i)
    expect(finding.rows.some((row) => row.label === 'Nitrites' && row.flag === 'abnormal')).toBe(true)
  })

  it('treats tummy as abdomen and CT as unavailable', () => {
    const abdomen = lookupFindingTemplate('abdominal-pain', 'show_examination', 'tummy')
    expect(abdomen.code).toBe('abdomen')
    expect(normalizeTest('pregnancy test')).toBe('beta_hcg')
    const ct = lookupFindingTemplate('abdominal-pain', 'show_investigation', 'ct_kub')
    expect(ct.kind).toBe('unavailable')
  })

  it('opens the matching card from spoken requests when Hume does not call the tool', () => {
    expect(matchStationRequest('abdominal-pain', 'Can I get an ecg?')?.template.code).toBe('ecg')
    expect(matchStationRequest('abdominal-pain', 'Can I get an e c g?')?.template.code).toBe('ecg')
    expect(matchStationRequest('abdominal-pain', "I'd like to do a urine dipstick.")?.template.code).toBe(
      'urine_dip'
    )
    expect(matchStationRequest('abdominal-pain', 'Can I get a even dipstick?')?.template.code).toBe(
      'urine_dip'
    )
    expect(matchStationRequest('abdominal-pain', 'Can I get an x ray?')?.template.code).toBe('cxr')
    expect(matchStationRequest('abdominal-pain', 'Abdominal examination.')?.template.code).toBe('abdomen')
    expect(
      matchStationRequest('abdominal-pain', 'show investigation test: urine dip')?.template.code
    ).toBe('urine_dip')
    expect(matchStationRequest('abdominal-pain', 'Can I get your name and age?')).toBeNull()
    expect(matchStationRequest('abdominal-pain', 'Okay doctor, what would you like to examine next?')).toBeNull()
    expect(isToolLeakSpeech('show investigation test: urine dip')).toBe(true)
    expect(findingFromUtterance('abdominal-pain', 'Can I get an ECG?')?.code).toBe('ecg')
  })

  it('does not treat a generic exam prompt as observations', () => {
    expect(matchStationRequest('abdominal-pain', 'Can I get ops?')?.template.code).toBe(
      'observations'
    )
    expect(matchStationRequest('abdominal-pain', 'Can I get the observations?')?.template.code).toBe(
      'observations'
    )
    expect(matchStationRequest('abdominal-pain', 'I just want to feel better.')).toBeNull()
  })

  it('hides Hume filler and merges rapid patient bursts', () => {
    expect(isPatientFillerSpeech("I don’t know… I’m not a doctor.")).toBe(true)
    expect(isPatientFillerSpeech('Okay doctor, what would you like to do next?')).toBe(true)
    expect(isPatientFillerSpeech('The doctor takes my chest x-ray and then comes back to talk. Okay.')).toBe(
      true
    )
    expect(
      scrubPatientUtterance(
        'I’ve had lower tummy pain for two days now, and a fever started yesterday. Sure—go ahead and examine my tummy.'
      )
    ).toBe('I’ve had lower tummy pain for two days now, and a fever started yesterday.')

    const base = new Date('2026-08-25T13:06:26Z').getTime()
    const turns = visibleStationTranscript([
      { role: 'patient', content: 'Sarah Johnson, 24.', timestamp: new Date(base) },
      {
        role: 'patient',
        content: 'The pain started two days ago and I have had a fever.',
        timestamp: new Date(base + 1000),
      },
      { role: 'doctor', content: 'Can I get an e c g?', timestamp: new Date(base + 8000) },
      {
        role: 'patient',
        content: 'I don’t know… I’m not a doctor.',
        timestamp: new Date(base + 9000),
      },
      {
        role: 'patient',
        content: 'My tummy hurts and I feel feverish.',
        timestamp: new Date(base + 10000),
      },
      {
        role: 'patient',
        content: 'Okay doctor, what would you like to do next?',
        timestamp: new Date(base + 11000),
      },
    ])

    expect(turns.map((turn) => turn.content)).toEqual([
      'Sarah Johnson, 24. The pain started two days ago and I have had a fever.',
      'Can I get an e c g?',
    ])
  })

  it('keeps Okay after a test request and drops leftover history', () => {
    const base = new Date('2026-08-25T13:21:43Z').getTime()
    const turns = visibleStationTranscript([
      { role: 'doctor', content: 'Can I get an ecg?', timestamp: new Date(base) },
      {
        role: 'patient',
        content: "I've had this lower tummy pain for a couple of days and a fever for two days.",
        timestamp: new Date(base + 2000),
      },
      { role: 'doctor', content: 'Can I get a urine dipstick?', timestamp: new Date(base + 8000) },
      { role: 'patient', content: 'Okay.', timestamp: new Date(base + 9000) },
    ])
    expect(turns.map((turn) => turn.content)).toEqual([
      'Can I get an ecg?',
      'Can I get a urine dipstick?',
      'Okay.',
    ])
  })
})
