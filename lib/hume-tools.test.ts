import { describe, expect, it } from 'vitest'
import { findingFromUtterance, resolveStationFinding } from '@/lib/hume-tools'
import {
  collapseStreamingTurns,
  diagnoseStationRequest,
  isPatientFillerSpeech,
  isToolLeakSpeech,
  lookupFindingTemplate,
  matchStationRequest,
  normalizeTest,
  scrubPatientUtterance,
  visibleStationTranscript,
} from '@/utils/stationFindings'
import { formatFindingsDiagnosticLog } from '@/utils/findingsDiagnostics'

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

  it('does not open findings cards when the doctor is explaining results', () => {
    expect(matchStationRequest('abdominal-pain', 'so your urine test showed infection')).toBeNull()
    expect(matchStationRequest('abdominal-pain', 'the urine dip showed white cells')).toBeNull()
    expect(matchStationRequest('abdominal-pain', 'your ECG is normal')).toBeNull()
    expect(matchStationRequest('abdominal-pain', 'looking at your bloods, the CRP is raised')).toBeNull()
    expect(matchStationRequest('abdominal-pain', 'the chest x-ray results are back')).toBeNull()
    expect(
      matchStationRequest('abdominal-pain', "I'd like to do a urine dipstick.")?.template.code
    ).toBe('urine_dip')
    expect(matchStationRequest('abdominal-pain', 'Can I have a urine dip?')?.template.code).toBe(
      'urine_dip'
    )
    expect(matchStationRequest('abdominal-pain', 'Urine dipstick.')?.template.code).toBe('urine_dip')
    expect(
      matchStationRequest('abdominal-pain', 'Have you taken any pregnancy test at home?')
    ).toBeNull()
    expect(
      matchStationRequest('abdominal-pain', 'Maybe we can do a ewing dipstick estay as well.')
        ?.template.code
    ).toBe('urine_dip')
    expect(matchStationRequest('abdominal-pain', 'Can I get a pregnancy test?')?.template.code).toBe(
      'beta_hcg'
    )
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

  it('collapses Hume speech drafts into the finished doctor turn', () => {
    const base = new Date('2026-08-27T13:45:33Z').getTime()
    const collapsed = collapseStreamingTurns([
      { role: 'doctor', content: 'Hi.', timestamp: new Date(base) },
      { role: 'doctor', content: 'Hi, how are you?', timestamp: new Date(base + 1000) },
      {
        role: 'doctor',
        content: 'Hi, how are you uh what brings you to hospital today?',
        timestamp: new Date(base + 4000),
      },
      {
        role: 'doctor',
        content: 'Hi, how are you uh what brings you to hospital today?',
        timestamp: new Date(base + 5000),
      },
      {
        role: 'patient',
        content: "I've had this lower tummy pain for a couple of days and a fever for two days.",
        timestamp: new Date(base + 5000),
      },
      { role: 'doctor', content: 'Okay.', timestamp: new Date(base + 12000) },
      {
        role: 'doctor',
        content: 'Okay Can you tell me a little bit more about the pain?',
        timestamp: new Date(base + 15000),
      },
      {
        role: 'doctor',
        content: 'Okay, can you tell me a little bit more about the pain?',
        timestamp: new Date(base + 15000),
      },
      {
        role: 'doctor',
        content: 'Okay, can you tell me a little bit more about the pain um when did it start?',
        timestamp: new Date(base + 18000),
      },
      { role: 'doctor', content: 'Does that sound good?', timestamp: new Date(base + 85000) },
      { role: 'doctor', content: 'Does that sound good?', timestamp: new Date(base + 87000) },
      { role: 'doctor', content: 'Can I get the ops?', timestamp: new Date(base + 124000) },
      { role: 'doctor', content: 'Can I get the urine analysis?', timestamp: new Date(base + 129000) },
    ])

    expect(collapsed.map((turn) => turn.content)).toEqual([
      'Hi, how are you uh what brings you to hospital today?',
      "I've had this lower tummy pain for a couple of days and a fever for two days.",
      'Okay, can you tell me a little bit more about the pain um when did it start?',
      'Does that sound good?',
      'Can I get the ops?',
      'Can I get the urine analysis?',
    ])
  })

  it('diagnoses each spoken line instead of only returning a match', () => {
    const bloods = diagnoseStationRequest('abdominal-pain', 'Can I get the blood test results?')
    expect(bloods.matched).toBe(true)
    expect(bloods.code).toBe('bloods')
    expect(bloods.flags.strongOrder).toBe(true)

    const pressure = diagnoseStationRequest(
      'abdominal-pain',
      "I'll take your blood pressure and also do a urine analysis."
    )
    expect(pressure.matched).toBe(false)
    expect(pressure.flags.mentionsBloodPressure).toBe(true)
    expect(pressure.investigationHit).toBeNull()

    const explaining = diagnoseStationRequest(
      'abdominal-pain',
      'Urine lipstick test and your blood test results it suggests that you have a urinary tract infection.'
    )
    expect(explaining.matched).toBe(false)
    expect(explaining.blockedBy).toBe('result_discussion')

    const history = diagnoseStationRequest(
      'abdominal-pain',
      'Hi, how are you uh what brings you to hospital today?'
    )
    expect(history.matched).toBe(false)
    expect(history.reason).toBe('no_match')

    const pregnancyHistory = diagnoseStationRequest(
      'abdominal-pain',
      'Have you taken any pregnancy test at home?'
    )
    expect(pregnancyHistory.matched).toBe(false)
    expect(pregnancyHistory.blockedBy).toBe('history_question')
  })

  it('formats a speech-plus-tool diagnostic log', () => {
    const text = formatFindingsDiagnosticLog(
      [
        {
          seq: 1,
          at: '2026-08-27T07:50:06.000Z',
          kind: 'speech',
          speaker: 'doctor',
          text: 'Um, can I get the blood test results?',
          diagnosis: diagnoseStationRequest('abdominal-pain', 'Um, can I get the blood test results?'),
          decision: 'speech_match:bloods',
          opened: null,
        },
        {
          seq: 2,
          at: '2026-08-27T07:50:07.000Z',
          kind: 'hume_tool',
          lastDoctor: 'Um, can I get the blood test results?',
          hume: {
            name: 'show_investigation',
            params: '{"test":"bloods"}',
            code: 'bloods',
            toolCallId: 'call_1',
          },
          decision: 'hume_agrees_with_speech:bloods',
          opened: null,
        },
        {
          seq: 3,
          at: '2026-08-27T07:50:07.100Z',
          kind: 'opened',
          decision: 'opened_from_tool:bloods',
          opened: 'bloods',
        },
      ],
      'abdominal-pain'
    )
    expect(text).toContain('speech_match:bloods')
    expect(text).toContain('hume:show_investigation(bloods)')
    expect(text).toContain('opened_from_tool:bloods')
  })

  it('opens falls findings for heart exam, postural BP, and normal bloods', () => {
    expect(matchStationRequest('falls-assessment', 'Can I listen to your heart?')?.template.code).toBe(
      'heart'
    )
    expect(matchStationRequest('falls-assessment', 'Listen to your heart.')?.template.code).toBe(
      'heart'
    )
    expect(matchStationRequest('falls-assessment', 'Cardiac examination.')?.template.code).toBe(
      'heart'
    )
    expect(
      matchStationRequest('falls-assessment', "I'll take your blood pressure.")?.template.code
    ).toBe('observations')
    expect(matchStationRequest('falls-assessment', 'Can I get the observations?')?.template.title).toBe(
      'Observations'
    )
    expect(
      matchStationRequest('falls-assessment', 'Can I get lying and standing BP?')?.template.code
    ).toBe('lying_standing')
    expect(matchStationRequest('falls-assessment', 'Can I get LSBP?')?.template.code).toBe(
      'lying_standing'
    )
    expect(matchStationRequest('falls-assessment', 'Can I do a PR?')?.template.code).toBe('rectal')
    expect(
      matchStationRequest('falls-assessment', 'Can I get an abdominal x-ray?')?.template.code
    ).toBe('axr')
    expect(
      matchStationRequest('falls-assessment', 'Can I get a pelvic x-ray for the hip bones?')
        ?.template.code
    ).toBe('pelvis_xray')
    expect(matchStationRequest('falls-assessment', 'Can I get a chest x-ray?')?.template.code).toBe(
      'cxr'
    )
    expect(lookupFindingTemplate('falls-assessment', 'show_examination', 'observations').rows).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'BP', value: '138/82 mmHg' })])
    )
    expect(
      lookupFindingTemplate('falls-assessment', 'show_examination', 'lying_standing').rows.some(
        (row) => row.label === 'BP standing 1 min'
      )
    ).toBe(true)
    expect(matchStationRequest('falls-assessment', 'Can I get bloods?')?.template.code).toBe('bloods')
    expect(lookupFindingTemplate('falls-assessment', 'show_investigation', 'bloods').rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'CRP', value: '3 mg/L', flag: 'normal' }),
        expect.objectContaining({ label: 'WCC', flag: 'normal' }),
      ])
    )
    expect(lookupFindingTemplate('falls-assessment', 'show_investigation', 'ecg').imageSrc).toBe(
      '/findings/abdominal-pain-ecg.jpg'
    )
    expect(lookupFindingTemplate('falls-assessment', 'show_investigation', 'cxr').imageSrc).toBe(
      '/findings/abdominal-pain-cxr.jpg'
    )
    expect(
      matchStationRequest('abdominal-pain', 'Have you taken any pregnancy test at home?')
    ).toBeNull()
    expect(matchStationRequest('abdominal-pain', 'Can I listen to your heart?')?.template.kind).toBe(
      'unavailable'
    )
  })
})
