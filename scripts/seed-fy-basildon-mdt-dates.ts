/**
 * Seed members-only Basildon MDT dates page.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-fy-basildon-mdt-dates.ts
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

const TITLE = 'MDT Dates at Basildon Hospital'
const FEATURED_TITLE = 'MDT DATES'
const SLUG = 'mdt-dates-basildon-hospital'
const COHORT = 'basildon'
const TOPIC_SLUG = 'local-systems'
const META =
  'Members-only Basildon MDT timetable for foundation doctors — specialty meeting days, times and which lists are held at Addenbrooke’s.'
const IMAGE_DIR = `foundation-year/${COHORT}/${TOPIC_SLUG}/${SLUG}/images`
const FEATURED_PATH = `${IMAGE_DIR}/featured-bleepy.webp`
const LOGO = path.resolve('public/Bleepy-Logo-128.webp')
const W = 1280
const H = 720

const CONTENT = `<p>A local timetable of multidisciplinary team (MDT) meetings for foundation doctors at Basildon Hospital.</p>
<p>Use this to plan when to attend, prepare a patient, or check when a specialty discusses cases. Confirm the current time and room with the team, as lists can change.</p>
<aside class="fy-callout fy-callout-trap" role="note"><p><strong>Note:</strong> Hepatobiliary MDTs (cirrhosis and PBC) are held at <strong>Addenbrooke’s</strong>, not on the Basildon site.</p></aside>
<h2>MDT timetable</h2>
<table>
  <thead>
    <tr><th>MDT</th><th>When does it take place?</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Cardiology (CTC)</strong></td><td>Monday, Wednesday and Friday every week</td></tr>
    <tr><td><strong>Endocrine</strong></td><td>Every 2 weeks on a Wednesday (2nd and 4th weeks of the month)</td></tr>
    <tr><td><strong>Gynaecology</strong></td><td>Every Wednesday</td></tr>
    <tr>
      <td><strong>Hepatobiliary</strong></td>
      <td>
        <ul>
          <li>Cirrhosis MDT — weekly</li>
          <li>Primary biliary cholangitis (PBC) MDT — once a month</li>
        </ul>
        <p>Both held at Addenbrooke’s.</p>
      </td>
    </tr>
    <tr><td><strong>IBD</strong></td><td>Every 2 weeks on a Friday</td></tr>
    <tr><td><strong>Lower GI and Pelvic</strong></td><td>Every Tuesday</td></tr>
    <tr>
      <td><strong>Neurology</strong></td>
      <td>
        <ul>
          <li>Neuroradiology MDT — alternate Tuesdays, 13:00–14:00</li>
          <li>MDT with epilepsy and Parkinson’s disease CNS — alternate Thursdays, 14:30–15:30</li>
          <li>Neurology MDT — every Friday afternoon, 14:30–15:30</li>
        </ul>
      </td>
    </tr>
    <tr><td><strong>Orthopaedic</strong></td><td>Trauma meeting every morning</td></tr>
    <tr>
      <td><strong>Respiratory</strong></td>
      <td>
        <ul>
          <li>Pre-lung MDT — every Thursday</li>
          <li>Lung MDT — every Monday, 08:00</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Rheumatology</strong></td>
      <td>
        <ul>
          <li>Radiology MDT — 1st and 2nd Friday each month</li>
          <li>Combined renal–rheumatology MDT — every 4th Wednesday</li>
          <li>Osteoporosis CKD-MBD MDT — once a month</li>
          <li>Combined dermatology–rheumatology MDT — every 3 months</li>
        </ul>
      </td>
    </tr>
    <tr><td><strong>Urology</strong></td><td>Every Thursday</td></tr>
    <tr><td><strong>Vascular</strong></td><td>Every Wednesday</td></tr>
  </tbody>
</table>
<aside class="fy-callout fy-callout-tip" role="note"><p><strong>Tip:</strong> If you need a patient discussed, ask the specialty team or CNS how to add them to that week’s list. This page does not replace the official MDT list.</p></aside>`

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function bannerSvg(title: string): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="90" y="28" width="1100" height="92" rx="18" fill="#F25006"/>
  <text x="640" y="88" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="46" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(title)}</text>
  <rect x="160" y="560" width="960" height="110" rx="18" fill="#EBA400"/>
  <text x="640" y="605" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="1">BASILDON-ONLY</text>
  <text x="640" y="648" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="1">FOUNDATION YEAR</text>
</svg>`)
}

function calendarSvg(): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(470,210)">
    <rect x="0" y="28" width="340" height="280" rx="28" fill="#EFF6FF" stroke="#2563EB" stroke-width="8"/>
    <rect x="0" y="28" width="340" height="72" rx="28" fill="#2563EB"/>
    <rect x="0" y="72" width="340" height="28" fill="#2563EB"/>
    <circle cx="70" cy="28" r="16" fill="#1E3A8A"/>
    <circle cx="270" cy="28" r="16" fill="#1E3A8A"/>
    <text x="170" y="78" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#ffffff">MDT</text>
    <rect x="48" y="130" width="54" height="46" rx="8" fill="#DBEAFE"/>
    <rect x="118" y="130" width="54" height="46" rx="8" fill="#93C5FD"/>
    <rect x="188" y="130" width="54" height="46" rx="8" fill="#DBEAFE"/>
    <rect x="258" y="130" width="54" height="46" rx="8" fill="#DBEAFE"/>
    <rect x="48" y="192" width="54" height="46" rx="8" fill="#DBEAFE"/>
    <rect x="118" y="192" width="54" height="46" rx="8" fill="#DBEAFE"/>
    <rect x="188" y="192" width="54" height="46" rx="8" fill="#93C5FD"/>
    <rect x="258" y="192" width="54" height="46" rx="8" fill="#DBEAFE"/>
    <rect x="48" y="254" width="54" height="32" rx="8" fill="#DBEAFE"/>
    <rect x="118" y="254" width="54" height="32" rx="8" fill="#DBEAFE"/>
    <rect x="188" y="254" width="54" height="32" rx="8" fill="#DBEAFE"/>
  </g>
</svg>`)
}

async function composeFeatured(): Promise<Buffer> {
  if (!fs.existsSync(LOGO)) throw new Error(`Missing logo: ${LOGO}`)
  const logo = await sharp(LOGO)
    .resize(220, 220, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
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
  const banners = await sharp(bannerSvg(FEATURED_TITLE)).png().toBuffer()
  const calendar = await sharp(calendarSvg()).png().toBuffer()
  return sharp({
    create: { width: W, height: H, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite([
      { input: watermarkSoft, top: 120, left: 290 },
      { input: calendar, top: 0, left: 0 },
      { input: logo, top: 248, left: 530 },
      { input: banners, top: 0, left: 0 },
    ])
    .webp({ quality: 90, effort: 5 })
    .toBuffer()
}

async function uploadBuffer(storagePath: string, body: Buffer, contentType: string) {
  const { error } = await sb.storage.from('placements').upload(storagePath, body, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw new Error(`Upload failed ${storagePath}: ${error.message}`)
  return storagePath
}

async function main() {
  const { data: existing } = await sb.from('fy_pages').select('id, slug').eq('slug', SLUG)
  if (existing && existing.length > 1) {
    throw new Error(`Multiple pages with slug ${SLUG}`)
  }

  const { data: topic, error: topicError } = await sb
    .from('fy_topics')
    .select('id')
    .eq('cohort', COHORT)
    .eq('slug', TOPIC_SLUG)
    .single()
  if (topicError || !topic) throw new Error(`Missing topic ${COHORT}/${TOPIC_SLUG}`)

  const { data: siblings } = await sb
    .from('fy_pages')
    .select('display_order')
    .eq('topic_id', topic.id)
    .order('display_order', { ascending: false })
    .limit(1)
  const displayOrder = existing?.[0]
    ? undefined
    : (siblings?.[0]?.display_order ?? 0) + 10

  const featuredWebp = await composeFeatured()
  await uploadBuffer(FEATURED_PATH, featuredWebp, 'image/webp')

  const payload: Record<string, unknown> = {
    topic_id: topic.id,
    title: TITLE,
    slug: SLUG,
    content: CONTENT,
    featured_image: FEATURED_PATH,
    status: 'published',
    is_active: true,
    requires_auth: true,
    meta_description: META,
    updated_at: new Date().toISOString(),
  }
  if (displayOrder !== undefined) payload.display_order = displayOrder

  if (existing?.[0]?.id) {
    let { error } = await sb.from('fy_pages').update(payload).eq('id', existing[0].id)
    if (error?.message?.includes('meta_description')) {
      delete payload.meta_description
      ;({ error } = await sb.from('fy_pages').update(payload).eq('id', existing[0].id))
    }
    if (error) throw error
    console.log(`updated ${existing[0].id}`)
  } else {
    let { data, error } = await sb.from('fy_pages').insert(payload).select('id').single()
    if (error?.message?.includes('meta_description')) {
      delete payload.meta_description
      ;({ data, error } = await sb.from('fy_pages').insert(payload).select('id').single())
    }
    if (error) throw error
    console.log(`created ${data!.id}`)
  }

  console.log(`/placements/foundation-year/${COHORT}/${TOPIC_SLUG}/${SLUG}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
