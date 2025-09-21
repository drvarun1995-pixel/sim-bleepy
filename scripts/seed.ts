#!/usr/bin/env tsx

/**
 * Sim-Bleepy Analytics Dashboard Seed Script
 * 
 * This script creates realistic demo data for the analytics dashboard including:
 * - 5 stations with different specialties and difficulties
 * - 50 users with mixed roles (students, educators, admins)
 * - 1000+ sessions with realistic durations and scores
 * - 3 cohorts with members
 * - A/B tests and assignments
 * - Tech metrics and cost data
 * 
 * Usage: pnpm tsx scripts/seed.ts
 */

import { createClient } from '@supabase/supabase-js'
import { faker } from '@faker-js/faker'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Configuration
const CONFIG = {
  stations: 5,
  users: 50,
  sessions: 1200,
  cohorts: 3,
  abTests: 2,
  timeRange: 90 // days
}

// Sample data
const SPECIALTIES = [
  'Cardiology', 'Emergency Medicine', 'Pediatrics', 'Psychiatry', 'Orthopedics',
  'Dermatology', 'Neurology', 'Obstetrics', 'Internal Medicine', 'General Practice'
]

const STATION_TITLES = [
  'Cardiology Consultation',
  'Emergency Triage Assessment',
  'Pediatric Fever Evaluation',
  'Mental Health Interview',
  'Orthopedic Examination',
  'Dermatology Case Study',
  'Neurological Assessment',
  'Obstetric Consultation',
  'Internal Medicine Round',
  'General Practice Visit'
]

const ORGANIZATIONS = [
  'Imperial College London',
  'King\'s College London',
  'University College London',
  'St George\'s University',
  'Barts Health NHS Trust',
  'Guy\'s and St Thomas\' NHS Foundation Trust',
  'Royal Free London NHS Foundation Trust'
]

const YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Foundation Year', 'Specialty Training']

const PROVIDERS = ['OpenAI', 'Hume', 'Anthropic']

// Helper functions
const randomChoice = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)]
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min
const randomFloat = (min: number, max: number): number => Math.random() * (max - min) + min
const randomDate = (daysAgo: number): Date => {
  const date = new Date()
  date.setDate(date.getDate() - randomInt(0, daysAgo))
  return date
}

const generateRealisticScore = (difficulty: number): number => {
  // Higher difficulty = lower average scores with more variance
  const baseScore = 85 - (difficulty * 8)
  const variance = 15 + (difficulty * 5)
  return Math.max(0, Math.min(100, Math.round(baseScore + randomFloat(-variance, variance))))
}

const generateSessionDuration = (): number => {
  // Most sessions between 15-45 minutes
  const durations = [900, 1200, 1500, 1800, 2100, 2400, 2700] // seconds
  return randomChoice(durations)
}

const generateTechMetrics = (sessionId: string): any => {
  const provider = randomChoice(PROVIDERS)
  const tokensUsed = randomInt(2000, 8000)
  
  // Provider-specific latency patterns
  const latencyRanges = {
    OpenAI: { asr: [100, 300], tts: [200, 500] },
    Hume: { asr: [150, 400], tts: [300, 800] },
    Anthropic: { asr: [80, 250], tts: [250, 600] }
  }
  
  const range = latencyRanges[provider as keyof typeof latencyRanges]
  const asrLatency = randomInt(range.asr[0], range.asr[1])
  const ttsLatency = randomInt(range.tts[0], range.tts[1])
  
  // Calculate cost based on tokens and time
  const tokenCost = (tokensUsed / 1000000) * (provider === 'OpenAI' ? 2.50 : provider === 'Anthropic' ? 8.00 : 0)
  const timeCost = (randomInt(15, 45) / 60) * (provider === 'Hume' ? 0.15 : 0)
  const totalCost = tokenCost + timeCost
  
  return {
    session_id: sessionId,
    asr_latency_ms: asrLatency,
    tts_latency_ms: ttsLatency,
    rtt_ms: randomInt(50, 200),
    disconnects: Math.random() < 0.05 ? randomInt(1, 3) : 0,
    error_code: Math.random() < 0.02 ? 'TIMEOUT' : null,
    provider,
    tokens_used: tokensUsed,
    cost_estimate_gbp: Math.round(totalCost * 10000) / 10000
  }
}

