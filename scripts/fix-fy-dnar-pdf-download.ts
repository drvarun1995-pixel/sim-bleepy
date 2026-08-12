/**
 * DNAR post fixes:
 * - restore PDF embed if missing
 * - 24h → 72h consultant countersign (East of England FAQ)
 * - red 72h callout above MDT note
 * - replace FAQs with EoE FAQ content + improved accordion design
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/fix-fy-dnar-pdf-download.ts
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
const FAQ_SOURCE =
  'https://heeoe.hee.nhs.uk/sites/default/files/east_of_england_dnacpr_frequently_asked_questions_november_2015.doc'

function pdfSection(filePath: string): string {
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

function faqItem(q: string, a: string): string {
  return `<details class="fy-faq-item">
<summary class="fy-faq-question">${q}</summary>
<div class="fy-faq-answer"><p>${a}</p></div>
</details>`
}

function faqsHtml(): string {
  const items = [
    faqItem(
      'Do doctors have a legal duty to consult patients about DNACPR?',
      'Yes. The Court of Appeal (17 June 2014) ruled that doctors have a legal duty to consult with and inform patients if they want to place a DNACPR order on medical notes, unless there are convincing reasons not to involve the patient. There should be a presumption in favour of patient involvement.'
    ),
    faqItem(
      'When should the DNACPR form be countersigned by the responsible senior clinician?',
      'If someone other than the responsible senior clinician (SRO) completes the form, it must be reviewed, endorsed and countersigned by the SRO as soon as practically possible and within a maximum of <strong>72 hours</strong> for the form to be valid. The form has two signature boxes: one for the healthcare professional completing the order, and one for SRO review/endorsement.'
    ),
    faqItem(
      'Who is the senior responsible officer/clinician (SRO)?',
      'The SRO is the most senior clinician with the appropriate capability and knowledge to assume clinical responsibility for the patient during a specific period of care. This is usually the patient’s consultant or GP. In the East of England, a senior nurse or senior medic who has completed DNACPR competency training may also become an SRO.'
    ),
    faqItem(
      'When is the DNACPR form valid?',
      'To be valid, the form must either state it is an indefinite order or be in date (if a review date is set), and contain the original signature of the SRO. The original patient-copy form with the original signature must stay with the patient and travel with them between care settings.'
    ),
    faqItem(
      'How long is the DNACPR form valid for?',
      'Indefinite DNACPR orders do not have an expiry date. It is still good practice to review the decision whenever the patient’s condition changes and before any move between care settings. If the form is not indefinite, a review timeframe should be stated and the patient assessed within that date.'
    ),
    faqItem(
      'Can someone other than the consultant/GP fill in the form first?',
      'This should be agreed within local governance arrangements between the SRO and their team. The SRO remains accountable. For validity, the form still needs SRO review, endorsement and countersignature as soon as practically possible and within 72 hours.'
    ),
    faqItem(
      'Can the same person sign both signature boxes?',
      'In hospital, a junior medic often signs the first box and the consultant SRO countersigns the second within 72 hours. In the community, the GP as SRO only needs to sign the second box. The form is valid with one signature if it is the signature of the SRO.'
    ),
    faqItem(
      'Is a black-and-white / photocopied DNACPR form valid?',
      'A photocopy should never be made of the original patient-copy form for use as the active order, because the original may later change or be reversed. For GP practices that cannot print the red bordered form, an original black-and-white form with an original SRO signature can be acceptable if indefinite or in date. Any copy kept for notes should be scored through and marked “COPY”.'
    ),
    faqItem(
      'Is the DNACPR form valid across care settings (hospital ↔ home/hospice)?',
      'Yes — provided the original patient-copy form travels with the patient. The receiving senior clinician should be informed and confirm they are happy to take responsibility for the DNACPR decision as part of their assessment.'
    ),
    faqItem(
      'If there is a DNACPR form, is it ever right to start CPR?',
      'This is a clinical judgement at the time of arrest. If the arrest is witnessed and clearly due to an easily reversible cause (for example choking), appropriate treatment must be given and a decision made about whether CPR should be started irrespective of the DNACPR order.'
    ),
    faqItem(
      'What if a patient with a DNACPR form deteriorates unexpectedly?',
      'DNACPR applies only to cardiopulmonary resuscitation. The patient should still receive all other appropriate assessment and treatment. Unexpected deterioration may require rapid medical assistance or a 999 call where appropriate.'
    ),
    faqItem(
      'What if an error is made while completing the form?',
      'Cross the form with two diagonal lines and write clearly between the lines “Void due to error”. Do not discard it — keep it for audit.'
    ),
    faqItem(
      'If DNACPR is suspended (for example for surgery), what happens next?',
      'Suspension is uncommon and should be decided case by case with the patient. If suspended, cross the form with two diagonal lines, write “suspended for…”, sign and date it, then complete a new DNACPR form when the suspension ends.'
    ),
    faqItem(
      'Can DNAR be overridden in an emergency?',
      'CPR may be started if the form is clearly inappropriate in the circumstances (for example outdated, not found, or the arrest is due to an easily reversible cause), until the situation is clarified. Always use clinical judgement and escalate.'
    ),
    faqItem(
      'Does DNAR mean no ICU or intubation?',
      'Not necessarily. DNACPR refers only to CPR. Other ceilings of care (for example NIV, HDU/ICU) are separate decisions and should be discussed and documented explicitly.'
    ),
    faqItem(
      'Can family refuse a DNAR decision?',
      'No. If the patient lacks capacity, family and carer views are important and should be considered, but the clinical decision rests with the responsible clinician following best-interest principles.'
    ),
    faqItem(
      'Can patients request DNACPR themselves?',
      'Yes. A capacitous patient may request DNACPR after discussion. Document the discussion carefully. If a clinician refuses to complete a form despite agreeing that CPR would be inappropriate, a second opinion can be sought.'
    ),
  ].join('\n')

  return `<h2 id="faqs">FAQs</h2>
<p class="fy-faq-intro">Answers below are adapted for Foundation doctors from the NHS East of England DNACPR Frequently Asked Questions (November 2015). Always follow your current Trust policy and senior advice.</p>
<div class="fy-faq-list">
${items}
</div>
<p class="fy-faq-source">Source: <a class="fy-source-link" href="${FAQ_SOURCE}" target="_blank" rel="noopener">East of England DNACPR Frequently Asked Questions (November 2015)</a></p>`
}

async function main() {
  const { data: page, error } = await sb
    .from('fy_pages')
    .select('id, content')
    .eq('slug', SLUG)
    .single()
  if (error) throw error

  let html = page.content || ''

  // 1) Fix 24h → 72h for consultant/SRO countersign language
  html = html.replace(/within\s*24\s*hours?/gi, 'within 72 hours')
  html = html.replace(/within\s*24\s*hrs?/gi, 'within 72 hours')
  html = html.replace(/countersign within 24 hours/gi, 'countersign within 72 hours')
  html = html.replace(
    /Must countersign within 24 hours for DNAR to remain valid/gi,
    'Must countersign within 72 hours for DNAR to remain valid'
  )
  html = html.replace(
    /countersigned by a consultant within 24 hours/gi,
    'countersigned by a consultant within 72 hours'
  )
  html = html.replace(
    /Consultant must sign within <strong>24 hours<\/strong>/gi,
    'Consultant must sign within <strong>72 hours</strong>'
  )
  html = html.replace(
    /This should be done within 24hrs of completing the form/gi,
    'This should be done within 72 hours of completing the form'
  )
  // Catch remaining 24h near consultant/sign language
  html = html.replace(
    /(consultant[^<]{0,80}|sign(?:ed|ature|ing)?[^<]{0,40}|countersign[^<]{0,40})24\s*h(?:ou)?rs?/gi,
    (m) => m.replace(/24\s*h(?:ou)?rs?/i, '72 hours')
  )

  // 2) Ensure PDF embed + download card still present under the heading
  const pdfRe =
    /<h2[^>]*>\s*DNACPR Form PDF Download\s*<\/h2>[\s\S]*?(?=(?:<div data-type="horizontalRule">|<hr\b|<h2\b))/i
  if (pdfRe.test(html)) {
    html = html.replace(pdfRe, `${pdfSection(STORAGE_PDF)}\n`)
  }

  // 3) Insert red 72h callout above the MDT pre note
  const mdtPre =
    /<pre><code>DNAR discussions often involve multiple team members\.[\s\S]*?<\/code><\/pre>/i
  const warning = `<aside class="fy-callout fy-callout-trap" role="note"><p><strong>Important:</strong> The DNAR / DNACPR form should be reviewed, endorsed and countersigned by the consultant (or other senior responsible clinician) within <strong>72 hours</strong> for it to be valid.</p></aside>
`
  if (mdtPre.test(html) && !/within <strong>72 hours<\/strong> for it to be valid/.test(html)) {
    html = html.replace(mdtPre, `${warning}$&`)
  } else if (mdtPre.test(html)) {
    // Replace existing warning if present just before pre
    html = html.replace(
      /(?:<aside class="fy-callout fy-callout-trap"[\s\S]*?<\/aside>\s*)?<pre><code>DNAR discussions often involve multiple team members\.[\s\S]*?<\/code><\/pre>/i,
      `${warning}<pre><code>DNAR discussions often involve multiple team members. It helps to be clear on understanding the roles of MDT members when coordinating care decisions.</code></pre>`
    )
  }

  // 4) Replace FAQ section through end (or next major block)
  const faqRe = /<h2[^>]*>\s*FAQs?\s*<\/h2>[\s\S]*$/i
  if (faqRe.test(html)) {
    html = html.replace(faqRe, faqsHtml())
  } else {
    html = `${html.trim()}\n${faqsHtml()}`
  }

  const { error: updErr } = await sb
    .from('fy_pages')
    .update({ content: html, updated_at: new Date().toISOString() })
    .eq('id', page.id)
  if (updErr) throw updErr

  const still24 = [...html.matchAll(/24\s*h(?:ou)?rs?/gi)].map((m) => m[0])
  console.log('Updated', SLUG)
  console.log('remaining 24h mentions:', still24)
  console.log('has pdf embed', /fy-pdf-embed/.test(html))
  console.log('has 72h callout', /72 hours<\/strong> for it to be valid/.test(html))
  console.log('has faq accordion', /fy-faq-item/.test(html))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
