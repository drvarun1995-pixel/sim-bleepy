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
  'shortness-breath': {
    id: 'shortness-breath',
    name: 'Shortness of Breath in an Asthmatic Patient',
    description: 'A 30-year-old asthmatic patient presents with increasing dyspnea and cough.',
    duration: DEFAULT_STATION_DURATION,
    available: false,
    patientProfile: {
      age: 30,
      gender: 'female',
      presentingComplaint: 'shortness of breath and cough',
      background: 'Ms. Jane Smith, a 30-year-old female, presents with sudden onset shortness of breath. She has a known history of asthma, for which she uses an inhaler intermittently. She reports feeling tight in her chest and has been wheezing. She denies fever or cough. She appears distressed and is using accessory muscles to breathe.'
    },
    humeConfigId: process.env.NEXT_PUBLIC_HUME_CONFIG_SHORTNESS_BREATH,
    keyAreas: ['Asthma assessment', 'Medication review', 'Trigger identification', 'Communication', 'Treatment planning'],
    difficulty: 'Advanced'
  }
};

export const getStationConfig = (stationId: string): StationConfig | null => {
  return stationConfigs[stationId] || null;
};
