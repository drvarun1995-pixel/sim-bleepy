/**
 * Seed members-only IV fluid prescribing guide (includes Basildon Wellsky screenshots).
 *
 * Cohorts: general + fy1 + fy2 (placements only; not public /guides).
 * Images under foundation-year/{cohort}/... so anonymous image API cannot serve them.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-fy1-iv-fluid-prescribing.ts
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

const TITLE = 'How to Prescribe IV Fluids as an FY1: A Practical Guide'
const FEATURED_TITLE = 'IV FLUID PRESCRIBING GUIDE'
const SLUG = 'fy1-iv-fluid-prescribing'
const TOPIC_SLUG = 'clerking-shifts'
/** Members-only Basildon Wellsky guide — keep a single FY1 copy (no cohort duplicates). */
const COHORTS = ['fy1'] as const

const ASSETS_DIR = path.resolve(
  process.env.USERPROFILE || '',
  '.cursor/projects/c-Users-FrostBite-Desktop-V-V1-1-sim-bleepy/assets'
)

const W = 1280
const H = 720

/** User-provided teaching slides (empty-window workspace attachments). */
const TEACHING = {
  whyMatter: 'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-0111b0ea-8113-4c32-a6f1-9b5f8a89cb1d.png',
  types: 'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-203a7a7e-89f0-4452-9737-8b2464ef9dca.png',
  fiveRs: 'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-735396f3-4294-46e4-b4aa-32757238e3ef.png',
  assess: 'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-6bf46abe-397c-4675-8397-490807eac890.png',
  algorithm: 'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-cf9236d1-b9ff-4b56-a880-83f05cce5353.png',
  resus: 'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-5c248b69-f5b2-41a1-ad36-763131470867.png',
  maintenance: 'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-d58f5f56-398f-4863-afca-efe4d3d8f1f2.png',
  losses: 'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-447352b5-9935-4a0e-816f-4c970a83835d.png',
  wellskySearch: 'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-587a8728-6a99-460d-8984-c2668aa74f63.png',
  wellskyVolume: 'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-993fd212-fb38-434c-8aeb-2aa9701bb366.png',
  wellskyRate: 'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-8a135d96-4a3f-4916-968a-4e9897fdd71f.png',
  wellskyConfirm: 'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-c8bc652a-a9b0-4dea-9236-a4c8f9b2d71c.png',
} as const

const FEATURED_BASE = path.join(ASSETS_DIR, 'fy1-iv-fluid-prescribing-bleepy-base.png')