async function createStations() {
  console.log('Creating stations...')
  
  const stations = []
  for (let i = 0; i < CONFIG.stations; i++) {
    const station = {
      title: STATION_TITLES[i] || faker.company.buzzPhrase(),
      specialty: randomChoice(SPECIALTIES),
      status: randomChoice(['active', 'active', 'active', 'draft']), // 75% active
      difficulty: randomInt(1, 5),
      version: randomInt(1, 3),
      description: faker.lorem.paragraph(),
      estimated_duration_minutes: randomInt(20, 40)
    }
    stations.push(station)
  }
  
  const { data, error } = await supabase
    .from('stations')
    .insert(stations)
    .select()
  
  if (error) throw error
  console.log(`✅ Created ${data.length} stations`)
  return data
}

async function createUsers(stationIds: string[]) {
  console.log('Creating users...')
  
  const users = []
  const profiles = []
  
  for (let i = 0; i < CONFIG.users; i++) {
    const email = faker.internet.email()
    const user = {
      email,
      password: 'password123',
      email_confirmed_at: new Date().toISOString()
    }
    users.push(user)
    
    const role = i < 40 ? 'student' : i < 48 ? 'educator' : 'admin'
    const profile = {
      email,
      role,
      org: randomChoice(ORGANIZATIONS),
      year: role === 'student' ? randomChoice(YEARS) : null,
      full_name: faker.person.fullName(),
      avatar_url: faker.image.avatar()
    }
    profiles.push(profile)
  }
  
  // Note: In a real implementation, you'd create auth users first
  // For this seed script, we'll create profiles directly
  const { data, error } = await supabase
    .from('profiles')
    .insert(profiles)
    .select()
  
  if (error) throw error
  console.log(`✅ Created ${data.length} user profiles`)
  return data
}

async function createCohorts(userProfiles: any[]) {
  console.log('Creating cohorts...')
  
  const educators = userProfiles.filter(p => p.role === 'educator')
  const cohorts = []
  
  for (let i = 0; i < CONFIG.cohorts; i++) {
    const cohort = {
      name: `${randomChoice(['Year 3', 'Year 4', 'Foundation Year'])} ${randomChoice(['Medical', 'Nursing', 'PA'])} Students`,
      org: randomChoice(ORGANIZATIONS),
      owner_id: educators[i % educators.length].id,
      description: faker.lorem.sentence()
    }
    cohorts.push(cohort)
  }
  
  const { data: cohortData, error: cohortError } = await supabase
    .from('cohorts')
    .insert(cohorts)
    .select()
  
  if (cohortError) throw cohortError
  
  // Add members to cohorts
  const cohortMembers: any[] = []
  const students = userProfiles.filter(p => p.role === 'student')
  
  cohortData.forEach((cohort, cohortIndex) => {
    const membersPerCohort = Math.floor(students.length / CONFIG.cohorts)
    const startIndex = cohortIndex * membersPerCohort
    const endIndex = Math.min(startIndex + membersPerCohort + randomInt(0, 3), students.length)
    
    for (let i = startIndex; i < endIndex; i++) {
      cohortMembers.push({
        cohort_id: cohort.id,
        user_id: students[i].id
      })
    }
  })
  
  const { data: memberData, error: memberError } = await supabase
    .from('cohort_members')
    .insert(cohortMembers)
    .select()
  
  if (memberError) throw memberError
  console.log(`✅ Created ${cohortData.length} cohorts with ${memberData.length} members`)
  
  return { cohorts: cohortData, members: memberData }
}

