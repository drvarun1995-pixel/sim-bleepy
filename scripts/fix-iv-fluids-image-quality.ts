/**
 * Re-upload IV fluids teaching images WITHOUT re-encoding (preserve attached bytes).
 * Cursor workspace attachments are often JPEG-in-.png; we detect format and upload as-is.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/fix-iv-fluids-image-quality.ts
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

const ASSETS = path.resolve(
  process.env.USERPROFILE || '',
  '.cursor/projects/c-Users-FrostBite-Desktop-V-V1-1-sim-bleepy/assets'
)

const SLUG = 'fy1-iv-fluid-prescribing'
const TOPIC = 'clerking-shifts'
const COHORT = 'fy1'
const FOLDER = `foundation-year/${COHORT}/${TOPIC}/${SLUG}/images`

const REPLACEMENTS: Array<{
  key: string
  local: string
  outBase: string
  oldBases: string[]
  alt?: string
}> = [
  {
    key: 'fiveRs',
    local:
      'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-735396f3-4294-46e4-b4aa-32757238e3ef.png',
    outBase: 'iv-fluids-5rs',
    oldBases: ['iv-fluids-5rs'],
    alt: '5 Rs of IV fluids (NICE CG174): resuscitation, routine maintenance, replacement, redistribution and reassessment',
  },
  {
    key: 'algorithm',
    local:
      'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-cf9236d1-b9ff-4b56-a880-83f05cce5353.png',
    outBase: 'iv-fluids-algorithm',
    oldBases: ['iv-fluids-algorithm'],
    alt: 'NICE algorithms for IV fluid therapy in adults: assessment, resuscitation, maintenance, replacement and redistribution',
  },
  {
    key: 'whyMatter',
    local:
      'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-0111b0ea-8113-4c32-a6f1-9b5f8a89cb1d.png',
    outBase: 'why-iv-fluids-matter',
    oldBases: ['why-iv-fluids-matter'],
  },
  {
    key: 'types',
    local:
      'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-203a7a7e-89f0-4452-9737-8b2464ef9dca.png',
    outBase: 'types-of-iv-fluids',
    oldBases: ['types-of-iv-fluids'],
  },
  {
    key: 'assess',
    local:
      'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-6bf46abe-397c-4675-8397-490807eac890.png',
    outBase: 'assess-before-prescribing',
    oldBases: ['assess-before-prescribing'],
  },
  {
    key: 'resus',
    local:
      'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-5c248b69-f5b2-41a1-ad36-763131470867.png',
    outBase: 'resuscitation-boluses',
    oldBases: ['resuscitation-boluses'],
  },
  {
    key: 'maintenance',
    local:
      'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-d58f5f56-398f-4863-afca-efe4d3d8f1f2.png',
    outBase: 'maintenance-replacement-calc',
    oldBases: ['maintenance-replacement-calc'],
  },
  {
    key: 'losses',
    local:
      'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-447352b5-9935-4a0e-816f-4c970a83835d.png',
    outBase: 'fluid-losses-tables',
    oldBases: ['fluid-losses-tables'],
  },
  {
    key: 'wellskySearch',
    local:
      'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-587a8728-6a99-460d-8984-c2668aa74f63.png',
    outBase: 'wellsky-search-protocol',
    oldBases: ['wellsky-search-protocol'],
  },
  {
    key: 'wellskyVolume',
    local:
      'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-993fd212-fb38-434c-8aeb-2aa9701bb366.png',
    outBase: 'wellsky-select-volume',
    oldBases: ['wellsky-select-volume'],
  },
  {
    key: 'wellskyRate',
    local:
      'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-8a135d96-4a3f-4916-968a-4e9897fdd71f.png',
    outBase: 'wellsky-order-entry-rate',
    oldBases: ['wellsky-order-entry-rate'],
  },
  {
    key: 'wellskyConfirm',
    local:
      'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-c8bc652a-a9b0-4dea-9236-a4c8f9b2d71c.png',
    outBase: 'wellsky-confirmation',
    oldBases: ['wellsky-confirmation'],
  },
]

function contentTypeFor(format?: string) {
  if (format === 'jpeg' || format === 'jpg') return { ext: 'jpg', type: 'image/jpeg' }
  if (format === 'webp') return { ext: 'webp', type: 'image/webp' }
  if (format === 'png') return { ext: 'png', type: 'image/png' }
  return { ext: 'png', type: 'image/png' }
}

async function main() {
  const { data: page, error } = await sb
    .from('fy_pages')
    .select('id, content, fy_topics!inner(cohort)')
    .eq('slug', SLUG)
    .eq('fy_topics.cohort', COHORT)
    .maybeSingle()
  if (error || !page) throw error || new Error('IV fluids page not found in fy1')

  let content = page.content || ''
  let uploaded = 0

  for (const item of REPLACEMENTS) {
    const localPath = path.join(ASSETS, item.local)
    if (!fs.existsSync(localPath)) {
      console.warn(`SKIP missing ${item.key}`)
      continue
    }

    const raw = fs.readFileSync(localPath)
    const meta = await sharp(raw).metadata()
    const { ext, type } = contentTypeFor(meta.format)
    const outName = `${item.outBase}.${ext}`
    const storagePath = `${FOLDER}/${outName}`

    // Remove prior degraded variants
    const remove = [
      ...item.oldBases.flatMap((b) => [
        `${FOLDER}/${b}.webp`,
        `${FOLDER}/${b}.png`,
        `${FOLDER}/${b}.jpg`,
        `${FOLDER}/${b}.jpeg`,
      ]),
      storagePath,
    ]
    await sb.storage.from('placements').remove(remove)

    // Upload original bytes — no sharp re-encode
    const { error: upErr } = await sb.storage.from('placements').upload(storagePath, raw, {
      contentType: type,
      upsert: true,
      cacheControl: '3600',
    })
    if (upErr) throw new Error(`Upload ${outName}: ${upErr.message}`)
    console.log(
      `OK ${item.key} → ${storagePath} (${raw.length} bytes, ${meta.width}x${meta.height} ${meta.format})`
    )
    uploaded += 1

    for (const base of item.oldBases) {
      content = content.replaceAll(`${base}.webp`, outName)
      content = content.replaceAll(`${base}.png`, outName)
      content = content.replaceAll(`${base}.jpg`, outName)
      content = content.replaceAll(`${base}.jpeg`, outName)
    }

    if (item.alt) {
      const esc = outName.replace('.', '\\.')
      content = content.replace(
        new RegExp(`(src="[^"]*${esc}"[^>]*alt=")([^"]*)(")`, 'i'),
        `$1${item.alt}$3`
      )
      content = content.replace(
        new RegExp(`(alt=")([^"]*)("[^>]*src="[^"]*${esc}")`, 'i'),
        `$1${item.alt}$3`
      )
    }
  }

  const { error: updErr } = await sb
    .from('fy_pages')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', page.id)
  if (updErr) throw updErr

  console.log(`Updated page ${page.id}; uploaded ${uploaded} originals`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