type ImgPaths = Record<keyof typeof TEACHING, string>

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapTitle(title: string, maxChars = 28): string[] {
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

function figure(storagePath: string, alt: string, caption?: string) {
  const img = `<p style="text-align:center"><img src="${viewUrl(storagePath)}" alt="${alt.replace(/"/g, '&quot;')}" width="1280" loading="lazy" decoding="async" class="fy-img fy-img-wide" /></p>`
  if (!caption) return img
  return `<figure class="fy-figure">${img}<figcaption>${caption}</figcaption></figure>`
}

async function uploadBuffer(
  cohort: string,
  fileName: string,
  buffer: Buffer,
  contentType = 'image/webp'
): Promise<string> {
  const storagePath = `foundation-year/${cohort}/${TOPIC_SLUG}/${SLUG}/images/${fileName}`
  const { error } = await sb.storage.from('placements').upload(storagePath, buffer, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw new Error(`Upload failed ${storagePath}: ${error.message}`)
  console.log('  uploaded', storagePath)
  return storagePath
}

/** Upload teaching slides as original bytes (no WebP recompress / resize). */
async function uploadLocalOriginal(cohort: string, localPath: string, outBase: string): Promise<string> {
  if (!fs.existsSync(localPath)) throw new Error(`Missing local asset: ${localPath}`)
  const raw = fs.readFileSync(localPath)
  const meta = await sharp(raw).metadata()
  const format = meta.format || 'png'
  const ext = format === 'jpeg' ? 'jpg' : format
  const type =
    format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png'
  return uploadBuffer(cohort, `${outBase}.${ext}`, raw, type)
}

async function deleteOldPublicImages() {
  const folder = `foundation-year/general/${TOPIC_SLUG}/${SLUG}/images`
  const { data: listed } = await sb.storage.from('placements').list(folder, { limit: 100 })
  if (!listed?.length) return
  const paths = listed.map((f) => `${folder}/${f.name}`)
  const { error } = await sb.storage.from('placements').remove(paths)
  if (error) console.warn('  warn deleting old public images:', error.message)
  else console.log(`  deleted ${paths.length} old public image(s) under ${folder}`)
}

function buildContent(imgs: ImgPaths) {
  return `
<p>A practical FY1 guide to prescribing IV fluids safely — fluid assessment, the 5 Rs, resuscitation, maintenance, replacement, potassium, reassessment, and step-by-step Wellsky/EPMA prescribing at Basildon.</p>

<p><strong>Members-only:</strong> This guide includes Basildon Hospital Wellsky/EPMA screenshots and is only available to signed-in users. Always follow your current trust policy — fluid protocols and electronic systems vary between hospitals.</p>

<p>IV fluid prescribing is one of those jobs that looks simple until you are actually responsible for doing it. At 2 am you may get a bleep: <em>“Doctor, Mr Jones is nil by mouth and his fluids have finished. Can you prescribe another bag?”</em></p>
<p>It can be tempting to open the drug chart, prescribe another litre and move on. But IV fluids are a prescription, not just a bag of water. The wrong fluid, volume or rate can cause real harm — particularly in heart failure, renal impairment or electrolyte abnormalities.</p>

<h2>Why IV fluids matter</h2>
${figure(
  imgs.whyMatter,
  'Infographic explaining why IV fluid prescribing matters for FY1 patient safety',
  'Treat IV fluids like drugs: choose the right indication, fluid, volume and rate — then reassess.'
)}
<p>You will prescribe IV fluids daily. NICE CG174 frames the approach around the <strong>5 Rs</strong>: Resuscitation, Routine maintenance, Replacement, Redistribution and Reassessment.</p>

<h2>Types of IV fluids</h2>
${figure(
  imgs.types,
  'Types of IV fluids: crystalloids, colloids and glucose solutions with example bags',
  'Most FY1 ward prescribing uses crystalloids (e.g. 0.9% sodium chloride, Hartmann’s) and glucose-containing maintenance fluids. Colloids are less commonly first-line on general wards.'
)}
<ul>
  <li><strong>Crystalloids</strong> — e.g. 0.9% saline, Hartmann’s — commonly used for resuscitation and many maintenance/replacement situations.</li>
  <li><strong>Colloids</strong> — e.g. Gelofusine, albumin — used in selected volume-expansion situations; follow local guidance.</li>
  <li><strong>Glucose solutions</strong> — e.g. 5% or 10% dextrose — maintenance glucose and hypoglycaemia management (with senior/local protocol support when needed).</li>
</ul>

<h2>The 5 Rs of IV fluid therapy</h2>
${figure(
  imgs.fiveRs,
  'NICE CG174 5 Rs of IV fluids: resuscitation, routine maintenance, replacement, redistribution and reassessment',
  'Before choosing a bag, name the problem you are treating using the 5 Rs.'
)}
<p>For day-to-day FY1 work, the most useful split is usually:</p>
<ul>
  <li>Does this patient need <strong>resuscitation</strong>?</li>
  <li>Are they unable to meet normal requirements (<strong>routine maintenance</strong>)?</li>
  <li>Are they losing fluid that needs <strong>replacement</strong>?</li>
</ul>
<p>Also ask whether IV fluid is actually necessary. If a stable patient can drink safely and adequately, oral or enteral fluid is often preferable.</p>

<h2>Assess before prescribing</h2>
${figure(
  imgs.assess,
  'Assess before prescribing IV fluids: history, examination, fluid status and bloods',
  'Do not prescribe from the fluid chart alone — combine history, ABCDE/exam, fluid balance and bloods.'
)}
<p>Look for volume depletion (tachycardia, oliguria, prolonged capillary refill, cool peripheries, dry mucous membranes, postural hypotension) and for overload (raised JVP, oedema, tachypnoea, crepitations, rising oxygen requirement).</p>
<p><strong>FY1 tip:</strong> a dry mouth alone does not mean “two litres of saline”. Combine history, examination, observations, fluid balance, urine output and blood results.</p>
<p>Before prescribing, check weight, U&amp;Es, creatinine, potassium, fluid balance, urine output, comorbidities, and everything already going in (oral intake, feeds, IV antibiotics, other infusions).</p>

<h2>NICE-style IV fluid algorithm</h2>
${figure(
  imgs.algorithm,
  'IV fluids recommended algorithm covering assessment, resuscitation, maintenance and replacement',
  'Use a structured pathway: assess → resuscitate if needed → then decide maintenance vs replacement/redistribution.'
)}
<p>If the patient needs fluid resuscitation, treat that first. If not, decide whether they can meet needs orally/enterally. If not, distinguish simple routine maintenance from complex replacement/redistribution problems and escalate when the picture is complicated.</p>

<h2>If they need resuscitation</h2>
${figure(
  imgs.resus,
  'IV fluid resuscitation boluses and adjustments for FY1 doctors including frail and heart failure patients',
  'Give → reassess → decide. Escalate early if there is no response or the patient is unstable.'
)}
<p>Current UK guidance commonly recommends a crystalloid containing sodium in the range 130–154 mmol/L as a <strong>500 mL bolus over less than 15 minutes</strong>, then reassessment.</p>
<p>Reassess BP, pulse, capillary refill, mental state, urine output and chest findings. Older/frail patients and those with cardiac or renal impairment often need smaller boluses (e.g. 250 mL) and closer monitoring.</p>
<p><strong>FY1 tip:</strong> if the patient remains hypotensive or unwell after resuscitation, escalate. Do not keep prescribing litre after litre because “the BP is still low” — the problem may not simply be lack of fluid.</p>

<h2>Routine maintenance</h2>
${figure(
  imgs.maintenance,
  'Maintenance and replacement IV fluid calculations for adults including a 70 kg worked example',
  'Estimate maintenance from weight, then adjust for oral intake, other IV fluids, losses and comorbidities.'
)}
<p>For routine maintenance alone, an initial adult estimate is around <strong>25–30 mL/kg/day</strong> water, about <strong>1 mmol/kg/day</strong> sodium/potassium/chloride, and around <strong>50–100 g/day</strong> glucose.</p>
<p>For a 70 kg adult that is roughly 1.75–2.1 L/day — not an automatic “1 L saline every 8 hours”. Older/frail patients and those with heart failure or renal impairment often need less (around 20–25 mL/kg/day may be considered).</p>
<p>Three litres of 0.9% sodium chloride gives a substantial sodium and chloride load and is not an appropriate default maintenance prescription for every patient.</p>

<h2>Replacement is different from maintenance</h2>
${figure(
  imgs.losses,
  'IV fluid losses tables showing approximate electrolyte content of gastrointestinal and other fluid losses',
  'Match replacement to measured losses and approximate electrolyte content — then add this on top of maintenance needs.'
)}
<p>Think: <strong>maintenance needs + replacement of abnormal losses</strong> (vomiting/NG, diarrhoea, stomas, drains, fistulae, biliary/pancreatic losses, polyuria).</p>
<p>Gastrointestinal losses can contain substantial potassium. Use measured losses, blood results and local guidance to choose composition and rate.</p>

<h2>Be careful with potassium</h2>
<p>Before prescribing potassium-containing fluids, check the latest potassium, renal function and urine output. Be especially cautious in renal impairment. Use pre-prepared potassium-containing fluids according to local policy — do not manually add potassium to IV bags.</p>
<p>If potassium is significantly abnormal, renal function is deteriorating, or you are unsure about concentration/rate, discuss with a senior.</p>

<h2>Write a prescription that makes sense</h2>
<p>Be able to explain four things:</p>
<ul>
  <li><strong>Why</strong> am I giving it?</li>
  <li><strong>Which fluid</strong> does this patient need?</li>
  <li><strong>How much and how quickly?</strong></li>
  <li><strong>When</strong> will they be reassessed?</li>
</ul>
<p>A bag prescribed “over 8 hours” creates another decision 8 hours later — make sure the next review is intentional.</p>

<h2>Prescribing on Wellsky / EPMA (Basildon)</h2>
<p>At Basildon, IV fluids are commonly prescribed electronically on <strong>Wellsky / EPMA</strong>. The screens below show a typical saline prescription workflow. Other trusts use different systems — use this as a Basildon walkthrough, not a universal NHS method.</p>

<h3>1. Search for the fluid protocol</h3>
${figure(
  imgs.wellskySearch,
  'Wellsky EPMA treatment search for sodium chloride 0.9 percent IV infusion protocol',
  'Search the fluid (e.g. “sodium chloride”), open the Protocol tab, and choose the correct concentration.'
)}
<p>Start by searching the fluid. For normal saline, search <strong>sodium chloride</strong>, select the <strong>Protocol</strong> tab, and choose <strong>SODIUM CHLORIDE 0.9% IV Infusion</strong>.</p>

<h3>2. Select the bag volume</h3>
${figure(
  imgs.wellskyVolume,
  'Wellsky EPMA formulary selection of sodium chloride 0.9 percent bag volume',
  'Pick the correct bag size from the formulary (e.g. 250 mL, 500 mL or 1000 mL) before continuing.'
)}
<p>Select the right fluid volume from the formulary. Common options include 250 mL, 500 mL and 1000 mL — match the volume to your clinical plan (bolus vs maintenance bag).</p>

<h3>3. Set duration or rate</h3>
${figure(
  imgs.wellskyRate,
  'Wellsky EPMA order entry showing infusion time automatically calculating dose rate',
  'If you set infusion duration, Wellsky often calculates the rate automatically — always check it still makes clinical sense.'
)}
<p>On Order Entry, set the infusion time or rate. If you enter duration (e.g. 12 hours for 1000 mL), the system may auto-calculate the mL/hour rate. Re-check that the rate matches what you intended.</p>

<h3>4. Confirm the prescription</h3>
${figure(
  imgs.wellskyConfirm,
  'Wellsky EPMA confirmation screen before signing an IV fluid prescription',
  'Re-check fluid, volume, rate, duration and start/stop times, then confirm.'
)}
<p>On Confirmation, review the summary carefully (fluid, dose, rate, infusion time, route, start/stop). Once happy, confirm. If anything looks wrong, go back and correct it before signing.</p>

<h2>Always reassess</h2>
<p>Fluid prescribing is dynamic. Review clinical condition, observations, fluid balance, urine output, weight where appropriate, and bloods. Look actively for harm: oedema, new oxygen need, crepitations, rising sodium/chloride, worsening renal function.</p>
<p>The prescription that was right yesterday may be wrong today. Stop IV fluids when they are no longer needed.</p>

<h2>The FY1 rule for IV fluids</h2>
<p>When asked to “just prescribe some fluids”, pause:</p>
<p><strong>Why do they need fluid? → Underfilled or overloaded? → Resuscitation, maintenance or replacement? → Check weight, U&amp;Es and urine output → Prescribe → Reassess.</strong></p>
<p>If the patient is significantly unwell, has complex fluid balance, severe renal/cardiac disease, major electrolyte abnormalities, or you are uncertain — ask for senior help.</p>

<h2>How do FY1s decide which IV fluid to prescribe?</h2>
<p>Start with the indication (resuscitation, maintenance or replacement), assess fluid status, check weight/U&amp;Es/potassium/urine output/comorbidities, then choose fluid, volume and rate according to the clinical problem and local policy — with a clear reassessment plan.</p>

<h2>What should I check before prescribing IV fluids as an FY1?</h2>
<p>See the patient; assess for depletion or overload; review weight, U&amp;Es, creatinine, potassium, fluid balance, urine output, comorbidities and other fluid already going in.</p>

<h2>When should an FY1 escalate about IV fluids?</h2>
<p>Escalate early if the patient remains hypotensive/unwell after resuscitation, has complex losses or redistribution, significant heart/kidney disease, major electrolyte abnormalities, or if you are unsure what to prescribe.</p>

<p><em>Educational guide for Foundation doctors. Follow your hospital’s current IV fluid policy and Wellsky/EPMA local guidance. Seek senior advice where appropriate. Wellsky screenshots reflect Basildon Hospital EPMA workflows and may differ elsewhere.</em></p>
`.trim()
}

async function upsertPage(cohort: string, content: string, featuredPath: string) {
  const { data: topic, error: topicError } = await sb
    .from('fy_topics')
    .select('id')
    .eq('cohort', cohort)
    .eq('slug', TOPIC_SLUG)
    .maybeSingle()
  if (topicError || !topic) {
    console.warn(`  topic missing for ${cohort}, skip`)
    return
  }

  const { data: existing } = await sb
    .from('fy_pages')
    .select('id')
    .eq('topic_id', topic.id)
    .eq('slug', SLUG)
    .maybeSingle()

  const payload: Record<string, unknown> = {
    title: TITLE,
    content,
    featured_image: featuredPath,
    status: 'published',
    is_active: true,
    requires_auth: true,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    let { error } = await sb.from('fy_pages').update(payload).eq('id', existing.id)
    if (error?.message?.includes('requires_auth')) {
      delete payload.requires_auth
      ;({ error } = await sb.from('fy_pages').update(payload).eq('id', existing.id))
    }
    if (error) throw error
    console.log(`  updated page ${existing.id}`)
  } else {
    const insertPayload = {
      topic_id: topic.id,
      slug: SLUG,
      display_order: 55,
      ...payload,
    }
    let { data, error } = await sb.from('fy_pages').insert(insertPayload).select('id').single()
    if (error?.message?.includes('requires_auth')) {
      delete (insertPayload as any).requires_auth
      ;({ data, error } = await sb.from('fy_pages').insert(insertPayload).select('id').single())
    }
    if (error) throw error
    console.log(`  created page ${data?.id}`)
  }

  console.log(`  open: /placements/foundation-year/${cohort}/${TOPIC_SLUG}/${SLUG}`)
}

async function main() {
  if (!fs.existsSync(FEATURED_BASE)) throw new Error(`Missing featured base: ${FEATURED_BASE}`)
  for (const [key, file] of Object.entries(TEACHING)) {
    const p = path.join(ASSETS_DIR, file)
    if (!fs.existsSync(p)) throw new Error(`Missing teaching image ${key}: ${p}`)
  }

  console.log('Removing previously public general images (SEO defence)...')
  await deleteOldPublicImages()

  console.log('Composing featured card...')
  const featuredWebp = await composeFeatured(FEATURED_BASE)

  for (const cohort of COHORTS) {
    console.log(`\n=== cohort ${cohort}`)
    const featuredPath = await uploadBuffer(cohort, 'featured-bleepy-mascot.webp', featuredWebp)

    const imgs = {} as ImgPaths
    const uploads: Array<[keyof ImgPaths, string, string]> = [
      ['whyMatter', TEACHING.whyMatter, 'why-iv-fluids-matter'],
      ['types', TEACHING.types, 'types-of-iv-fluids'],
      ['fiveRs', TEACHING.fiveRs, 'iv-fluids-5rs'],
      ['assess', TEACHING.assess, 'assess-before-prescribing'],
      ['algorithm', TEACHING.algorithm, 'iv-fluids-algorithm'],
      ['resus', TEACHING.resus, 'resuscitation-boluses'],
      ['maintenance', TEACHING.maintenance, 'maintenance-replacement-calc'],
      ['losses', TEACHING.losses, 'fluid-losses-tables'],
      ['wellskySearch', TEACHING.wellskySearch, 'wellsky-search-protocol'],
      ['wellskyVolume', TEACHING.wellskyVolume, 'wellsky-select-volume'],
      ['wellskyRate', TEACHING.wellskyRate, 'wellsky-order-entry-rate'],
      ['wellskyConfirm', TEACHING.wellskyConfirm, 'wellsky-confirmation'],
    ]
    for (const [key, file, outBase] of uploads) {
      imgs[key] = await uploadLocalOriginal(cohort, path.join(ASSETS_DIR, file), outBase)
    }

    const content = buildContent(imgs)
    await upsertPage(cohort, content, featuredPath)
  }

  console.log('\nMembers-only URL examples:')
  console.log(`  /placements/foundation-year/fy1/${TOPIC_SLUG}/${SLUG}`)
  console.log(`  /placements/foundation-year/general/${TOPIC_SLUG}/${SLUG}`)
  console.log('Public /guides URL should 404 / not list this page.')
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