async function createSessions(userProfiles: any[], stationIds: string[], cohorts: any[]) {
  console.log('Creating sessions...')
  
  const sessions = []
  const students = userProfiles.filter(p => p.role === 'student')
  
  for (let i = 0; i < CONFIG.sessions; i++) {
    const user = randomChoice(students)
    const station = randomChoice(stationIds)
    const startedAt = randomDate(CONFIG.timeRange)
    const duration = generateSessionDuration()
    const completed = Math.random() < 0.85 // 85% completion rate
    
    const session = {
      user_id: user.id,
      station_id: station,
      started_at: startedAt.toISOString(),
      ended_at: completed ? new Date(startedAt.getTime() + duration * 1000).toISOString() : null,
      duration_s: completed ? duration : null,
      completed,
      device: randomChoice(['Desktop', 'Mobile', 'Tablet']),
      browser: randomChoice(['Chrome', 'Safari', 'Firefox', 'Edge']),
      org: user.org,
      ip_address: faker.internet.ip(),
      user_agent: faker.internet.userAgent()
    }
    sessions.push(session)
  }
  
  const { data, error } = await supabase
    .from('sessions')
    .insert(sessions)
    .select()
  
  if (error) throw error
  console.log(`✅ Created ${data.length} sessions`)
  return data
}

async function createScores(sessions: any[], stations: any[]) {
  console.log('Creating scores...')
  
  const scores = []
  
  for (const session of sessions.filter(s => s.completed)) {
    const station = stations.find(st => st.id === session.station_id)
    const difficulty = station?.difficulty || 3
    
    const overallScore = generateRealisticScore(difficulty)
    const dataGathering = Math.max(0, Math.min(100, overallScore + randomInt(-15, 10)))
    const clinicalMgmt = Math.max(0, Math.min(100, overallScore + randomInt(-10, 15)))
    const communication = Math.max(0, Math.min(100, overallScore + randomInt(-12, 12)))
    
    const redFlagsMissed = Array.from({ length: randomInt(0, 3) }, () => ({
      flag: faker.lorem.words(3),
      severity: randomChoice(['low', 'medium', 'high'])
    }))
    
    const score = {
      session_id: session.id,
      overall_pct: overallScore,
      data_gathering_pct: dataGathering,
      clinical_mgmt_pct: clinicalMgmt,
      communication_pct: communication,
      red_flags_missed: redFlagsMissed,
      feedback_summary: faker.lorem.paragraph()
    }
    scores.push(score)
  }
  
  const { data, error } = await supabase
    .from('scores')
    .insert(scores)
    .select()
  
  if (error) throw error
  console.log(`✅ Created ${data.length} scores`)
  return data
}

async function createTranscripts(sessions: any[]) {
  console.log('Creating transcripts...')
  
  const transcripts = []
  
  for (const session of sessions.filter(s => s.completed)) {
    const turns = Array.from({ length: randomInt(20, 50) }, (_, i) => ({
      turn: i + 1,
      speaker: i % 2 === 0 ? 'student' : 'patient',
      text: faker.lorem.sentence(),
      timestamp: new Date(session.started_at.getTime() + i * 30000).toISOString()
    }))
    
    const tokenCounts = {
      input: randomInt(1000, 4000),
      output: randomInt(800, 3000),
      total: randomInt(1800, 7000)
    }
    
    const keptUntil = new Date()
    keptUntil.setFullYear(keptUntil.getFullYear() + 2) // 2 year retention
    
    const transcript = {
      session_id: session.id,
      turns,
      token_counts: tokenCounts,
      kept_until: keptUntil.toISOString()
    }
    transcripts.push(transcript)
  }
  
  const { data, error } = await supabase
    .from('transcripts')
    .insert(transcripts)
    .select()
  
  if (error) throw error
  console.log(`✅ Created ${data.length} transcripts`)
  return data
}

async function createTechMetrics(sessions: any[]) {
  console.log('Creating tech metrics...')
  
  const techMetrics = []
  
  for (const session of sessions) {
    const metrics = generateTechMetrics(session.id)
    metrics.created_at = session.started_at
    techMetrics.push(metrics)
  }
  
  const { data, error } = await supabase
    .from('tech_metrics')
    .insert(techMetrics)
    .select()
  
  if (error) throw error
  console.log(`✅ Created ${data.length} tech metrics`)
  return data
}

