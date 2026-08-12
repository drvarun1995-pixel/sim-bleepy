/**
 * Embed DNACPR PDF in-post + restore the download card underneath.
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
const STORAGE_PDF =
  'foundation-year/basildon/local-systems/dnar-dnacpr-rules-for-doctors-fy-guide/files/dnacpr-form.pdf'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function sectionHtml(filePath: string): string {
  const viewHref = `/api/placements/images/view?path=${encodeURIComponent(filePath)}`
  const downloadHref = `${viewHref}&download=${encodeURIComponent('DNACPR-form.pdf')}`
  return `<div class="fy-pdf-embed" data-fy-pdf-src="${viewHref}">
<embed class="fy-pdf-frame" src="${viewHref}#toolbar=1&navpanes=0&view=FitH" type="application/pdf" title="DNACPR form PDF" />
</div>
<div class="fy-download">
<span class="fy-download-badge" aria-hidden="true">PDF</span>
<div class="fy-download-body">
<p class="fy-download-title">DNACPR form</p>
<p class="fy-download-meta">Printable DNACPR / DNAR form for ward use. Open or save the PDF.</p>
</div>
<a class="fy-download-btn" href="${downloadHref}">Download PDF</a>
</div>`
}

async function main() {
  if (fs.existsSync(LOCAL_PDF)) {
    const pdf = fs.readFileSync(LOCAL_PDF)
    await sb.storage.from('placements').remove([STORAGE_PDF])
    const { error: upErr } = await sb.storage.from('placements').upload(STORAGE_PDF, pdf, {
      contentType: 'application/pdf',
      upsert: true,
    })
    if (upErr) throw upErr
    console.log('Uploaded PDF', STORAGE_PDF, `(${pdf.length} bytes)`)
  }

  const { data: page, error } = await sb
    .from('fy_pages')
    .select('id, content')
    .eq('slug', SLUG)
    .maybeSingle()
  if (error) throw error
  if (!page) throw new Error(`Page not found: ${SLUG}`)

  let html = page.content || ''
  const section = sectionHtml(STORAGE_PDF)

  const sectionRe =
    /<h2[^>]*>\s*DNACPR Form PDF Download\s*<\/h2>(?:\s*(?:<div class="fy-pdf-embed"[\s\S]*?<\/div>|<div class="fy-pdf-pages">[\s\S]*?<\/div>|<div class="fy-download">[\s\S]*?<\/div>|<a\b[^>]*class="[^"]*fy-download-btn[^"]*"[^>]*>[\s\S]*?<\/a>|<p[^>]*>[\s\S]*?Download[\s\S]*?<\/p>))*/i

  if (sectionRe.test(html)) {
    html = html.replace(sectionRe, `<h2>DNACPR Form PDF Download</h2>${section}`)
  } else {
    html = html.replace(
      /(<h2[^>]*>\s*DNACPR Form PDF Download\s*<\/h2>)/i,
      `$1${section}`
    )
  }

  // Drop page-image experiment leftovers only
  html = html.replace(/<div class="fy-pdf-pages">[\s\S]*?<\/div>/gi, '')

  const { error: updErr } = await sb
    .from('fy_pages')
    .update({
      content: html,
      requires_auth: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', page.id)
  if (updErr) throw updErr

  console.log('Updated section: PDF embed + download card for', SLUG)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
