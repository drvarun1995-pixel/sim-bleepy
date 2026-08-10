/**
 * Seed members-only FY1 guide:
 * "Anticoagulation for Foundation Doctors: The Ward Basics You Need"
 *
 * Public general + fy1 placements. Topic: clerking-shifts.
 * Featured: unique Bleepy logo card. Inline: teaching infographics.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-fy1-anticoagulation-ward-basics.ts
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

const TITLE = 'Anticoagulation for Foundation Doctors: The Ward Basics You Need'
const FEATURED_TITLE = 'ANTICOAGULATION WARD BASICS'
const SLUG = 'fy1-anticoagulation-ward-basics'
const TOPIC_SLUG = 'clerking-shifts'
const IMAGE_DIR = `foundation-year/general/${TOPIC_SLUG}/${SLUG}/images`
const COHORTS = ['general', 'fy1'] as const
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

function wrapTitle(title: string, maxChars = 26): string[] {
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

function anticoagPropsSvg(): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(210,240)">
    <rect x="0" y="20" width="170" height="210" rx="12" fill="#FFF7ED" stroke="#9A3412" stroke-width="6"/>
    <rect x="45" y="0" width="80" height="28" rx="8" fill="#F97316"/>
    <text x="85" y="72" text-anchor="middle" font-family="Arial" font-size="15" font-weight="800" fill="#9A3412">DRUG CHART</text>
    <rect x="24" y="95" width="122" height="10" rx="4" fill="#FDBA74"/>
    <rect x="24" y="118" width="98" height="10" rx="4" fill="#FED7AA"/>
    <text x="85" y="160" text-anchor="middle" font-family="Arial" font-size="18" font-weight="900" fill="#DC2626">LMWH?</text>
    <text x="85" y="188" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#B45309">DOAC?</text>
  </g>
  <g transform="translate(870,260)">
    <circle cx="70" cy="70" r="68" fill="#FEE2E2" stroke="#B91C1C" stroke-width="6"/>
    <path d="M40 70 h60" stroke="#B91C1C" stroke-width="10" stroke-linecap="round"/>
    <path d="M70 40 v60" stroke="#B91C1C" stroke-width="10" stroke-linecap="round" transform="rotate(45 70 70)"/>
    <text x="70" y="175" text-anchor="middle" font-family="Arial" font-size="16" font-weight="800" fill="#7F1D1D">BLEED RISK</text>
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
  const banners = await sharp(bannerSvg(lines, 'CLINICAL SKILLS', 'CLERKING SHIFTS')).png().toBuffer()
  const props = await sharp(anticoagPropsSvg()).png().toBuffer()

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

function prophylacticVsTherapeuticSvg(): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="70" text-anchor="middle" font-family="Arial Black, Arial" font-size="34" font-weight="900" fill="#1E3A5F">PROPHYLACTIC vs THERAPEUTIC</text>
  <text x="640" y="110" text-anchor="middle" font-family="Arial" font-size="20" font-weight="600" fill="#64748B">Same family of medicines — different intensity and purpose</text>

  <rect x="70" y="160" width="520" height="620" rx="24" fill="#ECFDF5" stroke="#059669" stroke-width="4"/>
  <text x="330" y="220" text-anchor="middle" font-family="Arial Black, Arial" font-size="28" fill="#065F46">PROPHYLAXIS</text>
  <circle cx="330" cy="340" r="70" fill="#A7F3D0" stroke="#047857" stroke-width="5"/>
  <path d="M300 340 l20 20 l40 -45" stroke="#047857" stroke-width="8" fill="none" stroke-linecap="round"/>
  <text x="330" y="460" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#064E3B">Prevent a clot</text>
  <text x="330" y="500" text-anchor="middle" font-family="Arial" font-size="18" fill="#065F46">Hospital VTE risk</text>
  <text x="330" y="540" text-anchor="middle" font-family="Arial" font-size="18" fill="#065F46">At-risk inpatients</text>
  <text x="330" y="600" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700" fill="#047857">Lower intensity</text>

  <rect x="690" y="160" width="520" height="620" rx="24" fill="#FEF2F2" stroke="#DC2626" stroke-width="4"/>
  <text x="950" y="220" text-anchor="middle" font-family="Arial Black, Arial" font-size="28" fill="#991B1B">THERAPEUTIC</text>
  <circle cx="950" cy="340" r="70" fill="#FECACA" stroke="#B91C1C" stroke-width="5"/>
  <ellipse cx="950" cy="340" rx="34" ry="22" fill="#B91C1C"/>
  <text x="950" y="460" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#7F1D1D">Treat / prevent embolism</text>
  <text x="950" y="500" text-anchor="middle" font-family="Arial" font-size="18" fill="#991B1B">DVT / PE treatment</text>
  <text x="950" y="540" text-anchor="middle" font-family="Arial" font-size="18" fill="#991B1B">AF stroke prevention</text>
  <text x="950" y="600" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700" fill="#B91C1C">Higher intensity</text>

  <text x="640" y="840" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#F25006">Mixing prophylactic and treatment doses is a major prescribing error</text>
</svg>`)
}

function safetyChecklistSvg(): Buffer {
  const items = [
    ['1', 'INDICATION', 'Why anticoagulated?'],
    ['2', 'INTENSITY', 'Prophylactic or therapeutic?'],
    ['3', 'DRUG & DOSE', 'Correct for this indication?'],
    ['4', 'KIDNEYS', 'Renal function change dose?'],
    ['5', 'WEIGHT', 'Extremes / weight-based?'],
    ['6', 'BLOODS', 'Hb, platelets, bleeding?'],
    ['7', 'PROCEDURE', 'Op / LP planned?'],
    ['8', 'PLAN', 'Monitor / hand over'],
  ]
  const cards = items
    .map(([n, title, sub], i) => {
      const col = i % 4
      const row = Math.floor(i / 4)
      const x = 60 + col * 300
      const y = 160 + row * 300
      return `
      <rect x="${x}" y="${y}" width="270" height="250" rx="20" fill="#F8FAFC" stroke="#1E3A5F" stroke-width="3"/>
      <circle cx="${x + 40}" cy="${y + 45}" r="22" fill="#F25006"/>
      <text x="${x + 40}" y="${y + 53}" text-anchor="middle" font-family="Arial Black" font-size="20" fill="#fff">${n}</text>
      <text x="${x + 135}" y="${y + 120}" text-anchor="middle" font-family="Arial Black" font-size="20" fill="#1E3A5F">${escapeXml(title)}</text>
      <text x="${x + 135}" y="${y + 160}" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748B">${escapeXml(sub)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="70" text-anchor="middle" font-family="Arial Black, Arial" font-size="32" fill="#1E3A5F">BEFORE YOU PRESCRIBE AN ANTICOAGULANT</text>
  <text x="640" y="110" text-anchor="middle" font-family="Arial" font-size="18" fill="#64748B">A safe prescription starts with the indication and ends with a plan</text>
  ${cards}
  <rect x="160" y="780" width="960" height="70" rx="16" fill="#EBA400"/>
  <text x="640" y="825" text-anchor="middle" font-family="Arial Black" font-size="22" fill="#fff">Know indication, intensity, kidneys, bleeding risk, and what happens next</text>
</svg>`)
}

function drugClassesSvg(): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="70" text-anchor="middle" font-family="Arial Black, Arial" font-size="30" fill="#1E3A5F">LMWH · DOACs · WARFARIN AT A GLANCE</text>
  <text x="640" y="110" text-anchor="middle" font-family="Arial" font-size="18" fill="#64748B">Practical prescribing checks differ by drug class</text>

  <rect x="50" y="150" width="370" height="580" rx="22" fill="#EFF6FF" stroke="#2563EB" stroke-width="4"/>
  <text x="235" y="210" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#1D4ED8">LMWH</text>
  <text x="235" y="280" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#1E3A5F">Subcutaneous injection</text>
  <text x="235" y="340" text-anchor="middle" font-family="Arial" font-size="17" fill="#334155">Prophylactic ≠ treatment dose</text>
  <text x="235" y="390" text-anchor="middle" font-family="Arial" font-size="17" fill="#334155">Check renal function</text>
  <text x="235" y="440" text-anchor="middle" font-family="Arial" font-size="17" fill="#334155">Check weight</text>
  <text x="235" y="490" text-anchor="middle" font-family="Arial" font-size="17" fill="#334155">Watch platelets / HIT risk</text>
  <text x="235" y="560" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#2563EB">Do not double anticoagulate</text>

  <rect x="455" y="150" width="370" height="580" rx="22" fill="#F5F3FF" stroke="#7C3AED" stroke-width="4"/>
  <text x="640" y="210" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#6D28D9">DOACs</text>
  <text x="640" y="280" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#1E3A5F">Oral tablets</text>
  <text x="640" y="340" text-anchor="middle" font-family="Arial" font-size="17" fill="#334155">Indication-specific dosing</text>
  <text x="640" y="390" text-anchor="middle" font-family="Arial" font-size="17" fill="#334155">Renal / weight / age checks</text>
  <text x="640" y="440" text-anchor="middle" font-family="Arial" font-size="17" fill="#334155">Bleeding &amp; interactions</text>
  <text x="640" y="490" text-anchor="middle" font-family="Arial" font-size="17" fill="#334155">INR is not the monitor</text>
  <text x="640" y="560" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#7C3AED">AF dose ≠ VTE dose</text>

  <rect x="860" y="150" width="370" height="580" rx="22" fill="#FFF7ED" stroke="#EA580C" stroke-width="4"/>
  <text x="1045" y="210" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#C2410C">WARFARIN</text>
  <text x="1045" y="280" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#1E3A5F">INR-guided dosing</text>
  <text x="1045" y="340" text-anchor="middle" font-family="Arial" font-size="17" fill="#334155">Know the target INR</text>
  <text x="1045" y="390" text-anchor="middle" font-family="Arial" font-size="17" fill="#334155">Latest INR + trend</text>
  <text x="1045" y="440" text-anchor="middle" font-family="Arial" font-size="17" fill="#334155">Interactions / illness</text>
  <text x="1045" y="490" text-anchor="middle" font-family="Arial" font-size="17" fill="#334155">Documented dosing plan</text>
  <text x="1045" y="560" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#EA580C">Do not guess the dose</text>

  <rect x="80" y="770" width="1120" height="80" rx="16" fill="#FEE2E2" stroke="#DC2626" stroke-width="3"/>
  <text x="640" y="820" text-anchor="middle" font-family="Arial" font-size="18" font-weight="800" fill="#991B1B">Mechanical heart valves need a specific plan — do not casually switch to a DOAC</text>
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

function buildContent(imgs: { compare: string; checklist: string; classes: string }) {
  return `
<p>A practical FY1 guide to anticoagulation on the ward — VTE prophylaxis, LMWH, DOACs, warfarin, renal function, bleeding risk and common prescribing pitfalls.</p>

<p>Anticoagulation is one of those areas that can feel more complicated than it needs to be during FY1. One patient is on prophylactic low-molecular-weight heparin, another is taking apixaban for atrial fibrillation, a third is receiving treatment-dose anticoagulation for a pulmonary embolism, and someone else has a mechanical heart valve and a warfarin chart.</p>
<p>The safest way to approach anticoagulation on the ward is not to memorise every regimen. Start by asking a few basic questions: Why is this patient anticoagulated? Is the dose prophylactic or therapeutic? What is their renal function and weight? Are they bleeding? And is there a reason today's dose should be changed, withheld or escalated?</p>

<div class="fy-callout fy-callout-tip">
<p><strong>The key distinction</strong></p>
<p>VTE prophylaxis prevents a clot in an at-risk hospital patient. Therapeutic anticoagulation treats an existing clot or prevents systemic embolism in conditions such as atrial fibrillation. Mixing up prophylactic and treatment doses is a major prescribing error.</p>
</div>

${figure(
  imgs.compare,
  'Infographic comparing prophylactic and therapeutic anticoagulation for FY1 doctors',
  'The first anticoagulation question is whether the patient needs prophylaxis or therapeutic treatment.'
)}

<h2>1. First work out why the patient is anticoagulated</h2>
<p>Common ward indications include:</p>
<ul>
  <li>VTE prophylaxis during a hospital admission</li>
  <li>Treatment of a confirmed deep vein thrombosis (DVT) or pulmonary embolism (PE)</li>
  <li>Stroke prevention in atrial fibrillation</li>
  <li>Mechanical prosthetic heart valves, usually with a vitamin K antagonist such as warfarin</li>
  <li>Other specialist indications where the anticoagulation plan may be highly individualised</li>
</ul>
<p>Do not assume that every anticoagulant on a drug chart is being used for the same reason. The indication determines the drug, dose, duration and monitoring.</p>
<p><strong>FY1 tip:</strong> If you cannot tell why the patient is anticoagulated from the drug chart, find out before altering the prescription. The answer may be in the admission clerking, discharge letters, anticoagulation record or latest senior plan.</p>

<h2>2. VTE prophylaxis: the common everyday job</h2>
<p>Hospital admission increases VTE risk, so patients should have both VTE risk and bleeding risk assessed promptly after admission. Where pharmacological prophylaxis is indicated, it should normally be started as soon as possible and within 14 hours of admission.</p>
<p>Before prescribing prophylaxis, check:</p>
<ul>
  <li>Has a VTE and bleeding risk assessment actually been completed?</li>
  <li>Is the patient already receiving therapeutic anticoagulation?</li>
  <li>Is there active bleeding or another important bleeding risk?</li>
  <li>What is the platelet count?</li>
  <li>What is the renal function?</li>
  <li>What is the patient's weight, particularly if they are at an extreme of body weight?</li>
  <li>Is there a history of heparin-induced thrombocytopenia (HIT)?</li>
  <li>Is a procedure planned that changes the anticoagulation plan?</li>
</ul>
<p>Low-molecular-weight heparin (LMWH) is commonly used for pharmacological prophylaxis. In renal impairment, the choice and dose may need adjustment; NICE allows either LMWH or unfractionated heparin in this setting. Follow your local prescribing protocol for the actual preparation and dose.</p>
<p><strong>Common FY1 trap:</strong> Do not add prophylactic LMWH automatically to a patient who is already therapeutically anticoagulated. Check what they are already receiving and why.</p>

<h2>3. LMWH: prophylactic dose is not treatment dose</h2>
<p>LMWH appears everywhere in hospital medicine, but the dose depends on what you are trying to achieve. A prophylactic dose is intended to reduce hospital-acquired VTE risk. A treatment dose is used for established or strongly suspected thromboembolism and is usually weight-based.</p>
<p>Before prescribing treatment-dose LMWH, make sure the patient's weight and renal function are known. Also review the haemoglobin and platelet count and ask whether there is active or recent bleeding.</p>
<p>Heparins can cause bleeding and, more rarely, HIT. A falling platelet count in a patient exposed to heparin should not be ignored. If HIT is suspected, stop and seek senior or haematology advice rather than simply switching between different heparin products.</p>

<h2>4. DOACs: simple to prescribe, easy to prescribe wrongly</h2>
<p>Direct-acting oral anticoagulants (DOACs) include apixaban, rivaroxaban, edoxaban and dabigatran. They do not use INR monitoring in the way warfarin does, but that does not mean they require no thought or monitoring.</p>
<p>Before prescribing or continuing a DOAC, check:</p>
<ul>
  <li>The indication</li>
  <li>The exact drug and dose</li>
  <li>Renal function</li>
  <li>Weight and age where these affect dosing</li>
  <li>Relevant liver function</li>
  <li>Other medicines that may increase bleeding or interact</li>
  <li>Whether the patient has active bleeding, significant anaemia or a recent bleeding event</li>
  <li>When the last dose was taken, especially if a procedure is planned</li>
</ul>
<p>A particularly important FY1 point is that DOAC dosing can change with the indication and stage of treatment. For example, a regimen used for acute VTE may not be the same as the regimen used for atrial fibrillation. Do not copy a dose from another patient or assume that “apixaban is apixaban”. Check the current BNF and the documented plan.</p>
<p>For confirmed proximal DVT or PE, NICE recommends anticoagulation for at least 3 months and lists apixaban or rivaroxaban as first options for many patients, with alternatives depending on clinical circumstances.</p>
<p><strong>FY1 tip:</strong> An INR does not tell you whether a DOAC is at a therapeutic level. A “normal INR” is not a reason to give an extra DOAC dose.</p>

${figure(
  imgs.classes,
  'Comparison of LMWH, DOACs and warfarin for Foundation doctors',
  'LMWH, DOACs and warfarin all anticoagulate, but the practical prescribing checks are different.'
)}

<h2>5. Warfarin: think INR, indication and plan</h2>
<p>Warfarin has a narrow therapeutic range and its effect is monitored using the INR. The target INR depends on the indication, so never assume every patient has the same target.</p>
<p>Before prescribing a warfarin dose, check:</p>
<ul>
  <li>Why the patient takes warfarin</li>
  <li>Their target INR</li>
  <li>The latest INR and recent trend</li>
  <li>The most recent dosing plan or anticoagulation chart</li>
  <li>Whether new medicines, acute illness or dietary changes may have altered control</li>
  <li>Whether there is bleeding or an upcoming procedure</li>
</ul>
<p>Do not guess a warfarin dose because the patient “usually takes 3 mg”. If the INR is unexpectedly high or low, work out why and follow the appropriate anticoagulation plan. Major bleeding or a markedly excessive INR needs urgent senior assessment and a reversal strategy rather than routine ward-level dose adjustment.</p>
<p>Mechanical heart valves are a particularly important exception to the modern move towards DOACs. DOACs should not be used as a substitute for the established anticoagulation plan in a patient with a mechanical valve.</p>

<h2>6. Atrial fibrillation: anticoagulation is about stroke prevention</h2>
<p>For atrial fibrillation, the question is whether the patient's stroke risk justifies anticoagulation. NICE uses the CHA₂DS₂-VASc score to assess stroke risk and the ORBIT score to assess bleeding risk.</p>
<p>NICE recommends offering anticoagulation to people with atrial fibrillation and a CHA₂DS₂-VASc score of 2 or more, and considering anticoagulation for men with a score of 1, after discussing risks and benefits. A DOAC is generally preferred when appropriate.</p>
<p>As an FY1, you will often be continuing an established plan rather than making the long-term decision alone. New AF, recent stroke, active bleeding, severe renal impairment or uncertainty about valve disease are good reasons to involve a senior before starting or changing anticoagulation.</p>

<h2>7. The “before I sign” anticoagulation check</h2>
${figure(
  imgs.checklist,
  'Safety checklist before prescribing anticoagulation on the ward',
  'A safe anticoagulant prescription starts with the indication and ends with a plan for monitoring or follow-up.'
)}
<p>A useful mental checklist is:</p>
<ul>
  <li><strong>INDICATION</strong> — Why are they anticoagulated?</li>
  <li><strong>INTENSITY</strong> — Prophylactic or therapeutic?</li>
  <li><strong>DRUG</strong> — LMWH, DOAC, warfarin or something else?</li>
  <li><strong>DOSE</strong> — Is it correct for this indication?</li>
  <li><strong>KIDNEYS</strong> — Does renal impairment change the choice or dose?</li>
  <li><strong>WEIGHT</strong> — Is the patient very small, very large or receiving weight-based therapy?</li>
  <li><strong>BLOOD</strong> — Haemoglobin and platelet count; any evidence of bleeding?</li>
  <li><strong>PROCEDURE</strong> — Is an operation, lumbar puncture or other invasive procedure planned?</li>
  <li><strong>LAST DOSE</strong> — When was the anticoagulant last given?</li>
  <li><strong>PLAN</strong> — What needs monitoring or handing over?</li>
</ul>
<p><strong>One-line rule:</strong> Before prescribing an anticoagulant, know the indication, intensity, renal function, bleeding risk and what happens next.</p>

<h2>8. The anticoagulated patient who starts bleeding</h2>
<p>If a patient taking an anticoagulant develops significant bleeding, do not simply delete the next dose and move on. Assess the patient, identify the likely source and severity, check observations and obtain appropriate blood tests. Establish exactly which anticoagulant they are taking and when the last dose was given.</p>
<p>Significant bleeding, haemodynamic instability, suspected intracranial bleeding or a major fall/head injury in an anticoagulated patient should trigger urgent senior assessment. Reversal depends on the anticoagulant and clinical circumstances, so use the current BNF and the appropriate local emergency pathway rather than trying to improvise.</p>
<p><strong>FY1 tip:</strong> With anticoagulant-associated bleeding, “Which drug? What dose? When was the last dose? Why are they anticoagulated?” are four questions worth answering early.</p>

<h2>9. Procedures: do not stop anticoagulation casually</h2>
<p>You may be asked to withhold anticoagulation because a patient is having a procedure. The correct interruption depends on the drug, renal function, bleeding risk of the procedure and the patient's thrombotic risk.</p>
<p>Do not make up a stop/restart interval from memory. Check the documented procedural plan, current BNF and local policy, and ask the relevant senior team if the plan is unclear. This is particularly important for mechanical valves, recent VTE and patients receiving therapeutic anticoagulation.</p>

<h2>10. A practical FY1 example</h2>
<p>You are asked to prescribe “the usual enoxaparin” for a patient admitted overnight. Before clicking prescribe, you notice apixaban on their regular medication list.</p>
<p>Your thought process should be:</p>
<ul>
  <li>Why are they on apixaban? Atrial fibrillation.</li>
  <li>Was it intentionally withheld on admission? No clear documentation.</li>
  <li>Are they bleeding? No.</li>
  <li>Is a procedure planned? No.</li>
  <li>What is the renal function? Stable.</li>
  <li>Do they need additional prophylactic LMWH? Do not assume so.</li>
</ul>
<p>Instead of automatically prescribing LMWH, clarify whether the apixaban should be continued. This avoids accidental double anticoagulation and turns a routine prescribing job into a safe clinical decision.</p>

<h2>The FY1 anticoagulation rule</h2>
<p><strong>INDICATION → PROPHYLACTIC OR THERAPEUTIC → DRUG → DOSE → KIDNEYS → WEIGHT → BLEEDING → PROCEDURE → MONITOR / HAND OVER</strong></p>
<p>Anticoagulation becomes much easier when you stop thinking of it as one topic. Your job on the ward is usually to recognise what the anticoagulant is for, make sure the prescription matches the indication and patient, identify bleeding or renal-function problems, and escalate when the situation is outside routine prescribing.</p>
<p>If the indication is unclear, the dose looks unusual, renal function is changing, the patient is bleeding, a procedure is planned, or you are considering reversal or interruption of therapeutic anticoagulation, involve a senior early.</p>

<p><em>Educational note: This article is intended for Foundation doctors as an educational guide. For exact anticoagulant doses, dose adjustments, contraindications, reversal and peri-procedural timing, use the current BNF, NICE guidance and your local anticoagulation policy.</em></p>
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
    display_order: 56,
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
  const compare = await uploadPngFromSvg(
    prophylacticVsTherapeuticSvg(),
    'prophylactic-vs-therapeutic-anticoagulation'
  )
  const checklist = await uploadPngFromSvg(
    safetyChecklistSvg(),
    'fy1-anticoagulation-safety-checklist'
  )
  const classes = await uploadPngFromSvg(drugClassesSvg(), 'lmwh-doac-warfarin-comparison')

  const content = buildContent({ compare, checklist, classes })

  for (const cohort of COHORTS) {
    console.log(`\n=== cohort ${cohort}`)
    const { data: topic, error } = await sb
      .from('fy_topics')
      .select('id, name')
      .eq('cohort', cohort)
      .eq('slug', TOPIC_SLUG)
      .maybeSingle()

    if (error || !topic) {
      throw new Error(`topic ${TOPIC_SLUG} missing for ${cohort}: ${error?.message || 'not found'}`)
    }

    await upsertPage(topic.id, content, featuredPath)
    console.log(`  placements: /placements/foundation-year/${cohort}/${TOPIC_SLUG}/${SLUG}`)
  }
  console.log(`\nPublic SEO URL: /guides/foundation-year/${TOPIC_SLUG}/${SLUG}`)
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
