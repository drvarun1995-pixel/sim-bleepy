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
    description: 'A 58-year-old man presents with chest pain. You are the doctor in the emergency department.',
    duration: DEFAULT_STATION_DURATION,
    available: true,
    patientProfile: {
      age: 58,
      gender: 'male',
      presentingComplaint: 'chest tightness on exertion',
      background: 'David Brown, 58, delivery driver. Presents with chest tightness on exertion that started 3 months ago, getting more frequent recently. Has hypertension, type 2 diabetes, smokes ~10 cigarettes/day (~20 pack-years), father had heart attack at 54. Takes ramipril 10mg OD, metformin 1g BD, atorvastatin 40mg nocte.'
    },
    humeConfigId: process.env.NEXT_PUBLIC_HUME_CONFIG_CHEST_PAIN,
    keyAreas: ['History taking', 'Physical examination', 'Differential diagnosis', 'Communication', 'Patient safety'],
    difficulty: 'Intermediate',
    correctDiagnosis: 'Stable Angina',
    diagnosisCriteria: [
      'Chest pain triggered by exertion or stress',
      'Pain relieved by rest or nitroglycerin',
      'Risk factors: hypertension, smoking, age >50',
      'Pain described as pressure, tightness, or crushing sensation',
      'May radiate to left arm, jaw, or back',
      'No acute ECG changes or elevated cardiac enzymes'
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
      gender: 'male',
      presentingComplaint: 'fall after standing up quickly',
      background: '72-year-old retired teacher, lives alone with walking stick. Collapsed at home after standing up quickly from sofa - felt dizzy then fell. No chest pain, palpitations, or shortness of breath. No seizure activity, tongue-biting, or incontinence. Past medical history: Hypertension, mild osteoarthritis. Medications: Amlodipine, bendroflumethiazide. Allergies: NKDA. Lives alone, independent with ADLs, one fall last year, occasional wine, never smoked.'
    },
    humeConfigId: process.env.NEXT_PUBLIC_HUME_CONFIG_POSTURAL_HYPOTENSION_FALL,
    keyAreas: ['History taking', 'Fall risk assessment', 'Differential diagnosis', 'Communication', 'Patient safety', 'Red flag screening'],
    difficulty: 'Advanced',
    correctDiagnosis: 'Postal Hypotension',
    diagnosisCriteria: [
      'Fall occurred after standing up quickly from sitting position',
      'Patient experienced dizziness before falling',
      'No cardiac symptoms (chest pain, palpitations, SOB)',
      'No neurological symptoms (weakness, numbness, speech/vision changes)',
      'No seizure features or loss of consciousness',
      'Hypertension medications (Amlodipine, bendroflumethiazide) may contribute',
      'No red flags: no significant head trauma, no anticoagulants, no prolonged LOC'
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
      presentingComplaint: 'worsening breathlessness over 2 days',
      background: '68-year-old retired builder, ex-smoker (40 pack-years, quit 5 years ago). 2-day history of worsening breathlessness, can only walk a few steps before stopping. Productive cough with green sputum. No chest pain. Past medical history: COPD, hypertension. Medications: Inhalers (SABA + LABA/ICS), amlodipine. Allergies: NKDA. Lives with wife, independent at baseline but limited exercise tolerance.'
    },
    humeConfigId: process.env.NEXT_PUBLIC_HUME_CONFIG_SHORTNESS_BREATH,
    keyAreas: ['History taking', 'Respiratory assessment', 'Differential diagnosis', 'Communication', 'Patient safety', 'Red flag screening'],
    difficulty: 'Intermediate',
    correctDiagnosis: 'COPD Exacerbation',
    diagnosisCriteria: [
      'Worsening breathlessness over 2 days',
      'Productive cough with green sputum',
      'Previous diagnosis of COPD',
      'Ex-smoker with significant pack-year history',
      'Limited exercise tolerance',
      'No cardiac symptoms (chest pain, orthopnoea, PND)',
      'No red flags: no haemoptysis, no syncope, no severe chest pain'
    ]
  }
};

export const getStationConfig = (stationId: string): StationConfig | null => {
  return stationConfigs[stationId] || null;
};
