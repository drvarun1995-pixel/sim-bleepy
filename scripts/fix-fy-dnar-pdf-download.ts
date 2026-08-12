/**
 * Restore DNACPR PDF embed after CMS/editor flattening, keep download card.
 * Does not rewrite the rest of the article.
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SLUG = 'dnar-dnacpr-rules-for-doctors-fy-guide'
const STORAGE_PDF =
  'foundation-year/basildon/local-systems/dnar-dnacpr-rules-for-doctors-fy-guide/files/dnacpr-form.pdf'

function sectionHtml(filePath: string): string {
  const viewHref = `/api/placements/images/view?path=${encodeURIComponent(filePath)}`
  const downloadHref = `${viewHref}&download=${encodeURIComponent('DNACPR-form.pdf')}`
  return `<h2>DNACPR Form PDF Download</h2>
<div class="fy-pdf-embed" data-fy-pdf-src="${viewHref}">
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
  const { data: page, error } = await sb
    .from('fy_pages')
    .select('id, content')
    .eq('slug', SLUG)
    .single()
  if (error) throw error

  let html = page.content || ''
  const replacement = sectionHtml(STORAGE_PDF)

  // Match heading + whatever the editor left until the next H2 / HR block
  const sectionRe =
    /<h2[^>]*>\s*DNACPR Form PDF Download\s*<\/h2>[\s\S]*?(?=(?:<div data-type="horizontalRule">|<hr\b|<h2\b))/i

  if (!sectionRe.test(html)) {
    throw new Error('Could not find DNACPR Form PDF Download section to repair')
  }

  html = html.replace(sectionRe, `${replacement}`)

  const { error: updErr } = await sb
    .from('fy_pages')
    .update({ content: html, updated_at: new Date().toISOString() })
    .eq('id', page.id)
  if (updErr) throw updErr

  console.log('Restored PDF embed + download card for', SLUG)
  console.log('has embed', /fy-pdf-embed/.test(html))
  console.log('has download card', /class="fy-download"/.test(html))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
