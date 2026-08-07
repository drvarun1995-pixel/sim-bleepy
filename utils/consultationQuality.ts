import { ConsultationMessage, ScoringResult } from '@/utils/openaiService';

export interface ConsultationQualityStats {
  doctorMessages: number;
  patientMessages: number;
  totalMessages: number;
  doctorWordCount: number;
  durationSeconds?: number;
}

export interface ConsultationQualityAssessment {
  isScorable: boolean;
  reason?: 'empty' | 'too_short' | 'insufficient_doctor_participation' | 'insufficient_dialogue';
  stats: ConsultationQualityStats;
}

const MIN_DOCTOR_MESSAGES = 3;
const MIN_PATIENT_MESSAGES = 2;
const MIN_DOCTOR_WORDS = 40;
const MIN_DURATION_SECONDS = 60;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function assessConsultationQuality(
  messages: ConsultationMessage[],
  durationSeconds?: number
): ConsultationQualityAssessment {
  const nonEmpty = messages.filter((m) => m.content?.trim().length > 0);
  const doctorMessages = nonEmpty.filter((m) => m.role === 'doctor');
  const patientMessages = nonEmpty.filter((m) => m.role === 'patient');
  const doctorWordCount = doctorMessages.reduce(
    (sum, m) => sum + countWords(m.content),
    0
  );

  const stats: ConsultationQualityStats = {
    doctorMessages: doctorMessages.length,
    patientMessages: patientMessages.length,
    totalMessages: nonEmpty.length,
    doctorWordCount,
    durationSeconds,
  };

  if (nonEmpty.length === 0) {
    return { isScorable: false, reason: 'empty', stats };
  }

  if (
    durationSeconds !== undefined &&
    durationSeconds > 0 &&
    durationSeconds < MIN_DURATION_SECONDS
  ) {
    return { isScorable: false, reason: 'too_short', stats };
  }

  if (
    doctorMessages.length < MIN_DOCTOR_MESSAGES ||
    doctorWordCount < MIN_DOCTOR_WORDS
  ) {
    return { isScorable: false, reason: 'insufficient_doctor_participation', stats };
  }

  if (patientMessages.length < MIN_PATIENT_MESSAGES) {
    return { isScorable: false, reason: 'insufficient_dialogue', stats };
  }

  return { isScorable: true, stats };
}

export function buildInsufficientConsultationScore(
  assessment: ConsultationQualityAssessment,
  correctDiagnosis?: string
): ScoringResult {
  const { stats, reason } = assessment;

  const examinerNotesByReason: Record<NonNullable<typeof reason>, string> = {
    empty:
      'No conversation was recorded. Please ensure you have a meaningful dialogue with the patient during the consultation.',
    too_short: `This consultation was too brief (${stats.durationSeconds ?? 0} seconds) to assess OSCE performance. A full station requires at least ${MIN_DURATION_SECONDS} seconds of active history taking.`,
    insufficient_doctor_participation: `Insufficient doctor participation was recorded (${stats.doctorMessages} doctor message(s), ${stats.doctorWordCount} words). The transcript does not contain enough clinical questioning to award marks.`,
    insufficient_dialogue: `The consultation did not include enough back-and-forth dialogue (${stats.patientMessages} patient message(s), ${stats.doctorMessages} doctor message(s)) to assess history taking fairly.`,
  };

  const areasByReason: Record<NonNullable<typeof reason>, string[]> = {
    empty: [
      'No conversation recorded',
      'Engage in a full consultation with the patient',
      'Check microphone and audio settings',
    ],
    too_short: [
      'Consultation ended before a meaningful assessment could take place',
      'Use the full station time for structured history taking',
      'Ask about onset, character, associated symptoms, and red flags',
    ],
    insufficient_doctor_participation: [
      'Doctor asked too few questions for a valid OSCE attempt',
      'Cover presenting complaint, history of presenting illness, and relevant systems review',
      'Do not end the station before completing a structured history',
    ],
    insufficient_dialogue: [
      'Two-way dialogue with the patient was too limited',
      'Allow the patient to respond and follow up with clarifying questions',
      'Build rapport before closing the consultation',
    ],
  };

  const reasonKey = reason ?? 'empty';

  return {
    totalScore: 0,
    maxScore: 12,
    status: 'FAIL',
    domainScores: {
      dataGathering: 0,
      clinicalManagement: 0,
      interpersonalSkills: 0,
    },
    examinerNotes: examinerNotesByReason[reasonKey],
    strengths: [],
    areasForImprovement: areasByReason[reasonKey],
    nextSteps: [
      'Conduct a complete consultation using the full station time',
      'Introduce yourself, take a structured history, and summarise before closing',
      'State your working diagnosis and management plan aloud before ending the call',
    ],
    detailedAnalysis: {
      communication: 'Not assessable — insufficient transcript.',
      clinicalReasoning: 'Not assessable — insufficient transcript.',
      patientSafety: 'Not assessable — insufficient transcript.',
      professionalism: 'Not assessable — insufficient transcript.',
    },
    ...(correctDiagnosis
      ? {
          diagnosisEvaluation: {
            correctDiagnosis,
            doctorDiagnosis: 'No diagnosis documented in transcript',
            diagnosisCorrect: false,
            diagnosisReasoning:
              'A diagnosis cannot be credited when the doctor did not conduct a sufficient consultation or state a diagnosis in the recorded transcript.',
          },
        }
      : {}),
  };
}
