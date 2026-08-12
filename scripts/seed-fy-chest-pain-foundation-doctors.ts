/**
 * Seed public FY guide:
 * "Called to a Patient With Chest Pain: A Foundation Doctor Approach"
 *
 * Cohort: general · Topic: on-calls
 * Featured: unique Bleepy logo card. Inline: teaching infographics.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-fy-chest-pain-foundation-doctors.ts
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

const TITLE = 'Called to a Patient With Chest Pain: A Foundation Doctor Approach'
const FEATURED_TITLE = 'CHEST PAIN'
const SLUG = 'foundation-doctor-chest-pain'
const TOPIC_SLUG = 'on-calls'
const COHORT = 'general'
const IMAGE_DIR = `foundation-year/${COHORT}/${TOPIC_SLUG}/${SLUG}/images`
const LOGO = path.resolve('public/Bleepy-Logo-128.webp')
const META =
  'A practical Foundation doctor guide to chest pain on the ward, covering ABCDE, focused history, ECG, troponin, PE, dangerous differentials and escalation.'

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

function wrapTitle(title: string, maxChars = 22): string[] {
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

function chestPainPropsSvg(): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(160,220)">
    <rect x="10" y="40" width="230" height="180" rx="18" fill="#FEF2F2" stroke="#DC2626" stroke-width="6"/>
    <rect x="45" y="18" width="160" height="36" rx="10" fill="#DC2626"/>
    <text x="125" y="42" text-anchor="middle" font-family="Arial" font-size="15" font-weight="800" fill="#fff">ECG</text>
    <path d="M30 120 L55 120 L70 85 L90 155 L110 100 L125 120 L210 120" fill="none" stroke="#B91C1C" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="125" y="190" text-anchor="middle" font-family="Arial" font-size="15" font-weight="700" fill="#7F1D1D">12-LEAD EARLY</text>
  </g>
  <g transform="translate(900,240)">
    <ellipse cx="80" cy="55" rx="62" ry="46" fill="#FEE2E2" stroke="#DC2626" stroke-width="5"/>
    <path d="M55 55 c0 -18 25 -28 25 -8 c0 -20 25 -10 25 8 c0 22 -25 38 -25 38 s-25 -16 -25 -38z" fill="#DC2626"/>
    <text x="80" y="145" text-anchor="middle" font-family="Arial" font-size="15" font-weight="800" fill="#7F1D1D">GO TO BEDSIDE</text>
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
  const banners = await sharp(bannerSvg(lines, 'ON-CALL & ACUTE CARE', 'FOUNDATION YEAR'))
    .png()
    .toBuffer()
  const props = await sharp(chestPainPropsSvg()).png().toBuffer()

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

function historyExamSvg(): Buffer {
  const hist = [
    ['HPC', 'Onset, location, character, radiation'],
    ['PMH', 'IHD, PE/DVT, aortic disease, GORD'],
    ['DRUGS', 'GTN, antiplatelets, anticoagulants'],
    ['SOCIAL / FH', 'Smoking, premature IHD, VTE context'],
  ]
  const exam = [
    ['A', 'Airway patent?'],
    ['B', 'RR, SpO₂, air entry, trachea'],
    ['C', 'HR/BP (both arms), JVP, calves'],
    ['D', 'Conscious level + glucose'],
    ['E', 'Chest wall, abdomen, fever'],
  ]
  const histCards = hist
    .map(([t, s], i) => {
      const y = 175 + i * 155
      return `
      <rect x="70" y="${y}" width="520" height="135" rx="16" fill="#FEF2F2" stroke="#DC2626" stroke-width="3"/>
      <text x="330" y="${y + 52}" text-anchor="middle" font-family="Arial Black" font-size="24" fill="#7F1D1D">${escapeXml(t)}</text>
      <text x="330" y="${y + 95}" text-anchor="middle" font-family="Arial" font-size="17" fill="#475569">${escapeXml(s)}</text>`
    })
    .join('\n')
  const examCards = exam
    .map(([t, s], i) => {
      const y = 175 + i * 125
      return `
      <rect x="690" y="${y}" width="520" height="108" rx="16" fill="#FFF7ED" stroke="#F25006" stroke-width="3"/>
      <circle cx="740" cy="${y + 54}" r="24" fill="#F25006"/>
      <text x="740" y="${y + 62}" text-anchor="middle" font-family="Arial Black" font-size="20" fill="#fff">${escapeXml(t)}</text>
      <text x="790" y="${y + 62}" font-family="Arial" font-size="18" font-weight="700" fill="#1E3A5F">${escapeXml(s)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="55" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#1E3A5F">CHEST PAIN ASSESSMENT</text>
  <text x="640" y="95" text-anchor="middle" font-family="Arial" font-size="17" fill="#64748B">Structured history + ABCDE examination for Foundation doctors</text>
  <rect x="70" y="120" width="520" height="40" rx="10" fill="#DC2626"/>
  <text x="330" y="148" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">HISTORY</text>
  <rect x="690" y="120" width="520" height="40" rx="10" fill="#F25006"/>
  <text x="950" y="148" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">EXAMINATION</text>
  ${histCards}
  ${examCards}
</svg>`)
}

function investigationsSvg(): Buffer {
  const items = [
    ['ECG', 'Rate, rhythm, ischaemia, dynamic change'],
    ['TROPONIN / BLOODS', 'Injury + trend — not yes/no alone'],
    ['CHEST X-RAY', 'Pneumothorax, oedema, pneumonia, effusion'],
    ['BLOOD GAS', 'If unwell, hypoxic, shocked or acid–base needed'],
    ['PE PATHWAY', 'Wells → D-dimer or imaging — not indiscriminate'],
    ['CT AORTA', 'Suspected dissection — senior-led imaging'],
  ]
  const cards = items
    .map(([title, sub], i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = 70 + col * 390
      const y = 200 + row * 280
      return `
      <rect x="${x}" y="${y}" width="350" height="230" rx="20" fill="#FEF2F2" stroke="#DC2626" stroke-width="3"/>
      <text x="${x + 175}" y="${y + 85}" text-anchor="middle" font-family="Arial Black" font-size="20" fill="#7F1D1D">${escapeXml(title)}</text>
      <text x="${x + 175}" y="${y + 140}" text-anchor="middle" font-family="Arial" font-size="16" fill="#475569">${escapeXml(sub)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="70" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#1E3A5F">CHEST PAIN: WHICH TEST ANSWERS WHICH QUESTION?</text>
  <text x="640" y="115" text-anchor="middle" font-family="Arial" font-size="18" fill="#64748B">Choose investigations to answer the differential — not as an automatic bundle</text>
  ${cards}
  <text x="640" y="840" text-anchor="middle" font-family="Arial" font-size="18" font-weight="800" fill="#F25006">ECG EARLY → TARGETED BLOODS → STRUCTURED PE / DISSECTION PATHWAYS</text>
</svg>`)
}

function pathwaySvg(): Buffer {
  const top = [
    ['NEW CHEST PAIN', '#DC2626'],
    ['ABCDE + OBS', '#F25006'],
    ['12-LEAD ECG EARLY', '#EBA400'],
  ]
  const danger = ['ACS', 'PE', 'DISSECTION', 'TENSION PTX', 'TAMPONADE']
  const secondary = ['Pneumonia', 'Tachyarrhythmia', 'MSK', 'Pericarditis', 'GORD']
  const bottom = ['TARGETED TESTS', 'TREAT IF INDICATED', 'REASSESS', 'ESCALATE']

  const topBoxes = top
    .map(([label, color], i) => {
      const x = 90 + i * 380
      return `
      <rect x="${x}" y="140" width="340" height="90" rx="16" fill="${color}"/>
      <text x="${x + 170}" y="195" text-anchor="middle" font-family="Arial Black" font-size="20" fill="#fff">${escapeXml(label)}</text>`
    })
    .join('\n')

  const dangerBoxes = danger
    .map((label, i) => {
      const x = 50 + i * 240
      return `
      <rect x="${x}" y="300" width="220" height="70" rx="12" fill="#7F1D1D"/>
      <text x="${x + 110}" y="345" text-anchor="middle" font-family="Arial Black" font-size="15" fill="#fff">${escapeXml(label)}</text>`
    })
    .join('\n')

  const secBoxes = secondary
    .map((label, i) => {
      const x = 70 + i * 230
      return `
      <rect x="${x}" y="430" width="210" height="58" rx="12" fill="#FFF7ED" stroke="#F25006" stroke-width="2"/>
      <text x="${x + 105}" y="467" text-anchor="middle" font-family="Arial" font-size="15" font-weight="700" fill="#9A3412">${escapeXml(label)}</text>`
    })
    .join('\n')

  const bottomBoxes = bottom
    .map((label, i) => {
      const x = 90 + i * 290
      return `
      <rect x="${x}" y="560" width="260" height="90" rx="16" fill="#FEF2F2" stroke="#DC2626" stroke-width="3"/>
      <text x="${x + 130}" y="615" text-anchor="middle" font-family="Arial Black" font-size="16" fill="#7F1D1D">${escapeXml(label)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="55" text-anchor="middle" font-family="Arial Black" font-size="26" fill="#1E3A5F">FOUNDATION DOCTOR CHEST PAIN PATHWAY</text>
  <text x="640" y="95" text-anchor="middle" font-family="Arial" font-size="17" fill="#64748B">Dangerous diagnoses first → targeted tests → treat → reassess → escalate</text>
  ${topBoxes}
  <text x="640" y="275" text-anchor="middle" font-family="Arial Black" font-size="16" fill="#7F1D1D">LIFE-THREATENING DIFFERENTIAL</text>
  ${dangerBoxes}
  <text x="640" y="410" text-anchor="middle" font-family="Arial" font-size="15" font-weight="700" fill="#64748B">Also consider</text>
  ${secBoxes}
  ${bottomBoxes}
  <rect x="160" y="700" width="960" height="70" rx="14" fill="#EBA400"/>
  <text x="640" y="745" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">STEMI / INSTABILITY → URGENT ESCALATION (do not wait for troponin)</text>
  <text x="640" y="850" text-anchor="middle" font-family="Arial" font-size="16" font-weight="800" fill="#F25006">GO NOW → ABCDE → HISTORY → ECG → DIFFERENTIAL → TESTS → TREAT → REASSESS → ESCALATE</text>
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

function sourceLink(href: string, label: string) {
  return `<a class="fy-source-link" href="${href}" target="_blank" rel="noopener">${label}</a>`
}

function buildContent(imgs: { historyExam: string; investigations: string; pathway: string }) {
  const niceCg95 = sourceLink('https://www.nice.org.uk/guidance/cg95', 'NICE CG95: recent-onset chest pain')
  const bnfAcs = sourceLink(
    'https://bnf.nice.org.uk/treatment-summaries/acute-coronary-syndromes/',
    'BNF: acute coronary syndromes'
  )
  const niceNg158 = sourceLink(
    'https://www.nice.org.uk/guidance/ng158',
    'NICE NG158: venous thromboembolic diseases'
  )

  return `
<p>A practical Foundation doctor guide to chest pain on the ward — ABCDE, focused history, ECG, troponin, PE, dangerous differentials and escalation.</p>

<h2>Called to a Patient With Chest Pain: What Should You Do?</h2>
<p>It is 2 am and the nurse bleeps you: “Doctor, this patient has new chest pain. Can you come and review them?”</p>
<p>Chest pain is common on-call, but the safe approach is to assume that a dangerous cause is possible until your assessment makes it less likely. Your job is not to diagnose every cause alone. It is to recognise time-critical illness, stabilise the patient, obtain the right early tests, start appropriate treatment and escalate promptly.</p>
<p><strong>The chest-pain rule:</strong> Do not start with “Is this ACS?” Start with “Is this patient unstable, and what dangerous diagnosis could explain this pain?”</p>

<h2>1. Go to the patient and decide how unwell they are</h2>
<p>Before diving into the notes, establish the immediate picture:</p>
<ul>
  <li>When did the pain start, and is it still present?</li>
  <li>Was the onset sudden or gradual?</li>
  <li>What are the current observations and NEWS2?</li>
  <li>Is the patient breathless, sweaty, pale, cyanosed, vomiting, dizzy or collapsed?</li>
  <li>Is there a new oxygen requirement?</li>
  <li>Is the blood pressure low, markedly different from baseline, or different between the arms?</li>
  <li>Is the heart rate very fast, very slow or irregular?</li>
  <li>Is there recent surgery, immobility, known VTE, anticoagulation or significant cardiac disease?</li>
</ul>

<h2>2. If the patient is unwell, use ABCDE</h2>
<ul>
  <li><strong>A — Airway</strong> — Confirm that the airway is patent.</li>
  <li><strong>B — Breathing</strong> — Check respiratory rate, SpO₂, oxygen requirement, work of breathing and chest expansion. Look for a deviated trachea, unilateral reduced air entry, wheeze, crackles or bronchial breathing. Percuss if pneumothorax or effusion is a realistic possibility. Ask about sputum and haemoptysis.</li>
  <li><strong>C — Circulation</strong> — Check heart rate and rhythm, blood pressure, capillary refill, peripheral perfusion and pulse volume. Consider blood pressure in both arms if aortic dissection is possible. Examine the JVP, heart sounds, calves and peripheral oedema where relevant.</li>
  <li><strong>D — Disability</strong> — Assess conscious level and check glucose when clinically appropriate. Syncope, confusion or focal neurology can point towards a dangerous alternative diagnosis.</li>
  <li><strong>E — Exposure</strong> — Look for chest-wall bruising or tenderness, fever, calf swelling, signs of trauma, rash and epigastric or abdominal tenderness.</li>
</ul>
<p><strong>FY tip:</strong> Reproducible chest-wall tenderness may support a musculoskeletal cause, but it should not automatically end the assessment if the history or physiology is concerning.</p>

<h2>3. Take a focused chest-pain history</h2>
${figure(
  imgs.historyExam,
  'Chest pain history and examination checklist for Foundation doctors',
  'A structured history and ABCDE examination help separate dangerous chest-pain causes from more benign explanations.'
)}
<p>A structured history keeps you from missing the clues that change the differential.</p>
<ul>
  <li><strong>HPC</strong> — Duration; sudden vs gradual onset; central/arm/neck/jaw/back location; pressure/tightness vs pleuritic or tearing pain; exertional or positional features; nausea, sweating, breathlessness, syncope or palpitations; cough, sputum or haemoptysis; recent surgery, immobility or viral illness.</li>
  <li><strong>PMH</strong> — IHD, previous MI, angina, heart failure, arrhythmia, previous DVT/PE, cancer, hypertension, diabetes, dyslipidaemia, known aortic disease, GORD/hiatus hernia.</li>
  <li><strong>Drug history</strong> — GTN or long-acting nitrates, beta-blockers, antiplatelets/anticoagulants, NSAIDs or steroids, VTE prophylaxis and recent omitted doses.</li>
  <li><strong>Social / family</strong> — Smoking status; family history of premature IHD or sudden cardiac death; recent long travel or other VTE context where relevant.</li>
</ul>
<p><strong>Useful question:</strong> Was the pain maximal at the moment it started? Abrupt, severe pain that is maximal immediately should make you think beyond ACS, particularly about aortic dissection or pneumothorax.</p>

<h2>4. Get a 12-lead ECG early</h2>
<p>For suspected acute coronary syndrome, obtain a resting 12-lead ECG as soon as possible and interpret it in the clinical context. ${niceCg95}</p>
<p>On the ECG, deliberately assess:</p>
<ul>
  <li>Rate and rhythm — including significant tachyarrhythmia or bradyarrhythmia.</li>
  <li>ST-segment elevation or depression and T-wave changes.</li>
  <li>Dynamic change compared with a previous or repeat ECG.</li>
  <li>Conduction abnormalities.</li>
  <li>Features suggesting pericarditis.</li>
  <li>Right-heart strain features if PE is clinically suspected — remembering that ECG cannot diagnose or exclude PE.</li>
</ul>
<p>If the first ECG is non-diagnostic but pain persists, recurs or the clinical suspicion remains high, repeat the ECG and compare it with previous tracings where available.</p>
<p><strong>Common FY trap:</strong> A normal or non-diagnostic ECG does not by itself rule out acute coronary syndrome.</p>

<h2>5. Think dangerous diagnoses first</h2>
<ul>
  <li><strong>Acute coronary syndrome</strong> — Pressure/heaviness/tightness, radiation to arm/jaw/neck, autonomic symptoms, exertional component, ischaemic ECG change.</li>
  <li><strong>Pulmonary embolism</strong> — Sudden breathlessness, pleuritic pain, tachycardia, haemoptysis, syncope, hypoxia, unilateral leg symptoms or VTE risk factors.</li>
  <li><strong>Aortic dissection</strong> — Abrupt severe pain, often maximal at onset; back pain; pulse/BP asymmetry; collapse; neurological deficit; possible new aortic regurgitation.</li>
  <li><strong>Pneumothorax</strong> — Sudden pleuritic pain and breathlessness, especially with unilateral reduced air entry; tension physiology is an emergency.</li>
  <li><strong>Pericarditis / tamponade</strong> — Pleuritic or positional pain can occur with pericarditis; hypotension, raised JVP and deterioration raise concern for tamponade.</li>
  <li><strong>Pneumonia / pleurisy</strong> — Fever, cough, sputum, focal chest signs or pleuritic pain.</li>
  <li><strong>Tachyarrhythmia</strong> — Palpitations with chest discomfort, haemodynamic compromise or demand-related ischaemia.</li>
  <li><strong>Musculoskeletal chest pain</strong> — Pain related to movement or reproducible tenderness, after more dangerous causes are considered.</li>
  <li><strong>GORD / oesophageal pain</strong> — Burning or post-prandial pain may mimic cardiac pain; do not label it benign until concerning features have been assessed.</li>
</ul>

${figure(
  imgs.pathway,
  'Foundation doctor chest pain differential and decision pathway',
  'The safest approach is dangerous diagnoses first, then targeted investigations and repeated reassessment.'
)}

<h2>6. If ACS is suspected: do the early things well</h2>
<p>Do not rely on the old MONA mnemonic. Current management is indication-based.</p>
<ul>
  <li><strong>Aspirin</strong> — if ACS is suspected and aspirin is appropriate, give the recommended loading dose unless there is a clear contraindication such as true aspirin allergy or a competing diagnosis where antiplatelet treatment could be dangerous.</li>
  <li><strong>GTN and analgesia</strong> — glyceryl trinitrate can be used for ischaemic chest pain when appropriate, but check blood pressure and contraindications first. ${bnfAcs}</li>
  <li><strong>Oxygen</strong> — do not give oxygen routinely just because the patient has chest pain. Give oxygen when there is hypoxaemia or another clinical indication, using the appropriate target saturation range.</li>
</ul>
<p><strong>Important precaution:</strong> If aortic dissection or active bleeding is a serious competing possibility, do not reflexively give antithrombotic treatment without urgent senior input.</p>

<h2>7. Troponin: send it for the right reason</h2>
<p>High-sensitivity troponin is central to suspected MI assessment, but it is not a yes/no test for ‘cardiac chest pain’. Interpret it with the history, ECG, symptom timing and your laboratory’s validated pathway.</p>
<ul>
  <li>Do not delay treatment of clear STEMI while waiting for troponin.</li>
  <li>A raised troponin shows myocardial injury; it does not automatically mean type 1 MI.</li>
  <li>An early normal troponin does not exclude MI unless it is being used within a validated high-sensitivity troponin pathway.</li>
  <li>Repeat testing may be required depending on symptom timing and the assay pathway.</li>
  <li>Always review the trend and the clinical context.</li>
</ul>

<h2>8. If PE is possible, use a structured pathway</h2>
<p>Do not request D-dimer indiscriminately. First assess clinical probability using the 2-level PE Wells score.</p>
<p>With a PE-unlikely Wells score (4 points or less), NICE recommends D-dimer testing; with a PE-likely score (more than 4 points), the pathway proceeds to imaging rather than using D-dimer to rule PE out. ${niceNg158}</p>
<p>CTPA is not a generic ‘chest pain scan’. It should follow the PE diagnostic pathway and be discussed/escalated appropriately when the patient is unstable, the diagnosis is uncertain or imaging decisions are complex.</p>
<p><strong>Common FY trap:</strong> S1Q3T3 is neither sensitive nor specific for PE. Treat ECG right-heart strain as supporting context, not as a diagnostic test.</p>

<h2>9. What investigations should you consider?</h2>
${figure(
  imgs.investigations,
  'Investigation pathway for chest pain in Foundation doctors',
  'Chest-pain investigations should be chosen to answer the differential, not ordered as an automatic bundle.'
)}
<p>Investigations should answer your differential rather than become an automatic bundle.</p>
<ul>
  <li><strong>ECG</strong> — Early 12-lead ECG. Repeat if symptoms persist/evolve. Assess rate, rhythm, ischaemia and dynamic change.</li>
  <li><strong>Bloods</strong> — FBC, U&amp;Es/creatinine and high-sensitivity troponin when ACS is considered. CRP/LFTs or other bloods only when they address the differential.</li>
  <li><strong>Blood gas</strong> — Useful if the patient is significantly unwell, hypoxic, shocked, has suspected ventilatory failure or you need lactate/acid-base information. It is not mandatory for every chest-pain patient.</li>
  <li><strong>Chest X-ray</strong> — Consider for pneumothorax, pulmonary oedema, pneumonia, pleural effusion or another thoracic diagnosis. A normal CXR does not exclude ACS or PE.</li>
  <li><strong>Microbiology</strong> — Blood cultures or sputum testing if infection is genuinely suspected and the result will affect management.</li>
  <li><strong>D-dimer / CTPA</strong> — Use through the structured PE pathway, not as indiscriminate screening.</li>
  <li><strong>CT aortic angiography</strong> — Urgent specialist/senior-led imaging when aortic dissection is suspected.</li>
</ul>

<h2>10. Review the medication chart</h2>
<ul>
  <li>Antiplatelet and anticoagulant therapy.</li>
  <li>GTN or long-acting nitrates.</li>
  <li>Beta-blockers and other rate-limiting drugs.</li>
  <li>VTE prophylaxis.</li>
  <li>NSAIDs or steroids where relevant.</li>
  <li>Recent analgesia.</li>
  <li>Recent omissions of regular cardiac medication.</li>
  <li>Recent drugs that could contribute to hypotension, arrhythmia or bleeding.</li>
</ul>

<h2>11. Reassess — chest pain is dynamic</h2>
<p>Repeat observations, pain assessment and ECG when clinically indicated. A patient who becomes hypotensive, develops new oxygen requirement, has recurrent pain or shows evolving ECG change has changed category and needs escalation.</p>
<p><strong>FY tip:</strong> A single normal ECG and one reassuring set of observations are snapshots. If the symptoms change, repeat the assessment.</p>

<h2>12. When should you escalate?</h2>
<p>Escalate promptly if:</p>
<ul>
  <li>ST elevation or dynamic ischaemic ECG changes.</li>
  <li>Ongoing or recurrent severe chest pain.</li>
  <li>Hypotension, shock, syncope or reduced conscious level.</li>
  <li>Significant arrhythmia with compromise.</li>
  <li>New or increasing oxygen requirement.</li>
  <li>Suspected PE, aortic dissection, tension pneumothorax or tamponade.</li>
  <li>New focal neurological deficit.</li>
  <li>Rising troponin with a clinical picture concerning for ACS.</li>
  <li>The patient is deteriorating despite initial treatment.</li>
  <li>You are uncertain whether aspirin, GTN, anticoagulation or further analgesia is safe.</li>
  <li>You are worried.</li>
</ul>
<p>You do not need the final diagnosis before calling. A useful escalation is concise and specific: “This patient has 30 minutes of new central pressure-like chest pain radiating to the jaw with sweating. They are haemodynamically stable. The ECG shows new ST depression in V4–V6. I am concerned about NSTE-ACS and would like you to review them now.”</p>

<h2>A practical Foundation doctor example</h2>
<p>You are called to a 68-year-old inpatient with new central chest pressure that started 20 minutes ago and radiates to the jaw. They feel nauseated and sweaty.</p>
<ul>
  <li>Go to the patient and assess ABCDE and observations.</li>
  <li>Obtain a 12-lead ECG early — do not wait for the blood results.</li>
  <li>Take a focused history that also tests dangerous alternatives such as PE and dissection.</li>
  <li>If ACS remains the leading diagnosis and aspirin is appropriate, give the recommended early treatment.</li>
  <li>Do not give routine oxygen if oxygenation is satisfactory.</li>
  <li>Send high-sensitivity troponin using the validated pathway, but act on important ECG findings without waiting for it.</li>
  <li>Reassess the pain and repeat the ECG if symptoms persist or recur.</li>
  <li>Escalate early to the senior clinician/cardiology pathway where indicated.</li>
</ul>

<h2>The Foundation doctor chest-pain rule</h2>
<p><strong>GO NOW → ABCDE → FOCUSED HISTORY → ECG EARLY → DANGEROUS DIFFERENTIAL → TARGETED TESTS → TREAT WHAT IS INDICATED → REASSESS → ESCALATE</strong></p>

<h2>The key message</h2>
<p>Do not let chest pain become ‘ECG + troponin’. The safest assessment combines physiology, history, examination, ECG, targeted investigations and repeated reassessment.</p>

<p><em>Educational note: This article is intended as an educational guide for Foundation doctors. For individual patients, follow current NICE/BNF guidance and your NHS organisation’s deteriorating-patient, ACS, PE and emergency-care pathways, and seek senior advice when appropriate.</em></p>
`.trim()
}

async function ensureTopic(): Promise<string> {
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
        name: 'On-calls',
        description: 'Bleeps, night cover and reviewing patients',
        display_order: 6,
        is_active: true,
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
  }

  payload.meta_description = META

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

  const insertPayload = {
    slug: SLUG,
    display_order: 55,
    ...payload,
  }
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
  const historyExam = await uploadPngFromSvg(historyExamSvg(), 'chest-pain-history-examination-map')
  const investigations = await uploadPngFromSvg(investigationsSvg(), 'chest-pain-investigations-map')
  const pathway = await uploadPngFromSvg(pathwaySvg(), 'foundation-doctor-chest-pain-pathway')

  const content = buildContent({ historyExam, investigations, pathway })
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
