export const SIMULATION_FELLOWSHIP_MAX_FILE_SIZE = 25 * 1024 * 1024

export const SIMULATION_FELLOWSHIP_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]

export const SIMULATION_FELLOWSHIP_STORAGE_BUCKET = 'Simulation Fellowship'

export type SimulationFellowshipRequirement = {
  key: string
  title: string
  folder: string
  hours: number
  evidence: string
  alsoCounts?: string
  bsafeVr: boolean
}

export const SIMULATION_FELLOWSHIP_REQUIREMENTS: SimulationFellowshipRequirement[] = [
  {
    key: 'elfh-modules',
    title: 'Complete the 6 e-LfH Simulation Faculty Development modules',
    folder: 'eLFH modules',
    hours: 12,
    evidence: 'e-LfH certificates',
    alsoCounts: 'e-LfH modules you do for BSF',
    bsafeVr: false,
  },
  {
    key: 'diamond-debrief',
    title: 'Understand the Diamond Debrief model used at Basildon and compare it with previous feedback practice',
    folder: 'Diamond model comparison',
    hours: 1,
    evidence: 'Portfolio reflection',
    bsafeVr: false,
  },
  {
    key: 'debriefing-course',
    title: 'Attend debriefing course',
    folder: 'Debriefing course',
    hours: 3,
    evidence: 'Attendance certificate, portfolio reflection',
    alsoCounts: 'CTF induction with Wilson, BSF',
    bsafeVr: false,
  },
  {
    key: 'observe-vr',
    title: 'Observe a Virtual Reality (VR) session',
    folder: 'Observe VR',
    hours: 4,
    evidence: 'Attendance certificate, portfolio reflection',
    alsoCounts: 'Being present in VR (VR is currently run by consultants)',
    bsafeVr: true,
  },
  {
    key: 'facilitate-vr',
    title: 'Facilitate one VR session',
    folder: 'Facilitate VR',
    hours: 4,
    evidence: 'Letter of appreciation',
    alsoCounts: 'Being present in VR (VR is currently run by consultants)',
    bsafeVr: true,
  },
  {
    key: 'high-fidelity',
    title: 'Attend high-fidelity simulation as faculty (in-situ or Sim Suite)',
    folder: 'Facilitate BSAFE',
    hours: 8,
    evidence: 'Attendance certificate, portfolio reflection',
    alsoCounts: 'Role playing + debrief',
    bsafeVr: true,
  },
  {
    key: 'observed-debrief',
    title: 'Be observed facilitating a debrief session and reflect on feedback received',
    folder: 'Debrief BSAFE',
    hours: 8,
    evidence: 'Feedback and reflection',
    alsoCounts: 'Role playing + debrief',
    bsafeVr: true,
  },
  {
    key: 'observed-skills',
    title: 'Be observed facilitating a skills teaching session and reflect on feedback received',
    folder: 'Clinical Skills',
    hours: 4,
    evidence: 'Feedback and reflection',
    alsoCounts: 'Clinical skills session run for students',
    bsafeVr: false,
  },
  {
    key: 'educational-project',
    title: 'Undertake an educational research/project (ideally aiming for presentation or publication)',
    folder: 'Educational Project',
    hours: 16,
    evidence: 'Initial project design and set-up established',
    alsoCounts: 'Does not need to be a publication — it needs to be a project aiming for publication or presentation',
    bsafeVr: false,
  },
]

export const SIMULATION_FELLOWSHIP_TOTAL_HOURS = SIMULATION_FELLOWSHIP_REQUIREMENTS.reduce(
  (sum, item) => sum + item.hours,
  0
)

export const SIMULATION_FELLOWSHIP_REQUIREMENT_KEYS = new Set(
  SIMULATION_FELLOWSHIP_REQUIREMENTS.map((item) => item.key)
)

export type SimulationFellowshipFile = {
  id: string
  requirement_key: string
  filename: string | null
  original_filename: string | null
  file_size: number | null
  file_type: string | null
  mime_type: string | null
  file_path: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export function requirementByKey(key: string) {
  return SIMULATION_FELLOWSHIP_REQUIREMENTS.find((item) => item.key === key)
}

export function filesForRequirement(
  files: SimulationFellowshipFile[],
  key: string
): SimulationFellowshipFile[] {
  return files.filter((file) => file.requirement_key === key && !!file.file_path)
}

export function isRequirementComplete(files: SimulationFellowshipFile[], key: string): boolean {
  return filesForRequirement(files, key).length > 0
}

export function simulationFellowshipProgress(files: SimulationFellowshipFile[]) {
  const pending = SIMULATION_FELLOWSHIP_REQUIREMENTS.filter(
    (item) => !isRequirementComplete(files, item.key)
  )
  const done = SIMULATION_FELLOWSHIP_REQUIREMENTS.filter((item) =>
    isRequirementComplete(files, item.key)
  )
  const hoursDone = done.reduce((sum, item) => sum + item.hours, 0)
  return {
    pending,
    done,
    hoursDone,
    hoursTotal: SIMULATION_FELLOWSHIP_TOTAL_HOURS,
    completeCount: done.length,
    totalCount: SIMULATION_FELLOWSHIP_REQUIREMENTS.length,
  }
}

export function sanitizeZipPart(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/\s+/g, ' ').trim() || 'untitled'
}

/** IMT-style path: UserName / requirement folder / file. No extra subfolders. */
export function simulationFellowshipStoragePath(
  userName: string,
  folder: string,
  filename: string
): string {
  const sanitizedUserName = userName.replace(/[^a-zA-Z0-9-_]/g, '_') || 'user'
  return `${sanitizedUserName}/${folder}/${filename}`
}

export function evidenceZipFilename(file: SimulationFellowshipFile): string {
  const raw = file.original_filename || file.filename || 'evidence'
  const sanitized = sanitizeZipPart(raw)
  const ext = (file.file_type || sanitized.split('.').pop() || 'bin').replace(/^\./, '')
  if (sanitized.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) return sanitized.slice(0, 120)
  return `${sanitized.slice(0, 100)}.${ext}`
}
