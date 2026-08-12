/**
 * Upload DNACPR form PDF and fix the empty download section on the DNAR post.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/fix-fy-dnar-pdf-download.ts
 */
import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const LOCAL_PDF = path.resolve(
  'C:/Users/FrostBite/Downloads/DNACPR-PDF-Form-Download.pdf'
)
const SLUG = 'dnar-dnacpr-rules-for-doctors-fy-guide'
const STORAGE_PATH =
  'foundation-year/basildon/local-systems/dnar-dnacpr-rules-for-doctors-fy-guide/files/dnacpr-form.pdf'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function downloadCardHtml(filePath: string): string {
  const href = `/api/placements/images/view?path=${encodeURIComponent(filePath)}&download=${encodeURIComponent('DNACPR-form.pdf')}`
  return `<div class="fy-download">
<span class="fy-download-badge" aria-hidden="true">PDF</span>
<div class="fy-download-body">
<p class="fy-download-title">DNACPR form</p>
<p class="fy-download-meta">Printable DNACPR / DNAR form for ward use. Open or save the PDF.</p>
</div>
<a class="fy-download-btn" href="${href}">Download PDF</a>
</div>`
}

async function main() {
  if (!fs.existsSync(LOCAL_PDF)) {
    throw new Error(`PDF not found: ${LOCAL_PDF}`)
  }
  const pdf = fs.readFileSync(LOCAL_PDF)
  console.log('Uploading', STORAGE_PATH, `(${pdf.length} bytes)`)

  await sb.storage.from('placements').remove([STORAGE_PATH])
  const { error: upErr } = await sb.storage.from('placements').upload(STORAGE_PATH, pdf, {
    contentType: 'application/pdf',
    upsert: true,
  })
  if (upErr) throw upErr
  console.log('  uploaded')

  const { data: page, error } = await sb
    .from('fy_pages')
    .select('id, slug, content')
    .eq('slug', SLUG)
    .maybeSingle()
  if (error) throw error
  if (!page) throw new Error(`Page not found: ${SLUG}`)

  let html = page.content || ''
  const card = downloadCardHtml(STORAGE_PATH)

  const broken =
    /<h2[^>]*>\s*DNACPR Form PDF Download\s*<\/h2>\s*<p[^>]*>[\s\S]*?Download[\s\S]*?<\/p>/i
  if (broken.test(html)) {
    html = html.replace(broken, `<h2>DNACPR Form PDF Download</h2>${card}`)
  } else if (!html.includes('fy-download') && !html.includes(STORAGE_PATH)) {
    // Fallback: insert after the heading if present
    html = html.replace(
      /(<h2[^>]*>\s*DNACPR Form PDF Download\s*<\/h2>)/i,
      `$1${card}`
    )
  } else if (html.includes('fy-download')) {
    html = html.replace(/<div class="fy-download">[\s\S]*?<\/div>/i, card)
  }

  const { error: updErr } = await sb
    .from('fy_pages')
    .update({
      content: html,
      requires_auth: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', page.id)
  if (updErr) throw updErr

  console.log('Updated', SLUG)
  console.log('Download path:', STORAGE_PATH)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
