import { fetchIngestTextOptional } from './fetch'
import { makeOpportunity, type IngestedOpportunity } from './types'

export const SAM_CFP_URL =
  'https://www.acutemedicine.org.uk/wp-content/uploads/SAMManchester-2025_Call-for-Abstracts.pdf'

export function parseSamCfpSource(url = SAM_CFP_URL): IngestedOpportunity[] {
  const year = Number(url.match(/20\d{2}/)?.[0] || 2025)
  return [
    makeOpportunity({
      name: `SAM Conference ${year}`,
      organising_body: 'Society for Acute Medicine',
      city: /manchester/i.test(url) ? 'Manchester' : null,
      location_text: /manchester/i.test(url) ? 'Manchester' : null,
      submission_status: 'closed',
      official_page_url: url,
      submission_page_url: null,
      canonical_url: url,
      suggested_specialty_slugs: ['acute-medicine'],
      verification_confidence: 0.4,
      ingest_payload: {
        source: 'sam_cfp',
        historic: true,
        note: 'Historic PDF seed. Do not publish as a current call.',
      },
    }),
  ]
}

export const samCfpAdapter = {
  key: 'sam_cfp',
  async listOpportunities() {
    await fetchIngestTextOptional(SAM_CFP_URL, 'application/pdf')
    return parseSamCfpSource()
  },
}
