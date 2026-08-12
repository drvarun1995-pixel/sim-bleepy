/**
 * Seed public FY guide:
 * "Hyponatraemia for Foundation Doctors: A Practical Guide"
 *
 * Cohort: general · Topic: core-investigations
 * Featured: Bleepy logo card. Inline: 3 teaching algorithms.
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
  'A practical guide to hyponatraemia for Foundation doctors, covering plasma osmolality, volume status, urine sodium, urine osmolality, causes of SIADH and broad management.'

const W = 1280
const H = 720
const NICE_CKS = 'https://cks.nice.org.uk/topics/hyponatraemia/'
const NICE_MGMT = 'https://cks.nice.org.uk/topics/hyponatraemia/management/'

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
    <text x="125" y="120" text-anchor="middle" font-family="Arial Black" font-size="42" fill="#B91C1C">&lt;135</text>
    <text x="125" y="165" text-anchor="middle" font-family="Arial" font-size="15" font-weight="700" fill="#065F46">mmol/L</text>
  </g>
  <g transform="translate(900,250)">
    <ellipse cx="80" cy="60" rx="58" ry="42" fill="#D1FAE5" stroke="#059669" stroke-width="5"/>
    <path d="M55 55 h50 M80 30 v60" stroke="#047857" stroke-width="8" stroke-linecap="round"/>
    <text x="80" y="145" text-anchor="middle" font-family="Arial" font-size="15" font-weight="800" fill="#065F46">OSMOLALITY</text>
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

/** Image 1 — full causes algorithm (osmolality → volume/urine branches) */
function causesAlgorithmSvg(): Buffer {
  const AH = 1680
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${AH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${AH}" fill="#FFFFFF"/>
  <text x="640" y="42" text-anchor="middle" font-family="Arial Black" font-size="26" fill="#1E3A5F">HYPONATRAEMIA CAUSES ALGORITHM</text>
  <text x="640" y="72" text-anchor="middle" font-family="Arial" font-size="15" fill="#64748B">Serum Na → plasma osmolality → volume status → urine Na / urine osmolality</text>

  <rect x="390" y="95" width="500" height="52" rx="12" fill="#1E40AF"/>
  <text x="640" y="128" text-anchor="middle" font-family="Arial Black" font-size="20" fill="#fff">SERUM Na &lt;135 mmol/L</text>

  <rect x="340" y="165" width="600" height="48" rx="12" fill="#DBEAFE" stroke="#2563EB" stroke-width="2"/>
  <text x="640" y="196" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#1E3A8A">PLASMA OSMOLALITY</text>

  <!-- Three tonicity columns -->
  <rect x="30" y="240" width="380" height="200" rx="14" fill="#F1F5F9" stroke="#64748B" stroke-width="2"/>
  <text x="220" y="275" text-anchor="middle" font-family="Arial Black" font-size="16" fill="#334155">280–295 mOsm/kg</text>
  <text x="220" y="305" text-anchor="middle" font-family="Arial Black" font-size="17" fill="#1E3A5F">ISOTONIC</text>
  <text x="220" y="335" text-anchor="middle" font-family="Arial" font-size="14" fill="#475569">Pseudohyponatraemia</text>
  <text x="220" y="370" text-anchor="middle" font-family="Arial" font-size="14" fill="#475569">• Hyperlipidaemia</text>
  <text x="220" y="400" text-anchor="middle" font-family="Arial" font-size="14" fill="#475569">• Hyperparaproteinaemia</text>

  <rect x="450" y="240" width="380" height="200" rx="14" fill="#DBEAFE" stroke="#2563EB" stroke-width="3"/>
  <text x="640" y="275" text-anchor="middle" font-family="Arial Black" font-size="16" fill="#1D4ED8">&lt;280 mOsm/kg</text>
  <text x="640" y="305" text-anchor="middle" font-family="Arial Black" font-size="17" fill="#1E3A5F">HYPOTONIC</text>
  <text x="640" y="340" text-anchor="middle" font-family="Arial" font-size="14" fill="#1E3A8A">True hyponatraemia</text>
  <text x="640" y="375" text-anchor="middle" font-family="Arial Black" font-size="15" fill="#1E40AF">→ ASSESS VOLUME STATUS</text>
  <text x="640" y="410" text-anchor="middle" font-family="Arial" font-size="13" fill="#64748B">Hypo- / Eu- / Hypervolaemic</text>

  <rect x="870" y="240" width="380" height="200" rx="14" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
  <text x="1060" y="275" text-anchor="middle" font-family="Arial Black" font-size="16" fill="#92400E">&gt;295 mOsm/kg</text>
  <text x="1060" y="305" text-anchor="middle" font-family="Arial Black" font-size="17" fill="#1E3A5F">HYPERTONIC</text>
  <text x="1060" y="335" text-anchor="middle" font-family="Arial" font-size="14" fill="#78350F">Translocational</text>
  <text x="1060" y="370" text-anchor="middle" font-family="Arial" font-size="14" fill="#78350F">• Hyperglycaemia</text>
  <text x="1060" y="400" text-anchor="middle" font-family="Arial" font-size="14" fill="#78350F">• Hypertonic fluids</text>

  <!-- Hypotonic volume branches header -->
  <rect x="200" y="470" width="880" height="44" rx="10" fill="#1E40AF"/>
  <text x="640" y="500" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">HYPOTONIC BRANCH — VOLUME STATUS</text>

  <!-- Hypovolaemic -->
  <rect x="30" y="540" width="400" height="520" rx="14" fill="#ECFDF5" stroke="#059669" stroke-width="3"/>
  <text x="230" y="580" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#065F46">HYPOVOLAEMIC</text>
  <text x="230" y="610" text-anchor="middle" font-family="Arial" font-size="14" fill="#047857">Use urinary sodium</text>

  <rect x="50" y="630" width="360" height="185" rx="10" fill="#FFFFFF" stroke="#059669" stroke-width="2"/>
  <text x="230" y="660" text-anchor="middle" font-family="Arial Black" font-size="15" fill="#047857">Urine Na &gt;20 mmol/L</text>
  <text x="230" y="688" text-anchor="middle" font-family="Arial Black" font-size="14" fill="#1E3A5F">RENAL LOSS</text>
  <text x="230" y="720" text-anchor="middle" font-family="Arial" font-size="13" fill="#334155">Diuretic use</text>
  <text x="230" y="745" text-anchor="middle" font-family="Arial" font-size="13" fill="#334155">Osmotic diuresis</text>
  <text x="230" y="770" text-anchor="middle" font-family="Arial" font-size="13" fill="#334155">Mineralocorticoid deficiency</text>
  <text x="230" y="795" text-anchor="middle" font-family="Arial" font-size="13" fill="#334155">(e.g. Addison's)</text>

  <rect x="50" y="835" width="360" height="200" rx="10" fill="#FFFFFF" stroke="#059669" stroke-width="2"/>
  <text x="230" y="865" text-anchor="middle" font-family="Arial Black" font-size="15" fill="#047857">Urine Na &lt;20 mmol/L</text>
  <text x="230" y="893" text-anchor="middle" font-family="Arial Black" font-size="14" fill="#1E3A5F">EXTRA-RENAL LOSS</text>
  <text x="230" y="925" text-anchor="middle" font-family="Arial" font-size="13" fill="#334155">GI loss</text>
  <text x="230" y="950" text-anchor="middle" font-family="Arial" font-size="13" fill="#334155">Burns</text>
  <text x="230" y="975" text-anchor="middle" font-family="Arial" font-size="13" fill="#334155">Pancreatitis</text>
  <text x="230" y="1005" text-anchor="middle" font-family="Arial" font-size="13" fill="#334155">Third-space losses</text>

  <!-- Euvolaemic -->
  <rect x="440" y="540" width="400" height="520" rx="14" fill="#EEF2FF" stroke="#4F46E5" stroke-width="3"/>
  <text x="640" y="580" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#3730A3">EUVOLAEMIC</text>
  <text x="640" y="610" text-anchor="middle" font-family="Arial" font-size="14" fill="#4338CA">Use urinary osmolality</text>

  <rect x="460" y="630" width="360" height="185" rx="10" fill="#FFFFFF" stroke="#4F46E5" stroke-width="2"/>
  <text x="640" y="660" text-anchor="middle" font-family="Arial Black" font-size="15" fill="#4338CA">Urine osm &gt;100 mOsm/kg</text>
  <text x="640" y="688" text-anchor="middle" font-family="Arial Black" font-size="14" fill="#1E3A5F">SIADH / ENDOCRINOPATHIES</text>
  <text x="640" y="725" text-anchor="middle" font-family="Arial" font-size="13" fill="#334155">SIADH</text>
  <text x="640" y="755" text-anchor="middle" font-family="Arial" font-size="13" fill="#334155">Glucocorticoid deficiency</text>
  <text x="640" y="785" text-anchor="middle" font-family="Arial" font-size="13" fill="#334155">Exclude adrenal / thyroid</text>

  <rect x="460" y="835" width="360" height="200" rx="10" fill="#FFFFFF" stroke="#4F46E5" stroke-width="2"/>
  <text x="640" y="865" text-anchor="middle" font-family="Arial Black" font-size="15" fill="#4338CA">Urine osm &lt;100 mOsm/kg</text>
  <text x="640" y="893" text-anchor="middle" font-family="Arial Black" font-size="14" fill="#1E3A5F">PRIMARY POLYDIPSIA</text>
  <text x="640" y="930" text-anchor="middle" font-family="Arial" font-size="13" fill="#334155">Mental health cause</text>
  <text x="640" y="960" text-anchor="middle" font-family="Arial" font-size="13" fill="#334155">Exercise-induced</text>
  <text x="640" y="990" text-anchor="middle" font-family="Arial" font-size="13" fill="#334155">Low solute intake</text>

  <!-- Hypervolaemic -->
  <rect x="850" y="540" width="400" height="520" rx="14" fill="#FEF2F2" stroke="#DC2626" stroke-width="3"/>
  <text x="1050" y="580" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#991B1B">HYPERVOLAEMIC</text>
  <text x="1050" y="610" text-anchor="middle" font-family="Arial" font-size="14" fill="#B91C1C">Urine Na typically &lt;20</text>

  <rect x="870" y="640" width="360" height="390" rx="10" fill="#FFFFFF" stroke="#DC2626" stroke-width="2"/>
  <text x="1050" y="680" text-anchor="middle" font-family="Arial Black" font-size="15" fill="#B91C1C">OEDEMATOUS DISORDERS</text>
  <text x="1050" y="730" text-anchor="middle" font-family="Arial" font-size="15" fill="#334155">Heart failure</text>
  <text x="1050" y="770" text-anchor="middle" font-family="Arial" font-size="15" fill="#334155">Cirrhosis</text>
  <text x="1050" y="810" text-anchor="middle" font-family="Arial" font-size="15" fill="#334155">Nephrotic syndrome</text>
  <text x="1050" y="850" text-anchor="middle" font-family="Arial" font-size="15" fill="#334155">Renal failure</text>
  <text x="1050" y="910" text-anchor="middle" font-family="Arial" font-size="13" fill="#7F1D1D">Effective arterial</text>
  <text x="1050" y="935" text-anchor="middle" font-family="Arial" font-size="13" fill="#7F1D1D">underfilling → ADH</text>
  <text x="1050" y="970" text-anchor="middle" font-family="Arial" font-size="13" fill="#7F1D1D">+ water retention</text>

  <!-- Framework footer -->
  <rect x="60" y="1090" width="1160" height="70" rx="12" fill="#FFF7ED" stroke="#F25006" stroke-width="2"/>
  <text x="640" y="1135" text-anchor="middle" font-family="Arial Black" font-size="15" fill="#9A3412">LOW Na → OSMOLALITY → VOLUME → URINE Na / OSM → CAUSE → MANAGEMENT</text>

  <!-- Management snippets under each top branch -->
  <text x="640" y="1220" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#1E3A5F">BROAD MANAGEMENT HINTS BY BRANCH</text>

  <rect x="30" y="1245" width="380" height="160" rx="12" fill="#F8FAFC" stroke="#64748B" stroke-width="2"/>
  <text x="220" y="1280" text-anchor="middle" font-family="Arial Black" font-size="15" fill="#334155">ISOTONIC</text>
  <text x="220" y="1315" text-anchor="middle" font-family="Arial" font-size="13" fill="#475569">Assess lipid / protein</text>
  <text x="220" y="1345" text-anchor="middle" font-family="Arial" font-size="13" fill="#475569">Identify &amp; treat cause</text>
  <text x="220" y="1375" text-anchor="middle" font-family="Arial" font-size="13" fill="#475569">(statin / myeloma pathway)</text>

  <rect x="450" y="1245" width="380" height="160" rx="12" fill="#EFF6FF" stroke="#2563EB" stroke-width="2"/>
  <text x="640" y="1280" text-anchor="middle" font-family="Arial Black" font-size="15" fill="#1D4ED8">HYPOTONIC</text>
  <text x="640" y="1315" text-anchor="middle" font-family="Arial" font-size="13" fill="#1E3A8A">Treat by volume pattern</text>
  <text x="640" y="1345" text-anchor="middle" font-family="Arial" font-size="13" fill="#1E3A8A">Saline / restrict / diurese</text>
  <text x="640" y="1375" text-anchor="middle" font-family="Arial" font-size="13" fill="#1E3A8A">See management map</text>

  <rect x="870" y="1245" width="380" height="160" rx="12" fill="#FFFBEB" stroke="#D97706" stroke-width="2"/>
  <text x="1060" y="1280" text-anchor="middle" font-family="Arial Black" font-size="15" fill="#92400E">HYPERTONIC</text>
  <text x="1060" y="1315" text-anchor="middle" font-family="Arial" font-size="13" fill="#78350F">Assess hyperglycaemia</text>
  <text x="1060" y="1345" text-anchor="middle" font-family="Arial" font-size="13" fill="#78350F">Corrected serum Na</text>
  <text x="1060" y="1375" text-anchor="middle" font-family="Arial" font-size="13" fill="#78350F">Treat DKA / cause</text>

  <text x="640" y="1475" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748B">Classify first — then choose fluids. Do not guess SIADH from a low Na alone.</text>
  <text x="640" y="1520" text-anchor="middle" font-family="Arial Black" font-size="15" fill="#F25006">AVOID RAPID CORRECTION — specialist input for hypertonic saline</text>
  <text x="640" y="1580" text-anchor="middle" font-family="Arial" font-size="13" fill="#94A3B8">Educational algorithm for Foundation doctors — follow local Trust guidance</text>
</svg>`)
}

/** Image 2 — Causes of SIADH */
function siadhCausesSvg(): Buffer {
  const AH = 980
  const groups = [
    {
      title: 'BRAIN INJURY',
      items: ['Traumatic brain injury', 'CVA', 'SAH', 'Meningitis'],
      fill: '#DBEAFE',
      stroke: '#2563EB',
      titleFill: '#1D4ED8',
    },
    {
      title: 'MALIGNANCY',
      items: ['Small-cell lung cancer'],
      fill: '#EEF2FF',
      stroke: '#4F46E5',
      titleFill: '#3730A3',
    },
    {
      title: 'ENDOCRINE',
      items: ['Hypothyroidism'],
      fill: '#ECFDF5',
      stroke: '#059669',
      titleFill: '#047857',
    },
    {
      title: 'INFECTION',
      items: ['Cerebral abscess', 'Lung abscess', 'Atypical pneumonia'],
      fill: '#FEF3C7',
      stroke: '#D97706',
      titleFill: '#92400E',
    },
    {
      title: 'MEDICATIONS',
      items: ['SSRI', 'Amitriptyline', 'Carbamazepine', 'Lisinopril', 'Levodopa'],
      fill: '#FEF2F2',
      stroke: '#DC2626',
      titleFill: '#B91C1C',
    },
  ]

  const cards = groups
    .map((g, i) => {
      const x = 40 + i * 244
      const itemLines = g.items
        .map(
          (it, j) =>
            `<text x="${x + 112}" y="${320 + j * 36}" text-anchor="middle" font-family="Arial" font-size="14" fill="#334155">${escapeXml(it)}</text>`
        )
        .join('\n')
      return `
      <rect x="${x}" y="200" width="228" height="520" rx="16" fill="${g.fill}" stroke="${g.stroke}" stroke-width="3"/>
      <rect x="${x + 14}" y="220" width="200" height="50" rx="10" fill="${g.stroke}"/>
      <text x="${x + 112}" y="253" text-anchor="middle" font-family="Arial Black" font-size="14" fill="#fff">${escapeXml(g.title)}</text>
      ${itemLines}`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${AH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${AH}" fill="#FFFFFF"/>
  <text x="640" y="55" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#1E3A5F">CAUSES OF SIADH</text>
  <text x="640" y="95" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748B">Neurological · malignancy · endocrine · infection · medications</text>
  <rect x="380" y="120" width="520" height="44" rx="10" fill="#EFF6FF" stroke="#2563EB" stroke-width="2"/>
  <text x="640" y="149" text-anchor="middle" font-family="Arial" font-size="15" font-weight="700" fill="#1E40AF">Not an exhaustive list — use as a prompt, not a checklist</text>
  ${cards}
  <text x="640" y="780" text-anchor="middle" font-family="Arial" font-size="15" fill="#475569">SIADH is a diagnosis of exclusion — confirm hypotonic euvolaemic pattern first</text>
  <text x="640" y="830" text-anchor="middle" font-family="Arial Black" font-size="16" fill="#F25006">Always review the drug chart and exclude adrenal / severe thyroid disease</text>
  <text x="640" y="900" text-anchor="middle" font-family="Arial" font-size="13" fill="#94A3B8">Foundation doctor educational infographic</text>
</svg>`)
}

/** Image 3 — General management map + safety warnings */
function generalManagementSvg(): Buffer {
  const AH = 1180
  const rows: [string, string, string][] = [
    ['ISOTONIC', 'Assess lipid / protein levels · identify cause · treat cause', '#F1F5F9|#64748B|#334155'],
    [
      'HYPERTONIC',
      'Assess hyperglycaemia · treat cause (e.g. DKA) · corrected serum Na',
      '#FEF3C7|#D97706|#92400E',
    ],
    [
      'HYPOTONIC — HYPOVOLAEMIC',
      'Treat cause · consider isotonic saline · stop diuretic · steroids for Addison\'s',
      '#ECFDF5|#059669|#065F46',
    ],
    [
      'HYPOTONIC — HYPERVOLAEMIC',
      'Treat cause · diuresis · fluid restriction · sodium restriction',
      '#FEF2F2|#DC2626|#991B1B',
    ],
    [
      'HYPOTONIC — EUVOLAEMIC',
      'Treat cause · fluid restriction · medication change · treat underlying SIADH',
      '#EEF2FF|#4F46E5|#3730A3',
    ],
  ]

  const rowBoxes = rows
    .map(([title, detail, colours], i) => {
      const [fill, stroke, titleFill] = colours.split('|')
      const y = 120 + i * 110
      return `
      <rect x="50" y="${y}" width="1180" height="95" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <text x="80" y="${y + 40}" font-family="Arial Black" font-size="18" fill="${titleFill}">${escapeXml(title)}</text>
      <text x="80" y="${y + 70}" font-family="Arial" font-size="15" fill="#334155">${escapeXml(detail)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${AH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${AH}" fill="#FFFFFF"/>
  <text x="640" y="50" text-anchor="middle" font-family="Arial Black" font-size="26" fill="#1E3A5F">GENERAL MANAGEMENT OF HYPONATRAEMIA</text>
  <text x="640" y="85" text-anchor="middle" font-family="Arial" font-size="15" fill="#64748B">Broad management follows the classification pattern — not the sodium number alone</text>
  ${rowBoxes}

  <rect x="50" y="690" width="1180" height="160" rx="16" fill="#FEF2F2" stroke="#DC2626" stroke-width="4"/>
  <text x="640" y="735" text-anchor="middle" font-family="Arial Black" font-size="20" fill="#B91C1C">⚠ HYPERTONIC SALINE — SPECIALIST INPUT REQUIRED</text>
  <text x="640" y="775" text-anchor="middle" font-family="Arial" font-size="15" fill="#7F1D1D">Do not start independently — discuss with a senior and obtain expert help</text>
  <text x="640" y="810" text-anchor="middle" font-family="Arial" font-size="15" fill="#7F1D1D">Use only in severe symptomatic hyponatraemia, irrespective of fluid status</text>
  <text x="640" y="840" text-anchor="middle" font-family="Arial" font-size="14" fill="#991B1B">Requires specialist monitoring in an appropriate setting</text>

  <rect x="50" y="875" width="1180" height="160" rx="16" fill="#FEF2F2" stroke="#DC2626" stroke-width="4"/>
  <text x="640" y="920" text-anchor="middle" font-family="Arial Black" font-size="20" fill="#B91C1C">⚠ AVOID RAPID CORRECTION</text>
  <text x="640" y="960" text-anchor="middle" font-family="Arial" font-size="15" fill="#7F1D1D">Do not correct sodium by ≥10 mmol/L per 24 hours</text>
  <text x="640" y="995" text-anchor="middle" font-family="Arial" font-size="15" fill="#7F1D1D">Risk of central pontine myelinolysis (osmotic demyelination)</text>
  <text x="640" y="1025" text-anchor="middle" font-family="Arial" font-size="14" fill="#991B1B">Applies to acute and chronic hyponatraemia correction pathways</text>

  <text x="640" y="1105" text-anchor="middle" font-family="Arial Black" font-size="15" fill="#F25006">Classify → treat the pattern → escalate for severe symptoms / hypertonic saline</text>
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

function sourceLink(href: string, label: string) {
  return `<a class="fy-source-link" href="${href}" target="_blank" rel="noopener">${label}</a>`
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

function buildContent(imgs: { causes: string; siadh: string; management: string }) {
  return `
<p>Hyponatraemia becomes much easier to approach when you stop treating every low sodium as the same problem. The key is to work through the pattern systematically: first identify the plasma osmolality, then assess volume status, and then use urinary sodium or urinary osmolality to narrow the cause.</p>

<p><strong>The practical framework:</strong> Serum sodium → plasma osmolality → volume status → urinary sodium / urinary osmolality → likely cause → broad management.</p>

<h2>1. Start with plasma osmolality</h2>
<p>For serum sodium below 135 mmol/L, divide the problem according to plasma osmolality. This is the first branch in any useful causes map and matches the approach summarised in ${sourceLink(NICE_CKS, 'NICE CKS hyponatraemia')}.</p>
<ul>
  <li><strong>280–295 mOsm/kg — isotonic hyponatraemia</strong> — think pseudohyponatraemia.</li>
  <li><strong>&lt;280 mOsm/kg — hypotonic hyponatraemia</strong> — true hyponatraemia; assess volume status next.</li>
  <li><strong>&gt;295 mOsm/kg — hypertonic hyponatraemia</strong> — think translocational causes.</li>
</ul>
<p><strong>FY tip:</strong> Do not jump straight to “SIADH” from a low sodium. Osmolality first — then volume — then urine tests.</p>

${figure(
  imgs.causes,
  'Hyponatraemia causes algorithm using plasma osmolality volume status urine sodium and urine osmolality',
  'A structured causes map helps move from a low sodium result to the likely physiological category.'
)}

<h2>2. Isotonic hyponatraemia</h2>
<p>When plasma osmolality is in the isotonic range, the pathway points towards pseudohyponatraemia rather than a true water excess problem.</p>
<ul>
  <li>Hyperlipidaemia</li>
  <li>Hyperparaproteinaemia</li>
</ul>
<p>Assess lipid and protein levels, identify the underlying cause and treat that cause. For hyperlipidaemia, lifestyle measures and consideration of statin therapy may be relevant. For hyperproteinaemia, the pathway highlights causes such as malignancy / multiple myeloma and treatment of the underlying condition.</p>
<p><strong>Common FY trap:</strong> Treating an isotonic (pseudo) low sodium with fluids or restriction as if it were hypotonic hyponatraemia.</p>

<h2>3. Hypertonic hyponatraemia</h2>
<p>When plasma osmolality is above 295 mOsm/kg, this is hypertonic or translocational hyponatraemia.</p>
<ul>
  <li>Hyperglycaemia</li>
  <li>Secondary to hypertonic fluid</li>
</ul>
<p>Assess for hyperglycaemia, identify the cause and treat it. Diabetes — particularly DKA — is a classic context. Calculate a corrected serum sodium so you are not misled by the measured value alone.</p>
<p><strong>FY tip:</strong> Always check glucose early. Marked hyperglycaemia can produce an apparently low sodium that is explained by water shift, not by a separate SIADH pathway.</p>

<h2>4. Hypotonic hyponatraemia: assess volume status</h2>
<p>If plasma osmolality is below 280 mOsm/kg, you are in true hypotonic hyponatraemia. Split patients into hypovolaemic, euvolaemic and hypervolaemic groups before interpreting urine sodium or urine osmolality. Volume status is clinical — look at mucous membranes, JVP, oedema, capillary refill, postural observations and fluid balance, not just the chart label.</p>
<p><strong>Common FY trap:</strong> Calling every well-looking patient “euvolaemic” without examining for subtle volume depletion or oedema.</p>

<h2>5. Hypovolaemic hypotonic hyponatraemia</h2>
<p>In the hypovolaemic branch, urinary sodium helps separate renal from extra-renal losses.</p>
<ul>
  <li><strong>Urine Na &gt;20 mmol/L — renal loss</strong> — diuretic use; osmotic diuresis; mineralocorticoid deficiency.</li>
  <li><strong>Urine Na &lt;20 mmol/L — extra-renal loss</strong> — GI loss; burns; pancreatitis.</li>
</ul>
<p>Broad management options:</p>
<ul>
  <li>Assess the cause of the volume-status abnormality and treat the cause.</li>
  <li>Consider isotonic saline.</li>
  <li>Stop diuretic use where appropriate.</li>
  <li>Steroid replacement therapy for Addison's disease.</li>
</ul>
<p><strong>FY tip:</strong> Do not fluid-restrict a genuinely hypovolaemic patient. Restore volume first, then reassess the sodium trend.</p>

<h2>6. Euvolaemic hypotonic hyponatraemia</h2>
<p>In the euvolaemic branch, urinary osmolality helps narrow the cause.</p>
<ul>
  <li><strong>Urine osmolality &gt;100 mOsm/kg — SIADH / endocrinopathies</strong> — SIADH; glucocorticoid deficiency.</li>
  <li><strong>Urine osmolality &lt;100 mOsm/kg — primary polydipsia</strong> — mental health cause; exercise-induced.</li>
</ul>
<p>Broad management options:</p>
<ul>
  <li>Assess the cause and treat it.</li>
  <li>Fluid restriction.</li>
  <li>Medication change.</li>
  <li>Treat the underlying cause of SIADH.</li>
</ul>
<p>SIADH remains a diagnosis of exclusion. Confirm the hypotonic euvolaemic pattern and exclude important alternatives (including adrenal insufficiency and severe hypothyroidism) before locking onto the label — see ${sourceLink(NICE_CKS, 'NICE CKS assessment')}.</p>
<p><strong>Common FY trap:</strong> Diagnosing SIADH from concentrated urine alone without volume assessment or exclusion of other causes.</p>

<h2>7. Hypervolaemic hypotonic hyponatraemia</h2>
<p>The hypervolaemic branch is linked to oedematous disorders, with urinary sodium below 20 mmol/L typically shown in the pathway.</p>
<ul>
  <li>Heart failure</li>
  <li>Cirrhosis</li>
  <li>Nephrotic syndrome</li>
  <li>Renal failure</li>
</ul>
<p>Broad management options:</p>
<ul>
  <li>Assess the cause of the volume-status abnormality and treat the cause.</li>
  <li>Diuresis.</li>
  <li>Fluid restriction.</li>
  <li>Sodium restriction.</li>
</ul>
<p><strong>FY tip:</strong> Treat the underlying disease and water excess together. Giving isotonic saline “because the sodium is low” can worsen oedema in this group.</p>

<h2>8. Causes of SIADH</h2>
${figure(
  imgs.siadh,
  'Causes of SIADH infographic for Foundation doctors',
  'The SIADH differential spans neurological disease, malignancy, endocrine disease, infection and medication causes.'
)}
<p>Important SIADH associations (not an exhaustive list):</p>
<ul>
  <li><strong>Brain injury</strong> — traumatic brain injury; CVA; SAH; meningitis.</li>
  <li><strong>Malignancy</strong> — small-cell lung cancer.</li>
  <li><strong>Endocrine</strong> — hypothyroidism.</li>
  <li><strong>Infection</strong> — cerebral abscess; lung abscess; atypical pneumonia.</li>
  <li><strong>Medications</strong> — SSRI; amitriptyline; carbamazepine; lisinopril; levodopa.</li>
</ul>
<p><strong>FY tip:</strong> Always review the drug chart. Stopping a contributing medicine (where clinically appropriate) is often more useful than adding another investigation.</p>

<h2>9. General management map</h2>
${figure(
  imgs.management,
  'General management of hyponatraemia and correction safety warnings',
  'Broad management depends on the type and volume-status pattern, with hypertonic saline reserved for severe symptomatic cases under specialist supervision.'
)}
<p>Pattern → broad management (see also ${sourceLink(NICE_MGMT, 'NICE CKS management')}):</p>
<ul>
  <li><strong>Isotonic</strong> — assess lipid/protein levels, identify the cause and treat it.</li>
  <li><strong>Hypertonic</strong> — assess for hyperglycaemia, identify and treat the cause; corrected serum sodium is highlighted.</li>
  <li><strong>Hypotonic — hypovolaemic</strong> — assess and treat cause; consider isotonic saline; stop diuretic use; steroid replacement for Addison's.</li>
  <li><strong>Hypotonic — hypervolaemic</strong> — assess and treat cause; consider diuresis, fluid restriction and sodium restriction.</li>
  <li><strong>Hypotonic — euvolaemic</strong> — assess and treat cause; consider fluid restriction, medication change and treatment of underlying SIADH.</li>
</ul>

<h2>10. Important safety points</h2>
<p><strong>Hypertonic saline:</strong> Requires specialist input and monitoring. Do not start this management independently — discuss with a senior and obtain expert help. It is used only in severe symptomatic hyponatraemia, irrespective of fluid status.</p>
<p><strong>Avoid rapid correction:</strong> For acute/chronic hyponatraemia, do not correct sodium by ≥10 mmol/L per 24 hours because of the risk of central pontine myelinolysis (osmotic demyelination).</p>
<p><strong>Common FY trap:</strong> Aiming to “normalise” sodium quickly because the number looks worrying. Controlled correction and senior oversight protect the patient more than a faster rise.</p>

<h2>The Foundation doctor hyponatraemia framework</h2>
<p><strong>LOW SODIUM → PLASMA OSMOLALITY → VOLUME STATUS → URINARY Na / URINARY OSMOLALITY → CAUSE → BROAD MANAGEMENT → AVOID RAPID CORRECTION</strong></p>

<h2>The key message</h2>
<p>The algorithm is built around classification. Work out whether the hyponatraemia is isotonic, hypotonic or hypertonic, then use volume status and the relevant urine test to narrow the cause before choosing the broad management approach.</p>

<p><em>Educational note: This article is for Foundation doctor education. For an individual patient, use ${sourceLink(NICE_CKS, 'NICE CKS hyponatraemia')}, local NHS hyponatraemia guidance and senior/endocrine advice. Content for this version was updated from the clinical information visible in the supplied hyponatraemia management images.</em></p>
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
  const causes = await uploadPngFromSvg(causesAlgorithmSvg(), 'hyponatraemia-causes-algorithm')
  const siadh = await uploadPngFromSvg(siadhCausesSvg(), 'causes-of-siadh-infographic')
  const management = await uploadPngFromSvg(
    generalManagementSvg(),
    'hyponatraemia-general-management'
  )

  const content = buildContent({ causes, siadh, management })
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
