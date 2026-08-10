/**
 * Seed FY1 Clerking Shifts article:
 * "How to Review a Patient You've Never Met While On-Call"
 *
 * Also publishes to General (public /guides SEO surface).
 * Images live under foundation-year/general/... so logged-out viewers can load them.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-fy1-review-patient-on-call.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const sb = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/** Reader-facing H1 / page title */
const TITLE =
  "How to Review a Patient You've Never Met While On-Call: A Practical FY1 Guide"
/** Shorter line for featured card banners */
const FEATURED_TITLE = 'REVIEW A PATIENT ON-CALL'
const SLUG = 'fy1-review-patient-on-call'
const TOPIC_SLUG = 'clerking-shifts'
/** Public-safe storage scope (must stay under foundation-year/general/) */
const IMAGE_DIR = `foundation-year/general/${TOPIC_SLUG}/${SLUG}/images`

const ASSETS_DIR = path.resolve(
  process.env.USERPROFILE || '',
  '.cursor/projects/c-Users-FrostBite-Desktop-V-V1-1-sim-bleepy/assets'
)

const LOCAL = {
  featuredBase: path.join(ASSETS_DIR, 'fy1-review-patient-on-call-bleepy-base.png'),
  bedside: path.join(ASSETS_DIR, 'fy1-bedside-patient-review.png'),
  abcde: path.join(ASSETS_DIR, 'abcde-assessment-fy1-doctors.png'),
  context: path.join(ASSETS_DIR, 'fy1-on-call-clinical-context-checklist.png'),
}

const W = 1280
const H = 720

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapTitle(title: string, maxChars = 26): string[] {
  const words = title.trim().split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (next.length > maxChars && cur) {
      lines.push(cur)
      cur = w
    } else {
      cur = next
    }
  }
  if (cur) lines.push(cur)
  return lines.slice(0, 2)
}

function bannerSvg(titleLines: string[], cat1: string, cat2: string): Buffer {
  const titleFs = titleLines.length > 1 ? 36 : 44
  const titleBlockH = titleLines.length > 1 ? 118 : 92
  const titleY0 = titleLines.length > 1 ? 52 : 62
  const titleTspans = titleLines
    .map((line, i) => {
      const y = titleY0 + i * 46
      return `<text x="640" y="${y}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="${titleFs}" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(line)}</text>`
    })
    .join('\n')

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="90" y="28" width="1100" height="${titleBlockH}" rx="18" ry="18" fill="#F25006"/>
  ${titleTspans}
  <rect x="160" y="560" width="960" height="110" rx="18" ry="18" fill="#EBA400"/>
  <text x="640" y="605" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(cat1)}</text>
  <text x="640" y="648" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(cat2)}</text>
</svg>`
  return Buffer.from(svg)
}

async function composeFeatured(basePath: string): Promise<Buffer> {
  const lines = wrapTitle(FEATURED_TITLE)
  const overlay = bannerSvg(lines, 'CLINICAL SKILLS', 'CLERKING SHIFTS')
  const whiteMasks = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="70" y="10" width="1140" height="150" rx="20" fill="#ffffff"/>
  <rect x="140" y="540" width="1000" height="150" rx="20" fill="#ffffff"/>
</svg>`)

  return sharp(basePath)
    .resize(W, H, { fit: 'cover', position: 'centre' })
    .composite([
      { input: await sharp(whiteMasks).png().toBuffer(), top: 0, left: 0 },
      { input: await sharp(overlay).png().toBuffer(), top: 0, left: 0 },
    ])
    .webp({ quality: 85, effort: 4 })
    .toBuffer()
}

function viewUrl(storagePath: string) {
  return `/api/placements/images/view?path=${encodeURIComponent(storagePath)}`
}

function figure(storagePath: string, alt: string, caption: string) {
  return `
<figure class="fy-figure">
  <p style="text-align:center"><img src="${viewUrl(storagePath)}" alt="${alt.replace(/"/g, '&quot;')}" width="1280" height="720" loading="lazy" decoding="async" class="fy-img fy-img-wide" /></p>
  <figcaption>${caption}</figcaption>
</figure>`.trim()
}

