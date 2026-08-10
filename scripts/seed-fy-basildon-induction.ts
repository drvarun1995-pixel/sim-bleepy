/**
 * Seed Basildon Trust Induction FY article into General + FY1 (not FY2).
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-fy-basildon-induction.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { slugify } from '../lib/foundation-year'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const TITLE = 'Trust Induction for Starters at Basildon Hospital'
const SLUG = 'trust-induction-basildon-hospital'
const TOPIC_SLUG = 'settling-at-nhs'
/** Members-only Basildon induction — single FY1 copy (no cohort duplicates). */
const COHORTS = ['fy1'] as const

const W = 1280
const H = 720

const BASE_CANDIDATES = [
  path.resolve('assets/bleepy-basildon-induction-base.png'),
  path.resolve('tmp-fy-featured/bleepy-basildon-induction-base.png'),
  path.resolve(
    process.env.USERPROFILE || '',
    '.cursor/projects/c-Users-FrostBite-Desktop-V-V1-1-sim-bleepy/assets/bleepy-basildon-induction-base.png'
  ),
]

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function bannerSvg(titleLines: string[], cat1: string, cat2: string): Buffer {
  const titleFs = titleLines.length > 1 ? 38 : 46
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
  const overlay = bannerSvg(
    ['TRUST INDUCTION FOR STARTERS', 'AT BASILDON HOSPITAL'],
    'BASILDON HOSPITAL',
    'FY1 STARTER GUIDE'
  )

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

function img(storagePath: string, alt: string) {
  return `<p style="text-align:center"><img src="${viewUrl(storagePath)}" alt="${alt.replace(/"/g, '&quot;')}" class="fy-img fy-img-wide" /></p>`
}

type MapPaths = {
  area: string
  campus: string
  levelA: string
  levelB: string
  levelC: string
  wardNames: string
}

function buildContent(maps: MapPaths): string {
  // Practical Basildon starter content from the induction booklet.
  // Intentionally omits trust logos and the "Excellent, Compassionate, Respectful" footer branding.
  return `
<p>Starting at <strong>Basildon University Hospital</strong> can feel like drinking from a fire hose — new wards, new computer systems, new names, and a lot of “you’ll pick it up as you go”. This induction guide pulls the essentials into one place for FY1s and other doctors starting in Medicine at Basildon.</p>
<p>Keep this handy for your first few weeks. Update local contacts if rotas or roles change.</p>

<h2>Quick orientation</h2>
<p>Basildon University Hospital is part of a large Essex trust group serving around <strong>1.2 million</strong> people across sites including Basildon, Broomfield, Southend, Braintree Community Hospital, St Michael’s, and St Peter’s.</p>
${img(maps.area, 'Map showing Basildon in relation to surrounding Essex towns and major roads')}
<blockquote>
<p><em>“Medicine is the science of uncertainty and an art of probability.”</em> — William Osler</p>
</blockquote>
<p>Your day-to-day world as a starter is usually: your ward team, the medical computer systems, how to refer, how to take leave/report sickness, and who to contact when stuck.</p>

<h2>Hospital maps</h2>
<p>Save these on your phone for the first couple of weeks — finding wards, A&amp;E, CTC, and the main entrances is half the battle when you’re new.</p>
<h3>Site map — Basildon University Hospital</h3>
${img(maps.campus, 'Basildon University Hospital site map showing buildings, entrances, parking and key departments')}
<h3>Level A</h3>
${img(maps.levelA, 'Basildon Hospital Level A floor plan')}
<h3>Level B</h3>
${img(maps.levelB, 'Basildon Hospital Level B floor plan')}
<h3>Level C</h3>
${img(maps.levelC, 'Basildon Hospital Level C floor plan')}
<h3>New block vs old block ward names</h3>
<p>Wards are sometimes still referred to by older names — this key helps you translate.</p>
${img(maps.wardNames, 'Table mapping new block and old block ward names at Basildon Hospital')}

<h2>Medical wards &amp; consultants (Basildon)</h2>
<p>Use this as a starting map — confirm the current consultant team on your ward at induction, as cover can rotate.</p>
<table>
  <thead>
    <tr><th>Specialty</th><th>Ward</th><th>Consultants / notes</th></tr>
  </thead>
  <tbody>
    <tr><td>DMOP</td><td>Lionel Cousins (Frailty)</td><td>Dr Shipa Raje; Dr Irina Zamfir</td></tr>
    <tr><td>DMOP</td><td>Bulphan</td><td>Dr Rizuan Mohamed; Dr Irushna Perera</td></tr>
    <tr><td>DMOP</td><td>Florence Nightingale</td><td>Dr Indi Gupta; Dr Ganganathan Govinnage</td></tr>
    <tr><td>DMOP</td><td>William Harvey</td><td>Dr Sri Sinha; Dr Soma Kar</td></tr>
    <tr><td>DMOP</td><td>Osler</td><td>Dr Stephen Waters (Clinical Lead); Dr Vijayaledchumy Paramsothy</td></tr>
    <tr><td>Renal</td><td>E Fry</td><td>Dr Balasubramanian (Clinical Lead); Dr Poorva Jain; Dr Thomas Hughes; Dr Michael Fawzy; Dr Hannah Stacey</td></tr>
    <tr><td>Gastroenterology</td><td>Edith Cavell</td><td>Dr Pushpakaran Munuswamy (Clinical Lead); Dr Gavin Wright; Dr Benjamin Cooper; Dr Mark Jarvis; Dr Manuel Jasper; Dr Chirag Oza; Dr Javaid Subhani</td></tr>
    <tr><td>Respiratory</td><td>Orsett / Burstead</td><td>Dr Kirsten Wadsworth (Clinical Lead); Dr Kanwar Pannu; Dr Sophie Tisi; Dr Tom McLellan; Dr Bernard Yung; Dr Ujaas Dawar; Dr Dipak Mukerjee</td></tr>
    <tr><td>Cardiology</td><td>James MacKenzie</td><td>Dr Jason Dhungu</td></tr>
    <tr><td>Endocrine</td><td>Kingswood</td><td>Dr Andrew Worsley</td></tr>
    <tr><td>GIM / Palliative / Haematology</td><td>Marjory Warren</td><td>Dr Rehman Khan (Clinical Lead); Dr Alan Choo-Kang; Dr Catherine O’Doherty</td></tr>
    <tr><td>GIM / Stroke</td><td>Lister</td><td>Dr Tabish Khan (GIM); stroke consultants rotate</td></tr>
    <tr><td>Stroke</td><td>Pasteur</td><td>Dr Narasimha Gadi (Clinical Lead); Dr Jayakumar Jagadeesan; Dr Branimir Nevajda; Dr Haroon Ahmad; Dr Maya Mukundan</td></tr>
  </tbody>
</table>

<h2>Key contacts</h2>
<ul>
  <li><strong>Clinical Director, Care Group 1:</strong> Dr Kirsten Wadsworth</li>
  <li><strong>Unit Training Director (DMOP):</strong> Dr Irina Zamfir</li>
  <li><strong>Unit Training Director (GIM):</strong> Dr Michael Fawzy</li>
  <li><strong>Educational Director:</strong> Dr Shilpa Raje</li>
  <li><strong>Line Manager &amp; Senior Rota Co-ordinator:</strong> Jodi Churchill — jodi.churchill2@nhs.net</li>
  <li><strong>Medical Rota Co-ordinator:</strong> Alison Dunnill — alison.dunnill@nhs.net</li>
  <li><strong>ALS / Resuscitation:</strong> Finola Cornes — f.cornes@nhs.net (also catharine.rideout2@nhs.net)</li>
  <li><strong>Horus portfolio:</strong> Postgraduate Centre (on site) / christine.wayman@nhs.net</li>
  <li><strong>Allocate (appraisal):</strong> Freya Drain — freya.drain3@nhs.net</li>
  <li><strong>Clinical audit:</strong> Nicholas Chinnon — nicholas.chinnon@nhs.net; Sanjuan Alvaro — alvaro.sanjuan@nhs.net</li>
  <li><strong>Training / simulation:</strong> Wilson Alvares — wilson.alvares@nhs.net (Postgraduate Centre)</li>
</ul>

<h2>Annual leave &amp; study leave</h2>
<ul>
  <li><strong>Annual leave:</strong> typically 27 days + bank holidays per year (about <strong>9 days per 4-month</strong> rotation).</li>
  <li><strong>Study leave:</strong> typically <strong>10 days/year</strong> with around a <strong>£600</strong> study budget/year (confirm current local policy).</li>
  <li>Complete leave forms. Get ward co-ordinator approval for dates, then send the signed form to <strong>Alison</strong> and <strong>Jodi</strong>.</li>
</ul>

<h2>Sickness reporting</h2>
<p>If you cannot attend a shift:</p>
<ol>
  <li>Email <strong>mse.divmed.management@nhs.net</strong></li>
  <li>Email your ward consultant</li>
  <li>Give a general reason so sickness is recorded correctly</li>
  <li>On return, see Alison or Jodi for a <strong>return-to-work</strong> meeting</li>
</ol>

<h2>Computer systems you will actually use</h2>
<p><strong>Important:</strong> medical notes at Basildon are still largely on <strong>paper</strong>.</p>
<ul>
  <li><strong>Clinical Portal:</strong> take list, worksheet/ward list, discharge summaries</li>
  <li><strong>EPR / Careflow:</strong> bloods, scan results, summary care record (GP records), clinic letters, previous discharges, scanned notes</li>
  <li><strong>Patient-Track:</strong> observations and bedside charts</li>
  <li><strong>WellSky:</strong> ePrescribing and TTAs</li>
  <li><strong>TomCat:</strong> echo, 24-hour tape, ICD recording, angiograms</li>
  <li><strong>ICE:</strong> requesting investigations</li>
  <li><strong>PACS (Insight):</strong> radiology images</li>
  <li><strong>MyStaff App:</strong> trust/hospital protocols (computer or phone)</li>
  <li><strong>Hornbill:</strong> IT / equipment / e-rostering / smartcard support (often auto-login on trust PCs)</li>
  <li><strong>Elevate:</strong> mandatory training / e-learning</li>
</ul>

<h3>Logins that usually share your trust account</h3>
<ul>
  <li>Main trust computer</li>
  <li>EPR / Careflow</li>
  <li>ACP (Acute Care Portal)</li>
  <li>Clinical Portal</li>
  <li>Patient-Track</li>
</ul>

<h3>Separate logins</h3>
<ul>
  <li>WellSky</li>
  <li>TomCat</li>
  <li>PACS (Insight)</li>
  <li><strong>Hexarad:</strong> overnight radiology vetting — create an account at <a href="https://www.hexarad.com/mse" target="_blank" rel="noopener noreferrer">hexarad.com/mse</a> so you can get scans vetted without always calling</li>
  <li><strong>Locums Nest:</strong> bank/locum shifts (download and register)</li>
</ul>

<h2>Referrals</h2>
<ul>
  <li><strong>Routine referrals:</strong> “C2C” form</li>
  <li><strong>More urgent advice:</strong> DECT phones or main switchboard</li>
  <li><strong>Cardiology PCI:</strong> Cardiothoracic Centre (CTC) on site</li>
  <li><strong>Neurosurgery:</strong> Queen’s Hospital, Romford</li>
  <li><strong>UGI bleed:</strong> consultant via main switchboard</li>
  <li><strong>Thrombolysis:</strong> Stroke CNS</li>
  <li><strong>NIV:</strong> NIV nurse</li>
</ul>
<p><strong>In-house medical specialties out of hours at Basildon:</strong> Renal, Gastroenterology, Respiratory, Stroke, Haematology.</p>

<h3>Specialties based outside Basildon</h3>
<ul>
  <li><strong>ENT:</strong> Broomfield (on-site registrar available)</li>
  <li><strong>Ophthalmology:</strong> Southend</li>
  <li><strong>Plastics:</strong> Broomfield — via switchboard → plastics secretaries for process</li>
  <li><strong>Maxillofacial:</strong> Broomfield — via switchboard → on-call MaxFax registrar/SHO</li>
</ul>

<h2>Accommodation</h2>
<p><strong>Hospital accommodation office (Mon–Fri 09:00–17:00):</strong></p>
<ul>
  <li>Sue Pitcher — 01268 394 878 — sue.pitcher@btuh.nhs.uk</li>
</ul>
<p>If you unexpectedly need a room out of hours, go to the <strong>switchboard room (tower block)</strong> for an emergency key. There are a small number of rooms available daily — complete the form so Accommodation knows who is using it.</p>
<p><strong>Nearby off-site option often mentioned by starters:</strong> Trafford House (near the station, ~20 min walk) — ask for a 3-month receipt. Contact Criterion Hospitality lettings if exploring that route. For private rentals, Rightmove/Zoopla are usually safer than Facebook Marketplace.</p>

<h2>Wellbeing</h2>
<ul>
  <li><strong>Nicola Rees</strong> — HR wellbeing representative for medicine</li>
  <li><strong>Wellbeing Hub, Level A</strong> — Mon–Fri 07:30–15:30</li>
  <li>occhealth@btuh.nhs.uk or Ext 4466</li>
  <li><strong>NHS People support:</strong> text <strong>FRONTLINE</strong> to 85258 or call 0300 131 7000</li>
</ul>

<h2>Other important admin logins</h2>
<ul>
  <li><strong>ESR number:</strong> email mse.hrservicedesk@nhs.net with NI number, DOB, and full name</li>
  <li><strong>Pay circular (check grade/pay):</strong> NHS Employers medical pay circulars (search current MD circular)</li>
  <li><strong>MySBSPay (payslips):</strong> NHS email + password</li>
  <li><strong>Allocate / e-rostering leave:</strong> Hornbill or self-service portal</li>
</ul>

<h2>ALS before on-calls</h2>
<p>ALS is usually needed before starting on-calls. Check availability on the trust intranet resuscitation pages (dates are often released ~3 months ahead) and email Finola Cornes / Catharine Rideout for places.</p>

<h2>Apps that make life easier</h2>
<ul>
  <li><strong>AccuRx:</strong> bleeps/phones — hard to survive without it</li>
  <li><strong>MyStaff:</strong> guidelines on your phone</li>
  <li><strong>MicroGuide:</strong> antibiotics</li>
  <li><strong>Pando:</strong> image transfer (e.g. dermatology) — get consent first</li>
  <li><strong>Locum Nest:</strong> bank shifts (or ask your line manager about being added to the local staffing group)</li>
  <li><strong>UpToDate:</strong> free on trust computers (favourites/bookmarks)</li>
  <li>Also useful: Outlook, Medscape, BMJ Best Practice, ECG apps, Osmosis, NHS App (for your own health)</li>
</ul>

<h2>First-week checklist</h2>
<ul>
  <li>Confirm your ward, consultant, and who signs leave</li>
  <li>Get all system logins working (especially WellSky, Patient-Track, Clinical Portal, PACS)</li>
  <li>Save key emails/phone numbers in your phone</li>
  <li>Book ALS if not already done</li>
  <li>Find the Postgraduate Centre, Wellbeing Hub, and switchboard</li>
  <li>Ask your team for the local “how we do discharges / referrals / escalation” shortcuts</li>
</ul>
<p>You’ve got this — every doctor on that corridor was new once. Ask early, write things down, and look after yourself as carefully as you look after your patients.</p>
`.trim()
}

async function uploadImage(cohort: string, fileName: string, buffer: Buffer): Promise<string> {
  const storagePath = `foundation-year/${cohort}/${TOPIC_SLUG}/${SLUG}/images/${fileName}`
  const { error } = await supabase.storage.from('placements').upload(storagePath, buffer, {
    contentType: 'image/webp',
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw new Error(`Upload failed (${cohort}/${fileName}): ${error.message}`)
  console.log(`  uploaded ${storagePath}`)
  return storagePath
}

async function uploadMaps(cohort: string): Promise<MapPaths> {
  const mapDir = path.resolve('tmp-fy-featured/basildon-maps')
  const files: Array<[keyof MapPaths, string]> = [
    ['area', 'basildon-area-map.webp'],
    ['campus', 'campus-map.webp'],
    ['levelA', 'level-a.webp'],
    ['levelB', 'level-b.webp'],
    ['levelC', 'level-c.webp'],
    ['wardNames', 'ward-block-names.webp'],
  ]

  const maps = {} as MapPaths
  for (const [key, fileName] of files) {
    const local = path.join(mapDir, fileName)
    if (!fs.existsSync(local)) throw new Error(`Missing map file: ${local}`)
    maps[key] = await uploadImage(cohort, fileName, fs.readFileSync(local))
  }
  return maps
}

async function upsertPage(
  cohort: (typeof COHORTS)[number],
  featuredPath: string,
  maps: MapPaths
) {
  const { data: topic, error: topicError } = await supabase
    .from('fy_topics')
    .select('id, slug, cohort')
    .eq('cohort', cohort)
    .eq('slug', TOPIC_SLUG)
    .single()
  if (topicError || !topic) throw new Error(`Topic missing for ${cohort}/${TOPIC_SLUG}`)

  const content = buildContent(maps)
  const { data: existing } = await supabase
    .from('fy_pages')
    .select('id')
    .eq('topic_id', topic.id)
    .eq('slug', SLUG)
    .maybeSingle()

  const payload: Record<string, unknown> = {
    topic_id: topic.id,
    title: TITLE,
    slug: SLUG || slugify(TITLE),
    content,
    featured_image: featuredPath,
    status: 'published',
    is_active: true,
    display_order: 0,
    updated_at: new Date().toISOString(),
  }
  // Members-only flag when column exists (see migrations/fy_blog_auth_and_analytics.sql)
  payload.requires_auth = true

  if (existing?.id) {
    let { error } = await supabase.from('fy_pages').update(payload).eq('id', existing.id)
    if (error?.message?.includes('requires_auth')) {
      delete payload.requires_auth
      ;({ error } = await supabase.from('fy_pages').update(payload).eq('id', existing.id))
    }
    if (error) throw error
    console.log(`updated ${cohort}: ${existing.id}`)
  } else {
    let { data, error } = await supabase.from('fy_pages').insert(payload).select('id').single()
    if (error?.message?.includes('requires_auth')) {
      delete payload.requires_auth
      ;({ data, error } = await supabase.from('fy_pages').insert(payload).select('id').single())
    }
    if (error) throw error
    console.log(`created ${cohort}: ${data?.id}`)
  }

  console.log(`  open: /placements/foundation-year/${cohort}/${TOPIC_SLUG}/${SLUG}`)
}

async function main() {
  const basePath = BASE_CANDIDATES.find((p) => fs.existsSync(p))
  if (!basePath) throw new Error(`Base image missing. Tried:\n${BASE_CANDIDATES.join('\n')}`)

  console.log('base:', basePath)
  const webp = await composeFeatured(basePath)
  fs.writeFileSync(path.resolve('tmp-fy-featured/basildon-induction-featured.webp'), webp)
  console.log('wrote local preview tmp-fy-featured/basildon-induction-featured.webp')

  for (const cohort of COHORTS) {
    console.log(`\n=== ${cohort}`)
    const featuredPath = await uploadImage(cohort, 'featured-bleepy.webp', webp)
    const maps = await uploadMaps(cohort)
    await upsertPage(cohort, featuredPath, maps)
  }

  console.log('\nDone.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
