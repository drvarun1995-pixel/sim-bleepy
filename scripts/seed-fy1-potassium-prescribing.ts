/**
 * Seed public FY guide:
 * "How to Prescribe Potassium Safely as an FY1"
 *
 * Cohort: general only (public /guides SEO). Topic: clerking-shifts.
 * Featured: unique Bleepy logo card. Inline: 3 educational infographics.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-fy1-potassium-prescribing.ts
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

const TITLE = 'How to Prescribe Potassium Safely as an FY1: A Practical Guide'
const FEATURED_TITLE = 'PRESCRIBE POTASSIUM SAFELY'
const SLUG = 'fy1-potassium-prescribing-hypokalaemia'
const TOPIC_SLUG = 'clerking-shifts'
const IMAGE_DIR = `foundation-year/general/${TOPIC_SLUG}/${SLUG}/images`

const ASSETS_DIR = path.resolve(
  process.env.USERPROFILE || '',
  '.cursor/projects/c-Users-FrostBite-Desktop-V-V1-1-sim-bleepy/assets'
)
const LOGO = path.resolve('public/Bleepy-Logo-128.webp')

const LOCAL = {
  checklist: path.join(ASSETS_DIR, 'potassium-prescribing-checklist.png'),
  compare: path.join(ASSETS_DIR, 'hypokalaemia-vs-hyperkalaemia.png'),
  pathway: path.join(ASSETS_DIR, 'fy1-potassium-replacement-pathway.png'),
  algorithm: path.join(
    ASSETS_DIR,
    'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-472f37d6-fe95-4e90-824d-c1da10965b2d.png'
  ),
}

const WORCS_ALGORITHM_URL =
  'https://apps.worcsacute.nhs.uk/KeyDocumentPortal/Home/DownloadFile/1563'

const W = 1280
const H = 720

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
    } else {
      cur = next
    }
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

function potassiumPropsSvg(): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <!-- lab result card left -->
  <g transform="translate(220,250)">
    <rect x="0" y="10" width="200" height="220" rx="14" fill="#F8FAFC" stroke="#1E3A5F" stroke-width="6"/>
    <rect x="0" y="10" width="200" height="44" rx="14" fill="#0F766E"/>
    <rect x="0" y="40" width="200" height="14" fill="#0F766E"/>
    <text x="100" y="40" text-anchor="middle" font-family="Arial" font-size="18" font-weight="800" fill="#ffffff">U&amp;E</text>
    <text x="24" y="90" font-family="Arial" font-size="16" font-weight="700" fill="#334155">Na 138</text>
    <text x="24" y="122" font-family="Arial" font-size="20" font-weight="900" fill="#DC2626">K  2.9 ↓</text>
    <text x="24" y="154" font-family="Arial" font-size="16" font-weight="700" fill="#334155">Creat 78</text>
    <text x="24" y="186" font-family="Arial" font-size="14" font-weight="600" fill="#64748B">mmol/L</text>
  </g>
  <!-- K+ capsule / vial right -->
  <g transform="translate(860,250)">
    <rect x="40" y="20" width="90" height="200" rx="28" fill="#E0E7FF" stroke="#3730A3" stroke-width="6"/>
    <rect x="40" y="20" width="90" height="70" rx="28" fill="#4F46E5"/>
    <rect x="40" y="70" width="90" height="20" fill="#4F46E5"/>
    <text x="85" y="65" text-anchor="middle" font-family="Arial Black, Arial" font-size="28" font-weight="900" fill="#ffffff">K+</text>
    <rect x="58" y="110" width="54" height="12" rx="4" fill="#A5B4FC"/>
    <rect x="58" y="136" width="54" height="12" rx="4" fill="#C7D2FE"/>
    <rect x="58" y="162" width="40" height="12" rx="4" fill="#A5B4FC"/>
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
  const banners = await sharp(bannerSvg(lines, 'CLINICAL SKILLS', 'CLERKING SHIFTS'))
    .png()
    .toBuffer()
  const props = await sharp(potassiumPropsSvg()).png().toBuffer()

  return sharp({
    create: {
      width: W,
      height: H,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
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

function viewUrl(storagePath: string) {
  return `/api/placements/images/view?path=${encodeURIComponent(storagePath)}`
}

function figure(
  storagePath: string,
  alt: string,
  caption?: string,
  sourceHtml?: string
) {
  const img = `<p style="text-align:center"><img src="${viewUrl(storagePath)}" alt="${alt.replace(/"/g, '&quot;')}" width="1280" loading="lazy" decoding="async" class="fy-img fy-img-wide" /></p>`
  const source = sourceHtml ? `\n${sourceHtml}` : ''
  if (!caption && !sourceHtml) return img
  if (!caption) return `<figure class="fy-figure">${img}${source}</figure>`
  return `<figure class="fy-figure">${img}${source}<figcaption>${caption}</figcaption></figure>`
}

async function uploadBuffer(
  storagePath: string,
  buffer: Buffer,
  contentType = 'image/webp'
): Promise<string> {
  const { error } = await sb.storage.from('placements').upload(storagePath, buffer, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw new Error(`Upload failed ${storagePath}: ${error.message}`)
  console.log('  uploaded', storagePath)
  return storagePath
}

async function uploadLocalOriginal(localPath: string, outBase: string): Promise<string> {
  if (!fs.existsSync(localPath)) throw new Error(`Missing local asset: ${localPath}`)
  const raw = fs.readFileSync(localPath)
  const meta = await sharp(raw).metadata()
  const format = meta.format || 'png'
  const ext = format === 'jpeg' ? 'jpg' : format
  const type =
    format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png'
  return uploadBuffer(`${IMAGE_DIR}/${outBase}.${ext}`, raw, type)
}

type ImgPaths = {
  checklist: string
  compare: string
  pathway: string
  algorithm: string
}

function sourceLink(href: string, label: string) {
  return `<p class="fy-image-source" style="text-align:center;margin-top:0.25rem;margin-bottom:0.5rem;font-size:0.9rem"><strong>Source:</strong> <a class="fy-source-link" href="${href}" target="_blank" rel="noopener noreferrer">${label}</a></p>`
}

function buildContent(imgs: ImgPaths) {
  return `
<p>A practical guide for FY1 doctors on safe potassium prescribing — hypokalaemia assessment, oral and IV replacement, renal function, ECGs, monitoring and hyperkalaemia.</p>

<p>You are checking the morning blood results when you spot:</p>
<p><strong>Potassium: 2.9 mmol/L</strong></p>
<p>The patient looks well. They have had diarrhoea for two days and are taking furosemide.</p>
<p>As an FY1, it is tempting to immediately think: <em>“I need to prescribe some potassium.”</em></p>
<p>But safe potassium prescribing starts one step earlier.</p>
<p>Why is the potassium low, how urgently does it need correcting, and can this patient safely receive potassium?</p>
<p>Potassium abnormalities matter because both too little and too much potassium can cause dangerous cardiac arrhythmias. Your aim is not simply to move a laboratory number back into the normal range. You need to understand the cause, choose an appropriate route of replacement and make sure somebody checks what happens afterwards.</p>

<h2>First: how low is the potassium?</h2>
<p>Hypokalaemia means a potassium below the normal laboratory range. As the potassium falls, the risk of symptoms and cardiac complications increases. A potassium below 2.5 mmol/L should be treated as urgent, particularly when accompanied by symptoms or ECG abnormalities.</p>
<ul>
  <li>Muscle weakness or cramps</li>
  <li>Palpitations</li>
  <li>Light-headedness</li>
  <li>Constipation</li>
  <li>Hyporeflexia</li>
  <li>Arrhythmias</li>
</ul>
<p>The number alone does not tell the whole story. A clinically well patient with potassium 3.2 mmol/L is very different from a patient with potassium 2.3 mmol/L who has palpitations and ECG changes.</p>

<h2>Before prescribing potassium, ask six questions</h2>
${figure(
  imgs.checklist,
  'Six safety checks before prescribing potassium replacement',
  'Potassium replacement should follow a clinical assessment rather than an isolated blood result.'
)}

<h3>1. Is the result genuine?</h3>
<p>Look at the potassium trend. Has it fallen 3.8 → 3.3 → 2.9 mmol/L? That makes a genuine abnormality much more likely. Always interpret blood results in the context of previous values and the patient’s clinical condition.</p>

<h3>2. Why is the potassium low?</h3>
<ul>
  <li>Vomiting</li>
  <li>Diarrhoea</li>
  <li>NG losses</li>
  <li>High-output stomas or fistulae</li>
  <li>Loop or thiazide diuretics</li>
  <li>Poor intake</li>
  <li>Alkalosis</li>
  <li>Renal potassium loss</li>
</ul>
<p>GI fluids can contain significant potassium, so a patient with substantial gastrointestinal losses may continue losing potassium even while you are replacing it.</p>
<p><strong>FY1 tip:</strong> Do not spend three days replacing potassium without asking why it keeps falling. Treat the cause as well as the number.</p>

<h3>3. What are the kidneys doing?</h3>
<p>Before giving potassium, check: creatinine → renal function → urine output → potassium trend.</p>
<p>Potassium is normally excreted through the kidneys. If renal function deteriorates or the patient becomes oliguric, potassium can accumulate rapidly. Giving repeated potassium replacement without noticing an AKI can convert hypokalaemia into dangerous hyperkalaemia.</p>
<p>Be particularly cautious when the patient has:</p>
<ul>
  <li>Acute kidney injury</li>
  <li>Significant chronic kidney disease</li>
  <li>Reduced urine output</li>
  <li>A rapidly changing creatinine</li>
</ul>
<p>If you are unsure, ask a senior before prescribing further replacement.</p>

<h3>4. What is the magnesium?</h3>
<p>Hypomagnesaemia can coexist with hypokalaemia and can make potassium difficult to correct. If a patient’s potassium stubbornly remains low despite repeated replacement, check whether the magnesium is also low.</p>
<p><strong>FY1 tip:</strong> Low K that won’t correct? Check Mg.</p>

<h3>5. Does the patient need an ECG?</h3>
<p>Hypokalaemia can produce ECG abnormalities including:</p>
<ul>
  <li>Flattened or inverted T waves</li>
  <li>Prominent U waves</li>
  <li>ST depression</li>
  <li>PR prolongation</li>
</ul>
<p>The risk becomes more concerning with severe hypokalaemia, symptoms or underlying cardiac disease. Hypokalaemia can also exacerbate digoxin toxicity. If the potassium is severely low, the patient has palpitations, syncope or other concerning symptoms, or you are worried clinically, obtain an ECG and involve a senior.</p>

<h3>6. Can I replace this orally?</h3>
<p>For a stable patient who can swallow and absorb medication, oral replacement is often the simpler and safer option. Do not choose IV potassium simply because the patient already has a cannula.</p>
<p>Think about:</p>
<ul>
  <li>How low the potassium is</li>
  <li>Whether they are symptomatic</li>
  <li>Whether they can swallow</li>
  <li>Whether their gut is functioning</li>
  <li>How urgently correction is required</li>
  <li>Renal function</li>
</ul>
<p>A stable patient with mild hypokalaemia usually does not need aggressive IV replacement. Use the potassium preparation and dose specified in your hospital prescribing guidance or BNF.</p>

<h2>When might IV potassium be needed?</h2>
<p>IV replacement becomes more relevant when potassium is significantly low, oral treatment cannot be used, the patient is symptomatic or more rapid correction is required. This is where extra caution is needed.</p>
<p><strong>Never give IV potassium as a rapid bolus.</strong></p>
<p>Potassium must be appropriately diluted and infused at a controlled rate. Potassium-containing IV fluids commonly contain 20 mmol/L or 40 mmol/L, with 40 mmol/L used as a practical maximum concentration for peripheral administration in many settings. Particular caution is needed in renal failure.</p>
<p>Where potassium-containing ready-prepared bags are available, these are preferable to improvising your own mixture.</p>
<p><strong>FY1 rule:</strong> If you are considering an unfamiliar concentration, rapid potassium administration, central-line potassium or aggressive correction of severe hypokalaemia, stop and speak to a senior. Do not improvise.</p>

<h2>Prescribe potassium with a plan</h2>
${figure(
  imgs.pathway,
  'Step-by-step potassium replacement pathway for FY1 doctors',
  'Safe potassium prescribing is a cycle: investigate, replace appropriately and always recheck.'
)}
<p>Before signing the prescription, you should be able to answer:</p>
<ul>
  <li>Why am I replacing potassium?</li>
  <li>Which route am I using?</li>
  <li>How much am I giving?</li>
  <li>How quickly?</li>
  <li>When will the potassium be checked again?</li>
</ul>
<p>That last question is crucial. Potassium replacement without repeat bloods is an incomplete prescription.</p>

<h2>Recheck rather than repeatedly prescribing</h2>
<p>After replacement, review:</p>
<ul>
  <li>Repeat potassium</li>
  <li>Renal function</li>
  <li>Magnesium</li>
  <li>Urine output</li>
  <li>Ongoing losses</li>
  <li>ECG where clinically indicated</li>
</ul>
<p>If the repeat blood is due after your shift, make sure it is explicitly handed over.</p>
<p><strong>Poor handover:</strong> “Check U&amp;Es.”</p>
<p><strong>Better handover:</strong> “Potassium was 2.7 mmol/L and has been replaced. Repeat U&amp;E due at 22:00 — please review potassium and renal function before any further replacement.”</p>

<h2>Hypokalaemia management algorithm</h2>
<p>The flowchart below summarises a practical adult hypokalaemia pathway used in NHS teaching materials (severity bands, oral vs IV options, monitoring and when to seek specialist advice). Always follow your own trust guideline and the current BNF for exact preparations and rates.</p>
${figure(
  imgs.algorithm,
  'Flow chart for the management of hypokalaemia in adult patients, showing mild, moderate and severe pathways with monitoring advice',
  'Adult hypokalaemia management algorithm — severity-based oral/IV replacement, magnesium replacement, monitoring and specialist referral.',
  sourceLink(
    WORCS_ALGORITHM_URL,
    'Worcestershire Acute Hospitals NHS Trust hypokalaemia guideline (WAHT-PHA-020)'
  )
)}

<h2>Do not forget the opposite problem: hyperkalaemia</h2>
${figure(
  imgs.compare,
  'Comparison of hypokalaemia and hyperkalaemia for FY1 doctors',
  'Both hypokalaemia and hyperkalaemia can cause dangerous cardiac complications, so potassium replacement requires monitoring.'
)}
<p>Safe potassium prescribing also means recognising when you need to stop giving potassium. Renal failure, potassium-sparing medications, acidosis and excessive potassium therapy can all contribute to hyperkalaemia.</p>
<p>A practical acute hyperkalaemia framing divides results into:</p>
<ul>
  <li><strong>K 5.5–5.9 mmol/L:</strong> usually investigate the cause rather than automatically giving acute treatment</li>
  <li><strong>K 6.0–6.4 mmol/L:</strong> moderate hyperkalaemia</li>
  <li><strong>K &gt;6.5 mmol/L:</strong> severe hyperkalaemia and an emergency</li>
</ul>
<p>For K ≥6.0 mmol/L, obtain a 12-lead ECG and monitor cardiac rhythm. Look for ECG features such as:</p>
<ul>
  <li>Peaked T waves</li>
  <li>Flattened or absent P waves</li>
  <li>Broadening QRS</li>
  <li>Bradycardia</li>
  <li>Sine-wave pattern</li>
  <li>Ventricular arrhythmias</li>
</ul>
<p>A surprising high potassium in a clinically well patient should also make you consider pseudohyperkalaemia, particularly if the sample was haemolysed.</p>
<p><strong>FY1 tip:</strong> If potassium suddenly jumps after replacement, stop and reassess: review the patient, renal function and ECG; consider whether the sample could be haemolysed; and escalate appropriately. Severe hyperkalaemia, ECG changes or an unwell patient should trigger urgent senior involvement.</p>

<h2>A practical FY1 example</h2>
<p>Imagine the potassium is 2.9 mmol/L. The patient is clinically stable. You establish:</p>
<ul>
  <li>Potassium was 3.2 yesterday</li>
  <li>They have ongoing diarrhoea</li>
  <li>Creatinine is stable</li>
  <li>Urine output is normal</li>
  <li>Magnesium is acceptable</li>
  <li>No concerning symptoms</li>
  <li>They can take oral medication</li>
</ul>
<ul>
  <li><strong>Is it genuine?</strong> Yes.</li>
  <li><strong>Why is it low?</strong> Likely GI losses.</li>
  <li><strong>Are the kidneys working?</strong> Yes.</li>
  <li><strong>Any magnesium problem?</strong> No.</li>
  <li><strong>Cardiac concern?</strong> No obvious concern.</li>
  <li><strong>What next?</strong> Replace according to appropriate prescribing guidance, treat ongoing losses and arrange repeat bloods.</li>
</ul>
<p>That is far safer than: “K 2.9 → prescribe potassium.”</p>

<h2>The FY1 potassium rule</h2>
<p><strong>Confirm → Find the cause → Check severity → Check kidneys → Check magnesium → Consider ECG → Choose oral or IV → Replace → Recheck</strong></p>
<p>Perhaps the single most important rule is:</p>
<p><strong>Never prescribe potassium without knowing the patient’s potassium, renal function and plan for repeat bloods.</strong></p>
<p>Potassium prescribing becomes much safer when you stop seeing potassium as something that simply needs “topping up” and start treating it like any other clinically important prescription. If the potassium is severely abnormal, the patient has ECG changes, renal function is deteriorating, replacement requirements are unusually high, or you are unsure what to prescribe, involve your senior early.</p>

<p><em>Educational note: This article is intended for Foundation doctors as an educational guide. Always use the current BNF and your local prescribing policy for exact potassium preparations, concentrations, infusion rates and monitoring requirements, and seek senior advice when appropriate.</em></p>
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
    display_order: 55,
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
  for (const [key, p] of Object.entries(LOCAL)) {
    if (!fs.existsSync(p)) throw new Error(`Missing asset ${key}: ${p}`)
  }

  console.log('Composing unique featured Bleepy card...')
  const featuredWebp = await composeFeaturedLogoCard()
  const featuredPath = `${IMAGE_DIR}/featured-bleepy-logo.webp`
  await uploadBuffer(featuredPath, featuredWebp, 'image/webp')

  console.log('Uploading teaching images (original bytes)...')
  const checklist = await uploadLocalOriginal(LOCAL.checklist, 'potassium-prescribing-checklist')
  const compare = await uploadLocalOriginal(LOCAL.compare, 'hypokalaemia-vs-hyperkalaemia')
  const pathway = await uploadLocalOriginal(LOCAL.pathway, 'fy1-potassium-replacement-pathway')
  const algorithm = await uploadLocalOriginal(LOCAL.algorithm, 'hypokalaemia-management-algorithm')

  const content = buildContent({ checklist, compare, pathway, algorithm })

  console.log('\n=== cohort general')
  const { data: topic, error } = await sb
    .from('fy_topics')
    .select('id, name')
    .eq('cohort', 'general')
    .eq('slug', TOPIC_SLUG)
    .maybeSingle()

  if (error || !topic) {
    throw new Error(`topic ${TOPIC_SLUG} missing for general: ${error?.message || 'not found'}`)
  }

  await upsertPage(topic.id, content, featuredPath)
  console.log(`  placements: /placements/foundation-year/general/${TOPIC_SLUG}/${SLUG}`)
  console.log(`  public:     /guides/foundation-year/${TOPIC_SLUG}/${SLUG}`)
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