async function uploadBuffer(storagePath: string, buffer: Buffer, contentType: string) {
  const { error } = await sb.storage.from('placements').upload(storagePath, buffer, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw new Error(`Upload failed ${storagePath}: ${error.message}`)
  console.log('  uploaded', storagePath)
}

async function uploadLocalWebp(localPath: string, fileName: string): Promise<string> {
  if (!fs.existsSync(localPath)) throw new Error(`Missing local asset: ${localPath}`)
  const webp = await sharp(localPath)
    .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer()
  const storagePath = `${IMAGE_DIR}/${fileName}`
  await uploadBuffer(storagePath, webp, 'image/webp')
  return storagePath
}

function buildContent(paths: {
  bedside: string
  abcde: string
  context: string
}) {
  return `
<p>A practical guide for FY1 doctors reviewing an unfamiliar patient on-call, covering ABCDE, observations, investigations, escalation, documentation and handover.</p>
<p>Being asked to review a patient you have never met is one of the most common — and most stressful — jobs on an FY1 on-call. You often arrive with limited background, a busy jobs list, and the quiet fear of missing something important.</p>
<p>This FY1 on-call guide walks through a calm, repeatable approach: see the patient, get the clinical context, assess systematically, escalate early when needed, and document clearly so the next doctor can continue safely.</p>

<h2>Before you leave the nurses’ station</h2>
<p>When the bleep or nurse request comes in, take thirty seconds to clarify the ask:</p>
<ul>
  <li><strong>Who</strong> is the patient (name, ward, bed)?</li>
  <li><strong>Why</strong> have you been asked now (pain, NEWS2 rise, low urine output, fall, abnormal bloods)?</li>
  <li><strong>How urgent</strong> is it — can this wait ten minutes, or do you need to go now?</li>
  <li><strong>What has already been done</strong> (repeat observations, oxygen started, ECG, bloods sent)?</li>
</ul>
<p>Write it down. On a night shift, memory is not a safe system.</p>

<h2>Look at the patient before looking at the computer</h2>
${figure(
  paths.bedside,
  'Foundation doctor speaking to and assessing an unfamiliar patient at the bedside',
  'Before ordering investigations, look at the patient, listen to their story and establish what has changed.'
)}
<p>When you arrive, introduce yourself, confirm identity with the wristband, and ask the nurse to stay if possible. Your first job is a rapid clinical first impression:</p>
<ul>
  <li>Does the patient look well, unwell, or critically unwell?</li>
  <li>Are they speaking in full sentences?</li>
  <li>What is their work of breathing, colour, and consciousness?</li>
  <li>What does the patient (or nurse) say has changed?</li>
</ul>
<p>Screens help — but they do not replace standing at the end of the bed.</p>

<h2>Use an ABCDE approach for the acutely unwell</h2>
${figure(
  paths.abcde,
  'ABCDE assessment infographic for FY1 doctors reviewing an acutely unwell patient',
  'For an acutely unwell patient, use an ABCDE approach, treat problems as you identify them and reassess after intervention.'
)}
<p>If the patient is deteriorating, do not jump straight to the notes. Use a structured ABCDE assessment and treat problems as you find them:</p>
<ul>
  <li><strong>A — Airway:</strong> Can they talk? Is the airway patent and protected?</li>
  <li><strong>B — Breathing:</strong> Respiratory rate, oxygen saturations, oxygen requirement, chest exam, work of breathing.</li>
  <li><strong>C — Circulation:</strong> Heart rate, blood pressure, capillary refill, fluid status, IV access, bleeding.</li>
  <li><strong>D — Disability:</strong> ACVPU/GCS, pupils, blood glucose, pain, focal neurology.</li>
  <li><strong>E — Exposure:</strong> Temperature, skin, wounds, calves, drains, focused exam guided by the complaint.</li>
</ul>
<p>Reassess after every intervention. A NEWS2 trend is useful context, but your bedside findings decide urgency.</p>

<h2>Get the clinical context quickly (BODEX)</h2>
${figure(
  paths.context,
  'Clinical information to check before reviewing an unfamiliar patient on call',
  'A quick review of bloods, observations, medications, ECGs and imaging can help you understand an unfamiliar patient’s clinical context.'
)}
<p>Once the patient is stable enough — or in parallel if help is with them — gather the background that makes an unfamiliar review safe. A simple mental checklist:</p>
<ul>
  <li><strong>B — Bloods:</strong> Recent FBC, U&amp;E, CRP, lactate, cultures, trends not just single values.</li>
  <li><strong>O — Observations:</strong> Latest set and the trend over the last few hours; what triggered the call.</li>
  <li><strong>D — Drug chart:</strong> Anticoagulation, insulin, opioids, antibiotics, allergies, missed doses.</li>
  <li><strong>E — ECG:</strong> If chest pain, syncope, electrolyte issues, or tachycardia/bradycardia.</li>
  <li><strong>X — X-rays / imaging:</strong> Chest X-ray, CT reports, and whether imaging is pending.</li>
</ul>
<p>Also check: reason for admission, ceiling of care / DNACPR status if recorded, and who the parent team is.</p>

<h2>Make a clear assessment and plan</h2>
<p>After bedside review and notes, summarise in one or two lines:</p>
<ul>
  <li>What is the most likely problem right now?</li>
  <li>What must be ruled out because it would be dangerous to miss?</li>
  <li>What immediate actions are needed?</li>
  <li>What can wait until the parent team / morning?</li>
</ul>
<p>Order investigations only if they will change management overnight. Start treatment you are confident about (for example oxygen to target saturations, analgesia, fluids after senior discussion where appropriate), and set a clear review time.</p>

<h2>Escalate early — use SBAR</h2>
<p>FY1s are not expected to manage every problem alone. Escalate early if the patient is unstable, you are out of your depth, or the situation is not improving after initial measures.</p>
<p>When you call a senior, structure the referral:</p>
<ul>
  <li><strong>Situation:</strong> Who you are, where you are, and the immediate concern.</li>
  <li><strong>Background:</strong> Admission reason, key history, DNACPR/ceiling if known.</li>
  <li><strong>Assessment:</strong> ABCDE findings, NEWS2, key results.</li>
  <li><strong>Recommendation:</strong> What you need — review, advice, or urgent presence — and by when.</li>
</ul>
<p>Have the notes, observations, drug chart and results in front of you before you dial.</p>

<h2>Document as if the next doctor has never met them either</h2>
<p>Your entry should let another FY1 understand the case at 03:00:</p>
<ul>
  <li>Time of review and why you were called</li>
  <li>History from patient/nurse and relevant background</li>
  <li>Examination / ABCDE findings and observations</li>
  <li>Key investigations reviewed or requested</li>
  <li>Impression and differential</li>
  <li>Plan with timescales, escalation thresholds, and who was informed</li>
</ul>
<p>Update the jobs list and hand over unfinished issues at the end of the shift.</p>

<h2>A simple on-call review checklist</h2>
<ol>
  <li>Clarify the job and urgency</li>
  <li>See the patient and form a first impression</li>
  <li>ABCDE if unwell; treat and reassess</li>
  <li>Check bloods, observations, drugs, ECG, imaging</li>
  <li>Decide: treat / investigate / escalate / observe</li>
  <li>Document and set a review time</li>
  <li>Hand over anything outstanding</li>
</ol>

<h2>When should an FY1 escalate a patient?</h2>
<p>Escalate promptly if the patient is haemodynamically unstable, has a rising or high NEWS2 with clinical concern, reduced consciousness, suspected sepsis with deterioration, chest pain with ECG changes, airway compromise, or if you are unsure and the situation feels unsafe. Escalation is a safety behaviour, not a failure.</p>

<h2>What should I check before reviewing a patient on-call?</h2>
<p>Confirm identity and location, the reason for the call, latest observations/NEWS2, recent bloods, the drug chart (including allergies), relevant ECGs or imaging, admission diagnosis, and any documented ceilings of care. Then go to the bedside and assess the patient yourself.</p>

<h2>What should an FY1 include when documenting a patient review?</h2>
<p>Include the time and reason for review, focused history, examination findings, observations, investigations reviewed or requested, your clinical impression, a timed plan, escalation advice, and who you discussed the case with. Write so the next doctor can continue safely without you.</p>

<p><em>This guide is for education and does not replace local trust protocols, senior advice, or your clinical judgement.</em></p>
`.trim()
}

async function upsertPage(topicId: string, content: string, featuredPath: string) {
  const { data: existing } = await sb
    .from('fy_pages')
    .select('id')
    .eq('topic_id', topicId)
    .eq('slug', SLUG)
    .maybeSingle()

  const payload = {
    title: TITLE,
    content,
    featured_image: featuredPath,
    status: 'published' as const,
    is_active: true,
    requires_auth: false,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    let { error } = await sb.from('fy_pages').update(payload).eq('id', existing.id)
    if (error?.message?.includes('requires_auth')) {
      const { requires_auth: _r, ...rest } = payload
      ;({ error } = await sb.from('fy_pages').update(rest).eq('id', existing.id))
    }
    if (error) throw error
    console.log(`Updated page ${existing.id}`)
    return existing.id as string
  }

  const insertPayload = {
    topic_id: topicId,
    slug: SLUG,
    display_order: 50,
    ...payload,
  }
  let { data, error } = await sb.from('fy_pages').insert(insertPayload).select('id').single()
  if (error?.message?.includes('requires_auth')) {
    const { requires_auth: _r, ...rest } = insertPayload
    ;({ data, error } = await sb.from('fy_pages').insert(rest).select('id').single())
  }
  if (error) throw error
  console.log(`Created page ${data?.id}`)
  return data!.id as string
}

async function main() {
  for (const [key, p] of Object.entries(LOCAL)) {
    if (!fs.existsSync(p)) throw new Error(`Missing asset ${key}: ${p}`)
  }

  console.log('Composing featured card...')
  const featuredWebp = await composeFeatured(LOCAL.featuredBase)
  const featuredPath = `${IMAGE_DIR}/featured-bleepy-mascot.webp`
  await uploadBuffer(featuredPath, featuredWebp, 'image/webp')

  console.log('Uploading inline images...')
  const bedside = await uploadLocalWebp(LOCAL.bedside, 'fy1-bedside-patient-review.webp')
  const abcde = await uploadLocalWebp(LOCAL.abcde, 'abcde-assessment-fy1-doctors.webp')
  const context = await uploadLocalWebp(
    LOCAL.context,
    'fy1-on-call-clinical-context-checklist.webp'
  )

  const content = buildContent({ bedside, abcde, context })

  // Public SEO surface only — do not mirror into fy1/fy2 (avoids duplicates).
  for (const cohort of ['general'] as const) {
    console.log(`\n=== cohort ${cohort}`)
    const { data: topic, error } = await sb
      .from('fy_topics')
      .select('id, name')
      .eq('cohort', cohort)
      .eq('slug', TOPIC_SLUG)
      .maybeSingle()

    if (error || !topic) {
      console.warn(`  topic ${TOPIC_SLUG} missing for ${cohort}, skip`)
      continue
    }

    await upsertPage(topic.id, content, featuredPath)
    console.log(
      `  open: /placements/foundation-year/${cohort}/${TOPIC_SLUG}/${SLUG}`
    )
  }

  console.log(`\nPublic SEO URL: /guides/foundation-year/${TOPIC_SLUG}/${SLUG}`)
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
