/**
 * Seed members-only FY1 guide:
 * "The FY1 Approach to a New Oxygen Requirement: A Practical Guide"
 *
 * Cohort: fy1. Topic: working-on-calls.
 * Featured: unique Bleepy logo card. Inline: teaching infographics.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-fy1-new-oxygen-requirement.ts
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

const TITLE = 'The FY1 Approach to a New Oxygen Requirement: A Practical Guide'
const FEATURED_TITLE = 'NEW OXYGEN REQUIREMENT'
const SLUG = 'fy1-new-oxygen-requirement'
const TOPIC_SLUG = 'working-on-calls'
const IMAGE_DIR = `foundation-year/fy1/${TOPIC_SLUG}/${SLUG}/images`
const LOGO = path.resolve('public/Bleepy-Logo-128.webp')

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

function wrapTitle(title: string, maxChars = 24): string[] {
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
  const titleFs = titleLines.length > 1 ? 36 : 44
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

function oxygenPropsSvg(): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(220,250)">
    <rect x="20" y="30" width="160" height="180" rx="18" fill="#E0F2FE" stroke="#0369A1" stroke-width="6"/>
    <rect x="55" y="10" width="90" height="40" rx="10" fill="#0284C7"/>
    <text x="100" y="38" text-anchor="middle" font-family="Arial" font-size="16" font-weight="800" fill="#fff">SpO₂</text>
    <text x="100" y="120" text-anchor="middle" font-family="Arial Black" font-size="42" fill="#DC2626">89%</text>
    <text x="100" y="165" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#0C4A6E">on O₂</text>
  </g>
  <g transform="translate(880,250)">
    <ellipse cx="55" cy="40" rx="40" ry="28" fill="#BAE6FD" stroke="#0369A1" stroke-width="5"/>
    <rect x="30" y="60" width="50" height="90" rx="18" fill="#7DD3FC" stroke="#0369A1" stroke-width="5"/>
    <rect x="40" y="150" width="30" height="40" rx="8" fill="#0EA5E9"/>
    <path d="M80 90 q40 10 55 45" stroke="#0284C7" stroke-width="6" fill="none" stroke-linecap="round"/>
    <text x="55" y="220" text-anchor="middle" font-family="Arial" font-size="15" font-weight="800" fill="#0C4A6E">OXYGEN</text>
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
  const banners = await sharp(bannerSvg(lines, 'CLINICAL SKILLS', 'WORKING ON-CALLS')).png().toBuffer()
  const props = await sharp(oxygenPropsSvg()).png().toBuffer()

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
    ['PNEUMONIA', 'Infection / consolidation'],
    ['PULMONARY OEDEMA', 'Fluid / heart failure'],
    ['PE', 'Clot to the lungs'],
    ['PNEUMOTHORAX', 'Collapsed lung'],
    ['ASTHMA / COPD', 'Airway narrowing'],
    ['HYPOVENTILATION', 'Sedation / weakness'],
  ]
  const cards = items
    .map(([title, sub], i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = 70 + col * 390
      const y = 200 + row * 280
      return `
      <rect x="${x}" y="${y}" width="350" height="230" rx="20" fill="#F0F9FF" stroke="#0284C7" stroke-width="3"/>
      <text x="${x + 175}" y="${y + 95}" text-anchor="middle" font-family="Arial Black" font-size="22" fill="#0C4A6E">${escapeXml(title)}</text>
      <text x="${x + 175}" y="${y + 140}" text-anchor="middle" font-family="Arial" font-size="17" fill="#475569">${escapeXml(sub)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="70" text-anchor="middle" font-family="Arial Black" font-size="30" fill="#1E3A5F">WHY DOES THIS PATIENT SUDDENLY NEED OXYGEN?</text>
  <text x="640" y="115" text-anchor="middle" font-family="Arial" font-size="18" fill="#64748B">A new oxygen requirement is a sign with a differential — not a diagnosis</text>
  <circle cx="640" cy="160" r="0"/>
  ${cards}
  <text x="640" y="840" text-anchor="middle" font-family="Arial" font-size="18" font-weight="800" fill="#F25006">Infection? Fluid? Clot? Collapse? Airways? Ventilation?</text>
</svg>`)
}

function respiratoryAssessmentSvg(): Buffer {
  const checks = [
    'Respiratory rate',
    'SpO₂ + oxygen device',
    'Oxygen requirement vs baseline',
    'Work of breathing',
    'Chest expansion',
    'Percussion',
    'Breath sounds',
    'Wheeze / crackles / reduced air entry',
  ]
  const rows = checks
    .map((c, i) => {
      const y = 200 + i * 70
      return `
      <rect x="180" y="${y}" width="920" height="55" rx="12" fill="${i % 2 ? '#F8FAFC' : '#EFF6FF'}" stroke="#1E3A5F" stroke-width="2"/>
      <circle cx="230" cy="${y + 28}" r="16" fill="#F25006"/>
      <text x="230" y="${y + 34}" text-anchor="middle" font-family="Arial Black" font-size="14" fill="#fff">${i + 1}</text>
      <text x="280" y="${y + 35}" font-family="Arial" font-size="20" font-weight="700" fill="#1E3A5F">${escapeXml(c)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="70" text-anchor="middle" font-family="Arial Black" font-size="30" fill="#1E3A5F">FY1 RESPIRATORY ASSESSMENT (BREATHING)</text>
  <text x="640" y="115" text-anchor="middle" font-family="Arial" font-size="18" fill="#64748B">Assess systematically and always compare with the patient's baseline oxygen need</text>
  ${rows}
</svg>`)
}

function pathwaySvg(): Buffer {
  const steps = [
    'CONFIRM',
    'ABCDE',
    'SET TARGET',
    'GIVE O₂',
    'FIND CAUSE',
    'GAS IF NEEDED',
    'INVESTIGATE',
    'REASSESS',
    'ESCALATE',
  ]
  const boxes = steps
    .map((s, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = 90 + col * 380
      const y = 180 + row * 210
      return `
      <rect x="${x}" y="${y}" width="320" height="140" rx="18" fill="#FFF7ED" stroke="#F25006" stroke-width="4"/>
      <text x="${x + 160}" y="${y + 55}" text-anchor="middle" font-family="Arial" font-size="16" fill="#9A3412">STEP ${i + 1}</text>
      <text x="${x + 160}" y="${y + 95}" text-anchor="middle" font-family="Arial Black" font-size="24" fill="#1E3A5F">${escapeXml(s)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="70" text-anchor="middle" font-family="Arial Black" font-size="30" fill="#1E3A5F">NEW OXYGEN REQUIREMENT — FY1 PATHWAY</text>
  <text x="640" y="115" text-anchor="middle" font-family="Arial" font-size="18" fill="#64748B">Stabilise → identify the cause → reassess response → escalate when needed</text>
  ${boxes}
  <rect x="160" y="800" width="960" height="60" rx="14" fill="#EBA400"/>
  <text x="640" y="840" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">Reassess is a loop — rising O₂ need is deterioration even if SpO₂ looks “OK”</text>
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

function buildContent(imgs: { causes: string; assess: string; pathway: string }) {
  return `
<p>A practical FY1 guide to assessing a new oxygen requirement on the ward — ABCDE, oxygen targets, common causes, investigations and escalation.</p>

<p>It is 2 am and the nurse bleeps you: “Doctor, could you review this patient? Their saturations were 96% on air earlier, but they’re now 89% and we’ve had to start oxygen.”</p>
<p>This is a bleep worth taking seriously. A new oxygen requirement is a change in the patient's physiology. Your job as the FY1 is not simply to prescribe oxygen and move on. You need to work out why they suddenly need it, whether they are deteriorating, and what needs to happen next.</p>

<h2>1. First: go and see the patient</h2>
<p>Before reading through several days of notes, establish how unwell they are. Ask the nurse:</p>
<ul>
  <li>What are the current oxygen saturations?</li>
  <li>How much oxygen are they receiving?</li>
  <li>What were their previous saturations?</li>
  <li>What is the respiratory rate?</li>
  <li>What are the rest of the observations?</li>
  <li>How quickly has this changed?</li>
  <li>Are they breathless, drowsy or confused?</li>
</ul>
<p><strong>FY1 tip:</strong> “94% on 4 L oxygen” is not the same as “94% on room air”. Always document both the saturation and the oxygen requirement. A rising oxygen requirement can be an important sign of deterioration even when the saturation number itself looks reassuring.</p>

<h2>2. Check whether the reading makes sense</h2>
<p>Do not manage a number without looking at the patient. Are they:</p>
<ul>
  <li>Talking normally?</li>
  <li>Breathless?</li>
  <li>Using accessory muscles?</li>
  <li>Cyanosed?</li>
  <li>Sweaty or clammy?</li>
  <li>Agitated or confused?</li>
  <li>Becoming drowsy?</li>
  <li>Obviously exhausted?</li>
</ul>
<p>Look at the saturation trend and respiratory rate. A respiratory rate of 30/min in someone whose usual rate is 16/min may tell you more about deterioration than staring at an SpO₂ of 94%.</p>

<h2>3. If they are unwell, use ABCDE</h2>
${figure(
  imgs.assess,
  'FY1 respiratory assessment for a patient with a new oxygen requirement',
  'Assess breathing systematically and always compare the current oxygen requirement with the patient\'s baseline.'
)}
<ul>
  <li><strong>A — Airway</strong> — Can they talk? Listen for evidence of airway obstruction and make sure the airway is patent.</li>
  <li><strong>B — Breathing</strong> — Check respiratory rate, oxygen saturations, oxygen device and requirement, work of breathing, chest expansion, tracheal position where relevant, percussion, breath sounds, wheeze, crackles and reduced or absent air entry.</li>
  <li><strong>C — Circulation</strong> — Check heart rate, blood pressure, capillary refill and peripheral perfusion. Also think about fluid status: signs of fluid overload or intravascular depletion may point towards the cause.</li>
  <li><strong>D — Disability</strong> — Assess consciousness. New confusion or drowsiness in a hypoxic patient should concern you. Check blood glucose where appropriate.</li>
  <li><strong>E — Exposure</strong> — Look for clues such as fever, calf swelling, surgical wounds, rashes or anything else that may point towards the cause.</li>
</ul>

<h2>4. Give oxygen — but know your target</h2>
<p>Oxygen should be treated like a medication: give it for an indication and prescribe a target saturation range. For most acutely unwell adults, the usual target oxygen saturation is 94–98%. For patients at risk of hypercapnic respiratory failure, the target is generally 88–92%.</p>
<p><strong>Common FY1 trap:</strong> Seeing “COPD” in the past medical history and immediately deciding the patient must only be allowed 88–92%. Instead, ask whether they are actually at risk of hypercapnic respiratory failure, review previous blood gases where available and assess the current clinical situation.</p>

<h2>5. Now ask: why do they suddenly need oxygen?</h2>
${figure(
  imgs.causes,
  'Common causes of a new oxygen requirement in a hospital patient',
  'A new oxygen requirement has a differential diagnosis — avoid assuming every desaturation is a chest infection.'
)}
<p>Once immediate problems are being addressed, form a differential diagnosis.</p>
<ul>
  <li><strong>Pneumonia</strong> — Fever, cough, sputum, pleuritic pain, tachypnoea, focal crackles or bronchial breathing.</li>
  <li><strong>Pulmonary oedema</strong> — Fluid overload or acute cardiac failure; crackles, raised JVP, oedema and cardiac history.</li>
  <li><strong>Pulmonary embolism</strong> — Especially if oxygen need seems disproportionate to the chest examination; sudden breathlessness, pleuritic pain, tachycardia, haemoptysis, VTE risk factors.</li>
  <li><strong>Pneumothorax</strong> — Sudden deterioration; unilateral reduced air entry. Tension pneumothorax is an emergency.</li>
  <li><strong>Asthma or COPD exacerbation</strong> — Wheeze, increased work of breathing and relevant respiratory history.</li>
  <li><strong>Reduced ventilation</strong> — Opioids or other sedatives, neurological disease, neuromuscular weakness or severe exhaustion.</li>
</ul>
<p><strong>FY1 tip:</strong> Try to avoid “Low sats = chest infection.” Instead think: Infection? Fluid? Clot? Collapse/pneumothorax? Airways? Ventilation?</p>

<h2>6. Do they need a blood gas?</h2>
<p>A blood gas becomes particularly useful when you are worried about:</p>
<ul>
  <li>Respiratory failure</li>
  <li>CO₂ retention</li>
  <li>Significant or unexplained deterioration</li>
  <li>Reduced consciousness</li>
  <li>Impaired respiratory effort</li>
  <li>A significant COPD exacerbation</li>
  <li>Persistent hypoxia despite oxygen</li>
</ul>
<p><strong>FY1 tip:</strong> Do not look only at the PaO₂. Check pH → PaCO₂ → PaO₂ → bicarbonate/base excess → lactate where relevant. A patient whose oxygen saturation has improved can still be deteriorating because their CO₂ is rising.</p>

<h2>7. Choose investigations based on your differential</h2>
<p>A reasonable initial work-up may include:</p>
<ul>
  <li>Chest X-ray</li>
  <li>ECG</li>
  <li>FBC</li>
  <li>U&amp;Es</li>
  <li>CRP</li>
  <li>Blood gas where indicated</li>
  <li>Blood cultures if infection/sepsis is suspected</li>
  <li>Further investigations directed by your differential</li>
</ul>
<p>Do not order investigations just because they appear on a standard shortness-of-breath panel. Ask: “What diagnosis am I considering, and what will this investigation tell me?”</p>

<h2>8. Treat the cause, not just the saturation</h2>
<p>Oxygen may correct hypoxaemia. It does not explain why the hypoxaemia happened. The patient with pneumonia may need antibiotics. The patient with pulmonary oedema may need treatment for acute heart failure. The patient with bronchospasm may need bronchodilator therapy. The patient with PE needs appropriate assessment and management. The patient with pneumothorax may need urgent intervention. The patient with ventilatory failure may require non-invasive or invasive ventilatory support.</p>
<p><strong>Key question:</strong> After putting oxygen on, always ask: “Why does this patient need oxygen now when they didn't need it before?”</p>

<h2>9. Reassess after everything you do</h2>
<p>Suppose the patient starts at SpO₂ 86% on room air. You commence oxygen and the saturation rises to 95%. Job done? No.</p>
<p>Ask:</p>
<ul>
  <li>What is their respiratory rate now?</li>
  <li>Are they less breathless?</li>
  <li>Is their oxygen requirement stable, falling or increasing?</li>
  <li>Has their consciousness changed?</li>
  <li>What did the chest examination show?</li>
  <li>Have you identified the likely cause?</li>
  <li>What do the investigations show?</li>
</ul>
<p>A patient whose saturation remains 95% but whose oxygen requirement keeps climbing is not stable simply because the monitor says 95%.</p>

${figure(
  imgs.pathway,
  'Step-by-step FY1 approach to a new oxygen requirement',
  'The safe FY1 approach is to stabilise, identify the cause, reassess the response and escalate when needed.'
)}

<h2>10. Know when to call your senior</h2>
<p>Escalate promptly if:</p>
<ul>
  <li>Oxygen requirement is increasing</li>
  <li>The patient remains hypoxic despite oxygen</li>
  <li>Respiratory rate is markedly elevated or falling with exhaustion</li>
  <li>They are drowsy or confused</li>
  <li>There is suspected hypercapnic respiratory failure</li>
  <li>Blood gas shows significant respiratory failure or acidosis</li>
  <li>You suspect PE, pneumothorax or another serious diagnosis</li>
  <li>Blood pressure is falling</li>
  <li>The patient is not responding to initial treatment</li>
  <li>You cannot explain the deterioration</li>
  <li>You are worried</li>
</ul>
<p>You do not need to have the diagnosis before calling. A useful escalation might be: “This patient has developed a new oxygen requirement. They were on room air this afternoon and are now requiring oxygen to maintain their target saturations. Their respiratory rate is 30 and I am concerned about pneumonia versus pulmonary oedema. I have started my assessment and I would like you to review them.”</p>

<h2>A practical FY1 example</h2>
<p>The nurse calls because a patient who was previously on room air is now saturating 88%. You review them. They are febrile, respiratory rate 28/min and tachycardic. They are now receiving oxygen to maintain their target saturation. They have a new productive cough and focal crackles at the right base.</p>
<ul>
  <li><strong>Is the hypoxia real and new?</strong> Yes.</li>
  <li><strong>Are they clinically deteriorating?</strong> Yes — tachypnoea and a new oxygen requirement.</li>
  <li><strong>Immediate priority?</strong> ABCDE, appropriate oxygen and repeat observations.</li>
  <li><strong>Likely cause?</strong> Pneumonia is high on the differential.</li>
  <li><strong>What else could be dangerous?</strong> PE, pulmonary oedema and pneumothorax depending on the history and examination.</li>
  <li><strong>What investigations do I need?</strong> Target them to the working diagnosis and severity.</li>
  <li><strong>Do I need help?</strong> Yes — this is a deteriorating patient with new respiratory compromise.</li>
</ul>

<h2>The FY1 rule for a new oxygen requirement</h2>
<p><strong>CONFIRM → ABCDE → TARGET OXYGEN → FIND THE CAUSE → GAS IF NEEDED → INVESTIGATE → TREAT → REASSESS → ESCALATE</strong></p>
<p><strong>The key message:</strong> A new oxygen requirement is a clinical problem, not just an oxygen prescription.</p>
<p>Find out why the patient needs oxygen, watch the trend and escalate early if the requirement is increasing or the patient is deteriorating.</p>

<p><em>Educational note: This article is intended as an educational guide for Foundation doctors. Follow current NICE/BNF guidance and your NHS organisation's oxygen and deteriorating-patient policies when managing individual patients.</em></p>
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
    requires_auth: true,
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
    display_order: 40,
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
  console.log('Composing unique featured Bleepy card...')
  const featuredWebp = await composeFeaturedLogoCard()
  const featuredPath = `${IMAGE_DIR}/featured-bleepy-logo.webp`
  await uploadBuffer(featuredPath, featuredWebp, 'image/webp')

  console.log('Generating teaching infographics...')
  const causes = await uploadPngFromSvg(causesSvg(), 'causes-new-oxygen-requirement')
  const assess = await uploadPngFromSvg(respiratoryAssessmentSvg(), 'fy1-respiratory-assessment-oxygen')
  const pathway = await uploadPngFromSvg(pathwaySvg(), 'fy1-new-oxygen-requirement-pathway')

  const content = buildContent({ causes, assess, pathway })

  const { data: topic, error } = await sb
    .from('fy_topics')
    .select('id, name')
    .eq('cohort', 'fy1')
    .eq('slug', TOPIC_SLUG)
    .maybeSingle()

  if (error || !topic) {
    throw new Error(`topic ${TOPIC_SLUG} missing for fy1: ${error?.message || 'not found'}`)
  }

  await upsertPage(topic.id, content, featuredPath)
  console.log(`  placements: /placements/foundation-year/fy1/${TOPIC_SLUG}/${SLUG}`)
  console.log('  (members-only — not on public /guides)')
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
