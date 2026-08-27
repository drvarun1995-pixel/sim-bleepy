export type FindingKind =
  | 'examination'
  | 'observations'
  | 'labs'
  | 'imaging'
  | 'unavailable'

export type FindingFlag = 'normal' | 'abnormal' | 'trace' | 'info'

export type FindingRow = {
  label: string
  value: string
  flag?: FindingFlag
}

export type FindingTemplate = {
  code: string
  kind: FindingKind
  title: string
  rows: FindingRow[]
  examinerNote: string
  spokenAck: string
  imageSrc?: string
  imageAlt?: string
  /** When false, the image is shown without the report table or examiner note. */
  showReport?: boolean
}

export type StationFindingsCatalog = {
  patientName: string
  patientLine: string
  examinations: Record<string, FindingTemplate>
  investigations: Record<string, FindingTemplate>
}

export type StationFinding = FindingTemplate & {
  instanceId: string
  toolCallId: string
  stationId: string
  requestedCode: string
  openedAt: string
  patientName: string
  patientLine: string
}

export type FindingsPreviewAction = {
  label: string
  tool: 'show_examination' | 'show_investigation'
  key: string
}

const REGION_ALIASES: Record<string, string> = {
  abdomen: 'abdomen',
  abdominal: 'abdomen',
  tummy: 'abdomen',
  belly: 'abdomen',
  abdo: 'abdomen',
  suprapubic: 'abdomen',
  chest: 'chest',
  heart: 'heart',
  cardiac: 'heart',
  lungs: 'lungs',
  chest_exam: 'chest',
  legs: 'legs',
  neuro: 'neuro',
  neurological: 'neuro',
  rectal: 'rectal',
  pr: 'rectal',
  observations: 'observations',
  observation: 'observations',
  obs: 'observations',
  ops: 'observations',
  opps: 'observations',
  vitals: 'observations',
  vital_signs: 'observations',
  news: 'observations',
  news2: 'observations',
}

const TEST_ALIASES: Record<string, string> = {
  urine_dip: 'urine_dip',
  urine: 'urine_dip',
  dip: 'urine_dip',
  dipstick: 'urine_dip',
  urine_dipstick: 'urine_dip',
  msu: 'urine_dip',
  urinalysis: 'urine_dip',
  beta_hcg: 'beta_hcg',
  bhcg: 'beta_hcg',
  hcg: 'beta_hcg',
  pregnancy: 'beta_hcg',
  pregnancy_test: 'beta_hcg',
  urine_hcg: 'beta_hcg',
  fbc: 'fbc',
  cbc: 'fbc',
  full_blood_count: 'fbc',
  bloods: 'bloods',
  blood: 'bloods',
  blood_tests: 'bloods',
  ue: 'ue',
  u_e: 'ue',
  uande: 'ue',
  electrolytes: 'ue',
  urea_and_electrolytes: 'ue',
  crp: 'crp',
  lft: 'lft',
  lfts: 'lft',
  liver: 'lft',
  cxr: 'cxr',
  chest_xray: 'cxr',
  chest_x_ray: 'cxr',
  chest_radiograph: 'cxr',
  ecg: 'ecg',
  ekg: 'ecg',
  uss_abdomen: 'uss_abdomen',
  uss: 'uss_abdomen',
  ultrasound: 'uss_abdomen',
}

function normalizeKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/β/g, 'beta')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function normalizeRegion(raw: string): string {
  const key = normalizeKey(raw)
  return REGION_ALIASES[key] ?? key
}

export function normalizeTest(raw: string): string {
  const key = normalizeKey(raw)
  return TEST_ALIASES[key] ?? key
}

function unavailable(code: string): FindingTemplate {
  return {
    code,
    kind: 'unavailable',
    title: 'Not available in this station',
    rows: [
      { label: 'Request', value: code.replace(/_/g, ' '), flag: 'info' },
      { label: 'Result', value: 'No canned finding for this OSCE', flag: 'info' },
    ],
    examinerNote:
      'This test is not part of the station. Do not invent a report.',
    spokenAck: "I don't think that test is back yet.",
  }
}

