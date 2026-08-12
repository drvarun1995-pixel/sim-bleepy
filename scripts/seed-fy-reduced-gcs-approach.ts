/**
 * Seed public FY guide:
 * "Called to a Patient With Reduced GCS: An FY Approach"
 *
 * Cohort: general · Topic: on-calls
 * Featured: unique Bleepy logo card. Inline: teaching infographics.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-fy-reduced-gcs-approach.ts
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

const TITLE = 'Called to a Patient With Reduced GCS: An FY Approach'
const FEATURED_TITLE = 'REDUCED GCS'
const SLUG = 'fy-reduced-gcs-approach'
const TOPIC_SLUG = 'on-calls'
const COHORT = 'general'
const IMAGE_DIR = `foundation-year/${COHORT}/${TOPIC_SLUG}/${SLUG}/images`
const LOGO = path.resolve('public/Bleepy-Logo-128.webp')
const META =
  'A practical FY guide to reviewing a patient with reduced GCS, including ABCDE, glucose, GCS assessment, common causes, investigations and escalation.'

const W = 1280
const H = 720
const INFO_H = 900

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapTitle(title: string, maxChars = 18): string[] {
  const words = title.trim().split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (next.length > maxChars && cur) {
      lines.push(cur)
      cur = w
    } else cur = next
  }
  if (cur) lines.push(cur)
  return lines.slice(0, 2)
}

function bannerSvg(titleLines: string[], cat1: string, cat2: string): Buffer {
  const titleFs = titleLines.length > 1 ? 40 : 48
  const titleBlockH = titleLines.length > 1 ? 118 : 92
  const titleY0 = titleLines.length > 1 ? 52 : 62
  const titleTspans = titleLines
    .map((line, i) => {
      const y = titleY0 + i * 46
      return `<text x="640" y="${y}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="${titleFs}" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(line)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="90" y="28" width="1100" height="${titleBlockH}" rx="18" ry="18" fill="#F25006"/>
  ${titleTspans}
  <rect x="160" y="560" width="960" height="110" rx="18" ry="18" fill="#EBA400"/>
  <text x="640" y="605" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(cat1)}</text>
  <text x="640" y="648" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(cat2)}</text>
</svg>`)
}

function gcsPropsSvg(): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(170,230)">
    <rect x="10" y="40" width="220" height="170" rx="18" fill="#EEF2FF" stroke="#4F46E5" stroke-width="6"/>
    <rect x="50" y="18" width="140" height="36" rx="10" fill="#4F46E5"/>
    <text x="120" y="42" text-anchor="middle" font-family="Arial" font-size="16" font-weight="800" fill="#fff">GCS</text>
    <text x="120" y="115" text-anchor="middle" font-family="Arial Black" font-size="34" fill="#312E81">E2 V3 M5</text>
    <text x="120" y="160" text-anchor="middle" font-family="Arial" font-size="15" font-weight="700" fill="#3730A3">was 15</text>
  </g>
  <g transform="translate(900,240)">
    <circle cx="80" cy="70" r="55" fill="#DBEAFE" stroke="#2563EB" stroke-width="5"/>
    <circle cx="60" cy="65" r="10" fill="#1E3A8A"/>
    <circle cx="100" cy="65" r="10" fill="#1E3A8A"/>
    <path d="M55 95 q25 18 50 0" stroke="#1E3A8A" stroke-width="5" fill="none" stroke-linecap="round"/>
    <text x="80" y="160" text-anchor="middle" font-family="Arial" font-size="15" font-weight="800" fill="#1E3A8A">PUPILS</text>
  </g>
</svg>`)
}

async function composeFeaturedLogoCard(): Promise<Buffer> {
  if (!fs.existsSync(LOGO)) throw new Error(`Missing logo: ${LOGO}`)

  const logo = await sharp(LOGO)
    .resize(360, 360, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  const watermark = await sharp(LOGO)
    .resize(700, 700, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .modulate({ brightness: 1.6, saturation: 0.05 })
    .png()
    .toBuffer()
  const watermarkSoft = await sharp(watermark)
    .composite([
      {
        input: Buffer.from(
          `<svg width="700" height="700"><rect width="700" height="700" fill="white" fill-opacity="0.55"/></svg>`
        ),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer()

  const lines = wrapTitle(FEATURED_TITLE)
  const banners = await sharp(
    bannerSvg(lines, 'ON-CALL & ACUTE CARE', 'FOUNDATION YEAR')
  )
    .png()
    .toBuffer()
  const props = await sharp(gcsPropsSvg()).png().toBuffer()

  return sharp({
    create: { width: W, height: H, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite([
      { input: watermarkSoft, top: 120, left: 290 },
      { input: props, top: 0, left: 0 },
      { input: logo, top: 210, left: 460 },
      {
        input: Buffer.from(
          `<svg width="220" height="28"><ellipse cx="110" cy="14" rx="100" ry="10" fill="#000" fill-opacity="0.12"/></svg>`
        ),
        top: 545,
        left: 530,
      },
      { input: banners, top: 0, left: 0 },
    ])
    .webp({ quality: 90, effort: 5 })
    .toBuffer()
}

function causesSvg(): Buffer {
  const items = [
    ['DRUGS / TOXINS', 'Opioids, sedatives, poisoning'],
    ['GLUCOSE / METABOLIC', 'Hypoglycaemia / electrolytes'],
    ['OXYGEN / CO₂', 'Hypoxia / hypercapnia'],
    ['NEUROLOGICAL', 'Stroke / bleed / raised ICP'],
    ['SEIZURE', 'Post-ictal / status'],
    ['INFECTION / SEPSIS', 'Meningitis / encephalitis'],
    ['TRAUMA', 'Head injury / fall'],
    ['ENDOCRINE', 'Adrenal / thyroid crisis'],
  ]
  const cards = items
    .map(([title, sub], i) => {
      const col = i % 4
      const row = Math.floor(i / 4)
      const x = 40 + col * 310
      const y = 200 + row * 280
      return `
      <rect x="${x}" y="${y}" width="290" height="230" rx="20" fill="#EEF2FF" stroke="#4F46E5" stroke-width="3"/>
      <text x="${x + 145}" y="${y + 95}" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#312E81">${escapeXml(title)}</text>
      <text x="${x + 145}" y="${y + 140}" text-anchor="middle" font-family="Arial" font-size="15" fill="#475569">${escapeXml(sub)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="70" text-anchor="middle" font-family="Arial Black" font-size="30" fill="#1E3A5F">WHY IS THE GCS REDUCED?</text>
  <text x="640" y="115" text-anchor="middle" font-family="Arial" font-size="18" fill="#64748B">Reduced GCS is a sign with multiple possible causes — check reversible ones early</text>
  ${cards}
  <text x="640" y="840" text-anchor="middle" font-family="Arial" font-size="16" font-weight="800" fill="#F25006">SUGAR → OXYGEN / CO₂ → DRUGS → SEIZURE → NEUROLOGY → SEPSIS → METABOLIC → TRAUMA</text>
</svg>`)
}

function gcsComponentsSvg(): Buffer {
  const panels = [
    ['EYES', 'Spontaneous → voice → stimulus → none', 'Record E'],
    ['VERBAL', 'Oriented → confused → words → sounds → none', 'Record V'],
    ['MOTOR', 'Obeys → localises → withdraws → abnormal → none', 'Record M'],
  ]
  const cards = panels
    .map(([title, sub, tip], i) => {
      const x = 70 + i * 390
      return `
      <rect x="${x}" y="220" width="350" height="420" rx="22" fill="#F8FAFC" stroke="#1E3A5F" stroke-width="3"/>
      <rect x="${x + 40}" y="260" width="270" height="70" rx="14" fill="#4F46E5"/>
      <text x="${x + 175}" y="305" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#fff">${escapeXml(title)}</text>
      <text x="${x + 175}" y="400" text-anchor="middle" font-family="Arial" font-size="17" fill="#334155">${escapeXml(sub)}</text>
      <text x="${x + 175}" y="520" text-anchor="middle" font-family="Arial Black" font-size="22" fill="#F25006">${escapeXml(tip)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="70" text-anchor="middle" font-family="Arial Black" font-size="30" fill="#1E3A5F">GCS COMPONENTS — RECORD E, V AND M</text>
  <text x="640" y="115" text-anchor="middle" font-family="Arial" font-size="18" fill="#64748B">The components are more useful than a total score alone — trend them over time</text>
  ${cards}
  <text x="640" y="820" text-anchor="middle" font-family="Arial" font-size="18" font-weight="800" fill="#F25006">Write E3 V3 M5, not just “GCS 11”</text>
</svg>`)
}

function pathwaySvg(): Buffer {
  const steps = [
    'GO NOW',
    'ABCDE',
    'GLUCOSE',
    'GCS + PUPILS',
    'MEDS / EVENTS',
    'FIND CAUSE',
    'TREAT',
    'INVESTIGATE',
    'REASSESS',
  ]
  const boxes = steps
    .map((s, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = 90 + col * 380
      const y = 180 + row * 210
      return `
      <rect x="${x}" y="${y}" width="320" height="140" rx="18" fill="#EEF2FF" stroke="#4F46E5" stroke-width="4"/>
      <text x="${x + 160}" y="${y + 55}" text-anchor="middle" font-family="Arial" font-size="16" fill="#4338CA">STEP ${i + 1}</text>
      <text x="${x + 160}" y="${y + 95}" text-anchor="middle" font-family="Arial Black" font-size="22" fill="#1E3A5F">${escapeXml(s)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="70" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#1E3A5F">FY REDUCED GCS — DECISION PATHWAY</text>
  <text x="640" y="115" text-anchor="middle" font-family="Arial" font-size="18" fill="#64748B">Stabilise first, check glucose early, identify the cause and repeatedly reassess</text>
  ${boxes}
  <rect x="160" y="800" width="960" height="60" rx="14" fill="#EBA400"/>
  <text x="640" y="840" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">A falling GCS is often more important than the absolute number</text>
</svg>`)
}

function viewUrl(storagePath: string) {
  return `/api/placements/images/view?path=${encodeURIComponent(storagePath)}`
}

function figure(storagePath: string, alt: string, caption?: string) {
  const img = `<p style="text-align:center"><img src="${viewUrl(storagePath)}" alt="${alt.replace(/"/g, '&quot;')}" width="1280" loading="lazy" decoding="async" class="fy-img fy-img-wide" /></p>`
  if (!caption) return img
  return `<figure class="fy-figure">${img}<figcaption>${caption}</figcaption></figure>`
}

async function uploadBuffer(storagePath: string, buffer: Buffer, contentType = 'image/webp') {
  const { error } = await sb.storage.from('placements').upload(storagePath, buffer, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw new Error(`Upload failed ${storagePath}: ${error.message}`)
  console.log('  uploaded', storagePath)
  return storagePath
}

async function uploadPngFromSvg(svg: Buffer, outBase: string) {
  const png = await sharp(svg).png().toBuffer()
  return uploadBuffer(`${IMAGE_DIR}/${outBase}.png`, png, 'image/png')
}

function buildContent(imgs: { causes: string; components: string; pathway: string }) {
  return `
<p>A practical FY guide to reviewing a patient with reduced GCS — ABCDE, glucose, GCS assessment, common causes, investigations and escalation.</p>

<p>It is 1:30 am and the nurse calls you: “Doctor, can you come and review this patient? They were awake earlier, but now they are very drowsy. Their GCS has dropped from 15 to 11.”</p>
<p>A new reduction in conscious level is a clinical emergency until you understand why it has happened. Reduced GCS is not a diagnosis. It can be caused by something rapidly reversible, such as hypoglycaemia or medication, but it can also be the first sign of stroke, intracranial bleeding, sepsis, respiratory failure or another serious illness.</p>
<p><strong>The key principle:</strong> Your first job is not to produce a perfect neurological diagnosis. It is to protect the patient, identify immediately reversible causes, assess the trend and escalate early.</p>

<h2>1. Go and see the patient now</h2>
<p>Do not leave a new drop in GCS sitting on a jobs list while you finish routine prescribing. Before you arrive, ask for a full set of observations and find out:</p>
<ul>
  <li>What is the GCS now, and what was it previously?</li>
  <li>When was the patient last seen at their normal conscious level?</li>
  <li>Was the change sudden or gradual?</li>
  <li>Have they had a fall, head injury or seizure?</li>
  <li>Have they received opioids, sedatives, insulin or other relevant medication?</li>
  <li>Are they hypoxic, hypotensive, febrile or bradypnoeic?</li>
  <li>Is there any new focal weakness, facial droop or speech disturbance?</li>
</ul>
<p><strong>FY tip:</strong> A fall from GCS 15 to 13 may be more important than a stable GCS of 13 in a patient whose baseline is already impaired. Always ask what has changed from baseline.</p>

<h2>2. Start with ABCDE</h2>
<p><strong>Common FY trap:</strong> Starting a long neurological examination before checking airway, breathing and blood glucose. Stabilise first; detailed examination comes after immediate threats have been addressed.</p>
<ul>
  <li><strong>A — Airway</strong> — Reduced consciousness can compromise the airway. Look and listen for obstruction, secretions, snoring or vomit. If the patient cannot protect their airway, has a GCS of 8 or below, or you are otherwise concerned about airway safety, call for urgent senior and anaesthetic/critical-care help.</li>
  <li><strong>B — Breathing</strong> — Check respiratory rate, oxygen saturation, oxygen requirement and work of breathing. A low respiratory rate in a drowsy patient should make you think about opioids or other sedating drugs. Hypoxia and hypercapnia can both reduce conscious level.</li>
  <li><strong>C — Circulation</strong> — Check heart rate, blood pressure, capillary refill and peripheral perfusion. Reduced cerebral perfusion from shock, bleeding or sepsis can cause confusion and reduced consciousness. Obtain IV access if the patient is significantly unwell.</li>
  <li><strong>D — Disability</strong> — Measure the GCS properly, check the pupils, look for focal neurology or seizure activity, and check a capillary blood glucose early.</li>
  <li><strong>E — Exposure</strong> — Check temperature and look for trauma, rash, bleeding, infection, needle marks or other clues. If trauma is possible, protect the cervical spine until injury has been appropriately excluded.</li>
</ul>

<h2>3. Check the blood glucose early</h2>
<p>Hypoglycaemia is one of the fastest reversible causes of reduced consciousness and should be checked early in any unexplained fall in GCS.</p>
<p>If the glucose is low, treat promptly using the current BNF and your NHS organisation's hypoglycaemia pathway, then recheck the glucose and reassess the patient's conscious level.</p>
<p><strong>FY rule:</strong> Reduced GCS + unknown cause = check a capillary glucose early.</p>

<h2>4. Measure the GCS properly — and record the components</h2>
${figure(
  imgs.components,
  'Glasgow Coma Scale eye verbal and motor assessment for Foundation doctors',
  'Record the individual eye, verbal and motor responses — the components are more useful than a total GCS alone.'
)}
<p>The Glasgow Coma Scale gives a structured way of describing conscious level. It assesses eye opening, verbal response and motor response.</p>
<p>Do not document only “GCS 11”. Write the components as well, for example E3 V3 M5. The components tell the next clinician where the change is occurring and make serial assessment more meaningful.</p>
<p>A GCS of 8 or below represents severe impairment of consciousness and should trigger immediate consideration of airway protection and specialist support.</p>
<p><strong>FY tip:</strong> Trend the GCS. A falling score is often more important than the absolute number. Repeat it after interventions and whenever the clinical state changes.</p>

<h2>5. Look at the pupils and for focal neurology</h2>
<p>Check pupil size and symmetry, reaction to light, new unilateral weakness, facial asymmetry, speech disturbance if the patient can speak, abnormal posturing, ongoing subtle seizure activity, and new severe headache or vomiting where relevant.</p>
<p>A new focal deficit, unequal or deteriorating pupil response, sudden onset of reduced consciousness, or concern about intracranial bleeding should prompt urgent senior assessment and appropriate brain imaging.</p>

<h2>6. Think in broad cause groups</h2>
${figure(
  imgs.causes,
  'Common causes of reduced GCS in an adult hospital patient',
  'Reduced GCS has a broad differential — always look for quickly reversible causes while considering serious neurological and systemic illness.'
)}
<p>Do not try to remember an enormous list at the bedside. A practical FY differential is to think through a few broad categories:</p>
<ul>
  <li><strong>Drugs and toxins</strong> — Opioids, sedatives, alcohol, poisoning or medication accumulation, especially with renal or hepatic impairment.</li>
  <li><strong>Glucose / metabolic</strong> — Hypoglycaemia, severe hyperglycaemia, sodium disturbance, uraemia, hepatic encephalopathy and other metabolic problems.</li>
  <li><strong>Oxygen / ventilation</strong> — Hypoxia or hypercapnia, including respiratory failure or excessive respiratory depression.</li>
  <li><strong>Neurological</strong> — Stroke, intracranial haemorrhage, subdural haematoma, subarachnoid haemorrhage, tumour or raised intracranial pressure.</li>
  <li><strong>Seizure</strong> — Post-ictal state, ongoing convulsive seizure or non-convulsive status.</li>
  <li><strong>Infection / systemic illness</strong> — Sepsis, meningitis, encephalitis, severe shock or hypothermia.</li>
  <li><strong>Trauma</strong> — Known or unwitnessed head injury, particularly after a fall or in an anticoagulated patient.</li>
  <li><strong>Endocrine</strong> — Adrenal crisis, severe thyroid disease and other less common endocrine emergencies.</li>
</ul>
<p><strong>A useful mental sweep:</strong> SUGAR → OXYGEN / CO₂ → DRUGS → SEIZURE → NEUROLOGY → SEPSIS / SYSTEMIC → METABOLIC → TRAUMA.</p>

<h2>7. Review the drug chart</h2>
<p>Medication is a common and sometimes overlooked cause of drowsiness on the ward. Check recent administrations, not just the regular medication list:</p>
<ul>
  <li>Opioids, including recent PRN doses</li>
  <li>Benzodiazepines and other sedatives</li>
  <li>Antipsychotic or sedating medication</li>
  <li>Insulin and glucose-lowering medication</li>
  <li>Antiepileptic medicines and whether doses have been missed</li>
  <li>Anticoagulants, especially if there has been a fall or possible head injury</li>
  <li>Recent changes in medication or renal function</li>
</ul>
<p><strong>Common FY trap:</strong> Writing “drowsy due to opioids” without checking the respiratory rate, pupils, glucose, observations and alternative causes. Medication may be the explanation, but reduced GCS still needs a structured assessment.</p>
<p>If opioid toxicity is suspected — for example reduced conscious level with respiratory depression and compatible clinical features — seek urgent senior help and use the current BNF and local NHS emergency pathway for naloxone and monitoring.</p>

<h2>8. Get a brief collateral history</h2>
<p>The patient may not be able to tell you what happened. Ask the nurse, relatives or other staff and review the notes for the patient's normal cognition and GCS, the exact time they were last known well, a witnessed fall, head strike or seizure, recent surgery or procedure, recent analgesia or sedation, alcohol or substance use where relevant, known epilepsy, stroke, diabetes, liver disease or renal failure, anticoagulation, and recent infection or deterioration.</p>
<p>In an emergency, get the short version first. You can collect the detailed history once the patient is stabilised.</p>

<h2>9. Investigate according to the problem</h2>
<p>Depending on the presentation, consider repeat capillary and laboratory glucose, FBC, U&amp;Es and creatinine, LFTs, CRP and infection-focused investigations where relevant, blood gas if respiratory failure, hypercapnia, metabolic disturbance or significant deterioration is suspected, ECG, blood cultures if sepsis is suspected and this does not delay urgent treatment, CT head when intracranial pathology, stroke or head injury is suspected, and drug levels or toxicology testing where clinically relevant.</p>
<p>If there has been a head injury, use the current NICE head injury pathway to guide imaging and specialist assessment rather than relying on memory.</p>

<h2>10. Treat reversible causes while you investigate</h2>
<p>Do not wait for every result before treating an obvious reversible problem. Examples include treating hypoglycaemia promptly, correcting hypoxia and addressing ventilatory failure, managing active seizures according to the current emergency pathway, following the current BNF/local NHS naloxone pathway if opioid toxicity is suspected, treating shock or sepsis appropriately, and escalating suspected stroke, intracranial bleed, meningitis/encephalitis or other neurological emergency urgently.</p>

<h2>11. Reassess — do not take one GCS and walk away</h2>
<p>Reduced conscious level is dynamic. Repeat the GCS, pupils, observations, respiratory status and glucose after treatment and at an appropriate frequency.</p>
<p>A patient whose GCS continues to fall despite apparently reassuring blood pressure or oxygen saturation is still deteriorating.</p>
<p><strong>FY tip:</strong> Document the response to treatment: “GCS improved from E2 V3 M5 to E4 V4 M6 after correction of hypoglycaemia” is far more useful than “patient better”.</p>

${figure(
  imgs.pathway,
  'Step-by-step FY approach to a patient with reduced GCS',
  'The safe FY approach is to stabilise first, check glucose early, identify the cause and repeatedly reassess the conscious level.'
)}

<h2>12. When to escalate</h2>
<p>Escalate urgently if:</p>
<ul>
  <li>GCS is 8 or below, or airway protection is a concern</li>
  <li>The GCS is falling or the cause is unclear</li>
  <li>There is respiratory depression, hypoxia or suspected hypercapnia</li>
  <li>There is a new focal neurological deficit</li>
  <li>Pupils are unequal, abnormal or changing</li>
  <li>There is suspected stroke, intracranial bleeding or significant head injury</li>
  <li>The patient is actively seizing or not recovering as expected after a seizure</li>
  <li>There is significant hypotension, sepsis or another cause of physiological deterioration</li>
  <li>You suspect poisoning or need an antidote</li>
  <li>The patient is not improving after initial treatment</li>
  <li>You are worried</li>
</ul>
<p>You do not need to know the final diagnosis before calling. A useful escalation might be: “This patient has dropped from GCS 15 to E2 V3 M5 over the last hour. Their airway is currently patent, respiratory rate is 8 after recent opioid administration, glucose is normal and pupils are small. I am concerned about opioid-related respiratory depression but I am continuing to exclude other causes. I need you to review them now.”</p>

<h2>A practical FY example</h2>
<p>You are called to a postoperative patient who is difficult to wake. Earlier they were GCS 15. They have received opioid analgesia. You find a respiratory rate of 8/min, small pupils and a GCS of E2 V3 M5. Oxygen saturation is acceptable on supplemental oxygen.</p>
<ul>
  <li><strong>Is this a genuine change?</strong> Yes — the baseline was GCS 15.</li>
  <li><strong>Immediate priority?</strong> ABCDE, with particular attention to airway and ventilation.</li>
  <li><strong>Quick reversible cause?</strong> Check capillary glucose immediately.</li>
  <li><strong>Important clue?</strong> Recent opioid administration plus respiratory depression and small pupils.</li>
  <li><strong>What next?</strong> Stop further sedating medication, call for senior/anaesthetic support and follow the current BNF/local NHS opioid-toxicity pathway if indicated.</li>
  <li><strong>What must not be forgotten?</strong> Other causes remain possible, especially if the patient does not improve as expected.</li>
  <li><strong>What do you monitor?</strong> GCS components, respiratory rate, oxygenation/ventilation, pupils and response to treatment.</li>
</ul>

<h2>The FY rule for reduced GCS</h2>
<p><strong>GO NOW → ABCDE → GLUCOSE → GCS + PUPILS → FIND THE CAUSE → TREAT REVERSIBLE PROBLEMS → INVESTIGATE → REASSESS → ESCALATE</strong></p>
<p><strong>The key message:</strong> Reduced GCS is a sign, not a diagnosis. Protect the airway, check glucose, identify rapidly reversible causes, look for neurological red flags and reassess the trend.</p>

<p><em>Educational note: This article is intended as an educational guide for Foundation doctors. For individual patients, use current NICE, BNF and your NHS organisation's deteriorating-patient, hypoglycaemia, seizure, poisoning, stroke and head-injury pathways, and seek senior help early.</em></p>
`.trim()
}

async function ensureTopic(): Promise<string> {
  const { data: existing } = await sb
    .from('fy_topics')
    .select('id')
    .eq('cohort', COHORT)
    .eq('slug', TOPIC_SLUG)
    .maybeSingle()

  if (existing?.id) return existing.id as string

  const { data, error } = await sb
    .from('fy_topics')
    .insert({
      cohort: COHORT,
      slug: TOPIC_SLUG,
      name: 'On-calls',
      description: 'Bleeps, night cover and reviewing patients',
      display_order: 6,
      is_active: true,
    })
    .select('id')
    .single()
  if (error) throw error
  return data!.id as string
}

async function upsertPage(topicId: string, content: string, featuredPath: string) {
  const { data: existing } = await sb
    .from('fy_pages')
    .select('id')
    .eq('slug', SLUG)
    .maybeSingle()

  const payload: Record<string, unknown> = {
    topic_id: topicId,
    title: TITLE,
    content,
    featured_image: featuredPath,
    status: 'published' as const,
    is_active: true,
    requires_auth: false,
    updated_at: new Date().toISOString(),
    meta_description: META,
  }

  if (existing) {
    let { error } = await sb.from('fy_pages').update(payload).eq('id', existing.id)
    if (error?.message?.includes('meta_description')) {
      delete payload.meta_description
      ;({ error } = await sb.from('fy_pages').update(payload).eq('id', existing.id))
    }
    if (error?.message?.includes('requires_auth')) {
      const { requires_auth: _r, meta_description: _m, ...rest } = payload
      ;({ error } = await sb.from('fy_pages').update(rest).eq('id', existing.id))
    }
    if (error) throw error
    console.log(`Updated page ${existing.id}`)
    return existing.id as string
  }

  const insertPayload = { slug: SLUG, display_order: 55, ...payload }
  let { data, error } = await sb.from('fy_pages').insert(insertPayload).select('id').single()
  if (error?.message?.includes('meta_description')) {
    delete (insertPayload as any).meta_description
    ;({ data, error } = await sb.from('fy_pages').insert(insertPayload).select('id').single())
  }
  if (error?.message?.includes('requires_auth')) {
    const { requires_auth: _r, ...rest } = insertPayload as any
    ;({ data, error } = await sb.from('fy_pages').insert(rest).select('id').single())
  }
  if (error) throw error
  console.log(`Created page ${data?.id}`)
  return data!.id as string
}

async function main() {
  console.log('Composing unique featured Bleepy card...')
  const featuredWebp = await composeFeaturedLogoCard()
  const featuredPath = `${IMAGE_DIR}/featured-bleepy-logo.webp`
  await uploadBuffer(featuredPath, featuredWebp, 'image/webp')

  console.log('Generating teaching infographics...')
  const causes = await uploadPngFromSvg(causesSvg(), 'causes-of-reduced-gcs-fy')
  const components = await uploadPngFromSvg(gcsComponentsSvg(), 'gcs-components-fy-infographic')
  const pathway = await uploadPngFromSvg(pathwaySvg(), 'fy-reduced-gcs-decision-pathway')

  const content = buildContent({ causes, components, pathway })
  const topicId = await ensureTopic()
  await upsertPage(topicId, content, featuredPath)

  console.log(`\nPlacements: /placements/foundation-year/${COHORT}/${TOPIC_SLUG}/${SLUG}`)
  console.log(`Public SEO URL: /guides/foundation-year/${TOPIC_SLUG}/${SLUG}`)
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
