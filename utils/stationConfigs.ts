export interface StationConfig {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  available: boolean;
  patientProfile: {
    age: number;
    gender: string;
    presentingComplaint: string;
    background: string;
  };
  humeConfigId?: string;
  keyAreas: string[];
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  correctDiagnosis?: string;
  diagnosisCriteria?: string[];
}

// Default duration for all stations (8 minutes)
export const DEFAULT_STATION_DURATION = 8;

export const stationConfigs: Record<string, StationConfig> = {
  'chest-pain': {
    id: 'chest-pain',
    name: 'Chest Pain Assessment',
    description: 'A 58-year-old man presents with chest pain. You are assessing them in the GP clinic.',
    duration: DEFAULT_STATION_DURATION,
    available: true,
    patientProfile: {
      age: 58,
      gender: 'male',
      presentingComplaint: 'chest pain when walking for the past 3 months',
      background: 'David Miller, 58-year-old taxi driver. 3-month history of central, heavy tightness across chest that comes on with exertion (walking 200m or climbing stairs), relieved by rest within 5 minutes. Sometimes radiates to left arm. Associated with slight breathlessness on exertion. Past medical history: Hypertension, high cholesterol. Medications: Amlodipine, simvastatin. Allergies: NKDA. Social: Smokes 10/day for 30 years, drinks socially, sedentary job, poor diet. Father died of heart attack at 62.'
    },
    humeConfigId: process.env.NEXT_PUBLIC_HUME_CONFIG_CHEST_PAIN,
    keyAreas: ['History taking', 'SOCRATES for pain', 'Cardiac risk factors', 'Red flag screening', 'Functional impact', 'Communication', 'Clinical reasoning'],
    difficulty: 'Intermediate',
    correctDiagnosis: 'Stable Angina',
    diagnosisCriteria: [
      'Central chest pain triggered by exertion (walking 200m, stairs)',
      'Pain relieved by rest within 5 minutes',
      'Heavy, tightness sensation across chest',
      'May radiate to left arm',
      'Risk factors: male, age 58, smoking, hypertension, family history',
      'No red flags: no pain at rest, no collapse, no acute features',
      'Exercise ECG shows pain and ST depression at 6 minutes'
    ]
  },
  'falls-assessment': {
    id: 'falls-assessment',
    name: 'Falls Assessment',
    description: 'A 72-year-old patient presents after a fall at home. You are assessing them in the emergency department.',
    duration: DEFAULT_STATION_DURATION,
    available: true,
    patientProfile: {
      age: 72,
      gender: 'female',
      presentingComplaint: 'collapsed after standing up quickly from sofa',
      background: 'Christine Miller, 72-year-old retired teacher. Collapsed at home after standing up quickly from sofa - felt dizzy then fell. Bruise on right hip, nothing broken. Lives alone, independent in ADLs, uses walking stick. Past medical history: Hypertension, mild osteoarthritis. Medications: Amlodipine, bendroflumethiazide. Allergies: NKDA. Social: Occasional wine, never smoked, one previous fall last year.'
    },
    humeConfigId: process.env.NEXT_PUBLIC_HUME_CONFIG_POSTURAL_HYPOTENSION_FALL,
    keyAreas: ['History taking', 'Fall circumstances', 'Postural BP assessment', 'Red flag screening', 'Independence assessment', 'Communication', 'Patient safety'],
    difficulty: 'Advanced',
    correctDiagnosis: 'Postural Hypotension',
    diagnosisCriteria: [
      'Fall occurred after standing up quickly from sitting position',
      'Patient experienced dizziness before falling',
      'No cardiac symptoms (chest pain, palpitations)',
      'No neurological symptoms (weakness, numbness, speech/vision changes)',
      'No seizure features or loss of consciousness',
      'Hypertension medications (Amlodipine, bendroflumethiazide) may contribute',
      'Postural blood pressure drop: lying 138/82, standing 118/70 (dizzy)',
      'No red flags: no head trauma, no anticoagulants, no prolonged LOC'
    ]
  },
  'shortness-of-breath': {
    id: 'shortness-of-breath',
    name: 'Shortness of Breath Assessment',
    description: 'A 68-year-old man presents with worsening breathlessness. You are assessing them in the emergency department.',
    duration: DEFAULT_STATION_DURATION,
    available: true,
    patientProfile: {
      age: 68,
      gender: 'male',
      presentingComplaint: 'worsening shortness of breath for 2 days',
      background: 'George Harris, 68-year-old retired builder. 2-day history of worsening shortness of breath, can only walk a few steps before stopping. Productive cough with green sputum. No chest pain. Past medical history: COPD, hypertension. Medications: Inhalers (SABA + LABA/ICS), amlodipine. Allergies: NKDA. Social: Ex-smoker (40 pack-years, quit 5 years ago), lives with wife, independent at baseline but limited exercise tolerance.'
    },
    humeConfigId: process.env.NEXT_PUBLIC_HUME_CONFIG_SHORTNESS_BREATH,
    keyAreas: ['History taking', 'Respiratory assessment', 'Infection screening', 'Smoking history', 'Functional impact', 'Red flag screening', 'Communication', 'Clinical reasoning'],
    difficulty: 'Intermediate',
    correctDiagnosis: 'COPD Exacerbation',
    diagnosisCriteria: [
      'Worsening shortness of breath for 2 days',
      'Can only walk a few steps before stopping',
      'Productive cough with green sputum',
      'Previous diagnosis of COPD',
      'Ex-smoker with significant pack-year history (40 pack-years)',
      'No cardiac symptoms (chest pain, orthopnoea, PND)',
      'No red flags: no haemoptysis, no syncope, no severe chest pain',
      'ABG shows type 2 respiratory failure (raised CO₂, low PaO₂)'
    ]
  },
  'joint-pain-assessment': {
    id: 'joint-pain-assessment',
    name: 'Joint Pain Assessment',
    description: 'A 53-year-old secretary presents with finger joint pain. You are taking a history in the rheumatology clinic.',
    duration: DEFAULT_STATION_DURATION,
    available: true,
    patientProfile: {
      age: 53,
      gender: 'female',
      presentingComplaint: 'finger joint pain for 6 months',
      background: 'Mrs Sophia Turner, 53-year-old secretary. 6-month history of aching and stiff finger joint pain, sometimes throbbing when swollen. Morning stiffness lasting ~30 minutes, improves with movement. Associated with nail pitting and rash on elbows. Past medical history: Psoriasis since 30s. Medications: Paracetamol as needed. Allergies: NKDA. Family history: Brother with psoriasis. Social: Non-smoker, occasional wine, worried about work impact and typing ability.'
    },
    humeConfigId: process.env.NEXT_PUBLIC_HUME_CONFIG_JOINT_PAIN_ASSESSMENT,
    keyAreas: ['History taking', 'SOCRATES for pain', 'Morning stiffness', 'Skin and nail changes', 'Psoriasis history', 'Work impact', 'Communication', 'Clinical reasoning'],
    difficulty: 'Intermediate',
    correctDiagnosis: 'Psoriatic Arthritis',
    diagnosisCriteria: [
      'Finger joint pain for 6 months',
      'Morning stiffness lasting ~30 minutes',
      'Aching and stiff joints, sometimes throbbing when swollen',
      'Associated psoriasis rash on elbows',
      'Nail pitting present',
      'Past medical history of psoriasis since 30s',
      'Family history of psoriasis (brother)',
      'No systemic features or red flags'
    ]
  },
  'abdominal-pain': {
    id: 'abdominal-pain',
    name: 'Abdominal Pain Assessment',
    description: 'A 24-year-old university student presents with lower abdominal pain. You are assessing them in the emergency department.',
    duration: DEFAULT_STATION_DURATION,
    available: true,
    patientProfile: {
      age: 24,
      gender: 'female',
      presentingComplaint: 'lower abdominal pain for 2 days',
      background: 'Sarah Johnson, 24-year-old university psychology student. 2-day history of dull, aching lower abdominal pain. Associated with increased urinary frequency and burning on urination. Sexually active with one partner, inconsistent combined oral contraceptive pill use. Last period 3 weeks ago, regular cycles. Past medical history: None. Medications: Combined oral contraceptive pill (inconsistent use). Allergies: NKDA. Social: Lives in student accommodation, drinks socially, non-smoker, anxious about possible pregnancy due to missed pills.'
    },
    humeConfigId: process.env.NEXT_PUBLIC_HUME_CONFIG_ABDOMINAL_PAIN,
    keyAreas: ['History taking', 'SOCRATES for pain', 'Urinary symptoms', 'Sexual history', 'Contraceptive history', 'Pregnancy assessment', 'Communication', 'Clinical reasoning'],
    difficulty: 'Intermediate',
    correctDiagnosis: 'Urinary Tract Infection (UTI)',
    diagnosisCriteria: [
      'Lower abdominal pain for 2 days',
      'Increased urinary frequency and dysuria',
      'Female gender of reproductive age',
      'Sexually active with pregnancy concerns',
      'Inconsistent contraceptive use',
      'No fever or systemic symptoms initially',
      'Urine dipstick positive for white cells and nitrites'
    ]
  },
  'constipation': {
    id: 'constipation',
    name: 'Constipation Assessment',
    description: 'A 67-year-old retired accountant presents with constipation. You are assessing them in the GP clinic.',
    duration: DEFAULT_STATION_DURATION,
    available: true,
    patientProfile: {
      age: 67,
      gender: 'male',
      presentingComplaint: 'constipation for 6 weeks',
      background: 'Robert Thompson, 67-year-old retired accountant. 6-week history of constipation with hard, difficult-to-pass stools. Opening bowels every 4-5 days (previously daily). No blood in stool, no weight loss. Associated with mild lower abdominal discomfort, relieved after passing stool. Past medical history: Hypertension, osteoarthritis. Medications: Amlodipine, co-codamol (started 2 months ago for knee pain). Allergies: NKDA. Social: Lives with wife, independent, reduced mobility due to knee pain, poor fluid intake, low-fibre diet. Concerned about bowel cancer as friend recently diagnosed.'
    },
    humeConfigId: process.env.NEXT_PUBLIC_HUME_CONFIG_CONSTIPATION,
    keyAreas: ['History taking', 'Bowel habit changes', 'Red flag screening', 'Medication review', 'Dietary assessment', 'Functional impact', 'Communication', 'Clinical reasoning'],
    difficulty: 'Basic',
    correctDiagnosis: 'Opioid-Induced Constipation',
    diagnosisCriteria: [
      'Constipation for 6 weeks with hard, difficult-to-pass stools',
      'Opening bowels every 4-5 days (previously daily)',
      'Started co-codamol (opioid) 2 months ago for knee pain',
      'Reduced mobility and poor fluid intake',
      'Low-fibre diet',
      'No red flags: no blood in stool, no weight loss, no family history',
      'Mild lower abdominal discomfort relieved after passing stool',
      'Examination: soft abdomen, palpable stool in left iliac fossa'
    ]
  }
};

export const getStationConfig = (stationId: string): StationConfig | null => {
  const config = stationConfigs[stationId];
  if (config) {
    console.log(`Loading station config for ${stationId}:`);
    console.log(`  - Name: ${config.name}`);
    console.log(`  - Hume Config ID: ${config.humeConfigId}`);
    console.log(`  - Env var check: ${process.env.NEXT_PUBLIC_HUME_CONFIG_JOINT_PAIN_ASSESSMENT}`);
    console.log(`  - Falls env var check: ${process.env.NEXT_PUBLIC_HUME_CONFIG_POSTURAL_HYPOTENSION_FALL}`);
  }
  return config || null;
};
