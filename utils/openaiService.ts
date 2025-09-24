import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ConsultationMessage {
  role: 'doctor' | 'patient';
  content: string;
  timestamp: Date;
}

export interface ScoringResult {
  totalScore: number;
  maxScore: number;
  status: "PASS" | "FAIL";
  domainScores: {
    dataGathering: number;
    clinicalManagement: number;
    interpersonalSkills: number;
  };
  examinerNotes: string;
  strengths: string[];
  areasForImprovement: string[];
  nextSteps: string[];
  detailedAnalysis: {
    communication: string;
    clinicalReasoning: string;
    patientSafety: string;
    professionalism: string;
  };
  diagnosisEvaluation?: {
    correctDiagnosis: string;
    doctorDiagnosis: string;
    diagnosisCorrect: boolean;
    diagnosisReasoning: string;
  };
  // UK Medical School OSCE specific fields
  ukOSCEScores?: {
    communicationSkills: string;
    dataGathering: string;
    structure: string;
    summary: string;
    investigationsManagement: string;
    overallGrade: string;
    diagnosisCheck: string;
  };
}

export async function generateConsultationScore(
  messages: ConsultationMessage[],
  stationType: string,
  duration: number,
  correctDiagnosis?: string,
  diagnosisCriteria?: string[]
): Promise<ScoringResult> {
  try {
    const transcript = messages.map(msg => 
      `${msg.role.toUpperCase()}: ${msg.content}`
    ).join('\n');

    const prompt = `You are an expert medical examiner evaluating a clinical consultation. 

STATION: ${stationType}
DURATION: ${duration} minutes
${correctDiagnosis ? `CORRECT DIAGNOSIS: ${correctDiagnosis}` : ''}
${diagnosisCriteria ? `DIAGNOSIS CRITERIA: ${diagnosisCriteria.join(', ')}` : ''}
CONSULTATION TRANSCRIPT:
${transcript}

Please evaluate this consultation based on the following criteria (each scored out of 4 points, total 12 points):

1. DATA GATHERING, TECHNICAL & ASSESSMENT SKILLS (0-4 points):
   - History taking (presenting complaint, history of present illness, past medical history, medications, allergies, social history)
   - Physical examination approach
   - Clinical reasoning and differential diagnosis
   - Appropriate questioning techniques

2. CLINICAL MANAGEMENT SKILLS (0-4 points):
   - Treatment planning and management decisions
   - Patient safety considerations
   - Appropriate investigations
   - Follow-up planning
   - Risk assessment

3. INTERPERSONAL SKILLS (0-4 points):
   - Communication with patient
   - Empathy and rapport building
   - Professional behavior
   - Patient-centered care
   - Cultural sensitivity

SCORING CRITERIA:
- 4 points: Excellent performance, exceeds expectations
- 3 points: Good performance, meets expectations
- 2 points: Satisfactory performance, minor areas for improvement
- 1 point: Below expectations, significant areas for improvement
- 0 points: Unsatisfactory, major deficiencies

PASS MARK: 8/12 or higher (typical clinical examination standard)

${correctDiagnosis ? `
DIAGNOSIS EVALUATION:
- Analyze if the doctor made a diagnosis during the consultation
- Determine if the diagnosis was correct (${correctDiagnosis})
- Evaluate the reasoning behind the diagnosis
- Consider if the doctor asked appropriate questions to reach the correct diagnosis
` : ''}

IMPORTANT: You must respond with ONLY valid JSON. Do not include any text before or after the JSON. The response must be parseable JSON.

{
  "totalScore": 0,
  "maxScore": 12,
  "status": "FAIL",
  "domainScores": {
    "dataGathering": 0,
    "clinicalManagement": 0,
    "interpersonalSkills": 0
  },
  "examinerNotes": "Detailed written feedback about the consultation performance",
  "strengths": ["List of specific strengths demonstrated"],
  "areasForImprovement": ["List of specific areas needing improvement"],
  "nextSteps": ["Actionable recommendations for improvement"],
  "detailedAnalysis": {
    "communication": "Analysis of communication skills",
    "clinicalReasoning": "Analysis of clinical reasoning and decision-making",
    "patientSafety": "Analysis of patient safety considerations",
    "professionalism": "Analysis of professional behavior and ethics"
  }${correctDiagnosis ? `,
  "diagnosisEvaluation": {
    "correctDiagnosis": "${correctDiagnosis}",
    "doctorDiagnosis": "The diagnosis made by the doctor during the consultation",
    "diagnosisCorrect": false,
    "diagnosisReasoning": "Analysis of whether the doctor's diagnosis was correct and their reasoning"
  }` : ''}
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert medical examiner with extensive experience in clinical assessment and medical education. You provide fair, constructive, and detailed feedback to help medical professionals improve their clinical skills. You must respond with ONLY valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Clean the response to extract JSON
    let cleanedResponse = response.trim();
    
    // Remove any markdown code blocks if present
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Try to find JSON object in the response
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    console.log('OpenAI Response:', cleanedResponse);

    // Parse the JSON response
    const scoringResult = JSON.parse(cleanedResponse) as ScoringResult;
    
    // Validate the response structure
    if (typeof scoringResult.totalScore !== 'number' || !scoringResult.domainScores) {
      throw new Error('Invalid response format from OpenAI');
    }

    return scoringResult;

  } catch (error) {
    console.error('Error generating consultation score:', error);
    
    // Return a fallback score if OpenAI fails
    return {
      totalScore: 0,
      maxScore: 12,
      status: "FAIL",
      domainScores: {
        dataGathering: 0,
        clinicalManagement: 0,
        interpersonalSkills: 0
      },
      examinerNotes: "Unable to analyze consultation due to technical error. Please ensure you have a meaningful conversation with the patient and try again.",
      strengths: [],
      areasForImprovement: [
        "Technical error prevented analysis",
        "Please ensure stable internet connection",
        "Try conducting a full consultation"
      ],
      nextSteps: [
        "Check your internet connection",
        "Ensure you have a complete conversation with the patient",
        "Try the consultation again"
      ],
      detailedAnalysis: {
        communication: "Unable to analyze due to technical error",
        clinicalReasoning: "Unable to analyze due to technical error",
        patientSafety: "Unable to analyze due to technical error",
        professionalism: "Unable to analyze due to technical error"
      }
    };
  }
}

export async function generatePsoriaticArthritisScore(
  messages: ConsultationMessage[],
  duration: number
): Promise<ScoringResult> {
  try {
    const transcript = messages.map(msg => 
      `${msg.role.toUpperCase()}: ${msg.content}`
    ).join('\n');

    const prompt = `You are an examiner marking a UK medical school OSCE station. 
You will be given a transcript of the student taking a history from a patient. 
Grade the performance using the UCL 5-domain scheme. 
Each domain should be scored as: Excellent, Clear Pass, Borderline Pass, Borderline Fail, or Clear Fail. 
Then provide an overall grade (A–E) with short feedback. 
Keep language concise, professional, and UK-focused. 

Domains to assess:

1. Communication Skills – rapport, introduction, active listening, use of lay language, appropriate closure. 
2. Data Gathering – coverage of presenting complaint (SOCRATES for pain), associated symptoms, relevant PMHx/DHx/FHx/SHx, ICE. 
3. Structure – logical flow (PC, HPC, PMHx, DHx, FHx, SHx, ICE), minimal repetition, good transitions. 
4. Summary – concise and accurate summary of positives and negatives, showing clinical reasoning. 
5. Investigations & Management Plan – suggests appropriate initial Ix (bloods, X-ray, inflammatory markers, antibodies) and sensible Mx (analgesia, DMARDs, biologics, lifestyle advice). 

Overall Grade: 
- A = Excellent (strong in most domains, no weak area) 
- B = Clear Pass (safe, competent, only minor gaps) 
- C = Borderline Pass (covers most areas but shallow/missed some) 
- D = Borderline Fail (major gaps in key areas) 
- E = Clear Fail (unsafe or unable to complete task) 

Extra Feature: 
- **Diagnosis check:** Did the student correctly identify *psoriatic arthritis* (or strongly suggest it as a leading differential)? 
  - Output as: Correct / Partially correct / Incorrect, with a 1-sentence justification. 

CONSULTATION TRANSCRIPT:
${transcript}

Output format: 
Communication Skills: [Grade + 1–2 sentences feedback] 
Data Gathering: [Grade + feedback] 
Structure: [Grade + feedback] 
Summary: [Grade + feedback] 
Investigations & Management: [Grade + feedback] 
Overall Grade: [A–E] 
Diagnosis check: [Correct / Partially correct / Incorrect + justification] 

What the candidate did well: 
- [bullet points] 

What the candidate could do to score higher: 
- [bullet points] 

IMPORTANT: You must respond with ONLY valid JSON. Do not include any text before or after the JSON.

{
  "totalScore": 0,
  "maxScore": 5,
  "status": "FAIL",
  "domainScores": {
    "dataGathering": 0,
    "clinicalManagement": 0,
    "interpersonalSkills": 0
  },
  "examinerNotes": "Detailed written feedback about the consultation performance",
  "strengths": ["List of specific strengths demonstrated"],
  "areasForImprovement": ["List of specific areas needing improvement"],
  "nextSteps": ["Actionable recommendations for improvement"],
  "detailedAnalysis": {
    "communication": "Analysis of communication skills",
    "clinicalReasoning": "Analysis of clinical reasoning and decision-making",
    "patientSafety": "Analysis of patient safety considerations",
    "professionalism": "Analysis of professional behavior and ethics"
  },
  "diagnosisEvaluation": {
    "correctDiagnosis": "Psoriatic Arthritis",
    "doctorDiagnosis": "The diagnosis made by the doctor during the consultation",
    "diagnosisCorrect": false,
    "diagnosisReasoning": "Analysis of whether the doctor's diagnosis was correct and their reasoning"
  },
  "ukOSCEScores": {
    "communicationSkills": "Grade + feedback",
    "dataGathering": "Grade + feedback",
    "structure": "Grade + feedback",
    "summary": "Grade + feedback",
    "investigationsManagement": "Grade + feedback",
    "overallGrade": "A-E",
    "diagnosisCheck": "Correct/Partially correct/Incorrect + justification"
  }
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert medical examiner with extensive experience in UK medical school OSCE assessment and medical education. You provide fair, constructive, and detailed feedback to help medical professionals improve their clinical skills. You must respond with ONLY valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Clean the response to extract JSON
    let cleanedResponse = response.trim();
    
    // Remove any markdown code blocks if present
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Try to find JSON object in the response
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    console.log('OpenAI Psoriatic Arthritis Response:', cleanedResponse);

    // Parse the JSON response
    const scoringResult = JSON.parse(cleanedResponse) as ScoringResult;
    
    // Validate the response structure
    if (typeof scoringResult.totalScore !== 'number' || !scoringResult.domainScores) {
      throw new Error('Invalid response format from OpenAI');
    }

    return scoringResult;

  } catch (error) {
    console.error('Error generating psoriatic arthritis score:', error);
    
    // Return a fallback score if OpenAI fails
    return {
      totalScore: 0,
      maxScore: 5,
      status: "FAIL",
      domainScores: {
        dataGathering: 0,
        clinicalManagement: 0,
        interpersonalSkills: 0
      },
      examinerNotes: "Unable to analyze consultation due to technical error. Please ensure you have a meaningful conversation with the patient and try again.",
      strengths: [],
      areasForImprovement: [
        "Technical error prevented analysis",
        "Please ensure stable internet connection",
        "Try conducting a full consultation"
      ],
      nextSteps: [
        "Check your internet connection",
        "Ensure you have a complete conversation with the patient",
        "Try the consultation again"
      ],
      detailedAnalysis: {
        communication: "Unable to analyze due to technical error",
        clinicalReasoning: "Unable to analyze due to technical error",
        patientSafety: "Unable to analyze due to technical error",
        professionalism: "Unable to analyze due to technical error"
      },
      diagnosisEvaluation: {
        correctDiagnosis: "Psoriatic Arthritis",
        doctorDiagnosis: "Unable to determine due to technical error",
        diagnosisCorrect: false,
        diagnosisReasoning: "Unable to analyze due to technical error"
      },
      ukOSCEScores: {
        communicationSkills: "Unable to assess due to technical error",
        dataGathering: "Unable to assess due to technical error",
        structure: "Unable to assess due to technical error",
        summary: "Unable to assess due to technical error",
        investigationsManagement: "Unable to assess due to technical error",
        overallGrade: "E",
        diagnosisCheck: "Unable to assess due to technical error"
      }
    };
  }
}