const abdominalPain: StationFindingsCatalog = {
  patientName: 'Sarah Johnson',
  patientLine: '24F · ED',
  examinations: {
    abdomen: {
      code: 'abdomen',
      kind: 'examination',
      title: 'Abdominal examination',
      rows: [
        { label: 'Inspection', value: 'No scarring, distension, or visible masses', flag: 'normal' },
        { label: 'Palpation', value: 'Soft. Mild suprapubic tenderness', flag: 'abnormal' },
        { label: 'Peritonism', value: 'No rebound, guarding, or rigidity', flag: 'normal' },
        { label: 'Masses', value: 'None felt', flag: 'normal' },
        { label: 'Bowel sounds', value: 'Present', flag: 'normal' },
        { label: 'Renal angles', value: 'Non-tender', flag: 'normal' },
      ],
      examinerNote: 'Lower abdominal / suprapubic findings only. No acute abdomen.',
      spokenAck: "I've let you examine my tummy.",
    },
    observations: {
      code: 'observations',
      kind: 'observations',
      title: 'Observations',
      rows: [
        { label: 'HR', value: '92 bpm, regular', flag: 'abnormal' },
        { label: 'BP', value: '118/72 mmHg', flag: 'normal' },
        { label: 'Temp', value: '38.2 °C', flag: 'abnormal' },
        { label: 'RR', value: '16 /min', flag: 'normal' },
        { label: 'SpO2', value: '99% on air', flag: 'normal' },
      ],
      examinerNote: 'Low-grade fever and mild tachycardia. Haemodynamically stable.',
      spokenAck: 'The nurse has just done my observations.',
    },
    chest: unavailable('chest'),
    heart: unavailable('heart'),
    lungs: unavailable('lungs'),
    legs: unavailable('legs'),
    neuro: unavailable('neuro'),
    rectal: unavailable('rectal'),
  },
  investigations: {
    urine_dip: {
      code: 'urine_dip',
      kind: 'labs',
      title: 'Urine dipstick',
      rows: [
        { label: 'Leucocytes', value: 'Positive', flag: 'abnormal' },
        { label: 'Nitrites', value: 'Positive', flag: 'abnormal' },
        { label: 'Blood', value: 'Trace', flag: 'trace' },
        { label: 'Protein', value: 'Negative', flag: 'normal' },
        { label: 'Glucose', value: 'Negative', flag: 'normal' },
        { label: 'Ketones', value: 'Negative', flag: 'normal' },
      ],
      examinerNote: 'Consistent with UTI. Look at β-hCG separately if pregnancy is a concern.',
      spokenAck: 'The nurse has done the dip.',
    },
    beta_hcg: {
      code: 'beta_hcg',
      kind: 'labs',
      title: 'Urine pregnancy test (β-hCG)',
      rows: [{ label: 'β-hCG', value: 'Negative', flag: 'normal' }],
      examinerNote:
        'Negative in this station. The history still includes pregnancy anxiety from missed pills.',
      spokenAck: 'The pregnancy test is back.',
    },
    fbc: {
      code: 'fbc',
      kind: 'labs',
      title: 'Full blood count',
      rows: [
        { label: 'Hb', value: '132 g/L', flag: 'normal' },
        { label: 'WCC', value: '12.1 ×10⁹/L', flag: 'abnormal' },
        { label: 'Neutrophils', value: '8.9 ×10⁹/L', flag: 'abnormal' },
        { label: 'Platelets', value: '268 ×10⁹/L', flag: 'normal' },
        { label: 'MCV', value: '88 fL', flag: 'normal' },
      ],
      examinerNote: 'Mild neutrophilia. Supports a simple bacterial infection.',
      spokenAck: 'The bloods are back.',
    },
    ue: {
      code: 'ue',
      kind: 'labs',
      title: 'Urea and electrolytes',
      rows: [
        { label: 'Na', value: '139 mmol/L', flag: 'normal' },
        { label: 'K', value: '4.1 mmol/L', flag: 'normal' },
        { label: 'Urea', value: '4.8 mmol/L', flag: 'normal' },
        { label: 'Creatinine', value: '62 µmol/L', flag: 'normal' },
        { label: 'eGFR', value: '>90', flag: 'normal' },
      ],
      examinerNote: 'Renal function normal. Safe for usual antibiotics.',
      spokenAck: 'The bloods are back.',
    },
    crp: {
      code: 'crp',
      kind: 'labs',
      title: 'C-reactive protein',
      rows: [{ label: 'CRP', value: '18 mg/L', flag: 'abnormal' }],
      examinerNote: 'Mildly raised. Not a septic picture.',
      spokenAck: 'The bloods are back.',
    },
    bloods: {
      code: 'bloods',
      kind: 'labs',
      title: 'Blood tests',
      rows: [
        { label: 'Hb', value: '132 g/L', flag: 'normal' },
        { label: 'WCC', value: '12.1 ×10⁹/L', flag: 'abnormal' },
        { label: 'Platelets', value: '268 ×10⁹/L', flag: 'normal' },
        { label: 'Na / K', value: '139 / 4.1 mmol/L', flag: 'normal' },
        { label: 'Creatinine', value: '62 µmol/L', flag: 'normal' },
        { label: 'CRP', value: '18 mg/L', flag: 'abnormal' },
      ],
      examinerNote: 'Mild inflammatory response. U&E normal.',
      spokenAck: 'The bloods are back.',
    },
    cxr: {
      code: 'cxr',
      kind: 'imaging',
      title: 'Chest radiograph',
      imageSrc: '/findings/abdominal-pain-cxr.jpg',
      imageAlt: 'PA chest radiograph, normal film',
      rows: [
        { label: 'Heart', value: 'Normal size and contour', flag: 'normal' },
        { label: 'Lungs', value: 'Clear. No consolidation', flag: 'normal' },
        { label: 'Pleura', value: 'No pneumothorax or effusion', flag: 'normal' },
        { label: 'Diaphragm', value: 'No free air under the diaphragm', flag: 'normal' },
        { label: 'Bones', value: 'No acute bony injury', flag: 'normal' },
      ],
      examinerNote: 'Normal film. Not indicated for uncomplicated UTI — still shown if requested.',
      spokenAck: 'The chest x-ray has been done.',
      showReport: false,
    },
    ecg: {
      code: 'ecg',
      kind: 'imaging',
      title: '12-lead ECG',
      imageSrc: '/findings/abdominal-pain-ecg.jpg',
      imageAlt: '12-lead ECG showing normal sinus rhythm',
      rows: [
        { label: 'Rhythm', value: 'Sinus rhythm', flag: 'normal' },
        { label: 'Rate', value: '75–80 bpm', flag: 'normal' },
        { label: 'Axis', value: 'Normal', flag: 'normal' },
        { label: 'PR / QRS', value: 'Normal intervals, narrow QRS', flag: 'normal' },
        { label: 'ST / T', value: 'No ischaemic change', flag: 'normal' },
      ],
      examinerNote: 'Normal ECG. Not indicated for uncomplicated UTI — still shown if requested.',
      spokenAck: 'The ECG has been done.',
      showReport: false,
    },
    lft: unavailable('lft'),
    uss_abdomen: unavailable('uss_abdomen'),
  },
}

