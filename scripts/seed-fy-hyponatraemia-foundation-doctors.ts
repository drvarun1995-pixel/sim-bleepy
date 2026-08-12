/**
 * Seed public FY guide:
 * "Hyponatraemia for Foundation Doctors: A Practical Guide"
 *
 * Cohort: general · Topic: core-investigations
 * Featured: Bleepy logo card. Inline: 4 teaching algorithms.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-fy-hyponatraemia-foundation-doctors.ts
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

const TITLE = 'Hyponatraemia for Foundation Doctors: A Practical Guide'
const FEATURED_TITLE = 'HYPONATRAEMIA'
const SLUG = 'hyponatraemia-foundation-doctors'
const TOPIC_SLUG = 'core-investigations'
const COHORT = 'general'
const IMAGE_DIR = `foundation-year/${COHORT}/${TOPIC_SLUG}/${SLUG}/images`
const LOGO = path.resolve('public/Bleepy-Logo-128.webp')
const META =
  'A practical guide to severe hyponatraemia for Foundation doctors, including paired tests, causes, treatment, safe correction, overcorrection and ODS.'

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

function wrapTitle(title: string, maxChars = 16): string[] {
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

function sodiumPropsSvg(): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(170,230)">
    <rect x="10" y="40" width="230" height="170" rx="18" fill="#ECFDF5" stroke="#059669" stroke-width="6"/>
    <rect x="45" y="18" width="160" height="36" rx="10" fill="#059669"/>
    <text x="125" y="42" text-anchor="middle" font-family="Arial" font-size="16" font-weight="800" fill="#fff">Na⁺</text>
    <text x="125" y="120" text-anchor="middle" font-family="Arial Black" font-size="42" fill="#B91C1C">119</text>
    <text x="125" y="165" text-anchor="middle" font-family="Arial" font-size="15" font-weight="700" fill="#065F46">mmol/L</text>
  </g>
  <g transform="translate(900,250)">
    <ellipse cx="80" cy="60" rx="58" ry="42" fill="#D1FAE5" stroke="#059669" stroke-width="5"/>
    <path d="M55 55 h50 M80 30 v60" stroke="#047857" stroke-width="8" stroke-linecap="round"/>
    <text x="80" y="145" text-anchor="middle" font-family="Arial" font-size="15" font-weight="800" fill="#065F46">ASSESS FIRST</text>
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
    bannerSvg(lines, 'ELECTROLYTES', 'FOUNDATION YEAR')
  )
    .png()
    .toBuffer()
  const props = await sharp(sodiumPropsSvg()).png().toBuffer()

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

function firstDecisionSvg(): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="55" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#1E3A5F">SODIUM 119 — FIRST DECISION</text>
  <text x="640" y="95" text-anchor="middle" font-family="Arial" font-size="17" fill="#64748B">The number matters, but treatment is driven by symptoms and acuity</text>

  <rect x="390" y="130" width="500" height="70" rx="16" fill="#059669"/>
  <text x="640" y="175" text-anchor="middle" font-family="Arial Black" font-size="26" fill="#fff">SODIUM 119 mmol/L</text>

  <rect x="280" y="230" width="720" height="70" rx="14" fill="#ECFDF5" stroke="#059669" stroke-width="3"/>
  <text x="640" y="275" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#065F46">SEE PATIENT → ABCDE → GLUCOSE → SODIUM TREND</text>

  <rect x="320" y="340" width="640" height="70" rx="14" fill="#FEF3C7" stroke="#D97706" stroke-width="3"/>
  <text x="640" y="385" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#92400E">SEVERE NEUROLOGICAL / CARDIORESPIRATORY SYMPTOMS?</text>

  <rect x="60" y="460" width="540" height="380" rx="18" fill="#FEF2F2" stroke="#DC2626" stroke-width="4"/>
  <text x="330" y="510" text-anchor="middle" font-family="Arial Black" font-size="24" fill="#B91C1C">YES — EMERGENCY</text>
  <text x="330" y="560" text-anchor="middle" font-family="Arial" font-size="16" fill="#7F1D1D">Seizure / coma / reduced GCS</text>
  <text x="330" y="595" text-anchor="middle" font-family="Arial" font-size="16" fill="#7F1D1D">Encephalopathy / severe vomiting</text>
  <text x="330" y="650" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700" fill="#1E3A5F">Senior + critical care</text>
  <text x="330" y="690" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700" fill="#1E3A5F">Hypertonic saline per local protocol</text>
  <text x="330" y="730" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700" fill="#1E3A5F">Controlled initial rise → reassess</text>
  <text x="330" y="790" text-anchor="middle" font-family="Arial Black" font-size="16" fill="#DC2626">Goal = symptoms, not Na 135</text>

  <rect x="680" y="460" width="540" height="380" rx="18" fill="#EFF6FF" stroke="#2563EB" stroke-width="4"/>
  <text x="950" y="510" text-anchor="middle" font-family="Arial Black" font-size="24" fill="#1D4ED8">NO — INVESTIGATE</text>
  <text x="950" y="560" text-anchor="middle" font-family="Arial" font-size="16" fill="#1E3A8A">Confirm true hyponatraemia</text>
  <text x="950" y="600" text-anchor="middle" font-family="Arial" font-size="16" fill="#1E3A8A">Chronicity → serum osmolality</text>
  <text x="950" y="640" text-anchor="middle" font-family="Arial" font-size="16" fill="#1E3A8A">Volume status → urine osm / Na</text>
  <text x="950" y="680" text-anchor="middle" font-family="Arial" font-size="16" fill="#1E3A8A">Treat cause → monitor sodium</text>
  <text x="950" y="740" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700" fill="#1E3A5F">Do not rapidly normalise</text>
  <text x="950" y="790" text-anchor="middle" font-family="Arial Black" font-size="16" fill="#2563EB">119 alone ≠ hypertonic saline</text>
</svg>`)
}

function causesMapSvg(): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="50" text-anchor="middle" font-family="Arial Black" font-size="26" fill="#1E3A5F">HYPONATRAEMIA CAUSES MAP</text>
  <text x="640" y="85" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748B">Paired serum + urine tests from the same clinical state where safe</text>

  <rect x="440" y="110" width="400" height="55" rx="12" fill="#059669"/>
  <text x="640" y="145" text-anchor="middle" font-family="Arial Black" font-size="20" fill="#fff">LOW SERUM SODIUM</text>

  <rect x="300" y="185" width="680" height="55" rx="12" fill="#ECFDF5" stroke="#059669" stroke-width="2"/>
  <text x="640" y="220" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#065F46">SERUM OSM + URINE OSM + URINE Na (PAIRED)</text>

  <rect x="40" y="270" width="380" height="160" rx="14" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
  <text x="230" y="310" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#92400E">HYPERTONIC</text>
  <text x="230" y="350" text-anchor="middle" font-family="Arial" font-size="15" fill="#78350F">&gt;295 mOsm/kg</text>
  <text x="230" y="390" text-anchor="middle" font-family="Arial" font-size="15" fill="#78350F">Hyperglycaemia / mannitol</text>

  <rect x="450" y="270" width="380" height="160" rx="14" fill="#F1F5F9" stroke="#64748B" stroke-width="2"/>
  <text x="640" y="310" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#334155">PSEUDO / NORMAL</text>
  <text x="640" y="350" text-anchor="middle" font-family="Arial" font-size="15" fill="#475569">275–295 mOsm/kg</text>
  <text x="640" y="390" text-anchor="middle" font-family="Arial" font-size="15" fill="#475569">Hyperlipidaemia / protein</text>

  <rect x="860" y="270" width="380" height="160" rx="14" fill="#DBEAFE" stroke="#2563EB" stroke-width="2"/>
  <text x="1050" y="310" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#1D4ED8">HYPOTONIC</text>
  <text x="1050" y="350" text-anchor="middle" font-family="Arial" font-size="15" fill="#1E3A8A">&lt;275 mOsm/kg</text>
  <text x="1050" y="390" text-anchor="middle" font-family="Arial" font-size="15" fill="#1E3A8A">Common pathway → urine osm</text>

  <rect x="60" y="470" width="360" height="200" rx="14" fill="#ECFDF5" stroke="#059669" stroke-width="2"/>
  <text x="240" y="515" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#065F46">HYPOVOLAEMIC</text>
  <text x="240" y="560" text-anchor="middle" font-family="Arial" font-size="15" fill="#064E3B">GI / skin / third-space losses</text>
  <text x="240" y="595" text-anchor="middle" font-family="Arial" font-size="15" fill="#064E3B">Diuretics / renal salt loss</text>
  <text x="240" y="640" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#047857">Restore volume when appropriate</text>

  <rect x="460" y="470" width="360" height="200" rx="14" fill="#EEF2FF" stroke="#4F46E5" stroke-width="2"/>
  <text x="640" y="515" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#3730A3">EUVOLAEMIC</text>
  <text x="640" y="560" text-anchor="middle" font-family="Arial" font-size="15" fill="#312E81">SIADH / medicines</text>
  <text x="640" y="595" text-anchor="middle" font-family="Arial" font-size="15" fill="#312E81">Adrenal / hypothyroidism</text>
  <text x="640" y="640" text-anchor="middle" font-family="Arial Black" font-size="14" fill="#DC2626">SIADH = diagnosis of exclusion</text>

  <rect x="860" y="470" width="360" height="200" rx="14" fill="#FEF2F2" stroke="#DC2626" stroke-width="2"/>
  <text x="1040" y="515" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#991B1B">HYPERVOLAEMIC</text>
  <text x="1040" y="560" text-anchor="middle" font-family="Arial" font-size="15" fill="#7F1D1D">Heart failure / cirrhosis</text>
  <text x="1040" y="595" text-anchor="middle" font-family="Arial" font-size="15" fill="#7F1D1D">Renal / nephrotic states</text>
  <text x="1040" y="640" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#B91C1C">Treat disease + water excess</text>

  <rect x="160" y="710" width="960" height="55" rx="12" fill="#FFF7ED" stroke="#F25006" stroke-width="2"/>
  <text x="640" y="745" text-anchor="middle" font-family="Arial" font-size="16" font-weight="800" fill="#9A3412">READ SERUM + URINE TOGETHER — TREATMENT CAN CHANGE THE PATTERN</text>

  <text x="640" y="840" text-anchor="middle" font-family="Arial" font-size="16" fill="#475569">Urine osm &lt;100: dilute urine (polydipsia / low solute). Urine osm &gt;100: ADH effect → use volume + urine Na</text>
  <text x="640" y="900" text-anchor="middle" font-family="Arial Black" font-size="16" fill="#F25006">Do not diagnose SIADH from numbers alone</text>
</svg>`)
}

function severePathwaySvg(): Buffer {
  const steps = [
    ['1', 'SEVERE SYMPTOMS', 'Seizure / reduced GCS / coma'],
    ['2', 'ABCDE + SENIOR', 'Critical care / monitored setting'],
    ['3', 'HYPERTONIC SALINE', 'Per local NHS protocol only'],
    ['4', 'RECHECK', 'Symptoms + sodium'],
    ['5', 'CONTROLLED RISE', 'Then stop hypertonic saline'],
    ['6', 'CAUSE TREATMENT', 'Monitor Na + urine output'],
  ]
  const boxes = steps
    .map(([n, title, sub], i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = 70 + col * 400
      const y = 180 + row * 280
      return `
      <rect x="${x}" y="${y}" width="360" height="220" rx="18" fill="#FEF2F2" stroke="#DC2626" stroke-width="3"/>
      <circle cx="${x + 40}" cy="${y + 40}" r="22" fill="#DC2626"/>
      <text x="${x + 40}" y="${y + 47}" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">${n}</text>
      <text x="${x + 180}" y="${y + 100}" text-anchor="middle" font-family="Arial Black" font-size="20" fill="#7F1D1D">${escapeXml(title)}</text>
      <text x="${x + 180}" y="${y + 145}" text-anchor="middle" font-family="Arial" font-size="16" fill="#475569">${escapeXml(sub)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="60" text-anchor="middle" font-family="Arial Black" font-size="26" fill="#1E3A5F">SEVERE SYMPTOMATIC HYPONATRAEMIA</text>
  <text x="640" y="100" text-anchor="middle" font-family="Arial" font-size="17" fill="#64748B">Immediate goal = neurological improvement with controlled correction</text>
  ${boxes}
  <rect x="160" y="800" width="960" height="70" rx="14" fill="#EBA400"/>
  <text x="640" y="845" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">Do not aim for a normal sodium in the emergency phase</text>
</svg>`)
}

function overcorrectionSvg(): Buffer {
  const steps = [
    'RAPID RISE / LIMIT AT RISK',
    'STOP HYPERTONIC SODIUM',
    'CALL SENIOR + ENDOCRINE / ICU',
    'STRICT FLUID BALANCE + UO',
    'FREQUENT SODIUM CHECKS',
    'SPECIALIST: 5% DEXTROSE ± DDAVP',
  ]
  const boxes = steps
    .map((s, i) => {
      const y = 170 + i * 95
      return `
      <rect x="120" y="${y}" width="700" height="75" rx="14" fill="${i === 0 ? '#FEF2F2' : '#FFF7ED'}" stroke="#DC2626" stroke-width="3"/>
      <circle cx="170" cy="${y + 38}" r="20" fill="#DC2626"/>
      <text x="170" y="${y + 45}" text-anchor="middle" font-family="Arial Black" font-size="16" fill="#fff">${i + 1}</text>
      <text x="470" y="${y + 45}" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#7F1D1D">${escapeXml(s)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="55" text-anchor="middle" font-family="Arial Black" font-size="26" fill="#1E3A5F">SODIUM CORRECTING TOO FAST — WHAT NOW?</text>
  <text x="640" y="95" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748B">Overcorrection is an emergency: stop, escalate and actively control the trajectory</text>
  ${boxes}
  <rect x="860" y="200" width="340" height="520" rx="18" fill="#EEF2FF" stroke="#4F46E5" stroke-width="3"/>
  <text x="1030" y="260" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#312E81">ODS RISK</text>
  <text x="1030" y="320" text-anchor="middle" font-family="Arial" font-size="15" fill="#334155">Weakness / paresis</text>
  <text x="1030" y="360" text-anchor="middle" font-family="Arial" font-size="15" fill="#334155">Speech / swallow issues</text>
  <text x="1030" y="400" text-anchor="middle" font-family="Arial" font-size="15" fill="#334155">Locked-in / disability</text>
  <text x="1030" y="470" text-anchor="middle" font-family="Arial Black" font-size="15" fill="#DC2626">Higher risk if:</text>
  <text x="1030" y="520" text-anchor="middle" font-family="Arial" font-size="14" fill="#475569">Malnutrition</text>
  <text x="1030" y="555" text-anchor="middle" font-family="Arial" font-size="14" fill="#475569">Alcohol dependence</text>
  <text x="1030" y="590" text-anchor="middle" font-family="Arial" font-size="14" fill="#475569">Very low starting Na</text>
  <text x="1030" y="625" text-anchor="middle" font-family="Arial" font-size="14" fill="#475569">Older / liver / postop</text>
  <text x="640" y="900" text-anchor="middle" font-family="Arial Black" font-size="17" fill="#F25006">Do not watch and hope — escalate immediately</text>
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

function buildContent(imgs: {
  first: string
  causes: string
  severe: string
  overcorrection: string
}) {
  return `
<p>A practical guide to severe hyponatraemia for Foundation doctors — paired tests, causes, treatment, safe correction, overcorrection and osmotic demyelination syndrome.</p>

<p>You are checking the evening bloods and see: sodium 119 mmol/L. The first instinct may be to think, “That number is dangerously low — I need to correct it.” But hyponatraemia is one of the situations where treating the number without understanding the patient can cause serious harm.</p>
<p>A sodium of 119 mmol/L is severe/profound biochemical hyponatraemia. However, the urgency and type of treatment depend on three things: the patient's symptoms, how quickly the sodium has fallen, and the underlying volume/osmolality problem. Current NHS hyponatraemia guidance emphasises that profound biochemical hyponatraemia can be symptom free, while a more modest fall can cause major neurological symptoms when it develops acutely.</p>
<p><strong>The first Foundation doctor rule:</strong> Na 119 is not an automatic prescription for hypertonic saline. First decide: Is the patient severely symptomatic? Is this acute or chronic/unclear? What type of hyponatraemia is this?</p>

<h2>The first decision: is this a hyponatraemic emergency?</h2>
${figure(
  imgs.first,
  'Foundation doctor treatment decision algorithm for a patient with sodium 119 hyponatraemia',
  'The number matters, but the first treatment decision is driven by symptoms and acuity.'
)}
<p>Severe symptoms are more likely when sodium is below 120 mmol/L, but symptoms and biochemical severity do not perfectly match. If the patient has major neurological symptoms, urgent treatment is indicated regardless of whether the hyponatraemia is known to be acute or chronic.</p>
<p><strong>Common FY trap:</strong> Seeing 119 and immediately prescribing normal saline or fluid restriction. Either may be wrong depending on the cause.</p>

<h2>1. Confirm that the result makes sense</h2>
<p>Before deciding on treatment, quickly check:</p>
<ul>
  <li>The previous sodium values and the rate of fall.</li>
  <li>Capillary/laboratory glucose — marked hyperglycaemia can produce hypertonic hyponatraemia.</li>
  <li>Whether the sample may be unreliable, including a sample taken from a drip arm.</li>
  <li>Serum osmolality — this separates hypotonic “true” hyponatraemia from hypertonic or pseudohyponatraemia; <a class="fy-source-link" href="https://cks.nice.org.uk/topics/hyponatraemia/" target="_blank" rel="noopener">NICE CKS</a> specifically recommends serum osmolality together with urine osmolality and urine sodium to help determine the cause.</li>
  <li>Whether severe hyperlipidaemia or hyperproteinaemia could be causing pseudohyponatraemia.</li>
</ul>
<p><strong>FY tip:</strong> If you are trending sodium during active treatment, compare results using the same sampling method where possible. One current NHS algorithm specifically advises VBG-to-VBG or laboratory-to-laboratory comparison rather than mixing methods unnecessarily.</p>

<h2>2. Ask: acute, chronic or unknown?</h2>
<p>Hyponatraemia developing within 48 hours is considered acute. If it has been present for more than 48 hours it is chronic. If the duration is unclear and the patient does not have severe symptoms, current NHS guidance advises treating it as chronic.</p>
<p>This distinction matters because the brain adapts to chronic hyponatraemia. Rapidly raising sodium after that adaptation can cause osmotic demyelination syndrome (ODS).</p>

<h2>3. Map the cause rather than guessing “SIADH”</h2>
${figure(
  imgs.causes,
  'Paired serum osmolality urine osmolality and urine sodium diagnostic algorithm for hyponatraemia causes',
  'Paired serum and urine studies show both the blood tonicity and the kidney response, helping you move from “low sodium” to a mechanism and cause.'
)}
<p>A practical investigation algorithm, consistent with NICE CKS assessment and current NHS hyponatraemia guidance, branches from serum osmolality into hypertonic, pseudo/normal and hypotonic pathways, then uses urine osmolality, volume status and urine sodium to separate hypovolaemic, euvolaemic and hypervolaemic causes.</p>
<p><strong>Do not overdiagnose SIADH:</strong> A low sodium plus concentrated urine is not enough. SIADH requires hypotonic hyponatraemia in a clinically euvolaemic patient, with inappropriately concentrated urine, and alternative causes such as adrenal insufficiency, severe hypothyroidism and renal failure excluded.</p>

<h2>4. What should you send?</h2>
<p>For a patient with sodium 119 mmol/L, the useful initial work-up usually includes:</p>
<ul>
  <li>Repeat U&amp;Es / sodium if confirmation is needed, while not delaying emergency treatment in a severely symptomatic patient.</li>
  <li>Glucose.</li>
  <li>Serum osmolality.</li>
  <li>Urine osmolality and urine sodium.</li>
  <li>Renal function.</li>
  <li>Thyroid function.</li>
  <li>Morning cortisol / adrenal assessment as clinically appropriate.</li>
  <li>LFTs and other tests directed by the clinical picture.</li>
  <li>Further investigations for the underlying cause, for example chest imaging if respiratory disease or malignancy is suspected.</li>
</ul>
<p>If the patient is stable enough, send the serum and urine studies as a paired set from the same clinical moment, ideally before IV fluids, fluid restriction, diuretics or other treatment changes the physiology. Do not delay urgent treatment in severe symptomatic hyponatraemia just to obtain paired samples.</p>
<p><strong>FY paired-test rule:</strong> Send serum osmolality + urine osmolality + urine sodium together, before treatment if safe. Read them as a set, alongside volume status, glucose, renal function, medications, thyroid function and adrenal assessment.</p>

<h2>5. Why paired serum and urine tests matter</h2>
<p>The tests are most useful when interpreted together because they answer two different questions at the same time: what is the tonicity of the blood, and how are the kidneys responding to it? If the blood and urine samples are taken hours apart — especially after saline, fluid restriction, diuretics or a sudden water diuresis — you may be comparing two different physiological states.</p>
<p>The classic SIADH pattern is worth recognising, but not diagnosing from numbers alone: low serum osmolality + urine osmolality &gt;100 mOsm/kg + urine sodium &gt;30 mmol/L in a clinically euvolaemic patient, with renal failure, adrenal insufficiency and severe hypothyroidism excluded. Diuretics can make urine sodium harder to interpret, so always review the drug chart.</p>

<h2>6. Review the drug chart — this is often the answer</h2>
<p>Medicines commonly implicated in current NHS hyponatraemia guidance include thiazide and related diuretics; SSRIs, tricyclic antidepressants and MAOIs; carbamazepine and other antiepileptic medicines; antipsychotics; some anticancer treatments; ACE inhibitors / ARBs and other medicines in the right clinical context; and proton-pump inhibitors and other less common drug causes.</p>
<p><strong>FY tip:</strong> Do not stop an essential medicine blindly. Identify likely contributors, assess the clinical need, and document/discuss the plan with the senior team or pharmacist.</p>

<h2>7. Treatment algorithm: what happens next?</h2>
${figure(
  imgs.severe,
  'Severe symptomatic hyponatraemia emergency treatment pathway for Foundation doctors',
  'In severe symptomatic hyponatraemia, the immediate goal is neurological improvement with controlled correction — not a normal sodium.'
)}
<p><strong>YES — medical emergency:</strong> ABCDE, urgent senior + critical-care/outreach involvement, monitored environment and hypertonic sodium chloride according to the local Trust protocol. The goal is improvement in symptoms and an initial rise of about 5 mmol/L — NOT normalising sodium to 135.</p>
<p><strong>NO — investigate before correcting:</strong> Establish chronicity, serum/urine osmolality, volume status and cause. Treat the underlying problem slowly and monitor sodium. Do not give hypertonic saline just because the number is 119.</p>
<p><strong>About hypertonic saline:</strong> Current NHS Trust algorithms use hypertonic sodium chloride boluses in severe symptomatic hyponatraemia. <a class="fy-source-link" href="https://bnf.nice.org.uk/treatment-summaries/fluids-and-electrolytes/" target="_blank" rel="noopener">BNF fluids and electrolytes</a> and your local NHS severe-hyponatraemia protocol should be used for the exact preparation, dose, monitoring and repeat-bolus rules.</p>
<p><strong>Do not aim for “normal”:</strong> If sodium is 119, the goal during emergency treatment is not 135. Once the immediate danger is controlled, correction must slow down.</p>

<h2>8. If there are no severe symptoms: treat the physiology</h2>
<p>Once true hypotonic hyponatraemia is established, treatment depends heavily on volume status and underlying cause; see <a class="fy-source-link" href="https://cks.nice.org.uk/topics/hyponatraemia/management/" target="_blank" rel="noopener">NICE CKS management guidance</a> and your local NHS guideline:</p>
<ul>
  <li><strong>Hypovolaemic</strong> — GI/skin losses, third spacing, diuretics or renal salt loss. Restore intravascular volume, commonly with 0.9% sodium chloride when appropriate; treat the cause and monitor sodium closely.</li>
  <li><strong>Euvolaemic</strong> — SIADH, medicines, adrenal insufficiency, severe hypothyroidism. Treat the cause. For confirmed SIADH, stop contributing drugs where appropriate and use fluid restriction according to local guidance; involve endocrinology if severe or not improving.</li>
  <li><strong>Hypervolaemic</strong> — Heart failure, cirrhosis, renal failure / nephrotic states. Treat the underlying disease and excess water state; fluid restriction may be part of the plan depending on the cause.</li>
</ul>
<p><strong>Common FY trap:</strong> Fluid restriction is appropriate for some euvolaemic/hypervolaemic causes, especially SIADH. It is not the treatment for a genuinely hypovolaemic patient.</p>

<h2>9. The major danger: correcting sodium too quickly</h2>
<p>The danger of chronic severe hyponatraemia is not only the low sodium itself. Rapid correction can cause osmotic demyelination syndrome (ODS), historically called central pontine myelinolysis. Current NHS adult hyponatraemia guidance sets a safe limit of no more than 10 mmol/L in the first 24 hours and 8 mmol/L in each subsequent 24 hours, with consideration of lower limits in people at higher risk of osmotic demyelination.</p>

<h2>10. What is osmotic demyelination syndrome?</h2>
<p>ODS is a rare but potentially devastating neurological complication of overly rapid correction of hyponatraemia. It can involve the pons and other parts of the brain.</p>
<ul>
  <li>Weakness progressing to para- or quadriparesis.</li>
  <li>Difficulty speaking or swallowing / pseudobulbar features.</li>
  <li>Movement or coordination abnormalities.</li>
  <li>Severe cases can cause a locked-in state, coma or permanent neurological disability.</li>
</ul>
<p>Current NHS guidance identifies higher-risk groups including older people, malnourished patients, people with alcohol misuse/dependence, CNS disease and postoperative patients. Other clinically recognised risk factors should be assessed with senior/endocrine input when setting an individual correction target.</p>

<h2>11. What if the sodium is correcting too fast?</h2>
${figure(
  imgs.overcorrection,
  'Overcorrection of hyponatraemia and osmotic demyelination syndrome safety algorithm',
  'Overcorrection is an emergency in its own right: stop the driver, escalate, monitor closely and actively control the sodium trajectory.'
)}
<p>A current NHS hyponatraemia guideline advises stopping hypertonic fluid, monitoring urine output, considering hypotonic 5% dextrose to slow the rise, and considering desmopressin only after discussion with the endocrinology team. This is not something a Foundation doctor should improvise independently.</p>
<p><strong>FY safety rule:</strong> If the sodium is rising too quickly, the correct response is NOT to watch and hope. Stop the hypertonic therapy, escalate immediately, monitor closely and help the senior/endocrine/critical-care team actively control the correction.</p>

<h2>12. Watch the urine output — overcorrection can accelerate suddenly</h2>
<p>A rapidly increasing urine output during treatment should get your attention. When the physiological stimulus for water retention resolves, the patient may begin passing large volumes of dilute urine and the sodium can rise faster than expected. That is why fluid balance and urine output are part of sodium safety, not just nursing paperwork.</p>

<h2>A practical ward example: Na 119, but the patient looks well</h2>
<p>You are called about a 76-year-old patient whose sodium is 119 mmol/L. They are awake, talking normally and have no seizure, vomiting, reduced GCS or cardiorespiratory compromise. Yesterday the sodium was 121 and three days ago it was 123.</p>
<ul>
  <li><strong>Is this severe biochemical hyponatraemia?</strong> Yes.</li>
  <li><strong>Is there evidence of severe symptomatic hyponatraemia?</strong> Not currently.</li>
  <li><strong>Does 119 alone mean hypertonic saline?</strong> No.</li>
  <li><strong>Is it probably acute?</strong> The trend suggests this may be chronic/subacute, but establish the earlier baseline.</li>
  <li><strong>What next?</strong> Full assessment, medication review, fluid status, serum osmolality, urine osmolality and urine sodium, glucose, renal/thyroid/adrenal assessment as appropriate.</li>
  <li><strong>What are you trying to avoid?</strong> Missing the cause, giving the wrong fluid strategy, or correcting the sodium too quickly.</li>
</ul>
<p>Now imagine the same sodium of 119 with a new seizure or rapidly falling GCS. That is a completely different situation: ABCDE, urgent senior/critical-care involvement and the severe symptomatic hyponatraemia pathway.</p>

<h2>A practical ward example: sodium 119 becomes 128 too quickly</h2>
<p>A patient with chronic hyponatraemia starts at 119 mmol/L. After treatment, the sodium has already reached 128 mmol/L within the first day and urine output has risen markedly.</p>
<ul>
  <li>Recognise this as dangerous overcorrection / impending breach of the safe correction limit.</li>
  <li>Stop hypertonic sodium if it is still running.</li>
  <li>Call the registrar/consultant and involve endocrinology/critical care urgently.</li>
  <li>Institute strict fluid balance and frequent sodium monitoring.</li>
  <li>Expect specialist-directed use of 5% dextrose and possibly desmopressin to slow or reverse the rise.</li>
  <li>Do not wait until neurological symptoms develop before acting.</li>
</ul>

<h2>13. When should you escalate?</h2>
<p>With sodium 119 mmol/L, early senior discussion is sensible even if the patient appears well. Escalate urgently if:</p>
<ul>
  <li>There is seizure, coma, reduced/altered GCS, encephalopathy or severe vomiting.</li>
  <li>The sodium has fallen rapidly or the patient is clinically deteriorating.</li>
  <li>Hypertonic saline is being considered or administered.</li>
  <li>The diagnosis or volume status is unclear.</li>
  <li>Adrenal insufficiency is possible.</li>
  <li>The sodium continues to fall despite initial measures.</li>
  <li>The sodium is rising faster than intended or is approaching the correction limit.</li>
  <li>There is a large new urine output during correction.</li>
  <li>The patient has major ODS risk factors.</li>
  <li>You are unsure what fluid strategy is appropriate.</li>
</ul>

<h2>The sodium 119 rule</h2>
<p><strong>SYMPTOMS → CHRONICITY → OSMOLALITY → VOLUME STATUS → URINE OSM / URINE Na → CAUSE → TREAT → TREND SODIUM → WATCH URINE OUTPUT → PREVENT OVERCORRECTION</strong></p>
<p><strong>The key message:</strong> With sodium 119, your job is not to make the number normal. Your job is to recognise symptomatic cerebral risk, identify the type and cause of hyponatraemia, start the correct pathway, and make sure correction remains controlled.</p>

<p><em>Educational note: This article is for Foundation doctor education. For an individual patient, use NICE CKS hyponatraemia assessment, NICE CKS management guidance, BNF fluids and electrolytes, your local NHS hyponatraemia guideline and senior/endocrine/critical-care advice. Clinical content for this draft was restricted to NICE/CKS, BNF, NHS guidance and approved Oxford clinical handbooks.</em></p>
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
      name: 'Core investigations',
      description: 'ABG, ECG, AKI, cannulas, electrolytes and scans',
      display_order: 8,
      is_active: true,
    })
    .select('id')
    .single()
  if (error) throw error
  return data!.id as string
}

async function upsertPage(topicId: string, content: string, featuredPath: string) {
  const { data: existing } = await sb.from('fy_pages').select('id').eq('slug', SLUG).maybeSingle()
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

  const insertPayload = { slug: SLUG, display_order: 60, ...payload }
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
  console.log('Composing featured Bleepy card...')
  const featuredWebp = await composeFeaturedLogoCard()
  const featuredPath = `${IMAGE_DIR}/featured-bleepy-logo.webp`
  await uploadBuffer(featuredPath, featuredWebp, 'image/webp')

  console.log('Generating teaching algorithms...')
  const first = await uploadPngFromSvg(firstDecisionSvg(), 'sodium-119-first-decision-algorithm')
  const causes = await uploadPngFromSvg(causesMapSvg(), 'hyponatraemia-causes-algorithm-foundation')
  const severe = await uploadPngFromSvg(
    severePathwaySvg(),
    'severe-symptomatic-hyponatraemia-treatment-algorithm'
  )
  const overcorrection = await uploadPngFromSvg(
    overcorrectionSvg(),
    'hyponatraemia-overcorrection-ods-algorithm'
  )

  const content = buildContent({ first, causes, severe, overcorrection })
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
