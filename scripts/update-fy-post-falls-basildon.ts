/**
 * Update post-falls assessment from updated Word doc, move to Basildon-only,
 * and mark members-only.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/update-fy-post-falls-basildon.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const TITLE = 'Post-Falls Assessment for Foundation Doctors: A Practical Ward Guide'
const FEATURED_TITLE = 'POST-FALLS ASSESSMENT'
const SLUG = 'post-falls-assessment'
const COHORT = 'basildon'
const TOPIC_SLUG = 'local-systems'
const IMAGE_DIR = `foundation-year/${COHORT}/${TOPIC_SLUG}/${SLUG}/images`
const LOGO = path.resolve('public/Bleepy-Logo-128.webp')
const META =
  'A practical Foundation doctor guide to inpatient falls: immediate assessment, injury checks, neurological observations, CT-head decisions, causes and prevention.'

const W = 1280
const H = 720
const INFO_H = 980

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
  const titleFs = titleLines.length > 1 ? 34 : 42
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

function fallsPropsSvg(): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(180,240)">
    <rect x="10" y="40" width="200" height="160" rx="18" fill="#EFF6FF" stroke="#2563EB" stroke-width="6"/>
    <text x="110" y="110" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#1D4ED8">GCS</text>
    <text x="110" y="155" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#1E3A8A">E · V · M</text>
  </g>
  <g transform="translate(900,250)">
    <circle cx="80" cy="70" r="55" fill="#DBEAFE" stroke="#2563EB" stroke-width="5"/>
    <path d="M55 85 q25 20 50 0" stroke="#1E3A8A" stroke-width="6" fill="none"/>
    <circle cx="60" cy="60" r="8" fill="#1E3A8A"/>
    <circle cx="100" cy="60" r="8" fill="#1E3A8A"/>
    <text x="80" y="160" text-anchor="middle" font-family="Arial" font-size="14" font-weight="800" fill="#1E3A8A">REVIEW</text>
  </g>
</svg>`)
}

async function composeFeatured(): Promise<Buffer> {
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
  const banners = await sharp(
    bannerSvg(wrapTitle(FEATURED_TITLE), 'BASILDON-ONLY', 'FOUNDATION YEAR')
  )
    .png()
    .toBuffer()
  const props = await sharp(fallsPropsSvg()).png().toBuffer()
  return sharp({
    create: { width: W, height: H, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite([
      { input: watermarkSoft, top: 120, left: 290 },
      { input: props, top: 0, left: 0 },
      { input: logo, top: 210, left: 460 },
      { input: banners, top: 0, left: 0 },
    ])
    .webp({ quality: 90, effort: 5 })
    .toBuffer()
}

function pathwaySvg(): Buffer {
  const steps = [
    ['FALL', 'Go now'],
    ['ABCDE', 'If unwell'],
    ['EXCLUDE', 'Collapse / emergency'],
    ['INJURY CHECK', 'Head / spine / hip'],
    ['HEAD INJURY?', 'Can it be excluded?'],
    ['NEURO OBS', 'If indicated'],
    ['GLUCOSE', 'Check / recheck'],
    ['CT HEAD', 'Current NICE criteria'],
    ['CAUSE + PREVENT', 'Document / hand over'],
  ]
  const boxes = steps
    .map(([t, s], i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = 70 + col * 400
      const y = 160 + row * 240
      return `
      <rect x="${x}" y="${y}" width="360" height="190" rx="18" fill="#EFF6FF" stroke="#2563EB" stroke-width="3"/>
      <text x="${x + 180}" y="${y + 55}" text-anchor="middle" font-family="Arial" font-size="15" fill="#1D4ED8">STEP ${i + 1}</text>
      <text x="${x + 180}" y="${y + 100}" text-anchor="middle" font-family="Arial Black" font-size="22" fill="#1E3A5F">${escapeXml(t)}</text>
      <text x="${x + 180}" y="${y + 140}" text-anchor="middle" font-family="Arial" font-size="16" fill="#475569">${escapeXml(s)}</text>`
    })
    .join('\n')
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="55" text-anchor="middle" font-family="Arial Black" font-size="26" fill="#1E3A5F">POST-FALLS ASSESSMENT PATHWAY</text>
  <text x="640" y="95" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748B">Injury assessment and an investigation into why the fall happened</text>
  ${boxes}
  <rect x="160" y="880" width="960" height="55" rx="12" fill="#EBA400"/>
  <text x="640" y="915" text-anchor="middle" font-family="Arial Black" font-size="16" fill="#fff">INJURY → MEDICAL CAUSE → NEUROLOGICAL RISK → PREVENT RECURRENCE</text>
</svg>`)
}

function neuroObsSvg(): Buffer {
  const items = [
    ['GCS', 'Eyes · Verbal · Motor\nRecord components'],
    ['PUPILS', 'Size · Symmetry\nReaction to light'],
    ['LIMBS', 'Power · Symmetry\nNew asymmetry'],
    ['PHYSIO OBS', 'Temp · Pulse · RR\nBP · SpO₂'],
  ]
  const cards = items
    .map(([title, sub], i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = 120 + col * 520
      const y = 180 + row * 300
      const lines = sub.split('\n')
      return `
      <rect x="${x}" y="${y}" width="460" height="250" rx="20" fill="#F8FAFC" stroke="#1E3A5F" stroke-width="3"/>
      <rect x="${x + 40}" y="${y + 30}" width="380" height="60" rx="12" fill="#2563EB"/>
      <text x="${x + 230}" y="${y + 70}" text-anchor="middle" font-family="Arial Black" font-size="24" fill="#fff">${escapeXml(title)}</text>
      <text x="${x + 230}" y="${y + 140}" text-anchor="middle" font-family="Arial" font-size="18" fill="#334155">${escapeXml(lines[0])}</text>
      <text x="${x + 230}" y="${y + 180}" text-anchor="middle" font-family="Arial" font-size="18" fill="#334155">${escapeXml(lines[1] || '')}</text>`
    })
    .join('\n')
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="60" text-anchor="middle" font-family="Arial Black" font-size="26" fill="#1E3A5F">COMPLETE NEUROLOGICAL OBSERVATIONS</text>
  <text x="640" y="100" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748B">After suspected head injury — more than the total GCS</text>
  ${cards}
  <text x="640" y="880" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#F25006">Trend every set against the patient’s documented baseline</text>
</svg>`)
}

function timelineSvg(): Buffer {
  const rows = [
    ['Until baseline / GCS 15', 'Every 30 minutes'],
    ['Once baseline reached', 'Every 30 min × 2 hours'],
    ['If stable', 'Every 1 hour × 4 hours'],
    ['If still stable', 'Every 2 hours up to 24h'],
  ]
  const cards = rows
    .map(([phase, freq], i) => {
      const y = 180 + i * 140
      return `
      <rect x="140" y="${y}" width="1000" height="110" rx="16" fill="${i % 2 ? '#EFF6FF' : '#F8FAFC'}" stroke="#1E3A5F" stroke-width="2"/>
      <circle cx="210" cy="${y + 55}" r="28" fill="#2563EB"/>
      <text x="210" y="${y + 62}" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">${i + 1}</text>
      <text x="280" y="${y + 45}" font-family="Arial Black" font-size="20" fill="#1E3A5F">${escapeXml(phase)}</text>
      <text x="280" y="${y + 80}" font-family="Arial" font-size="18" fill="#475569">${escapeXml(freq)}</text>`
    })
    .join('\n')
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="55" text-anchor="middle" font-family="Arial Black" font-size="24" fill="#1E3A5F">NEURO OBSERVATION TIMELINE AFTER A FALL</text>
  <text x="640" y="95" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748B">When head injury has occurred or cannot be excluded</text>
  ${cards}
  <rect x="160" y="780" width="960" height="80" rx="14" fill="#FEF2F2" stroke="#DC2626" stroke-width="3"/>
  <text x="640" y="830" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#B91C1C">Deterioration → immediate reassessment + more frequent obs + escalate</text>
  <text x="640" y="920" text-anchor="middle" font-family="Arial" font-size="15" fill="#64748B">Full physiological observations at the same frequency</text>
</svg>`)
}

function redFlagsSvg(): Buffer {
  const flags = [
    'Falling GCS',
    'Agitation / abnormal behaviour',
    'Increasing headache',
    'Persistent vomiting',
    'Pupil inequality',
    'New facial asymmetry',
    'New unilateral weakness',
    'Seizure',
    'GCS ≤8 / airway concern',
  ]
  const cards = flags
    .map((f, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = 70 + col * 400
      const y = 180 + row * 220
      return `
      <rect x="${x}" y="${y}" width="360" height="180" rx="18" fill="#FEF2F2" stroke="#DC2626" stroke-width="3"/>
      <text x="${x + 180}" y="${y + 100}" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#7F1D1D">${escapeXml(f)}</text>`
    })
    .join('\n')
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="60" text-anchor="middle" font-family="Arial Black" font-size="26" fill="#1E3A5F">NEUROLOGICAL DETERIORATION RED FLAGS</text>
  <text x="640" y="100" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748B">Escalate now — do not wait for the next scheduled observation</text>
  ${cards}
  <rect x="220" y="860" width="840" height="60" rx="14" fill="#DC2626"/>
  <text x="640" y="900" text-anchor="middle" font-family="Arial Black" font-size="22" fill="#fff">ESCALATE NOW</text>
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

async function uploadBuffer(storagePath: string, buffer: Buffer, contentType: string) {
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

function buildContent(imgs: {
  pathway: string
  neuro: string
  timeline: string
  flags: string
}) {
  return `
<p>A practical Foundation doctor guide to inpatient falls: immediate assessment, injury checks, neurological observations, CT-head decisions, causes and prevention.</p>

<p>It is 3 am and the nurse calls: “Doctor, one of our patients has fallen next to the bed. They are back in bed now and seem okay. Could you review them?”</p>
<p>A post-falls review is not simply a bruise check. Your job is to answer three questions: Has the patient been injured? Why did they fall? And what needs to change to reduce the chance of another fall? If head injury has occurred or cannot be excluded, neurological assessment and observation become especially important.</p>
<p><strong>The core approach:</strong> INJURY → MEDICAL CAUSE → NEUROLOGICAL RISK → PREVENT RECURRENCE. Do not skip the first two because the patient “looks fine”.</p>
<p><strong>Foundation doctor tip:</strong> Frailty matters. A low-impact fall can still cause a hip fracture, intracranial injury or other significant harm, particularly in older or cognitively impaired patients.</p>

${figure(
  imgs.pathway,
  'Post-falls assessment decision pathway for Foundation doctors',
  'The post-falls assessment is both an injury assessment and an investigation into why the fall happened.'
)}

<h2>1. Go and see the patient — and establish what actually happened</h2>
<p>Ask for a full set of physiological observations and speak to the patient, nurse and any witness. Establish:</p>
<ul>
  <li>Was the fall witnessed or unwitnessed?</li>
  <li>Was there a head strike, or can head injury definitely be excluded?</li>
  <li>Was there loss of consciousness, collapse, seizure-like activity or preceding dizziness?</li>
  <li>Where and how was the patient found?</li>
  <li>Were they able to move or weight-bear afterwards?</li>
  <li>Are they taking an anticoagulant or antiplatelet medicine?</li>
  <li>What is their normal mobility, cognition and neurological baseline?</li>
  <li>Is there new pain, weakness, confusion, drowsiness, headache or vomiting?</li>
</ul>

<h2>2. First exclude a medical emergency or collapse</h2>
<p>Before assuming this was a mechanical fall, consider whether the patient collapsed because of an acute medical problem. If they are unwell, altered, hypotensive or have sustained significant trauma, use ABCDE.</p>
<ul>
  <li><strong>Airway:</strong> is it patent, and can the patient protect it?</li>
  <li><strong>Breathing:</strong> respiratory rate, oxygen saturation, chest movement and evidence of chest injury.</li>
  <li><strong>Circulation:</strong> pulse, blood pressure, perfusion, bleeding and possible arrhythmia or shock.</li>
  <li><strong>Disability:</strong> GCS/AVPU, pupils, limb movement and capillary blood glucose.</li>
  <li><strong>Exposure:</strong> look for head injury, bruising, deformity, spinal tenderness, skin tears and other trauma.</li>
</ul>
<p><strong>Do not miss:</strong> A fall may be the consequence of syncope, arrhythmia, sepsis, hypoglycaemia, stroke, haemorrhage or another acute illness. “Mechanical fall” should not be the default diagnosis.</p>

<h2>3. Before moving the patient, think about spinal injury</h2>
<p>If there is central spinal pain, new altered sensation, weakness, a concerning mechanism or another reason to suspect spinal injury, minimise unnecessary movement and seek senior/trauma support before routine transfer from the floor. If spinal injury is not suspected, use appropriate moving-and-handling equipment rather than manually lifting the patient.</p>

<h2>4. Look systematically for injury</h2>
<p>A focused secondary survey should be guided by the mechanism and symptoms. Pay particular attention to:</p>
<ul>
  <li><strong>Head and face:</strong> scalp swelling or wound, headache, vomiting, amnesia, altered behaviour or neurological change.</li>
  <li><strong>Neck and spine:</strong> pain, midline tenderness, neurological symptoms or altered sensation.</li>
  <li><strong>Hip and pelvis:</strong> hip, groin or knee pain; shortening or external rotation; inability to lift the leg or weight-bear.</li>
  <li><strong>Other limbs:</strong> wrist, humeral, clavicular and lower-limb tenderness, swelling, deformity or loss of function.</li>
  <li><strong>Chest and abdomen:</strong> pain, tenderness or evidence of trauma.</li>
  <li><strong>Skin:</strong> tears, bruising, bleeding and pressure injury.</li>
</ul>
<p><strong>Suspected hip fracture:</strong> Do not repeatedly stand or mobilise a patient to “see if they can walk” when hip fracture is suspected. Provide analgesia, minimise movement and arrange urgent imaging and orthopaedic review if confirmed.</p>

<h2>5. When are neurological observations needed?</h2>
${figure(
  imgs.neuro,
  'Four components of neurological observations after an inpatient fall',
  'Neurological observations after suspected head injury include more than the total GCS.'
)}
<p>Neurological observations are indicated when head injury has occurred or cannot be excluded — for example after an unwitnessed fall where nobody can confidently rule out head impact. They are also important when there is an acute change in neurological status or a sustained reduction from the patient’s normal level of alertness that is not rapidly explained and corrected.</p>
<p>A complete neurological observation set should include GCS (eye, verbal and motor components), pupil size/symmetry/reaction to light, limb responses/motor symmetry, and full physiological observations including temperature, pulse, respiratory rate, blood pressure and oxygen saturation.</p>
<p><strong>Important:</strong> Neurological observations are a trend, not a single GCS number. Compare every set with the patient’s documented baseline.</p>

<h2>6. GCS: record the components, not just the total</h2>
<p>Document the individual components as well as the total — for example E4 V4 M6 = 14. This makes deterioration easier to recognise and communicate. Record limitations to assessment, such as intubation, aphasia, pre-existing disability or inability to open the eyes.</p>
<p>If a painful stimulus is required, use an appropriate validated central stimulus and avoid sternal rubbing because it can cause bruising. Stop once an adequate response is obtained.</p>

<h2>7. Pupils and limb responses are part of the neurological examination</h2>
<p>Check pupil size and reaction to light using an appropriate light source. New anisocoria, a newly sluggish or absent response, or a dilated fixed pupil requires urgent senior assessment. Be aware that opioids, anticholinergic drugs, beta-blocker eye drops, previous ocular trauma and cataracts can alter pupil size or response.</p>
<p>Assess limb movement and power bilaterally. New asymmetry, facial weakness or a new difference between left and right sides should be treated as a significant neurological change.</p>

<h2>8. Know the neurological deterioration triggers</h2>
${figure(
  imgs.flags,
  'Neurological deterioration red flags after an inpatient fall',
  'Neurological deterioration after a fall should trigger urgent reassessment rather than waiting for the next scheduled observation.'
)}
<p>Urgent reassessment and escalation are needed for neurological deterioration. Important warning signs include:</p>
<ul>
  <li>A fall in GCS, especially a drop of 2 or more points, or a 1-point drop that persists on repeat assessment.</li>
  <li>A drop of 3 or more points in eye-opening or verbal response, or 2 or more points in motor response.</li>
  <li>New agitation or abnormal behaviour.</li>
  <li>Severe or increasing headache.</li>
  <li>Persistent vomiting.</li>
  <li>New pupil inequality.</li>
  <li>New or evolving asymmetry of limb or facial movement.</li>
  <li>GCS 8 or less, or any concern that the patient may not protect their airway.</li>
</ul>
<p><strong>Foundation doctor tip:</strong> If the GCS changes, repeat the assessment promptly, check glucose, review oxygenation/ventilation and escalate. Do not wait for the next scheduled observation if the patient is deteriorating.</p>

<h2>9. A practical neurological observation schedule after a fall</h2>
${figure(
  imgs.timeline,
  'Neurological observation timeline after an inpatient fall',
  'Neurological observations should become less frequent only when the patient remains stable; deterioration requires immediate reassessment and escalation.'
)}
<p>When head injury has occurred or cannot be excluded, observations should start as soon as possible and be frequent enough to establish a baseline and detect deterioration. A practical monitoring sequence is:</p>
<ul>
  <li><strong>Until GCS returns to 15 or the patient’s normal baseline:</strong> every 30 minutes.</li>
  <li><strong>Once baseline/GCS 15 is reached:</strong> every 30 minutes for 2 hours.</li>
  <li><strong>If stable:</strong> every 1 hour for 4 hours.</li>
  <li><strong>If still stable:</strong> every 2 hours up to 24 hours or until a documented senior plan changes the schedule.</li>
</ul>
<p>Full physiological observations should be performed at the same frequency as the neurological observations. If the patient deteriorates at any point, return to more frequent observations and escalate rather than waiting for the next scheduled set.</p>

<h2>10. Recheck blood glucose if neurological status changes</h2>
<p>Hypoglycaemia is a reversible cause of altered consciousness. Check capillary blood glucose during the initial assessment and recheck it if there is a new fall in GCS or unexplained deterioration, even in a patient without diabetes.</p>

<h2>11. Does the patient need a CT head?</h2>
<p>Use the current NICE head-injury criteria rather than relying on the absence of an obvious scalp wound. Important features include reduced or deteriorating GCS, focal neurological deficit, suspected skull fracture, post-traumatic seizure, repeated vomiting and loss of consciousness or amnesia with additional risk factors.</p>
<p>For the current adult CT-head criteria and timings, use <a class="fy-source-link" href="https://www.nice.org.uk/guidance/ng232" target="_blank" rel="noopener">NICE NG232: Head injury — assessment and early management</a>.</p>
<p>For a person with a head injury who has no other indication for CT but is taking anticoagulant treatment or antiplatelet treatment other than aspirin monotherapy, NICE advises considering a CT head scan. The timing depends on when the injury occurred and the clinical circumstances, so check the current NICE pathway rather than memorising a simplified rule.</p>
<p><strong>Practical point:</strong> Unwitnessed fall + head injury cannot be excluded + anticoagulation/antiplatelet therapy = actively check the current NICE CT-head pathway and discuss with a senior when needed.</p>

<h2>12. Avoid obscuring the neurological examination</h2>
<p>After suspected head injury, avoid unnecessary sedating medication where possible because it can make neurological deterioration harder to detect. If sedation is clinically necessary, document why it is required and make sure the monitoring plan remains appropriate.</p>

<h2>13. Work out why the patient fell</h2>
<p>Once significant injury has been addressed, investigate the cause. Consider postural hypotension or dehydration; arrhythmia, syncope or another cardiovascular cause; infection or acute illness; hypoglycaemia or another metabolic disturbance; medication effects (including sedatives, opioids, antihypertensives and diuretics); delirium or cognitive impairment; poor mobility, weakness or deconditioning; toileting urgency/nocturia; and visual impairment, inappropriate footwear or environmental hazards.</p>
<p>For current national falls assessment and prevention recommendations, see <a class="fy-source-link" href="https://www.nice.org.uk/guidance/ng249" target="_blank" rel="noopener">NICE NG249: Falls — assessment and prevention</a>.</p>

<h2>14. Investigations should answer a clinical question</h2>
<ul>
  <li>ECG if syncope, arrhythmia or unexplained collapse is possible.</li>
  <li>Capillary glucose if not already checked.</li>
  <li>FBC, U&amp;Es and other blood tests if anaemia, infection, dehydration or metabolic disturbance is suspected.</li>
  <li>Postural blood pressure when clinically appropriate and safe.</li>
  <li>Urgent X-ray for suspected fracture.</li>
  <li>CT head according to current NICE head-injury criteria.</li>
  <li>Other investigations guided by the suspected cause rather than a fixed “falls panel”.</li>
</ul>
<p>Imaging requested to exclude a significant injury should be treated as time-sensitive: make sure it is performed, reviewed and acted on rather than simply ordered and forgotten.</p>

<h2>15. Prevent the next fall</h2>
<p>A post-falls review is incomplete if you only rule out injury. The fall should trigger a review of modifiable risk factors and the patient’s care plan:</p>
<ul>
  <li>Review mobility, supervision and need for walking aids.</li>
  <li>Review medicines that may have contributed.</li>
  <li>Correct dehydration, hypoglycaemia, infection or other reversible illness.</li>
  <li>Address toileting needs.</li>
  <li>Ensure glasses, hearing aids and suitable footwear are available where relevant.</li>
  <li>Request physiotherapy, occupational therapy or wider multidisciplinary assessment when indicated.</li>
  <li>Update staff about any changed mobility or supervision requirement.</li>
</ul>

<h2>16. Document and hand over clearly</h2>
<p>Your entry should make it easy for the next clinician to understand what happened, what you found and what still needs to happen. Include time and circumstances of the fall; whether head injury can be excluded; symptoms before and after; ABCDE/physiological observations; GCS components, pupils and limb findings when indicated; injuries found or specifically not found; anticoagulant/antiplatelet status; working explanation for the fall; investigations and imaging decisions; who you escalated to; neurological observation frequency; and falls-prevention actions.</p>
<p>A fall or near miss should also be reported through the organisation’s patient-safety incident reporting system with an accurate description of the circumstances and any resulting injury.</p>

<h2>A practical Foundation doctor example</h2>
<p>An 82-year-old inpatient is found on the floor beside the bed after an unwitnessed fall. They cannot remember what happened. They take apixaban for atrial fibrillation. There is no obvious external head injury. GCS is E4 V4 M6 = 14; their documented baseline was 15.</p>
<ul>
  <li><strong>Can head injury be excluded?</strong> No — the fall was unwitnessed.</li>
  <li><strong>Immediate assessment:</strong> ABCDE, full physiological observations and capillary glucose.</li>
  <li><strong>Injury check:</strong> examine head, neck/spine, hips/pelvis and other painful areas before routine mobilisation.</li>
  <li><strong>Neurology:</strong> document GCS components, pupils and limb responses; compare with baseline and repeat promptly.</li>
  <li><strong>Important change:</strong> GCS has fallen by 1 point. If the change persists or worsens, escalate urgently rather than waiting for the next scheduled observation.</li>
  <li><strong>Imaging:</strong> because head injury cannot be excluded and the patient is anticoagulated, check the current NICE NG232 CT-head pathway.</li>
  <li><strong>Cause of fall:</strong> assess for syncope/arrhythmia, postural hypotension, infection, hypoglycaemia, medication effects, delirium and mobility/environmental factors.</li>
  <li><strong>Afterwards:</strong> document the observation schedule, imaging decision, senior discussion and measures to reduce another fall.</li>
</ul>

<h2>The post-falls algorithm</h2>
<p><strong>GO NOW → ABCDE IF UNWELL → EXCLUDE COLLAPSE / MEDICAL EMERGENCY → HEAD / SPINE / HIP / INJURY CHECK → CAN HEAD INJURY BE EXCLUDED? → NEURO OBS + GCS / PUPILS / LIMBS IF INDICATED → CHECK GLUCOSE → APPLY CURRENT NICE CT-HEAD CRITERIA → FIND THE CAUSE → TREAT → PREVENT RECURRENCE → DOCUMENT + HAND OVER</strong></p>
<p><strong>The key message:</strong> A post-falls review is both a trauma assessment and a medical review. Look for hidden injury, identify why the patient fell, monitor neurological change properly and make sure the prevention plan changes afterwards.</p>

<p><em>Educational note: This article is for Foundation doctor education. For individual patients, follow current NICE NG232 / NG249 guidance, local NHS falls and head-injury pathways, and seek senior advice when appropriate.</em></p>
`.trim()
}

async function ensureBasildonTopic(): Promise<string> {
  const { data: existing } = await sb
    .from('fy_topics')
    .select('id')
    .eq('cohort', COHORT)
    .eq('slug', TOPIC_SLUG)
    .maybeSingle()
  if (existing?.id) {
    await sb
      .from('fy_topics')
      .update({
        is_active: true,
        name: 'Local systems',
        description: 'Trust-specific systems and local clinical guidance',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    return existing.id as string
  }
  const { data, error } = await sb
    .from('fy_topics')
    .insert({
      cohort: COHORT,
      slug: TOPIC_SLUG,
      name: 'Local systems',
      description: 'Trust-specific systems and local clinical guidance',
      display_order: 2,
      is_active: true,
    })
    .select('id')
    .single()
  if (error) throw error
  return data!.id as string
}

async function main() {
  console.log('Composing featured image...')
  const featured = await composeFeatured()
  const featuredPath = `${IMAGE_DIR}/featured-bleepy-logo.webp`
  await uploadBuffer(featuredPath, featured, 'image/webp')

  console.log('Generating teaching graphics...')
  const pathway = await uploadPngFromSvg(pathwaySvg(), 'post-falls-assessment-algorithm')
  const neuro = await uploadPngFromSvg(neuroObsSvg(), 'neurological-observations-after-fall')
  const timeline = await uploadPngFromSvg(timelineSvg(), 'post-fall-neuro-observation-timeline')
  const flags = await uploadPngFromSvg(redFlagsSvg(), 'post-fall-neurological-red-flags')

  const content = buildContent({ pathway, neuro, timeline, flags })
  const topicId = await ensureBasildonTopic()

  const { data: page, error } = await sb
    .from('fy_pages')
    .select('id')
    .eq('slug', SLUG)
    .maybeSingle()
  if (error) throw error
  if (!page) throw new Error(`Missing page ${SLUG}`)

  const payload: Record<string, unknown> = {
    topic_id: topicId,
    title: TITLE,
    content,
    featured_image: featuredPath,
    requires_auth: true,
    status: 'published',
    is_active: true,
    updated_at: new Date().toISOString(),
    meta_description: META,
  }

  let { error: upErr } = await sb.from('fy_pages').update(payload).eq('id', page.id)
  if (upErr?.message?.includes('meta_description')) {
    delete payload.meta_description
    ;({ error: upErr } = await sb.from('fy_pages').update(payload).eq('id', page.id))
  }
  if (upErr) throw upErr

  console.log(`Updated ${SLUG} → ${COHORT}/${TOPIC_SLUG} (members-only)`)
  console.log(`/placements/foundation-year/${COHORT}/${TOPIC_SLUG}/${SLUG}`)
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