export const stationFindingsCatalogs: Record<string, StationFindingsCatalog> = {
  'abdominal-pain': abdominalPain,
}

export const findingsPreviewActions: Record<string, FindingsPreviewAction[]> = {
  'abdominal-pain': [
    { label: 'Abdomen', tool: 'show_examination', key: 'abdomen' },
    { label: 'Obs', tool: 'show_examination', key: 'observations' },
    { label: 'Urine dip', tool: 'show_investigation', key: 'urine_dip' },
    { label: 'β-hCG', tool: 'show_investigation', key: 'beta_hcg' },
    { label: 'Bloods', tool: 'show_investigation', key: 'bloods' },
    { label: 'ECG', tool: 'show_investigation', key: 'ecg' },
    { label: 'CXR', tool: 'show_investigation', key: 'cxr' },
    { label: 'CT (none)', tool: 'show_investigation', key: 'ct_kub' },
  ],
}

export function stationHasFindings(stationId: string): boolean {
  return Boolean(stationFindingsCatalogs[stationId])
}

export function lookupFindingTemplate(
  stationId: string,
  toolName: string,
  rawCode: string
): FindingTemplate {
  const catalog = stationFindingsCatalogs[stationId]
  if (!catalog) return unavailable(rawCode || 'unknown')

  if (toolName === 'show_examination') {
    const region = normalizeRegion(rawCode)
    return catalog.examinations[region] ?? unavailable(region)
  }

  if (toolName === 'show_investigation') {
    const test = normalizeTest(rawCode)
    return catalog.investigations[test] ?? unavailable(test)
  }

  return unavailable(rawCode || toolName)
}

