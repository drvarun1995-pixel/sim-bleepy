// Mock data for dashboard components until Supabase is set up

export const mockKPIs = {
  streak: 5,
  resumeLastSession: true,
  bestScore: 87,
  latestScore: 82
}

export const mockScoreTrend = [
  { date: '2024-01-01', score: 75 },
  { date: '2024-01-02', score: 78 },
  { date: '2024-01-03', score: 82 },
  { date: '2024-01-04', score: 80 },
  { date: '2024-01-05', score: 85 },
  { date: '2024-01-06', score: 87 },
  { date: '2024-01-07', score: 82 }
]

export const mockRadarData = [
  { domain: 'Data Gathering', score: 85 },
  { domain: 'Clinical Management', score: 78 },
  { domain: 'Communication', score: 92 },
  { domain: 'Red Flags', score: 75 }
]

export const mockAttempts = [
  {
    id: '1',
    date: '2024-01-07',
    station: 'Cardiac Emergency',
    duration: '15:30',
    overallScore: 82,
    dataGathering: 85,
    clinicalMgmt: 78,
    communication: 92,
    redFlags: 75,
    certificate: true
  },
  {
    id: '2',
    date: '2024-01-06',
    station: 'Respiratory Distress',
    duration: '12:45',
    overallScore: 87,
    dataGathering: 90,
    clinicalMgmt: 85,
    communication: 88,
    redFlags: 85,
    certificate: true
  },
  {
    id: '3',
    date: '2024-01-05',
    station: 'Trauma Assessment',
    duration: '18:20',
    overallScore: 80,
    dataGathering: 82,
    clinicalMgmt: 78,
    communication: 85,
    redFlags: 75,
    certificate: false
  }
]

export const mockSkillGaps = [
  {
    domain: 'Red Flags',
    score: 75,
    improvement: -5,
    suggestions: ['Focus on recognizing early warning signs', 'Practice emergency protocols']
  },
  {
    domain: 'Clinical Management',
    score: 78,
    improvement: 2,
    suggestions: ['Review treatment algorithms', 'Practice decision-making scenarios']
  }
]

export const mockStations = [
  { id: '1', name: 'Cardiac Emergency', specialty: 'Cardiology' },
  { id: '2', name: 'Respiratory Distress', specialty: 'Pulmonology' },
  { id: '3', name: 'Trauma Assessment', specialty: 'Emergency Medicine' },
  { id: '4', name: 'Pediatric Fever', specialty: 'Pediatrics' },
  { id: '5', name: 'Psychiatric Crisis', specialty: 'Psychiatry' }
]

export const mockCohorts = [
  { id: '1', name: 'Medical Students Year 3', org: 'University Hospital' },
  { id: '2', name: 'Nursing Students', org: 'Nursing School' },
  { id: '3', name: 'Residents', org: 'Teaching Hospital' }
]

export const mockStudents = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@university.edu',
    latestScore: 87,
    attempts: 12,
    lastActive: '2024-01-07'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@university.edu',
    latestScore: 92,
    attempts: 15,
    lastActive: '2024-01-07'
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike.chen@university.edu',
    latestScore: 78,
    attempts: 8,
    lastActive: '2024-01-06'
  }
]

export const mockLiveMetrics = {
  onlineUsers: 23,
  sessionsInProgress: 8,
  avgDuration: '14:32'
}

export const mockStationPerformance = [
  {
    id: '1',
    name: 'Cardiac Emergency',
    attempts: 156,
    completionRate: 94.2,
    medianScore: 82,
    difficultyDrift: -2.1
  },
  {
    id: '2',
    name: 'Respiratory Distress',
    attempts: 134,
    completionRate: 91.8,
    medianScore: 85,
    difficultyDrift: 1.3
  },
  {
    id: '3',
    name: 'Trauma Assessment',
    attempts: 98,
    completionRate: 87.7,
    medianScore: 78,
    difficultyDrift: -0.8
  }
]

export const mockTechHealth = {
  asrLatencyP50: 120,
  asrLatencyP95: 280,
  ttsLatencyP50: 95,
  ttsLatencyP95: 220,
  disconnectRate: 2.1,
  scoringFailCount: 12
}

export const mockCostTelemetry = {
  costPerSession: 0.47,
  providerBreakdown: {
    hume: 0.23,
    openai: 0.24
  },
  totalSessions: 1256,
  totalCost: 590.32
}
