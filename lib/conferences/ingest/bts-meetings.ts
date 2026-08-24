import { fetchIngestText, fetchIngestTextOptional } from './fetch'
import {
  makeOpportunity,
  parseMeetingDates,
  slugFromMeetingName,
  visiblePageText,
  type IngestedOpportunity,
} from './types'

export const BTS_WINTER_ABSTRACTS_URL = 'https://www.brit-thoracic.org.uk/education-and-events/winter-meeting-2026/abstracts/'
export const BTS_DATES_URL = 'https://www.brit-thoracic.org.uk/education-and-events/upcoming-meeting-dates/'

function abstractUrlFor(kind: 'winter' | 'summer', year: number) {
  return `https://www.brit-thoracic.org.uk/education-and-events/${kind}-meeting-${year}/abstracts/`
}

export function parseBtsMeetingsHtml(datesHtml: string, winterHtml = '', currentYear = new Date().getUTCFullYear()): IngestedOpportunity[] {
  const datesText = visiblePageText(datesHtml)
  const winterText = visiblePageText(winterHtml)
  const maxYear = currentYear + 1
  const opportunities: IngestedOpportunity[] = []

  const yearBlocks = [...datesText.matchAll(/(20\d{2})\s*:([\s\S]*?)(?=20\d{2}\s*:|Programmes from previous|$)/gi)]
  for (const block of yearBlocks) {
    const year = Number(block[1])
    if (year < currentYear || year > maxYear) continue
    const body = block[2]
    const meetings = [...body.matchAll(/(Summer|Winter) Meeting\s+(\d{1,2}\s*(?:-|–|to)\s*\d{1,2}\s+[A-Za-z]+)(?:,\s*([A-Za-z]+))?/gi)]
    for (const meeting of meetings) {
      const kind = meeting[1].toLowerCase() as 'summer' | 'winter'
      const dates = parseMeetingDates(`${meeting[2]} ${year}`, year)
      const city = (meeting[3] || (kind === 'winter' ? 'London' : 'Manchester')).trim()
      const name = `BTS ${meeting[1]} Meeting ${year}`
      const closed = kind === 'winter' && new RegExp(`abstract submission for the ${year} winter meeting is now closed`, 'i').test(winterText)
      opportunities.push(
        makeOpportunity({
          name,
          organising_body: 'British Thoracic Society',
          start_date: dates.start,
          end_date: dates.end,
          location_text: city,
          city,
          format: 'in_person',
          submission_status: closed ? 'closed' : 'upcoming',
          prize_info:
            kind === 'winter'
              ? 'BTS/BALR/Asthma + Lung UK Early Career Investigator prizes and a medical student competition. Conference grants for high-scoring first authors in training.'
              : null,
          official_page_url: abstractUrlFor(kind, year),
          submission_page_url: closed ? null : abstractUrlFor(kind, year),
          canonical_url: `${BTS_DATES_URL}#${slugFromMeetingName(name)}`,
          suggested_specialty_slugs: ['respiratory'],
          verification_confidence: closed ? 0.8 : 0.62,
          ingest_payload: { source: 'bts_meetings', year, kind, deadlineNotStated: !closed },
        })
      )
    }
  }

  return opportunities
}

export const btsMeetingsAdapter = {
  key: 'bts_meetings',
  async listOpportunities(html?: string) {
    const dates = html ?? (await fetchIngestText(BTS_DATES_URL))
    const winter = html ? '' : (await fetchIngestTextOptional(BTS_WINTER_ABSTRACTS_URL)) || ''
    return parseBtsMeetingsHtml(dates, winter)
  },
}