const INVESTIGATION_PHRASES: Array<{ pattern: RegExp; code: string }> = [
  { pattern: /\b(?:urine\s*)?dip(?:stick)?\b|\burinalysis\b|\bmsu\b|\burine\s+test\b/i, code: 'urine_dip' },
  { pattern: /\b(?:beta[\s-]?hcg|β[\s-]?hcg|pregnancy\s+test)\b|\bhcg\b/i, code: 'beta_hcg' },
  { pattern: /\bchest\s*x[\s-]?ray\b|\bcxr\b/i, code: 'cxr' },
  { pattern: /\bx[\s-]?ray\b/i, code: 'cxr' },
  { pattern: /\b(?:ecg|ekg|electrocardiogram)\b|\be[\s.\-]*c[\s.\-]*g\b/i, code: 'ecg' },
  { pattern: /\b(?:bloods|blood\s+tests?|fbc|u&e|crp|inflammatory\s+markers)\b/i, code: 'bloods' },
  { pattern: /\blfts?\b|\bliver\s+function\b/i, code: 'lft' },
  { pattern: /\bultrasound\b|\buss\b/i, code: 'uss_abdomen' },
  { pattern: /\bct\s*(?:scan|kub|abdomen|head)?\b|\bct\b/i, code: 'ct' },
]

const EXAMINATION_PHRASES: Array<{ pattern: RegExp; code: string }> = [
  {
    pattern:
      /\b(?:obs(?:ervations)?|ops|opps|vital\s*signs?|vitals|news\s*2?|news2|obs\s+chart)\b/i,
    code: 'observations',
  },
  { pattern: /\b(?:abdomen|abdominal|tummy|belly|stomach|suprapubic)\b/i, code: 'abdomen' },
  { pattern: /\b(?:chest exam|heart|cardiac|lungs?)\b/i, code: 'chest' },
]

const EXAM_CUE =
  /\b(?:examin(?:e|ation|ed|ing)|exams?\b|look at|have a look|palpat)/i

const STRONG_ORDER =
  /\b(?:can i (?:get|do|have)|could i (?:get|do|have)|may i (?:get|do|have)|can we (?:get|do|order|request)|could we (?:get|do|request)|we can (?:get|do|request|order)|maybe we can(?: (?:get|do|request|order))?|i['’]d like to (?:do|get|order|request)|i would like to (?:do|get|order)|please (?:get|do|order)|order(?: me)?(?: a| an| the)?|request(?: a| an| the)?|get me (?:a|an|the|some)|let me (?:get|do|examine|check)|let['’]?s (?:get|do|examine|order|request)|i want (?:a|an|to get|to do)|i need (?:a|an|to get|to do))\b/i

const RESULT_DISCUSSION =
  /\b(?:showed|shows|showing|shown|result|results|mean(?:s|ing)?|suggest(?:s|ed|ing)?|consistent with|looking at|based on|came back|your (?:urine|blood|ecg|ekg|x-?ray|dip|cxr|obs)|the (?:urine|dip(?:stick)?|ecg|x-?ray|bloods?|cxr) (?:show|is|was|look))\b/i

