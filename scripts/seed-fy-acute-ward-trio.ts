/**
 * Seed three public FY guides (cohort: general · topic: on-calls):
 * 1. Breathlessness Assessment: FY Guide
 * 2. Acute Seizure Management: FY Guide
 * 3. Tachycardia on the Ward: FY Guide
 *
 * Featured: unique Bleepy logo cards. Inline: teaching SVG infographics.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-fy-acute-ward-trio.ts
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

const TOPIC_SLUG = 'on-calls'
const COHORT = 'general'
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

function breathlessnessPropsSvg(): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(140,210)">
    <ellipse cx="90" cy="70" rx="70" ry="55" fill="#DBEAFE" stroke="#1E40AF" stroke-width="5"/>
    <path d="M55 70 Q70 40 90 70 Q110 100 125 70" fill="none" stroke="#1E40AF" stroke-width="5" stroke-linecap="round"/>
    <text x="90" y="160" text-anchor="middle" font-family="Arial" font-size="15" font-weight="800" fill="#1E3A5F">OXYGEN TARGET</text>
  </g>
  <g transform="translate(920,230)">
    <rect x="0" y="20" width="180" height="140" rx="16" fill="#FEF2F2" stroke="#DC2626" stroke-width="5"/>
    <path d="M40 90 L70 90 L85 55 L105 125 L120 90 L150 90" fill="none" stroke="#DC2626" stroke-width="4"/>
    <text x="90" y="185" text-anchor="middle" font-family="Arial" font-size="15" font-weight="800" fill="#7F1D1D">GO TO BEDSIDE</text>
  </g>
</svg>`)
}

function seizurePropsSvg(): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(150,220)">
    <circle cx="80" cy="80" r="70" fill="#FEF2F2" stroke="#DC2626" stroke-width="6"/>
    <text x="80" y="75" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#DC2626">5</text>
    <text x="80" y="105" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#7F1D1D">MINUTES</text>
    <text x="80" y="185" text-anchor="middle" font-family="Arial" font-size="14" font-weight="800" fill="#7F1D1D">TREAT IF ONGOING</text>
  </g>
  <g transform="translate(900,240)">
    <rect x="0" y="10" width="180" height="130" rx="16" fill="#FFF7ED" stroke="#F25006" stroke-width="5"/>
    <text x="90" y="70" text-anchor="middle" font-family="Arial Black" font-size="22" fill="#F25006">ABCDE</text>
    <text x="90" y="105" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#9A3412">+ GLUCOSE</text>
  </g>
</svg>`)
}

function tachycardiaPropsSvg(): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(140,220)">
    <rect x="0" y="20" width="220" height="150" rx="16" fill="#FEF2F2" stroke="#DC2626" stroke-width="5"/>
    <path d="M25 95 L50 95 L65 55 L85 140 L105 70 L125 95 L190 95" fill="none" stroke="#DC2626" stroke-width="5" stroke-linecap="round"/>
    <text x="110" y="195" text-anchor="middle" font-family="Arial" font-size="14" font-weight="800" fill="#7F1D1D">12-LEAD ECG</text>
  </g>
  <g transform="translate(900,235)">
    <rect x="0" y="15" width="180" height="70" rx="12" fill="#DC2626"/>
    <text x="90" y="58" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">UNSTABLE?</text>
    <rect x="0" y="100" width="180" height="55" rx="12" fill="#1E40AF"/>
    <text x="90" y="135" text-anchor="middle" font-family="Arial Black" font-size="16" fill="#fff">STABLE?</text>
  </g>
</svg>`)
}

async function composeFeaturedLogoCard(featuredTitle: string, propsSvg?: Buffer): Promise<Buffer> {
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

  const lines = wrapTitle(featuredTitle)
  const banners = await sharp(bannerSvg(lines, 'ON-CALL & ACUTE CARE', 'FOUNDATION YEAR'))
    .png()
    .toBuffer()

  const layers: sharp.OverlayOptions[] = [
    { input: watermarkSoft, top: 120, left: 290 },
  ]
  if (propsSvg) {
    const props = await sharp(propsSvg).png().toBuffer()
    layers.push({ input: props, top: 0, left: 0 })
  }
  layers.push(
    { input: logo, top: 210, left: 460 },
    {
      input: Buffer.from(
        `<svg width="220" height="28"><ellipse cx="110" cy="14" rx="100" ry="10" fill="#000" fill-opacity="0.12"/></svg>`
      ),
      top: 545,
      left: 530,
    },
    { input: banners, top: 0, left: 0 }
  )

  return sharp({
    create: { width: W, height: H, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite(layers)
    .webp({ quality: 90, effort: 5 })
    .toBuffer()
}

/* ─── Breathlessness SVGs ─── */

