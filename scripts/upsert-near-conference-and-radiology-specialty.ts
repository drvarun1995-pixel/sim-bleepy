/**
 * Ensure Radiology exists as a conference filter specialty, tag BIR/BSIR
 * listings with it, and publish NEAR Conference 2026 under Medical Education.
 *
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/upsert-near-conference-and-radiology-specialty.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { slugifyConferenceName } from '@/lib/conferences'
import { ukEventDateTimeToUtc } from '@/lib/ukEventTime'

config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const NEAR_SLUG = 'near-conference-2026'
const NEAR_MAILTO = 'mailto:NEARCONFERENCESUBMISSIONS@gmail.com'
const NEAR_FORM =
  'https://docs.google.com/forms/d/e/1FAIpQLSdkachR1yO8ole4_7rsyoOBZEsV83CNkbVPNxOLIxrath2o9A/viewform'

async function uniqueSlug(name: string) {
  const base = slugifyConferenceName(name)
  let slug = base
  let n = 2
  while (true) {
    const { data } = await supabaseAdmin.from('conference_opportunities').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    slug = `${base}-${n}`
    n += 1
  }
}

async function ensureSpecialty(name: string, slug: string, description: string, displayOrder: number) {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('specialties')
    .select('id, name, slug, is_active, display_order')
    .eq('slug', slug)
    .maybeSingle()
  if (fetchError) throw fetchError

  if (existing?.id) {
    if (!existing.is_active) {
      const { error } = await supabaseAdmin
        .from('specialties')
        .update({ is_active: true, name, description, display_order: displayOrder })
        .eq('id', existing.id)
      if (error) throw error
    }
    return existing.id as string
  }

  const { data: created, error } = await supabaseAdmin
    .from('specialties')
    .insert({
      name,
      slug,
      description,
      display_order: displayOrder,
      is_active: true,
    })
    .select('id')
    .single()
  if (error) throw error
  return created.id as string
}

async function specialtyIdBySlug(slug: string) {
  const { data, error } = await supabaseAdmin.from('specialties').select('id, slug, name, is_active').eq('slug', slug).maybeSingle()
  if (error) throw error
  if (!data?.id) throw new Error(`Missing specialty slug: ${slug}`)
  return data.id as string
}

async function linkSpecialty(opportunityId: string, specialtyId: string) {
  const { error } = await supabaseAdmin.from('conference_opportunity_specialties').upsert(
    { opportunity_id: opportunityId, specialty_id: specialtyId },
    { onConflict: 'opportunity_id,specialty_id' }
  )
  if (error) throw error
}

async function tagRadiologyListings(radiologyId: string) {
  const { data, error } = await supabaseAdmin
    .from('conference_opportunities')
    .select('id, name, organising_body')
    .or(
      [
        'organising_body.ilike.%Institute of Radiology%',
        'organising_body.ilike.%Interventional Radiology%',
        'name.ilike.BIR %',
        'name.ilike.BSIR %',
      ].join(',')
    )
  if (error) throw error
  for (const row of data || []) {
    await linkSpecialty(row.id, radiologyId)
  }
  return (data || []).map((row) => row.name)
}

async function upsertNear(medicalEducationId: string) {
  const deadline = ukEventDateTimeToUtc('2026-09-10', '23:59').toISOString()
  const payload = {
    name: 'NEAR Conference 2026',
    organising_body: 'INEAR · Anglia Ruskin University and Mid and South Essex NHS Foundation Trust',
    start_date: '2026-10-10',
    end_date: '2026-10-10',
    location_text: 'Virtual',
    city: null,
    nation: 'uk_wide',
    format: 'virtual',
    abstract_deadline: deadline,
    results_date_text: null,
    submission_status: 'open',
    status_override: 'open',
    poster_accepted: false,
    oral_accepted: true,
    eligible_work_types: ['research', 'education', 'qi', 'other'],
    eligible_career_levels: ['medical_student', 'foundation_doctor', 'resident_doctor'],
    abstract_word_limit: null,
    submission_requirements:
      'International Education and Academic Research Conference (INEAR). Oral abstracts in Clinical Research, Educational Research, QIP, and Innovation. Submit via the official Google Form. Questions: NEARCONFERENCESUBMISSIONS@gmail.com.',
    submission_fee:
      'ARU/UCL students free; other students £50; MSE residents £50; non-MSE residents £100. James Brown Essay Prize entry is free.',
    prize_info:
      'Prizes for each oral abstract category (Clinical Research, Educational Research, QIP, Innovation). James Brown Essay Prize for medical students: “How can we train our future doctors to still be relevant in an artificial intelligence driven future?” 3000 words, free to enter, cash prize for first place. Essay deadline 10 Sep 2026.',
    recognition_level: 'international',
    official_page_url: NEAR_MAILTO,
    submission_page_url: NEAR_FORM,
    canonical_url: NEAR_FORM,
    source_type: 'staff',
    last_verified_at: new Date().toISOString(),
    publication_status: 'published',
    deadline_not_stated: false,
    updated_at: new Date().toISOString(),
  }

  const { data: bySlug } = await supabaseAdmin
    .from('conference_opportunities')
    .select('id, slug')
    .eq('slug', NEAR_SLUG)
    .maybeSingle()
  const { data: byCanonical } = await supabaseAdmin
    .from('conference_opportunities')
    .select('id, slug')
    .eq('canonical_url', NEAR_FORM)
    .maybeSingle()
  const existing = bySlug || byCanonical

  if (existing?.id) {
    const { error } = await supabaseAdmin.from('conference_opportunities').update(payload).eq('id', existing.id)
    if (error) throw error
    await linkSpecialty(existing.id, medicalEducationId)
    return { id: existing.id, slug: existing.slug, action: 'updated' }
  }

  const slug = await uniqueSlug('NEAR Conference 2026')
  const { data: created, error } = await supabaseAdmin
    .from('conference_opportunities')
    .insert({ ...payload, slug })
    .select('id, slug')
    .single()
  if (error) throw error
  await linkSpecialty(created.id, medicalEducationId)
  return { id: created.id, slug: created.slug, action: 'created' }
}

async function main() {
  const radiologyId = await ensureSpecialty(
    'Radiology',
    'radiology',
    'Radiology, imaging and interventional radiology presentation opportunities',
    90
  )
  const medicalEducationId = await specialtyIdBySlug('medical-education')
  const tagged = await tagRadiologyListings(radiologyId)
  const near = await upsertNear(medicalEducationId)

  const { data: specialties } = await supabaseAdmin
    .from('specialties')
    .select('name, slug, is_active')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  console.log(
    JSON.stringify(
      {
        radiologyId,
        medicalEducationId,
        radiologyTagged: tagged,
        near,
        activeSpecialties: (specialties || []).map((row) => row.name),
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