const HISTORY_QUESTION =
  /\b(?:have you (?:taken|done|had)|did you (?:take|do|have)|at home|already (?:done|taken|had)|previously)\b/i

export function normalizeFindingTrigger(text: string): string {
  return text
    .toLowerCase()
    .replace(/[?.!,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isShortTestOrder(text: string): boolean {
  const s = normalizeFindingTrigger(text)
  if (!s || s.split(' ').length > 8) return false
  const stripped = s
    .replace(/^(please|can i|could i|may i|can we|could we)\s+/i, '')
    .replace(/^(get|do|order|request|have)\s+/i, '')
    .replace(/^(a|an|the|some)\s+/i, '')
    .replace(/\s+please$/i, '')
  return INVESTIGATION_PHRASES.some(({ pattern }) => pattern.test(stripped))
}

function isShortObsOrder(text: string): boolean {
  const s = normalizeFindingTrigger(text)
  if (!s || s.split(' ').length > 6) return false
  return /^(?:please\s+)?(?:(?:can i|could i|may i|can we|could we)\s+)?(?:(?:get|do|check|take)\s+)?(?:(?:a|an|the|some)\s+)?(?:obs(?:ervations)?|ops|opps|vitals|vital signs|news\s*2?)$/.test(
    s
  )
}

/** Hume sometimes speaks the tool instead of calling it. Hide those lines in chat. */
export function isToolLeakSpeech(text: string): boolean {
  const t = text.trim()
  if (!t) return true
  if (/^\{[\s\S]*"type"\s*:/i.test(t)) return true
  if (/\bshow[_\s-]*investigation\b/i.test(t)) return true
  if (/\bshow[_\s-]*examination\b/i.test(t)) return true
  if (/^test:\s*/i.test(t)) return true
  if (/^region:\s*/i.test(t)) return true
  return false
}

/** Hume panic / “I’m just a patient” loops. Hide from the live transcript. */
export function isPatientFillerSpeech(text: string): boolean {
  const t = text.trim()
  if (!t) return true
  if (isToolLeakSpeech(t)) return true
  if (/i(?:['’]m| am) not a doctor/i.test(t)) return true
  if (/\bjust a patient\b/i.test(t)) return true
  if (/not (really )?familiar with (medical )?tests/i.test(t)) return true
  if (/i don['’]t know/.test(t) && /(test|that|doctor|x-?ray|ecg|dip|medical)/i.test(t)) {
    return true
  }
  if (/i don['’]t know about that/i.test(t)) return true
  if (/what would you like to (do|examine|check) next/i.test(t)) return true
  if (/please go ahead/i.test(t)) return true
  if (/tell me (what you find|if it['’]?s serious)/i.test(t)) return true
  if (/just want to feel better/i.test(t)) return true
  if (/just want to know what['’]?s wrong/i.test(t)) return true
  if (/okay doctor, i understand/i.test(t)) return true
  if (/do what you need to check me/i.test(t)) return true
  if (/the pain is really bothering me/i.test(t)) return true
  if (/still in pain and worried/i.test(t)) return true
  if (/i(?:['’]m| am) really (scared|worried)/i.test(t) && t.length < 140) return true
  if (/\bthe doctor\b/i.test(t)) return true
  if (/comes back to talk/i.test(t)) return true
  if (/trouble breathing/i.test(t)) return true
  if (/should we check (it|that|my)\b/i.test(t)) return true
  if (/does that matter/i.test(t)) return true
  if (/is that tenderness/i.test(t)) return true
  if (/blood tests are important/i.test(t)) return true
  if (/check my abdomen now/i.test(t)) return true
  if (/please do (the )?(urine|blood|chest|ecg|exam|test|dip)/i.test(t)) return true
  if (/yes[,—–-]?\s*please do bloods/i.test(t)) return true
  return false
}

export function isShortPatientAck(text: string): boolean {
  return /^(okay|ok|sure|yes|alright|all right)[.!?]*$/i.test(text.trim())
}

/** Drop volunteered extras Hume tacks onto a real history answer. */
export function scrubPatientUtterance(text: string): string {
  if (isPatientFillerSpeech(text)) return ''
  return text
    .replace(/\s*(?:sure[,—–-]?\s*)?go ahead and examine[^.!?]*[.!?]?/gi, '')
    .replace(/\s*i['’]m also[^.!?]*[.!?]?/gi, '')
    .replace(/\s*should we check[^.!?]*[.!?]?/gi, '')
    .replace(/\s*does that matter[^.!?]*[.!?]?/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export type MatchedStationRequest = {
  tool: 'show_examination' | 'show_investigation'
  template: FindingTemplate
}

export type StationRequestDiagnosis = {
  text: string
  matched: boolean
  code: string | null
  tool: 'show_examination' | 'show_investigation' | null
  investigationHit: string | null
  examHit: string | null
  flags: {
    strongOrder: boolean
    shortTestOrder: boolean
    shortObsOrder: boolean
    examCue: boolean
    resultDiscussion: boolean
    askedForObs: boolean
    identityOnly: boolean
    toolLeak: boolean
    mentionsBloodPressure: boolean
    historyQuestion: boolean
  }
  blockedBy: string | null
  reason: string
}

function firstInvestigationHit(text: string): string | null {
  for (const { pattern, code } of INVESTIGATION_PHRASES) {
    if (pattern.test(text)) return code
  }
  return null
}

function firstExamHit(text: string, askedForObs: boolean, examCue: boolean): string | null {
  if (!examCue && !askedForObs) return null
  for (const { pattern, code } of EXAMINATION_PHRASES) {
    if (code === 'observations' && !askedForObs) continue
    if (pattern.test(text)) return code
  }
  return null
}

/** Explain why a spoken line would or would not open a findings card. */
export function diagnoseStationRequest(
  stationId: string,
  text: string
): StationRequestDiagnosis {
  const t = text.trim()
  const empty: StationRequestDiagnosis = {
    text: t,
    matched: false,
    code: null,
    tool: null,
    investigationHit: null,
    examHit: null,
    flags: {
      strongOrder: false,
      shortTestOrder: false,
      shortObsOrder: false,
      examCue: false,
      resultDiscussion: false,
      askedForObs: false,
      identityOnly: false,
      toolLeak: false,
      mentionsBloodPressure: false,
      historyQuestion: false,
    },
    blockedBy: t ? null : 'empty',
    reason: t ? 'no_match' : 'empty',
  }
  if (!t) return empty

  const toolLeakInv = t.match(
    /show[_\s-]*investigation(?:[\s_-]*test)?[:\s_-]+([a-z][a-z\s_-]{1,40})/i
  )
  const toolLeakExam = t.match(
    /show[_\s-]*examination(?:[\s_-]*region)?[:\s_-]+([a-z][a-z\s_-]{1,40})/i
  )
  const investigationHit = firstInvestigationHit(t)
  const askedForObs =
    /\b(?:obs(?:ervations)?|ops|opps|vital\s*signs?|vitals|news\s*2?|news2)\b/i.test(t)
  const examCue = EXAM_CUE.test(t)
  const hasExamPhrase = EXAMINATION_PHRASES.some(({ pattern }) => pattern.test(t))
  const flags = {
    strongOrder: STRONG_ORDER.test(t),
    shortTestOrder: isShortTestOrder(t),
    shortObsOrder: isShortObsOrder(t),
    examCue,
    resultDiscussion: RESULT_DISCUSSION.test(t),
    askedForObs,
    identityOnly:
      /\b(?:name|age|date of birth|\bdob\b|who are you)\b/i.test(t) &&
      !investigationHit &&
      !hasExamPhrase,
    toolLeak: Boolean(toolLeakInv?.[1] || toolLeakExam?.[1] || isToolLeakSpeech(t)),
    mentionsBloodPressure: /\bblood\s+pressure\b|\bbp\b/i.test(t),
    historyQuestion: HISTORY_QUESTION.test(t),
  }
  const examHit = firstExamHit(t, askedForObs, examCue)

  const base = {
    text: t,
    investigationHit,
    examHit,
    flags,
  }

  if (toolLeakInv?.[1]) {
    const template = lookupFindingTemplate(stationId, 'show_investigation', toolLeakInv[1])
    return {
      ...base,
      matched: true,
      code: template.code,
      tool: 'show_investigation',
      blockedBy: null,
      reason: `tool_leak_investigation:${template.code}`,
    }
  }
  if (toolLeakExam?.[1]) {
    const template = lookupFindingTemplate(stationId, 'show_examination', toolLeakExam[1])
    return {
      ...base,
      matched: true,
      code: template.code,
      tool: 'show_examination',
      blockedBy: null,
      reason: `tool_leak_examination:${template.code}`,
    }
  }

  if (flags.identityOnly) {
    return {
      ...base,
      matched: false,
      code: null,
      tool: null,
      blockedBy: 'identity_only',
      reason: 'identity_question_not_a_test_request',
    }
  }

  if (flags.historyQuestion && !flags.strongOrder) {
    return {
      ...base,
      matched: false,
      code: null,
      tool: null,
      blockedBy: 'history_question',
      reason: 'asking_if_the_patient_already_did_the_test',
    }
  }

  if (flags.resultDiscussion && !flags.strongOrder) {
    return {
      ...base,
      matched: false,
      code: null,
      tool: null,
      blockedBy: 'result_discussion',
      reason: 'explaining_results_not_ordering',
    }
  }

  const looksLikeRequest =
    flags.strongOrder || flags.shortTestOrder || flags.shortObsOrder || flags.examCue
  if (!looksLikeRequest) {
    return {
      ...base,
      matched: false,
      code: null,
      tool: null,
      blockedBy: investigationHit || examHit ? 'no_request_cue' : 'no_test_or_exam_phrase',
      reason: investigationHit
        ? `mentioned_${investigationHit}_but_not_an_order`
        : examHit
          ? `mentioned_${examHit}_but_not_an_order`
          : 'no_match',
    }
  }

  if (investigationHit) {
    const template = lookupFindingTemplate(stationId, 'show_investigation', investigationHit)
    return {
      ...base,
      matched: true,
      code: template.code,
      tool: 'show_investigation',
      blockedBy: null,
      reason: `speech_order:${template.code}`,
    }
  }

  if (examHit) {
    const template = lookupFindingTemplate(stationId, 'show_examination', examHit)
    return {
      ...base,
      matched: true,
      code: template.code,
      tool: 'show_examination',
      blockedBy: null,
      reason: `speech_order:${template.code}`,
    }
  }

  return {
    ...base,
    matched: false,
    code: null,
    tool: null,
    blockedBy: 'request_cue_without_known_test',
    reason: 'looks_like_a_request_but_no_known_test',
  }
}

/**
 * Parse a spoken request (doctor, or leaked patient tool speech) into a finding.
 * Used as a fallback when Hume talks about the test instead of calling the tool.
 */
export function matchStationRequest(
  stationId: string,
  text: string
): MatchedStationRequest | null {
  const diagnosis = diagnoseStationRequest(stationId, text)
  if (!diagnosis.matched || !diagnosis.tool || !diagnosis.code) return null
  return {
    tool: diagnosis.tool,
    template: lookupFindingTemplate(stationId, diagnosis.tool, diagnosis.code),
  }
}

export function getStationPatientMeta(stationId: string): {
  patientName: string
  patientLine: string
} {
  const catalog = stationFindingsCatalogs[stationId]
  return {
    patientName: catalog?.patientName ?? 'Patient',
    patientLine: catalog?.patientLine ?? 'OSCE',
  }
}

export type StationTranscriptLine = {
  role: 'doctor' | 'patient'
  content: string
  timestamp: Date
  key: string
}

const PATIENT_BURST_MS = 4000
const STREAMING_REVISION_MS = 12_000
const TRANSCRIPT_STOPWORDS = new Set([
  'um',
  'uh',
  'er',
  'ah',
  'okay',
  'ok',
  'mm',
  'mmhmm',
  'mmm',
  'yeah',
  'yup',
  'yes',
  'like',
  'so',
  'the',
  'and',
  'any',
  'for',
  'you',
  'your',
  'can',
  'get',
  'have',
  'did',
  'does',
  'with',
  'that',
  'this',
  'from',
  'about',
])

function foldTranscriptText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function transcriptContentWords(text: string): string[] {
  return foldTranscriptText(text)
    .split(' ')
    .filter((word) => word.length > 2 && !TRANSCRIPT_STOPWORDS.has(word))
}

export function isStreamingRevision(previous: string, next: string): boolean {
  const a = foldTranscriptText(previous)
  const b = foldTranscriptText(next)
  if (!a || !b) return !a && !b
  if (a === b) return true
  if (b.startsWith(a) || a.startsWith(b)) return true
  const words = transcriptContentWords(previous)
  if (words.length < 2) return false
  const hits = words.filter((word) => b.includes(word)).length
  return hits / words.length >= 0.8 && b.length >= a.length * 0.9
}

function pickStreamingContent(previous: string, next: string): string {
  return foldTranscriptText(next).length >= foldTranscriptText(previous).length ? next : previous
}

/** Hume STT sends growing drafts of the same spoken turn. Keep the final sentence. */
export function collapseStreamingTurns<
  T extends { role: string; content: string; timestamp: Date | string },
>(lines: T[]): T[] {
  const out: T[] = []
  for (const line of lines) {
    const content = line.content.trim()
    if (!content) continue
    const prev = out[out.length - 1]
    if (!prev || prev.role !== line.role) {
      out.push({ ...line, content })
      continue
    }
    const dt = Math.abs(
      new Date(line.timestamp).getTime() - new Date(prev.timestamp).getTime()
    )
    if (dt <= STREAMING_REVISION_MS && isStreamingRevision(prev.content, content)) {
      out[out.length - 1] = {
        ...prev,
        content: pickStreamingContent(prev.content, content),
        timestamp: line.timestamp,
      }
      continue
    }
    out.push({ ...line, content })
  }
  return out
}

/** Drop Hume filler and merge rapid patient bursts into one bubble. */
export function visibleStationTranscript(
  lines: Array<{
    role: 'doctor' | 'patient'
    content: string
    timestamp: Date | string
    key?: string
  }>,
  stationId = 'abdominal-pain'
): StationTranscriptLine[] {
  const out: StationTranscriptLine[] = []
  let awaitingAck = false

  for (const line of collapseStreamingTurns(lines)) {
    const raw = line.content.trim()
    if (!raw) continue

    if (line.role === 'doctor') {
      awaitingAck = Boolean(matchStationRequest(stationId, raw))
      const timestamp = new Date(line.timestamp)
      out.push({
        role: 'doctor',
        content: raw,
        timestamp,
        key: line.key ?? `doctor-${timestamp.getTime()}-${raw.slice(0, 24)}`,
      })
      continue
    }

    if (awaitingAck && !isShortPatientAck(raw) && !isToolLeakSpeech(raw)) {
      continue
    }

    const content = scrubPatientUtterance(raw)
    if (!content) continue
    if (awaitingAck && !isShortPatientAck(content)) continue

    const timestamp = new Date(line.timestamp)
    const prev = out[out.length - 1]
    if (
      prev?.role === 'patient' &&
      timestamp.getTime() - prev.timestamp.getTime() < PATIENT_BURST_MS &&
      !prev.content.includes(content)
    ) {
      prev.content = `${prev.content} ${content}`
      continue
    }

    out.push({
      role: 'patient',
      content,
      timestamp,
      key: line.key ?? `patient-${timestamp.getTime()}-${content.slice(0, 24)}`,
    })
  }
  return out
}