function breathHistoryExamSvg(): Buffer {
  const hist = [
    ['TIMELINE', 'Sudden vs gradual; baseline change'],
    ['RESP / CARDIAC', 'Sputum, pain, orthopnoea, PND'],
    ['RISK FACTORS', 'PE risks, asthma/COPD, HF, VTE'],
    ['DRUGS / SOCIAL', 'Inhalers, LTOT, VTE prophylaxis'],
  ]
  const exam = [
    ['A', 'Airway, stridor, facial swelling'],
    ['B', 'RR, SpO₂, FiO₂, air entry, wheeze'],
    ['C', 'HR/BP, JVP, calves, oedema'],
    ['D', 'GCS, glucose, temperature'],
    ['E', 'Rash, urticaria, abdomen'],
  ]
  const histCards = hist
    .map(([t, s], i) => {
      const y = 175 + i * 155
      return `
      <rect x="70" y="${y}" width="520" height="135" rx="16" fill="#EFF6FF" stroke="#1E40AF" stroke-width="3"/>
      <text x="330" y="${y + 52}" text-anchor="middle" font-family="Arial Black" font-size="22" fill="#1E3A5F">${escapeXml(t)}</text>
      <text x="330" y="${y + 95}" text-anchor="middle" font-family="Arial" font-size="16" fill="#475569">${escapeXml(s)}</text>`
    })
    .join('\n')
  const examCards = exam
    .map(([t, s], i) => {
      const y = 175 + i * 125
      return `
      <rect x="690" y="${y}" width="520" height="108" rx="16" fill="#FFF7ED" stroke="#F25006" stroke-width="3"/>
      <circle cx="740" cy="${y + 54}" r="24" fill="#F25006"/>
      <text x="740" y="${y + 62}" text-anchor="middle" font-family="Arial Black" font-size="20" fill="#fff">${escapeXml(t)}</text>
      <text x="790" y="${y + 62}" font-family="Arial" font-size="17" font-weight="700" fill="#1E3A5F">${escapeXml(s)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="55" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#1E3A5F">BREATHLESS PATIENT ASSESSMENT</text>
  <text x="640" y="95" text-anchor="middle" font-family="Arial" font-size="17" fill="#64748B">Structured history + ABCDE examination for Foundation doctors</text>
  <rect x="70" y="120" width="520" height="40" rx="10" fill="#1E40AF"/>
  <text x="330" y="148" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">HISTORY</text>
  <rect x="690" y="120" width="520" height="40" rx="10" fill="#F25006"/>
  <text x="950" y="148" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">EXAMINATION</text>
  ${histCards}
  ${examCards}
</svg>`)
}

function breathInvestigationsSvg(): Buffer {
  const items = [
    ['BLOODS', 'FBC, U&Es, CRP; troponin if ACS'],
    ['BLOOD GAS', 'pH, PaO₂, PaCO₂, HCO₃⁻, lactate'],
    ['CHEST X-RAY', 'Consolidation, PTX, oedema, mass'],
    ['ECG', 'Rate, rhythm, ischaemia, strain'],
    ['MICRO / PEFR', 'Cultures if infection; PEFR in asthma'],
    ['PE PATHWAY', 'Wells → D-dimer or CTPA'],
  ]
  const cards = items
    .map(([title, sub], i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = 70 + col * 390
      const y = 200 + row * 280
      return `
      <rect x="${x}" y="${y}" width="350" height="230" rx="20" fill="#EFF6FF" stroke="#1E40AF" stroke-width="3"/>
      <text x="${x + 175}" y="${y + 85}" text-anchor="middle" font-family="Arial Black" font-size="20" fill="#1E3A5F">${escapeXml(title)}</text>
      <text x="${x + 175}" y="${y + 140}" text-anchor="middle" font-family="Arial" font-size="16" fill="#475569">${escapeXml(sub)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="70" text-anchor="middle" font-family="Arial Black" font-size="26" fill="#1E3A5F">BREATHLESSNESS: WHICH TEST ANSWERS WHICH QUESTION?</text>
  <text x="640" y="115" text-anchor="middle" font-family="Arial" font-size="18" fill="#64748B">Choose investigations to answer the differential — not as an automatic bundle</text>
  ${cards}
  <text x="640" y="840" text-anchor="middle" font-family="Arial" font-size="18" font-weight="800" fill="#F25006">STABILISE → TARGETED TESTS → DANGEROUS DIFFERENTIAL → REASSESS</text>
</svg>`)
}

function breathPathwaySvg(): Buffer {
  const danger = [
    'ASTHMA',
    'COPD',
    'PNEUMONIA',
    'ACS',
    'PE',
    'HF / OEDEMA',
    'PNEUMOTHORAX',
    'ANAPHYLAXIS',
  ]
  const dangerBoxes = danger
    .map((label, i) => {
      const col = i % 4
      const row = Math.floor(i / 4)
      const x = 70 + col * 300
      const y = 280 + row * 100
      return `
      <rect x="${x}" y="${y}" width="280" height="80" rx="14" fill="#7F1D1D"/>
      <text x="${x + 140}" y="${y + 48}" text-anchor="middle" font-family="Arial Black" font-size="16" fill="#fff">${escapeXml(label)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="55" text-anchor="middle" font-family="Arial Black" font-size="26" fill="#1E3A5F">ACUTE BREATHLESSNESS DIFFERENTIAL</text>
  <text x="640" y="95" text-anchor="middle" font-family="Arial" font-size="17" fill="#64748B">Dangerous diagnoses first — stabilise, then narrow the cause</text>
  <rect x="340" y="130" width="600" height="90" rx="18" fill="#F25006"/>
  <text x="640" y="185" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#fff">ACUTE BREATHLESSNESS</text>
  <text x="640" y="255" text-anchor="middle" font-family="Arial Black" font-size="16" fill="#7F1D1D">LIFE-THREATENING / URGENT DIFFERENTIAL</text>
  ${dangerBoxes}
  <rect x="160" y="520" width="960" height="70" rx="14" fill="#EBA400"/>
  <text x="640" y="565" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">Also consider: lung malignancy · acute abdomen / non-respiratory causes</text>
  <rect x="160" y="630" width="960" height="70" rx="14" fill="#1E40AF"/>
  <text x="640" y="675" text-anchor="middle" font-family="Arial Black" font-size="20" fill="#fff">STABILISE FIRST → DIAGNOSE SECOND → REASSESS ALWAYS</text>
  <text x="640" y="780" text-anchor="middle" font-family="Arial" font-size="15" font-weight="800" fill="#F25006">GO NOW → ABCDE → OXYGEN TARGET → HISTORY → EXAM → GAS IF NEEDED → TESTS → TREAT → REASSESS → ESCALATE</text>
</svg>`)
}

/* ─── Seizure SVGs ─── */

function seizureAlgorithmSvg(): Buffer {
  const steps = [
    ['0–2 MIN', 'Most seizures self-terminate', '#1E40AF'],
    ['BY 5 MIN', 'First-line benzo if ongoing', '#F25006'],
    ['AT 10 MIN', 'Escalate + lorazepam IV', '#DC2626'],
    ['AT 15 MIN', 'Senior-led 2nd-line ASM', '#7F1D1D'],
  ]
  const stepBoxes = steps
    .map(([t, s, c], i) => {
      const x = 50 + i * 305
      return `
      <rect x="${x}" y="140" width="290" height="110" rx="14" fill="${c}"/>
      <text x="${x + 145}" y="185" text-anchor="middle" font-family="Arial Black" font-size="20" fill="#fff">${escapeXml(t)}</text>
      <text x="${x + 145}" y="220" text-anchor="middle" font-family="Arial" font-size="14" fill="#fff">${escapeXml(s)}</text>`
    })
    .join('\n')

  const firstLine = [
    ['Midazolam buccal', '10 mg'],
    ['Diazepam PR', '10 mg'],
    ['Lorazepam IV', '4 mg'],
  ]
  const flBoxes = firstLine
    .map(([t, d], i) => {
      const x = 100 + i * 360
      return `
      <rect x="${x}" y="320" width="330" height="90" rx="12" fill="#FEF2F2" stroke="#DC2626" stroke-width="3"/>
      <text x="${x + 165}" y="360" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#7F1D1D">${escapeXml(t)}</text>
      <text x="${x + 165}" y="390" text-anchor="middle" font-family="Arial" font-size="16" fill="#475569">${escapeXml(d)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="50" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#1E3A5F">ACUTE SEIZURE MANAGEMENT</text>
  <text x="640" y="90" text-anchor="middle" font-family="Arial" font-size="17" fill="#64748B">ABCDE · call for help · glucose · timed benzodiazepines · escalate</text>
  ${stepBoxes}
  <text x="640" y="300" text-anchor="middle" font-family="Arial Black" font-size="16" fill="#7F1D1D">STEP 1 OPTIONS (IF ONGOING AT 5 MINUTES)</text>
  ${flBoxes}
  <rect x="100" y="450" width="1080" height="80" rx="14" fill="#FFF7ED" stroke="#F25006" stroke-width="3"/>
  <text x="640" y="500" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#9A3412">Phenytoin 20 mg/kg (max 2 g) · Levetiracetam 60 mg/kg (max 4.5 g) · Valproate 40 mg/kg (max 3 g) — SENIOR-LED</text>
  <rect x="100" y="560" width="1080" height="80" rx="14" fill="#7F1D1D"/>
  <text x="640" y="610" text-anchor="middle" font-family="Arial Black" font-size="22" fill="#fff">IF STILL FITTING → ESCALATE TO CRITICAL CARE</text>
  <text x="640" y="720" text-anchor="middle" font-family="Arial" font-size="16" font-weight="800" fill="#F25006">TIME → ABCDE → HELP → GLUCOSE → TREAT BY 5 MIN → ESCALATE AT 10 → SENIOR 2nd-LINE AT 15 → INVESTIGATE</text>
  <text x="640" y="820" text-anchor="middle" font-family="Arial" font-size="15" fill="#64748B">Adverse features: airway obstruction · hypoxia · hypotension · fever → escalate immediately</text>
</svg>`)
}

function seizurePostSvg(): Buffer {
  const items = [
    ['ABCDE + GCS', 'Reassess; wake as expected?'],
    ['ABG', 'pH, pO₂, lactate'],
    ['BLOODS', 'FBC, U&Es, Mg, Ca, LFT, CRP'],
    ['EXTRA TESTS', 'Coag, tox, levels, cultures'],
    ['IMAGING / LP / EEG', 'As clinically indicated'],
    ['MEDS REVIEW', 'Threshold-lowering drugs'],
  ]
  const cards = items
    .map(([title, sub], i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = 70 + col * 390
      const y = 180 + row * 260
      return `
      <rect x="${x}" y="${y}" width="350" height="220" rx="18" fill="#EFF6FF" stroke="#1E40AF" stroke-width="3"/>
      <text x="${x + 175}" y="${y + 80}" text-anchor="middle" font-family="Arial Black" font-size="20" fill="#1E3A5F">${escapeXml(title)}</text>
      <text x="${x + 175}" y="${y + 130}" text-anchor="middle" font-family="Arial" font-size="16" fill="#475569">${escapeXml(sub)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="60" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#1E3A5F">POST-SEIZURE MANAGEMENT</text>
  <text x="640" y="105" text-anchor="middle" font-family="Arial" font-size="17" fill="#64748B">Stopping the fit is only the start — work out why and what to monitor next</text>
  ${cards}
  <text x="640" y="780" text-anchor="middle" font-family="Arial" font-size="17" font-weight="800" fill="#F25006">DOCUMENT TIMING · TREATMENTS · RESPONSE · CONSIDER PROPHYLAXIS WITH SENIOR</text>
</svg>`)
}

function seizureEscalateSvg(): Buffer {
  const flags = [
    'Seizure &gt;5 min / recurrent',
    'Airway / hypoxia / hypotension',
    'Fever / suspected CNS infection',
    'Head injury / trauma / bleed risk',
    'Persistent reduced GCS',
    'Failure of first-line treatment',
  ]
  const flagBoxes = flags
    .map((label, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = 70 + col * 390
      const y = 200 + row * 140
      return `
      <rect x="${x}" y="${y}" width="360" height="110" rx="14" fill="#FEF2F2" stroke="#DC2626" stroke-width="3"/>
      <text x="${x + 180}" y="${y + 62}" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#7F1D1D">${label}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="55" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#1E3A5F">WHEN TO ESCALATE IN A SEIZURE</text>
  <text x="640" y="100" text-anchor="middle" font-family="Arial" font-size="17" fill="#64748B">Red flags moving toward status epilepticus need immediate senior help</text>
  <rect x="200" y="130" width="880" height="50" rx="10" fill="#DC2626"/>
  <text x="640" y="164" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">WARD → SENIOR → CRITICAL CARE</text>
  ${flagBoxes}
  <rect x="160" y="520" width="960" height="90" rx="16" fill="#7F1D1D"/>
  <text x="640" y="575" text-anchor="middle" font-family="Arial Black" font-size="20" fill="#fff">FIRST SEIZURE · STATUS · YOU ARE WORRIED → CALL NOW</text>
  <text x="640" y="700" text-anchor="middle" font-family="Arial" font-size="16" font-weight="800" fill="#F25006">Do not wait for a final diagnosis before escalating</text>
</svg>`)
}

/* ─── Tachycardia SVGs ─── */

function tachyStableUnstableSvg(): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="55" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#1E3A5F">TACHYCARDIA: STABLE VS UNSTABLE</text>
  <text x="640" y="95" text-anchor="middle" font-family="Arial" font-size="17" fill="#64748B">The first branch is haemodynamic stability — not the ECG diagnosis</text>
  <rect x="390" y="130" width="500" height="70" rx="14" fill="#F25006"/>
  <text x="640" y="175" text-anchor="middle" font-family="Arial Black" font-size="24" fill="#fff">TACHYCARDIA</text>
  <rect x="70" y="250" width="540" height="420" rx="18" fill="#FEF2F2" stroke="#DC2626" stroke-width="4"/>
  <rect x="90" y="270" width="500" height="55" rx="10" fill="#DC2626"/>
  <text x="340" y="305" text-anchor="middle" font-family="Arial Black" font-size="22" fill="#fff">UNSTABLE</text>
  <text x="340" y="370" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700" fill="#7F1D1D">Shock / marked hypotension</text>
  <text x="340" y="410" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700" fill="#7F1D1D">Syncope with compromise</text>
  <text x="340" y="450" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700" fill="#7F1D1D">Myocardial ischaemia</text>
  <text x="340" y="490" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700" fill="#7F1D1D">Severe HF / pulmonary oedema</text>
  <rect x="120" y="530" width="440" height="100" rx="12" fill="#7F1D1D"/>
  <text x="340" y="575" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">CALL FOR HELP</text>
  <text x="340" y="605" text-anchor="middle" font-family="Arial" font-size="16" fill="#fff">Synchronised cardioversion</text>
  <rect x="670" y="250" width="540" height="420" rx="18" fill="#EFF6FF" stroke="#1E40AF" stroke-width="4"/>
  <rect x="690" y="270" width="500" height="55" rx="10" fill="#1E40AF"/>
  <text x="940" y="305" text-anchor="middle" font-family="Arial Black" font-size="22" fill="#fff">STABLE</text>
  <text x="940" y="380" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#1E3A5F">12-lead ECG</text>
  <text x="940" y="430" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#1E3A5F">→ QRS WIDTH</text>
  <text x="940" y="480" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#1E3A5F">→ REGULARITY</text>
  <text x="940" y="540" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#1E3A5F">→ LIKELY RHYTHM</text>
  <text x="940" y="600" text-anchor="middle" font-family="Arial" font-size="16" fill="#475569">Then pathway-specific treatment</text>
  <text x="640" y="740" text-anchor="middle" font-family="Arial" font-size="16" font-weight="800" fill="#F25006">PATIENT FIRST → UNSTABLE OR STABLE? → ECG → SINUS OR ARRHYTHMIA?</text>
</svg>`)
}

function tachyQrsMapSvg(): Buffer {
  const quads = [
    { x: 70, y: 160, title: 'BROAD + REGULAR', think: 'VT until proven otherwise', action: 'Senior early — not casual SVT', bg: '#FEF2F2', stroke: '#DC2626' },
    { x: 670, y: 160, title: 'BROAD + IRREGULAR', think: 'AF+BBB / pre-excited AF / polymorphic VT', action: 'Urgent senior; torsades pathway', bg: '#FEF2F2', stroke: '#DC2626' },
    { x: 70, y: 480, title: 'NARROW + IRREGULAR', think: 'Usually AF (± flutter variable block)', action: 'Duration, rate, anticoag, AF pathway', bg: '#EFF6FF', stroke: '#1E40AF' },
    { x: 670, y: 480, title: 'NARROW + REGULAR', think: 'Re-entry SVT / atrial flutter', action: 'Vagal → adenosine if appropriate', bg: '#EFF6FF', stroke: '#1E40AF' },
  ]
  const cards = quads
    .map(
      (q) => `
    <rect x="${q.x}" y="${q.y}" width="540" height="270" rx="18" fill="${q.bg}" stroke="${q.stroke}" stroke-width="4"/>
    <text x="${q.x + 270}" y="${q.y + 55}" text-anchor="middle" font-family="Arial Black" font-size="22" fill="#1E3A5F">${escapeXml(q.title)}</text>
    <text x="${q.x + 270}" y="${q.y + 120}" text-anchor="middle" font-family="Arial" font-size="16" fill="#475569">${escapeXml(q.think)}</text>
    <text x="${q.x + 270}" y="${q.y + 180}" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#9A3412">${escapeXml(q.action)}</text>`
    )
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="50" text-anchor="middle" font-family="Arial Black" font-size="26" fill="#1E3A5F">QRS WIDTH + REGULARITY MAP</text>
  <text x="640" y="90" text-anchor="middle" font-family="Arial" font-size="17" fill="#64748B">Four-quadrant approach for stable tachyarrhythmia</text>
  ${cards}
  <rect x="200" y="800" width="880" height="55" rx="12" fill="#DC2626"/>
  <text x="640" y="835" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">BROAD OR UNCERTAIN = SENIOR REVIEW</text>
</svg>`)
}

function tachyNarrowPathwaySvg(): Buffer {
  const steps = [
    ['ABCDE', 'Confirm stable'],
    ['12-LEAD ECG', 'Regular + narrow?'],
    ['VAGAL', 'e.g. modified Valsalva'],
    ['ADENOSINE', 'If appropriate + monitored'],
    ['TERMINATES?', 'Capture ECG / escalate'],
  ]
  const boxes = steps
    .map(([t, s], i) => {
      const x = 40 + i * 245
      return `
      <rect x="${x}" y="280" width="230" height="140" rx="14" fill="${i === 4 ? '#F25006' : '#1E40AF'}"/>
      <text x="${x + 115}" y="340" text-anchor="middle" font-family="Arial Black" font-size="16" fill="#fff">${escapeXml(t)}</text>
      <text x="${x + 115}" y="375" text-anchor="middle" font-family="Arial" font-size="13" fill="#fff">${escapeXml(s)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="55" text-anchor="middle" font-family="Arial Black" font-size="26" fill="#1E3A5F">STABLE NARROW-COMPLEX TACHYCARDIA</text>
  <text x="640" y="100" text-anchor="middle" font-family="Arial" font-size="17" fill="#64748B">Vagal manoeuvres → monitored adenosine when appropriate → reassess</text>
  ${boxes}
  <rect x="100" y="500" width="500" height="160" rx="16" fill="#EFF6FF" stroke="#1E40AF" stroke-width="3"/>
  <text x="350" y="560" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#1E3A5F">IF TERMINATES</text>
  <text x="350" y="605" text-anchor="middle" font-family="Arial" font-size="15" fill="#475569">12-lead in sinus · cardiology if recurrent</text>
  <rect x="680" y="500" width="500" height="160" rx="16" fill="#FEF2F2" stroke="#DC2626" stroke-width="3"/>
  <text x="930" y="560" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#7F1D1D">IF DOES NOT TERMINATE</text>
  <text x="930" y="605" text-anchor="middle" font-family="Arial" font-size="15" fill="#475569">Consider flutter / escalate — do not keep dosing forever</text>
  <text x="640" y="760" text-anchor="middle" font-family="Arial" font-size="16" font-weight="800" fill="#F25006">Do not give adenosine to undifferentiated broad irregular tachycardia</text>
</svg>`)
}

/* ─── Shared HTML helpers ─── */

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

async function uploadPngFromSvg(imageDir: string, svg: Buffer, outBase: string) {
  const png = await sharp(svg).png().toBuffer()
  return uploadBuffer(`${imageDir}/${outBase}.png`, png, 'image/png')
}

function sourceLink(href: string, label: string) {
  return `<a class="fy-source-link" href="${href}" target="_blank" rel="noopener">${label}</a>`
}

function imageDirFor(slug: string) {
  return `foundation-year/${COHORT}/${TOPIC_SLUG}/${slug}/images`
}

/* ─── Content builders ─── */

function buildBreathlessnessContent(imgs: {
  historyExam: string
  investigations: string
  pathway: string
}) {
  const bnfO2 = sourceLink('https://bnf.nice.org.uk/treatment-summaries/oxygen/', 'BNF: Oxygen')
  const niceNg115 = sourceLink(
    'https://www.nice.org.uk/guidance/ng115',
    'NICE NG115: COPD diagnosis and management'
  )
  const niceNg158 = sourceLink(
    'https://www.nice.org.uk/guidance/ng158',
    'NICE NG158: suspected pulmonary embolism'
  )

  return `
<p>A practical Foundation doctor guide to assessing acute breathlessness on the ward, including ABCDE, focused history, blood gases, CXR, ECG, PE assessment and escalation.</p>

<h2>Breathlessness on the Ward: What Should You Do?</h2>
<p>It is 1 am and the nurse bleeps you: “Doctor, can you review this patient? They are suddenly much more breathless.”</p>
<p>Breathlessness is a symptom, not a diagnosis. It may represent a relatively straightforward exacerbation of known respiratory disease, but it can also be the first sign of pulmonary embolism, pulmonary oedema, pneumothorax, anaphylaxis, acute coronary syndrome or impending respiratory failure.</p>
<p><strong>The first rule:</strong> Do not start by asking “Is this asthma or pneumonia?” Start by asking “How sick is this patient, and is there an immediately reversible or life-threatening cause?”</p>

<h2>1. Go to the patient and get the timeline</h2>
<p>Before opening several days of notes, establish the essentials:</p>
<ul>
  <li>How long have they been breathless?</li>
  <li>Was the onset sudden or gradual?</li>
  <li>Is this new, or a deterioration from their baseline?</li>
  <li>Are they febrile?</li>
  <li>Is there cough or sputum, and is it clear, yellow-green, frothy or blood-stained?</li>
  <li>Is there chest pain — cardiac, pleuritic or associated with palpitations?</li>
  <li>Are there pulmonary embolism risk factors such as recent surgery or immobility?</li>
  <li>Are there heart-failure symptoms such as oedema, orthopnoea or paroxysmal nocturnal dyspnoea?</li>
  <li>What are the current observations, oxygen requirement and NEWS2?</li>
</ul>
<p>The timing matters. Sudden breathlessness should make you think particularly about pulmonary embolism, pneumothorax, acute pulmonary oedema, anaphylaxis or arrhythmia, while a more gradual history may fit infection, COPD, heart failure or another evolving process.</p>

<h2>2. Use the past history to narrow the field</h2>
<p>Useful background questions include:</p>
<ul>
  <li>Asthma — previous ICU admission or a history of brittle/severe disease?</li>
  <li>COPD — recent exacerbations or previous need for non-invasive ventilation?</li>
  <li>Other lung disease — interstitial lung disease or malignancy?</li>
  <li>Previous anaphylaxis?</li>
  <li>Cardiac disease — IHD, previous MI or heart failure?</li>
  <li>Previous DVT/PE, cancer or other VTE risk factors?</li>
</ul>
<p>Review the drug chart and regular treatment: inhalers and nebulisers, long-term oxygen therapy, GTN or relevant cardiac medication, VTE prophylaxis or anticoagulation, allergies and recently started medicines. Also establish smoking status and the patient's usual exercise tolerance — the change from baseline is often more useful than a generic “short of breath”.</p>

<h2>3. If the patient is unwell, assess ABCDE immediately</h2>
${figure(
  imgs.historyExam,
  'Breathless patient history and ABCDE assessment for Foundation doctors',
  'A focused history plus ABCDE examination helps separate airway, lung, cardiac, thromboembolic and systemic causes of breathlessness.'
)}
<ul>
  <li><strong>A — Airway</strong> — Confirm the airway is patent. Look and listen for stridor and check for facial or tongue swelling. These findings can move anaphylaxis or upper-airway obstruction rapidly to the top of the differential.</li>
  <li><strong>B — Breathing</strong> — Check respiratory rate, SpO₂, current oxygen device/FiO₂ and work of breathing. Assess tracheal position, chest expansion and air entry. Listen for wheeze, crackles, bronchial breathing or a silent chest. Percuss if pneumothorax or effusion is possible. Note sputum character, including frothy sputum or haemoptysis.</li>
  <li><strong>C — Circulation</strong> — Check heart rate, blood pressure, capillary refill and fluid balance. Examine the JVP, heart sounds, calves and peripheries. Unilateral leg swelling may support DVT/PE; bilateral or sacral oedema and a raised JVP may support fluid overload or heart failure.</li>
  <li><strong>D — Disability</strong> — Check temperature, GCS and capillary blood glucose. Consider whether reduced conscious level could reflect hypoxia, hypercapnia or another systemic problem.</li>
  <li><strong>E — Exposure</strong> — Look for rash or urticaria, petechiae, evidence of recent procedures/trauma, and abdominal distension or tenderness where the presentation is not fitting a purely respiratory cause.</li>
</ul>
<p><strong>Foundation doctor tip:</strong> A patient who is becoming exhausted, confused, drowsy, cyanosed, hypotensive, has a silent chest or has rapidly increasing oxygen needs is not a routine breathlessness review. Escalate while you continue ABCDE.</p>

<h2>4. Oxygen: treat hypoxaemia, not the sensation of breathlessness</h2>
<p>Oxygen should be treated as a drug and prescribed to an appropriate target range. For most acutely unwell adults the usual target is 94–98%; patients at risk of hypercapnic respiratory failure generally require a lower target such as 88–92%, with blood-gas assessment guiding further management. ${bnfO2}</p>
<p>Do not let a satisfactory saturation on supplemental oxygen falsely reassure you. The patient may still be deteriorating if the oxygen requirement is rising, the respiratory rate is worsening or carbon dioxide is accumulating.</p>
<p><strong>The important trend:</strong> A saturation of 94% on progressively increasing oxygen is deterioration, not reassurance.</p>

<h2>5. Do they need a blood gas?</h2>
<p>A blood gas is particularly useful when the patient is significantly unwell, hypoxic despite oxygen, drowsy, at risk of hypercapnic respiratory failure, or when you need to assess ventilation, acid–base status or lactate.</p>
<p>Read it systematically:</p>
<ul>
  <li>pH</li>
  <li>PaO₂</li>
  <li>PaCO₂</li>
  <li>HCO₃⁻ / base excess</li>
  <li>Lactate</li>
  <li>Haemoglobin, electrolytes and glucose where available on the analyser</li>
</ul>
<p>For an acute COPD exacerbation requiring hospital assessment, NICE recommends arterial blood gases with the inspired oxygen concentration recorded. A rising PaCO₂ with acidosis or failure to improve despite treatment needs senior review and may require ventilatory support. ${niceNg115}</p>
<p><strong>Common FY trap:</strong> Do not look only at PaO₂. A patient can have an acceptable saturation on oxygen while developing worsening hypercapnia and acidosis.</p>

<h2>6. Investigations: choose tests that answer your differential</h2>
${figure(
  imgs.investigations,
  'Investigation map for an acutely breathless patient',
  'Investigations should answer the differential rather than become an automatic shortness-of-breath bundle.'
)}
<table>
  <thead>
    <tr><th>Investigation</th><th>What it can help answer</th></tr>
  </thead>
  <tbody>
    <tr><td>Bloods</td><td>FBC, U&amp;Es and CRP are common starting tests. Add troponin if chest pain/ACS is part of the differential. D-dimer should be used only within an appropriate PE probability pathway.</td></tr>
    <tr><td>Blood gas</td><td>Ventilation, oxygenation, acid–base status and lactate in a clinically significant respiratory deterioration.</td></tr>
    <tr><td>Chest X-ray</td><td>Consolidation, pleural effusion, collapse, pneumothorax, pulmonary oedema pattern or a mass.</td></tr>
    <tr><td>ECG</td><td>Rate, rhythm, arrhythmia, ischaemia and clues to right-heart strain. ECG findings can support a differential but do not diagnose or exclude PE.</td></tr>
    <tr><td>Microbiology</td><td>Blood cultures, sputum culture or other microbiology when infection is clinically suspected and the result is likely to affect management.</td></tr>
    <tr><td>PEFR</td><td>Useful in suspected acute asthma when the patient is able to perform it; compare with predicted/personal best as appropriate.</td></tr>
    <tr><td>CTPA</td><td>For suspected PE according to the structured clinical-probability pathway; discuss/escalate appropriately if the patient is unstable or the imaging decision is complex.</td></tr>
  </tbody>
</table>

<h2>7. Do not reflexively order a D-dimer</h2>
<p>If pulmonary embolism is a realistic possibility, use a structured clinical-probability approach rather than adding a D-dimer to every breathlessness work-up.</p>
<p>NICE uses the 2-level PE Wells score. A score of 4 or less is “PE unlikely” and leads to D-dimer testing; a score above 4 is “PE likely” and leads towards imaging rather than using D-dimer to rule PE out. ${niceNg158}</p>
<p><strong>Foundation doctor tip:</strong> Breathlessness can be the only obvious feature of PE. A relatively quiet chest examination does not exclude it.</p>

<h2>8. Build a dangerous-first differential</h2>
${figure(
  imgs.pathway,
  'Dangerous differential diagnoses for acute breathlessness in Foundation doctors',
  'Acute breathlessness has a broad differential; prioritise diagnoses that can deteriorate rapidly.'
)}
<table>
  <thead>
    <tr><th>Diagnosis</th><th>Bedside clues</th></tr>
  </thead>
  <tbody>
    <tr><td>Acute asthma</td><td>Wheeze, increased work of breathing, reduced air entry; a silent chest or exhaustion is a red flag.</td></tr>
    <tr><td>COPD exacerbation</td><td>Worsening breathlessness with cough/sputum change, wheeze and possible hypercapnic respiratory failure.</td></tr>
    <tr><td>Pneumonia</td><td>Fever, cough, sputum, pleuritic pain, focal crackles or bronchial breathing, consolidation on CXR.</td></tr>
    <tr><td>ACS</td><td>Breathlessness may accompany or occasionally dominate an ischaemic presentation, especially with chest discomfort, sweating or ECG change.</td></tr>
    <tr><td>Pulmonary embolism</td><td>Sudden dyspnoea, pleuritic chest pain, haemoptysis, tachycardia, syncope, hypoxia or VTE risk factors.</td></tr>
    <tr><td>Heart failure / pulmonary oedema</td><td>Orthopnoea, PND, oedema, raised JVP, crackles and frothy sputum.</td></tr>
    <tr><td>Pneumothorax</td><td>Sudden breathlessness, pleuritic pain, unilateral reduced air entry or hyperresonance; haemodynamic compromise raises concern for tension physiology.</td></tr>
    <tr><td>Anaphylaxis</td><td>Acute breathlessness with stridor/wheeze, facial or tongue swelling, urticaria and/or circulatory compromise.</td></tr>
  </tbody>
</table>
<p>Also keep lung malignancy and acute abdomen / non-respiratory causes on the secondary list when the timeline is more subacute or the chest examination does not fit.</p>

<h2>9. Match bedside clues to the differential</h2>
<ul>
  <li>Stridor or facial/tongue swelling → think upper-airway obstruction/anaphylaxis.</li>
  <li>Silent chest or markedly reduced air entry in asthma → severe deterioration.</li>
  <li>Unilateral reduced air entry with sudden onset → think pneumothorax.</li>
  <li>Crackles + raised JVP + peripheral oedema + orthopnoea/PND → think heart failure/pulmonary oedema.</li>
  <li>Fever + purulent sputum + focal chest signs → think infection/pneumonia.</li>
  <li>Sudden dyspnoea + pleuritic pain/haemoptysis + VTE risk → think PE.</li>
  <li>Chest discomfort + ECG ischaemia/troponin pathway → consider ACS.</li>
  <li>Drowsiness + low respiratory rate or rising CO₂ → think ventilatory failure and medication/neurological causes as well as lung disease.</li>
</ul>

<h2>10. Treat the cause, then reassess</h2>
<p>Oxygen, nebulisers or fluids can temporarily improve numbers without solving the diagnosis. After each intervention, repeat the clinical assessment: respiratory rate, SpO₂ and oxygen requirement, work of breathing, heart rate and blood pressure, GCS, chest examination, blood-gas trend when indicated, and response to treatment.</p>

<h2>11. When should you escalate?</h2>
<p>Escalate urgently if:</p>
<ul>
  <li>Airway compromise, stridor or significant facial/tongue swelling</li>
  <li>Severe respiratory distress or rapidly increasing work of breathing</li>
  <li>A silent chest or markedly reduced air entry</li>
  <li>Persistent hypoxaemia or rapidly increasing oxygen requirement</li>
  <li>Drowsiness, confusion or falling GCS</li>
  <li>Hypercapnia with acidosis or worsening blood-gas parameters</li>
  <li>Hypotension, shock, syncope or significant arrhythmia</li>
  <li>Suspected tension pneumothorax, major PE, anaphylaxis or acute pulmonary oedema</li>
  <li>The patient is not improving despite initial treatment</li>
  <li>You cannot explain the deterioration</li>
  <li>You are worried</li>
</ul>
<p>You do not need a final diagnosis before calling. A useful escalation might be: “This patient has developed acute breathlessness over 30 minutes. They are tachypnoeic with a new oxygen requirement, have unilateral reduced air entry on the right and pleuritic chest pain. I am concerned about a pneumothorax and need you to review them now.”</p>

<h2>A practical Foundation doctor example</h2>
<p>You are called to a patient who has become suddenly breathless after several days of reduced mobility. They have pleuritic chest pain, tachycardia and a relatively unremarkable chest examination.</p>
<ul>
  <li>Start with ABCDE and assess physiological stability.</li>
  <li>Check oxygenation and give oxygen only if indicated to the correct target range.</li>
  <li>Take a focused history including recent surgery/immobility, previous VTE, cancer and haemoptysis.</li>
  <li>Obtain ECG and appropriate baseline investigations.</li>
  <li>Use the 2-level PE Wells pathway rather than ordering a D-dimer reflexively.</li>
  <li>If PE is clinically likely, escalate and follow the imaging/treatment pathway rather than waiting for an unnecessary D-dimer.</li>
  <li>Reassess continuously if the patient becomes hypotensive, more hypoxic or clinically unstable.</li>
</ul>

<h2>The Foundation doctor breathlessness rule</h2>
<p><strong>GO NOW → ABCDE → OXYGEN TARGET → FOCUSED HISTORY → CHEST + CIRCULATION EXAM → GAS IF NEEDED → TARGETED TESTS → DANGEROUS DIFFERENTIAL → TREAT → REASSESS → ESCALATE</strong></p>

<h2>The key message</h2>
<p>Breathlessness is not a diagnosis. Stabilise first, then use the timeline, examination and targeted investigations to separate airway disease, infection, fluid, clot, collapse and non-respiratory causes.</p>

<p><em>Educational note: This article is intended as an educational guide for Foundation doctors. For individual patients, follow current NICE/BNF guidance and your NHS organisation’s deteriorating-patient and emergency-care pathways, and seek senior advice when appropriate.</em></p>
`.trim()
}

function buildSeizureContent(imgs: { algorithm: string; post: string; escalate: string }) {
  const nhsSeizure = sourceLink(
    'https://www.nhs.uk/conditions/what-to-do-if-someone-has-a-seizure-fit/',
    'NHS: What to do if someone has a seizure'
  )
  const bnfStatus = sourceLink(
    'https://bnf.nice.org.uk/treatment-summaries/status-epilepticus/',
    'BNF: Status epilepticus'
  )
  const niceNg217 = sourceLink(
    'https://www.nice.org.uk/guidance/ng217',
    'NICE NG217: Treating status epilepticus'
  )

  return `
<p>A practical Foundation doctor guide to acute seizure management on the ward, including ABCDE, glucose, first-line benzodiazepines, escalation, post-seizure care and key investigations.</p>

<h2>Acute Seizure on the Ward: What Should You Do?</h2>
<p>You are bleeped to a ward because a patient is actively fitting. This is one of the situations where a structured response matters. Your priorities are to keep the patient safe, assess ABCDE, correct reversible causes, start appropriate treatment if the seizure does not stop promptly, and escalate early.</p>
<p><strong>The key timing point:</strong> Most seizures self-terminate within around 2 minutes. If the seizure is continuing, aim to start antiseizure treatment no later than 5 minutes from onset.</p>

<h2>1. Go to the bedside and call for help early</h2>
<p>Do not manage an ongoing seizure from the desk. Go immediately and establish:</p>
<ul>
  <li>How long has the seizure been going on?</li>
  <li>Is it still ongoing now?</li>
  <li>Is this a first seizure, or is there a known seizure disorder?</li>
  <li>Has the patient fully recovered between events, or are they having repeated seizures?</li>
  <li>What is the current airway, oxygenation and haemodynamic status?</li>
</ul>
<p>If there are any adverse features, escalate immediately: airway obstruction, hypoxia, hypotension or fever.</p>
<p><strong>Foundation doctor tip:</strong> Start management but always contact a senior. If the patient is acutely unwell or you are worried, call for help and get the crash trolley.</p>

<h2>2. Start with ABCDE and basic seizure first aid</h2>
<ul>
  <li><strong>A — Airway</strong> — Check that the airway is patent. If convulsing, do not put anything in the mouth. Once it is safe, position and suction as required.</li>
  <li><strong>B — Breathing</strong> — Give high-flow oxygen if needed (for example 15 L/min via a non-rebreather mask as part of immediate management). Check respiratory effort and saturations.</li>
  <li><strong>C — Circulation</strong> — Attach monitoring if available, obtain a full set of observations and secure IV access.</li>
  <li><strong>D — Disability</strong> — Check GCS when possible and check capillary blood glucose early. Ongoing fitting and recurrent seizures are themselves a neurological emergency.</li>
  <li><strong>E — Exposure</strong> — Look for clues such as fever, trauma, head injury, alcohol misuse or evidence of infection.</li>
</ul>
<p>Basic seizure first-aid principles still apply: protect the patient from injury; do not restrain them; do not put anything in their mouth; loosen tight clothing around the neck if relevant; place them in the recovery position once convulsions stop and if it is safe to do so. ${nhsSeizure}</p>

<h2>3. Check capillary glucose early</h2>
<p>A bedside glucose is one of the fastest reversible causes to identify. Check capillary glucose in all patients.</p>
<p>If BM is below 4.0 mmol/L, correct it promptly:</p>
<ul>
  <li>100 mL of 20% glucose IV over 15 minutes, or</li>
  <li>200 mL of 10% glucose IV over 15 minutes</li>
</ul>
<p>Correcting hypoglycaemia does not replace the need for ABCDE and escalation if the patient remains unwell.</p>

${figure(
  imgs.algorithm,
  'Step-by-step acute seizure management algorithm for Foundation doctors',
  'A stepwise seizure algorithm helps FY1 doctors act quickly and escalate appropriately.'
)}

<h2>4. If the seizure is still going at 5 minutes, give first-line medication</h2>
<p>A prolonged ongoing convulsive seizure should be treated as a medical emergency. Choose one of the following first-line options if the seizure has not self-terminated within 5 minutes:</p>
<table>
  <thead>
    <tr><th>Option</th><th>Dose / comment</th></tr>
  </thead>
  <tbody>
    <tr><td>Midazolam (buccal)</td><td>10 mg buccal</td></tr>
    <tr><td>Diazepam (per rectum)</td><td>10 mg PR</td></tr>
    <tr><td>Lorazepam (intravenous)</td><td>4 mg IV if access is available; preferred if IV access is present (e.g. 0.1 mg/kg up to a maximum of 4 mg).</td></tr>
  </tbody>
</table>
<p><strong>FY tip:</strong> Use the route that you can deliver quickly and safely. If you have reliable IV access, lorazepam is commonly preferred; if not, buccal midazolam or rectal diazepam may be faster to give.</p>
<p>BNF also supports lorazepam and midazolam as first-line options in status epilepticus. ${bnfStatus}</p>

<h2>5. If the seizure is still going at 10 minutes, escalate and repeat benzodiazepine treatment</h2>
<p>If the seizure is persisting beyond 10 minutes, call a senior and give lorazepam 4 mg IV (or repeat it as directed in the pathway if already given as step 1). At this point you should be thinking of established convulsive status epilepticus and making sure senior help is already on the way.</p>

<h2>6. If the seizure is still going at 15 minutes, this becomes senior-led management</h2>
<p>This stage is only to be initiated by a senior. If the seizure is persisting beyond 15 minutes, the next step is escalation to second-line antiseizure medication. ${niceNg217}</p>
<table>
  <thead>
    <tr><th>Second-line option</th><th>Dose</th></tr>
  </thead>
  <tbody>
    <tr><td>Phenytoin IV</td><td>20 mg/kg IV, maximum dose 2 g, rate 50 mg/min. Monitor BP and ECG.</td></tr>
    <tr><td>Levetiracetam IV</td><td>60 mg/kg IV, maximum dose 4.5 g, diluted in 100 mL sodium chloride 0.9%, given over 10 minutes.</td></tr>
    <tr><td>Valproate IV</td><td>40 mg/kg IV, maximum dose 3 g, diluted in 100 mL sodium chloride 0.9%, given over 5 minutes.</td></tr>
  </tbody>
</table>
<p><strong>Common FY trap:</strong> If a patient is still fitting beyond 15 minutes, this is not a routine ward review. Senior-led escalation and critical-care involvement should already be in motion.</p>

<h2>7. If the seizure persists, escalate to critical care</h2>
<p>Ongoing seizures after second-line treatment need escalation to critical care for airway support, continuous monitoring and advanced treatment in refractory status epilepticus.</p>

<h2>8. Adjunctive treatments: think about the cause</h2>
<ul>
  <li><strong>Suspected alcohol misuse:</strong> consider Pabrinex IV and assess with CIWA-Ar where relevant.</li>
  <li><strong>Suspected cerebral oedema</strong> (for example vasculitis or cerebral tumour): dexamethasone 10 mg IV after discussion with a senior and CT head evidence of cerebral oedema.</li>
</ul>
<p>Do not forget that seizure management is not only about stopping the fit. You also need to identify and start treating the underlying cause.</p>

<h2>9. Post-seizure management is just as important</h2>
${figure(
  imgs.post,
  'Post-seizure management checklist for a Foundation doctor',
  'Stopping the seizure is only the start; the next job is to work out why it happened and what needs monitoring next.'
)}
<p>Once the seizure has stopped, continue a structured review rather than simply leaving the bedside: repeat ABCDE; monitor observations and GCS; check whether the patient is waking as expected; look for tongue bite, head injury or other trauma; document timing, treatments and response.</p>
<table>
  <thead>
    <tr><th>Investigation / review</th><th>What to consider</th></tr>
  </thead>
  <tbody>
    <tr><td>ABG</td><td>pH, pO₂ and lactate.</td></tr>
    <tr><td>Bloods</td><td>FBC, U&amp;Es, magnesium, calcium, LFTs and CRP.</td></tr>
    <tr><td>Additional blood tests</td><td>Coagulation if potential intracranial bleeding; toxicology screen if relevant; anticonvulsant levels if the patient is already taking these; cultures if infection is suspected; repeat glucose if diabetic or hypoglycaemia is a concern.</td></tr>
    <tr><td>Other investigations</td><td>Consider lumbar puncture, CT head and EEG as clinically appropriate.</td></tr>
    <tr><td>Medication review</td><td>Review medicines that lower seizure threshold (for example quinolones). Check BNF for more detail.</td></tr>
    <tr><td>Seizure prophylaxis</td><td>Senior advice on ongoing prophylaxis may be needed (for example levetiracetam). Consider prescribing a step-1 PRN rescue medicine if recurrent seizures are a concern.</td></tr>
  </tbody>
</table>

<h2>10. A practical FY1 approach at the bedside</h2>
<ul>
  <li>Note the time or ask exactly when the seizure started.</li>
  <li>Call for help early and ask for the crash trolley if the patient looks unwell.</li>
  <li>Start ABCDE and basic seizure first aid.</li>
  <li>Check capillary glucose and correct hypoglycaemia if present.</li>
  <li>If the seizure continues beyond 5 minutes, give first-line treatment.</li>
  <li>If the seizure persists beyond 10 minutes, escalate and give the next step of treatment.</li>
  <li>If the seizure persists beyond 15 minutes, ensure senior-led second-line treatment and critical-care escalation.</li>
  <li>Once the seizure stops, investigate why it happened and document everything clearly.</li>
</ul>

<h2>11. When should the FY1 escalate immediately?</h2>
${figure(
  imgs.escalate,
  'Seizure red flags and escalation points for Foundation doctors',
  'Red flags help Foundation doctors recognise when an acute seizure is moving into status epilepticus and needs immediate escalation.'
)}
<ul>
  <li>This is a first seizure or there is no clear history available.</li>
  <li>The seizure is prolonged or recurrent.</li>
  <li>There is airway compromise, hypoxia or hypotension.</li>
  <li>The patient is febrile or you suspect CNS infection.</li>
  <li>The patient has head injury, trauma or possible intracranial bleeding.</li>
  <li>There is persistent reduced GCS after the seizure.</li>
  <li>You suspect status epilepticus.</li>
  <li>You are worried.</li>
</ul>

<h2>The Foundation doctor seizure rule</h2>
<p><strong>TIME THE SEIZURE → ABCDE → CALL FOR HELP → CHECK GLUCOSE → GIVE FIRST-LINE TREATMENT BY 5 MINUTES IF ONGOING → ESCALATE AT 10 MINUTES → SENIOR-LED SECOND-LINE TREATMENT AT 15 MINUTES → POST-SEIZURE REVIEW AND INVESTIGATE THE CAUSE</strong></p>

<h2>The key message</h2>
<p>In an acute seizure, time matters. Keep the patient safe, treat reversible causes, start appropriate medication promptly if the seizure continues, and escalate early rather than late.</p>

<p><em>Educational note: This article is intended as an educational guide for Foundation doctors. For individual patients, follow current NICE/BNF guidance and your NHS organisation’s status epilepticus and emergency-care pathways, and seek senior advice when appropriate.</em></p>
`.trim()
}

function buildTachycardiaContent(imgs: {
  stableUnstable: string
  qrsMap: string
  narrowPathway: string
}) {
  const nhsTachy = sourceLink(
    'https://www.resus.org.uk/library/additional-guidance/peri-arrest-arrhythmias/tachycardia',
    'NHS tachyarrhythmia algorithm'
  )
  const niceNg196 = sourceLink(
    'https://www.nice.org.uk/guidance/ng196',
    'NICE NG196: atrial fibrillation'
  )
  const bnfAdenosine = sourceLink('https://bnf.nice.org.uk/drugs/adenosine/', 'BNF: adenosine')

  return `
<p>A practical Foundation Year and FY1 guide to tachycardia on the ward, covering instability, reversible causes, ECG assessment, SVT, AF, broad-complex tachycardia and escalation.</p>

<h2>Tachycardia on the Ward</h2>
<p>A heart rate of 154 appears in red on the observations chart. Before deciding that the patient simply “has tachycardia”, there are two questions to answer: is the fast rate a physiological response to something else, or is this a primary tachyarrhythmia — and is the patient unstable because of it?</p>
<p>For Foundation Year doctors, particularly FY1s, the aim is to recognise instability, identify reversible causes, obtain and interpret the ECG systematically, and involve a senior before moving into rhythm-specific drug treatment or cardioversion.</p>
<p>That distinction changes everything. Sinus tachycardia from sepsis, pain, hypovolaemia or hypoxia is treated by correcting the cause. An unstable tachyarrhythmia may need urgent synchronised cardioversion. A stable arrhythmia can usually be approached by looking at QRS width and regularity on the ECG.</p>
<p><strong>The first decision:</strong> Do not treat the heart-rate number in isolation. Assess the patient first, then the rhythm.</p>

<h2>1. Start with the patient, not the ECG</h2>
${figure(
  imgs.stableUnstable,
  'Stable versus unstable tachycardia algorithm for Foundation Year doctors',
  'The first branch in tachycardia is haemodynamic stability, not the ECG diagnosis.'
)}
<p>Use ABCDE and obtain a full set of observations. While doing this, look specifically for adverse features that suggest the tachyarrhythmia is causing haemodynamic compromise:</p>
<ul>
  <li>Shock or marked hypotension</li>
  <li>Syncope associated with severe or ongoing hypotension</li>
  <li>Myocardial ischaemia</li>
  <li>Severe heart failure or pulmonary oedema</li>
</ul>
<p>Also obtain IV access, place the patient on cardiac monitoring, and record a 12-lead ECG as soon as practical. Give oxygen only when clinically indicated and to the appropriate target saturation range.</p>

<h2>2. Ask whether this could be sinus tachycardia</h2>
<p>Many fast heart rates are physiological responses rather than primary arrhythmias. Look for and treat common drivers such as:</p>
<ul>
  <li>Pain or anxiety</li>
  <li>Fever or sepsis</li>
  <li>Hypovolaemia or bleeding</li>
  <li>Hypoxia</li>
  <li>Anaemia</li>
  <li>Electrolyte abnormalities</li>
  <li>Pulmonary embolism</li>
  <li>Thyrotoxicosis or other metabolic causes</li>
  <li>Medication or stimulant effects</li>
</ul>
<p><strong>Foundation Year doctor tip:</strong> If the ECG shows sinus tachycardia, treat the cause. Do not try to “normalise” the rate with antiarrhythmic drugs or cardioversion.</p>

<h2>3. If unstable: synchronised cardioversion is the pathway</h2>
<p>If the tachyarrhythmia is causing life-threatening compromise, call for help, bring the crash trolley and prepare for synchronised DC cardioversion. Sedation or anaesthesia is usually required if the patient is conscious and time allows.</p>
<p><strong>Important:</strong> If adverse features are present, call for senior/resuscitation help immediately and prepare for synchronised cardioversion. Do not spend time trying to fully classify the rhythm before escalating.</p>
<p>If cardioversion is unsuccessful, antiarrhythmic treatment and repeat synchronised cardioversion become senior-led decisions. A current NHS tachyarrhythmia algorithm lists amiodarone 300 mg IV over 10–20 minutes as one option after unsuccessful shocks, followed by repeat cardioversion. ${nhsTachy}</p>

<h2>4. If stable: look at QRS width first</h2>
<p>Once you are satisfied there are no adverse features, the ECG pattern becomes the next decision point. The practical sequence is: QRS width → regularity → likely rhythm.</p>
${figure(
  imgs.qrsMap,
  'QRS width and regularity map for tachycardia',
  'QRS width and regularity rapidly narrow the tachycardia differential.'
)}
<table>
  <thead>
    <tr><th>ECG pattern</th><th>Think about</th><th>Foundation Year doctor action</th></tr>
  </thead>
  <tbody>
    <tr><td>Broad + regular</td><td>VT until proven otherwise; SVT with aberrancy is possible</td><td>Call senior early. A broad regular tachycardia should not be casually treated as SVT.</td></tr>
    <tr><td>Broad + irregular</td><td>AF with bundle branch block, pre-excited AF, polymorphic VT / torsades</td><td>Urgent senior review. If torsades is suspected, magnesium may be required under the emergency pathway.</td></tr>
    <tr><td>Narrow + irregular</td><td>Usually atrial fibrillation; atrial flutter with variable block is possible</td><td>Assess duration, rate, symptoms, comorbidity and anticoagulation status. Use the acute AF pathway.</td></tr>
    <tr><td>Narrow + regular</td><td>Re-entry SVT or atrial flutter with fixed conduction</td><td>If stable, try an appropriate vagal manoeuvre; if it persists, discuss adenosine with a senior.</td></tr>
  </tbody>
</table>

<h2>5. Broad-complex tachycardia: treat uncertainty seriously</h2>
<p>A broad-complex tachycardia can be ventricular tachycardia or a supraventricular rhythm conducted with bundle branch block. If you are not certain, involve a senior rather than assuming it is benign.</p>
<p>Broad regular tachycardia maps to VT/uncertain; broad irregular tachycardia maps to possibilities including AF with bundle branch block and polymorphic VT. This is a useful way to organise your differential, but treatment should be senior-led.</p>
<p><strong>Common FY trap:</strong> Do not give adenosine to an undifferentiated broad-complex irregular tachycardia. Pre-excited AF is one reason this can be dangerous.</p>

<h2>6. Narrow irregular tachycardia: think atrial fibrillation</h2>
<p>A narrow irregular tachycardia is commonly AF. Confirm the rhythm on a 12-lead ECG and assess whether the patient is stable, when the arrhythmia started, whether there is a reversible trigger and whether anticoagulation needs consideration.</p>
<p>For acute AF without life-threatening haemodynamic instability, NICE recommends either rate or rhythm control if onset is less than 48 hours; if onset is more than 48 hours or uncertain, rate control is generally used. For long-term rate control, a standard beta-blocker or rate-limiting calcium-channel blocker is usually first line, with digoxin reserved for selected circumstances. Acute decompensated heart failure needs senior specialist input before choosing rate-control drugs. ${niceNg196}</p>
<p><strong>Foundation Year doctor tip:</strong> Before prescribing rate control, check blood pressure, heart failure, renal function, current medicines and the likely duration of AF.</p>

<h2>7. Narrow regular tachycardia: vagal manoeuvres, then adenosine if appropriate</h2>
${figure(
  imgs.narrowPathway,
  'Stable narrow complex tachycardia pathway for Foundation Year doctors',
  'A regular narrow-complex tachycardia can be approached systematically with vagal manoeuvres, monitored adenosine when appropriate and reassessment.'
)}
<p>For a stable regular narrow-complex tachycardia, use vagal manoeuvres first. In practice, use a recognised manoeuvre such as a modified Valsalva rather than routine carotid sinus massage.</p>
<p>If the rhythm persists and adenosine is appropriate, it should be given with continuous ECG monitoring and rapid IV administration through a suitable large/proximal vein. BNF dosing starts with 6 mg, followed by 12 mg after 1–2 minutes if needed. Any further dosing should follow the current BNF and your emergency pathway. ${bnfAdenosine}</p>
<p><strong>Important precaution:</strong> Before adenosine, make sure the rhythm is regular and narrow-complex and that there is no concerning pre-excitation pattern or another reason the pathway does not fit. If uncertain, ask a senior first.</p>

<h2>8. If adenosine terminates the rhythm</h2>
<p>If the tachycardia terminates, obtain a 12-lead ECG in sinus rhythm. If episodes recur, consider antiarrhythmic prophylaxis under specialist guidance and cardiology referral for probable re-entry paroxysmal SVT.</p>

<h2>9. If adenosine does not terminate a narrow regular rhythm</h2>
<p>A rhythm that remains regular and narrow despite appropriate vagal manoeuvres and adenosine may be atrial flutter or another atrial tachycardia. Do not keep escalating adenosine indefinitely — escalate for senior review.</p>

<h2>10. Investigate the trigger while you manage the rhythm</h2>
<ul>
  <li>12-lead ECG and comparison with previous ECGs</li>
  <li>Full observations and continuous cardiac monitoring if clinically indicated</li>
  <li>FBC for anaemia or infection</li>
  <li>U&amp;Es, potassium and magnesium</li>
  <li>Renal function before drugs that depend on renal clearance</li>
  <li>Glucose</li>
  <li>CRP or infection-focused tests if clinically indicated</li>
  <li>Troponin when myocardial ischaemia is part of the clinical picture</li>
  <li>Thyroid testing when clinically appropriate rather than as an emergency reflex test</li>
</ul>

<h2>11. Reassess after every intervention</h2>
<p>Do not document only the new heart rate. Reassess blood pressure, symptoms, chest pain, breathlessness, conscious level and the rhythm itself. A slower heart rate does not automatically mean the patient is better if they remain hypotensive or develop heart failure.</p>

<h2>12. When should you escalate immediately?</h2>
<ul>
  <li>Shock or severe/ongoing hypotension</li>
  <li>Syncope with haemodynamic compromise</li>
  <li>Myocardial ischaemia</li>
  <li>Severe heart failure or pulmonary oedema</li>
  <li>Broad-complex tachycardia you cannot confidently classify</li>
  <li>Polymorphic VT or suspected torsades</li>
  <li>Possible pre-excited AF</li>
  <li>Failure of initial treatment</li>
  <li>Recurrent tachyarrhythmia with deterioration</li>
  <li>Any situation where you are unsure which antiarrhythmic drug is safe</li>
</ul>

<h2>A practical ward example</h2>
<p>The observations chart flags a heart rate of 158. The patient is alert, blood pressure is stable and there is no chest pain or pulmonary oedema. The ECG shows a regular narrow-complex tachycardia.</p>
<ul>
  <li>ABCDE first: there are no adverse features.</li>
  <li>Confirm the ECG is regular and narrow-complex.</li>
  <li>Look for reversible causes and obtain IV access/monitoring.</li>
  <li>Try an appropriate vagal manoeuvre.</li>
  <li>If it persists, discuss and prepare adenosine with continuous ECG monitoring.</li>
  <li>If the rhythm terminates, capture a 12-lead ECG and document the response.</li>
  <li>If it does not terminate or the patient deteriorates, escalate promptly.</li>
</ul>

<h2>The Foundation Year tachycardia rule</h2>
<p><strong>PATIENT FIRST → UNSTABLE OR STABLE? → 12-LEAD ECG → SINUS OR ARRHYTHMIA? → QRS WIDTH → REGULARITY → TREAT THE CORRECT PATHWAY → REASSESS → ESCALATE</strong></p>

<h2>The key message</h2>
<p>A fast heart rate is not a diagnosis. First decide whether the patient is unstable, then decide whether the tachycardia is a physiological response or a primary arrhythmia. Only then should you move into rhythm-specific treatment.</p>

<p><em>Educational note: This article is intended as an educational guide for Foundation Year doctors. For individual patients, follow current Resuscitation Council/NICE/BNF guidance and your NHS organisation’s peri-arrest arrhythmia pathways, and seek senior advice when appropriate.</em></p>
`.trim()
}

/* ─── DB helpers ─── */

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

async function upsertPage(
  topicId: string,
  slug: string,
  title: string,
  meta: string,
  content: string,
  featuredPath: string,
  displayOrder: number
) {
  const { data: existing } = await sb.from('fy_pages').select('id').eq('slug', slug).maybeSingle()

  const payload: Record<string, unknown> = {
    topic_id: topicId,
    title,
    content,
    featured_image: featuredPath,
    status: 'published' as const,
    is_active: true,
    requires_auth: false,
    updated_at: new Date().toISOString(),
    meta_description: meta,
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
    console.log(`Updated page ${slug} (${existing.id})`)
    return existing.id as string
  }

  const insertPayload = {
    slug,
    display_order: displayOrder,
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
  console.log(`Created page ${slug} (${data?.id})`)
  return data!.id as string
}

/* ─── Seed each guide ─── */

async function seedBreathlessness(topicId: string) {
  const TITLE = 'Breathlessness Assessment: FY Guide'
  const FEATURED_TITLE = 'BREATHLESSNESS'
  const SLUG = 'breathlessness-assessment-fy-guide'
  const META =
    'A practical Foundation doctor guide to assessing acute breathlessness on the ward, including ABCDE, focused history, blood gases, CXR, ECG, PE assessment and escalation.'
  const IMAGE_DIR = imageDirFor(SLUG)

  console.log(`\n=== ${TITLE} ===`)
  console.log('Composing featured Bleepy card...')
  const featuredWebp = await composeFeaturedLogoCard(FEATURED_TITLE, breathlessnessPropsSvg())
  const featuredPath = `${IMAGE_DIR}/featured-bleepy-logo.webp`
  await uploadBuffer(featuredPath, featuredWebp, 'image/webp')

  console.log('Generating teaching infographics...')
  const historyExam = await uploadPngFromSvg(IMAGE_DIR, breathHistoryExamSvg(), 'breathlessness-history-abcde-map')
  const investigations = await uploadPngFromSvg(
    IMAGE_DIR,
    breathInvestigationsSvg(),
    'breathlessness-investigations-map'
  )
  const pathway = await uploadPngFromSvg(IMAGE_DIR, breathPathwaySvg(), 'acute-breathlessness-differential')

  const content = buildBreathlessnessContent({ historyExam, investigations, pathway })
  await upsertPage(topicId, SLUG, TITLE, META, content, featuredPath, 56)
  console.log(`Public SEO URL: /guides/foundation-year/${TOPIC_SLUG}/${SLUG}`)
}

async function seedSeizure(topicId: string) {
  const TITLE = 'Acute Seizure Management: FY Guide'
  const FEATURED_TITLE = 'ACUTE SEIZURE'
  const SLUG = 'acute-seizure-management-fy-guide'
  const META =
    'A practical Foundation doctor guide to acute seizure management on the ward, including ABCDE, glucose, first-line benzodiazepines, escalation, post-seizure care and key investigations.'
  const IMAGE_DIR = imageDirFor(SLUG)

  console.log(`\n=== ${TITLE} ===`)
  console.log('Composing featured Bleepy card...')
  const featuredWebp = await composeFeaturedLogoCard(FEATURED_TITLE, seizurePropsSvg())
  const featuredPath = `${IMAGE_DIR}/featured-bleepy-logo.webp`
  await uploadBuffer(featuredPath, featuredWebp, 'image/webp')

  console.log('Generating teaching infographics...')
  const algorithm = await uploadPngFromSvg(IMAGE_DIR, seizureAlgorithmSvg(), 'acute-seizure-management-algorithm')
  const post = await uploadPngFromSvg(IMAGE_DIR, seizurePostSvg(), 'post-seizure-management-checklist')
  const escalate = await uploadPngFromSvg(IMAGE_DIR, seizureEscalateSvg(), 'seizure-red-flags-escalation')

  const content = buildSeizureContent({ algorithm, post, escalate })
  await upsertPage(topicId, SLUG, TITLE, META, content, featuredPath, 57)
  console.log(`Public SEO URL: /guides/foundation-year/${TOPIC_SLUG}/${SLUG}`)
}

async function seedTachycardia(topicId: string) {
  const TITLE = 'Tachycardia on the Ward: FY Guide'
  const FEATURED_TITLE = 'TACHYCARDIA'
  const SLUG = 'tachycardia-on-the-ward-fy-guide'
  const META =
    'A practical Foundation Year and FY1 guide to tachycardia on the ward, covering instability, reversible causes, ECG assessment, SVT, AF, broad-complex tachycardia and escalation.'
  const IMAGE_DIR = imageDirFor(SLUG)

  console.log(`\n=== ${TITLE} ===`)
  console.log('Composing featured Bleepy card...')
  const featuredWebp = await composeFeaturedLogoCard(FEATURED_TITLE, tachycardiaPropsSvg())
  const featuredPath = `${IMAGE_DIR}/featured-bleepy-logo.webp`
  await uploadBuffer(featuredPath, featuredWebp, 'image/webp')

  console.log('Generating teaching infographics...')
  const stableUnstable = await uploadPngFromSvg(IMAGE_DIR, tachyStableUnstableSvg(), 'stable-vs-unstable-tachycardia')
  const qrsMap = await uploadPngFromSvg(IMAGE_DIR, tachyQrsMapSvg(), 'tachycardia-qrs-width-regularity')
  const narrowPathway = await uploadPngFromSvg(
    IMAGE_DIR,
    tachyNarrowPathwaySvg(),
    'narrow-complex-tachycardia-pathway'
  )

  const content = buildTachycardiaContent({ stableUnstable, qrsMap, narrowPathway })
  await upsertPage(topicId, SLUG, TITLE, META, content, featuredPath, 58)
  console.log(`Public SEO URL: /guides/foundation-year/${TOPIC_SLUG}/${SLUG}`)
}

async function main() {
  const topicId = await ensureTopic()
  await seedBreathlessness(topicId)
  await seedSeizure(topicId)
  await seedTachycardia(topicId)
  console.log('\nDone — all three acute ward FY guides seeded.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
