import { fetchIngestText, fetchIngestTextOptional } from './fetch'
import { makeOpportunity, visiblePageText, type IngestedOpportunity } from './types'

export const BCS_CONFERENCE_URL = 'https://britishcardiovascularsociety.org.uk/annual-conference/'
export const BCS_ABSTRACTS_URL = 'https://britishcardiovascularsociety.org.uk/abstract-submissions/'

export function parseBcsConferenceHtml(conferenceHtml: string, abstractsHtml = ''): IngestedOpportunity[] {
  const conferenceText = visiblePageText(conferenceHtml)
  const abstractsText = visiblePageText(abstractsHtml)
  const year = conferenceText.match(/BCS (\d{4}) Annual Conference/i)?.[1] || conferenceText.match(/Annual Conference (\d{4})/i)?.[1] || '2027'
  const venue = /Manchester Central/i.test(conferenceText) ? 'Manchester Central' : null
  const abstractsClosed = /deadline for submitting[\s\S]{0,80}has now passed|abstract submissions?[\s\S]{0,40}closed/i.test(abstractsText)
  const abstractsAreCurrentYear = new RegExp(`Annual Conference ${year}`, 'i').test(abstractsText)

  return [
    makeOpportunity({
      name: `BCS Annual Conference ${year}`,
      organising_body: 'British Cardiovascular Society',
      location_text: venue,
      city: /manchester/i.test(conferenceText) ? 'Manchester' : null,
      format: 'in_person',
      submission_status: abstractsAreCurrentYear && abstractsClosed ? 'closed' : 'upcoming',
      official_page_url: BCS_CONFERENCE_URL,
      submission_page_url: abstractsAreCurrentYear && !abstractsClosed ? BCS_ABSTRACTS_URL : null,
      canonical_url: `${BCS_CONFERENCE_URL}#${year}`,
      suggested_specialty_slugs: ['cardiology'],
      verification_confidence: 0.6,
      ingest_payload: {
        source: 'bcs_annual_conference',
        year,
        abstractsPageStale: !abstractsAreCurrentYear,
      },
    }),
  ]
}

export const bcsConferenceAdapter = {
  key: 'bcs_annual_conference',
  async listOpportunities(html?: string) {
    const conference = html ?? (await fetchIngestText(BCS_CONFERENCE_URL))
    const abstracts = html ? '' : (await fetchIngestTextOptional(BCS_ABSTRACTS_URL)) || ''
    return parseBcsConferenceHtml(conference, abstracts)
  },
}