async function createABTests(stations: any[]) {
  console.log('Creating A/B tests...')
  
  const abTests = []
  const variants = [
    { name: 'Control', description: 'Original version' },
    { name: 'Variant A', description: 'Simplified interface' },
    { name: 'Variant B', description: 'Enhanced feedback' }
  ]
  
  for (let i = 0; i < CONFIG.abTests; i++) {
    const station = randomChoice(stations)
    const startDate = randomDate(30)
    const endDate = Math.random() < 0.7 ? randomDate(10) : null
    const winner = endDate ? randomChoice(['Control', 'Variant A', 'Variant B']) : null
    
    const abTest = {
      name: `${station.title} A/B Test ${i + 1}`,
      station_id: station.id,
      variants,
      status: endDate ? 'completed' : 'active',
      start_date: startDate.toISOString(),
      end_date: endDate?.toISOString() || null,
      winner_variant: winner
    }
    abTests.push(abTest)
  }
  
  const { data, error } = await supabase
    .from('ab_tests')
    .insert(abTests)
    .select()
  
  if (error) throw error
  console.log(`✅ Created ${data.length} A/B tests`)
  return data
}

async function createBillingData(userProfiles: any[]) {
  console.log('Creating billing data...')
  
  const billingRecords = []
  
  for (const user of userProfiles) {
    const plan = randomChoice(['Student', 'Educator', 'Institution'])
    const priceMap = { Student: 0, Educator: 29.99, Institution: 299.99 }
    
    const billing = {
      user_id: user.id,
      plan,
      stripe_customer_id: `cus_${faker.string.alphanumeric(14)}`,
      price_gbp: priceMap[plan as keyof typeof priceMap],
      status: randomChoice(['active', 'active', 'active', 'cancelled']), // 75% active
      started_at: randomDate(365).toISOString(),
      ended_at: Math.random() < 0.1 ? randomDate(30).toISOString() : null
    }
    billingRecords.push(billing)
  }
  
  const { data, error } = await supabase
    .from('billing')
    .insert(billingRecords)
    .select()
  
  if (error) throw error
  console.log(`✅ Created ${data.length} billing records`)
  return data
}

async function main() {
  try {
    console.log('🌱 Starting Sim-Bleepy Analytics Dashboard seed...')
    console.log(`📊 Configuration: ${CONFIG.stations} stations, ${CONFIG.users} users, ${CONFIG.sessions} sessions`)
    
    // Create data in dependency order
    const stations = await createStations()
    const users = await createUsers(stations.map(s => s.id))
    const { cohorts } = await createCohorts(users)
    const sessions = await createSessions(users, stations.map(s => s.id), cohorts)
    const scores = await createScores(sessions, stations)
    const transcripts = await createTranscripts(sessions)
    const techMetrics = await createTechMetrics(sessions)
    const abTests = await createABTests(stations)
    const billing = await createBillingData(users)
    
    console.log('\n🎉 Seed completed successfully!')
    console.log('\n📈 Generated data summary:')
    console.log(`   • ${stations.length} stations`)
    console.log(`   • ${users.length} user profiles`)
    console.log(`   • ${cohorts.length} cohorts`)
    console.log(`   • ${sessions.length} sessions`)
    console.log(`   • ${scores.length} scores`)
    console.log(`   • ${transcripts.length} transcripts`)
    console.log(`   • ${techMetrics.length} tech metrics`)
    console.log(`   • ${abTests.length} A/B tests`)
    console.log(`   • ${billing.length} billing records`)
    
    console.log('\n🔗 Dashboard URLs:')
    console.log('   • Student: http://localhost:3000/dashboard/student')
    console.log('   • Educator: http://localhost:3000/dashboard/educator')
    console.log('   • Admin: http://localhost:3000/dashboard/admin')
    
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

// Run the seed
main()
