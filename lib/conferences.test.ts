import { describe, expect, it } from 'vitest'
import { computeListingStatus, deadlineUrgency, formatDeadline, isVisibleInDefaultSearch } from '@/lib/conferences'
import { parseBcsConferenceHtml } from '@/lib/conferences/ingest/bcs-conference'
import { parseBgsAbstractsHtml } from '@/lib/conferences/ingest/bgs-abstracts'
import { parseBsrAnnualHtml } from '@/lib/conferences/ingest/bsr-annual'
import { parseBtsMeetingsHtml } from '@/lib/conferences/ingest/bts-meetings'
import { parseRcemAbstractsHtml } from '@/lib/conferences/ingest/rcem-abstracts'
import { parseRcpchConferenceHtml } from '@/lib/conferences/ingest/rcpch-conference'
import { parseRcpsychCongressHtml } from '@/lib/conferences/ingest/rcpsych-congress'
import { parseSamCfpSource } from '@/lib/conferences/ingest/sam-cfp'
import { ingestSourceGroups } from '@/lib/conferences/ingest/source-registry'
import { parseClosingDeadline, parseMeetingDates } from '@/lib/conferences/ingest/types'

const BGS_FIXTURE = `
<table>
  <tr>
    <th>Meeting</th>
    <th>Abstract submission open</th>
    <th>Abstract closing date</th>
    <th>Expected date of results</th>
    <th>Meeting Dates</th>
    <th>Submission link</th>
  </tr>
  <tr>
    <td><a href="https://www.bgs.org.uk/node/58978">2026 Dementia, Delirium and Brain Health</a></td>
    <td>1 October 2025</td>
    <td>Closes: 5pm GMT 16 February</td>
    <td>Week commencing 9 March 2026</td>
    <td>20 May 2026</td>
    <td><a href="https://www.bgs.org.uk/abstracts">Submissions Closed</a></td>
  </tr>
  <tr>
    <td><a href="https://www.bgs.org.uk/26ScotA">2026 Scotland Autumn Meeting</a></td>
    <td>1 March 2026</td>
    <td>Closes: 5pm GMT 31 July 2026</td>
    <td>Week commencing 17 August 2026</td>
    <td>2 October 2026</td>
    <td><a href="https://www.bgs.org.uk/abstract-submission?eid=515">Submit abstracts online</a></td>
  </tr>
  <tr>
    <td><a href="https://www.bgs.org.uk/node/59786">2027 Trainees Meeting</a></td>
    <td>17 July 2026</td>
    <td>Closes: 5pm GMT 11 January 2027</td>
    <td>Week commencing 25 January</td>
    <td>20-21 April 2027</td>
    <td><a href="https://www.bgs.org.uk/abstract-submission?eid=530">Submit abstracts online</a></td>
  </tr>
  <tr>
    <td>Call for research symposia proposals</td>
    <td>1 June 2026</td>
    <td>Closes: 5pm 31 August 2026</td>
    <td></td>
    <td></td>
    <td>Email</td>
  </tr>
</table>
`

describe('computeListingStatus', () => {
  it('treats past deadlines as closed unless overridden', () => {
    const status = computeListingStatus(
      { abstract_deadline: '2020-01-01T17:00:00.000Z' },
      new Date('2026-08-24T12:00:00.000Z')
    )
    expect(status).toBe('closed')
    expect(isVisibleInDefaultSearch(status)).toBe(false)
  })

  it('keeps an open override even after the deadline', () => {
    expect(
      computeListingStatus(
        { abstract_deadline: '2020-01-01T17:00:00.000Z', status_override: 'open' },
        new Date('2026-08-24T12:00:00.000Z')
      )
    ).toBe('open')
  })

  it('archives after the event end date', () => {
    expect(
      computeListingStatus(
        { end_date: '2026-01-01', abstract_deadline: '2026-12-01T17:00:00.000Z' },
        new Date('2026-08-24T12:00:00.000Z')
      )
    ).toBe('archived')
  })
})

describe('deadlineUrgency', () => {
  it('flags deadlines within 7 days as urgent', () => {
    expect(deadlineUrgency('2026-08-26T17:00:00.000Z', new Date('2026-08-24T12:00:00.000Z'))).toBe('urgent')
  })
})

describe('formatDeadline', () => {
  it('shows UK civil time rather than UTC', () => {
    const text = formatDeadline('2026-08-24T12:00:00.000Z')
    expect(text).toContain('24 Aug 2026')
    expect(text).toMatch(/13:00/)
    expect(text).toContain('BST')
    expect(text).not.toMatch(/UTC/)
  })

  it('labels winter UK time as GMT', () => {
    const text = formatDeadline('2027-01-11T17:00:00.000Z')
    expect(text).toMatch(/17:00/)
    expect(text).toContain('GMT')
  })
})

describe('BGS date parsing', () => {
  it('parses GMT closing times onto the given year', () => {
    const date = parseClosingDeadline('Closes: 5pm GMT 16 February', 2026)
    expect(date?.toISOString()).toBe('2026-02-16T17:00:00.000Z')
  })

  it('treats unzoned 5pm as UK wall clock', () => {
    const date = parseClosingDeadline('Closes: 5pm 31 August 2026')
    expect(date?.toISOString()).toBe('2026-08-31T16:00:00.000Z')
  })

  it('parses meeting date ranges', () => {
    expect(parseMeetingDates('12 - 13 November 2026')).toEqual({
      start: '2026-11-12',
      end: '2026-11-13',
    })
  })
})

describe('parseBgsAbstractsHtml', () => {
  it('creates one opportunity per meeting and skips symposium CFPs', () => {
    const rows = parseBgsAbstractsHtml(BGS_FIXTURE)
    expect(rows.map((row) => row.name)).toEqual([
      '2026 Dementia, Delirium and Brain Health',
      '2026 Scotland Autumn Meeting',
      '2027 Trainees Meeting',
    ])
    const scotland = rows[1]
    expect(scotland.organising_body).toBe('British Geriatrics Society')
    expect(scotland.poster_accepted).toBe(true)
    expect(scotland.oral_accepted).toBe(true)
    expect(scotland.eligible_work_types).toContain('research')
    expect(scotland.eligible_work_types).not.toContain('case_report')
    expect(scotland.nation).toBe('scotland')
    expect(scotland.canonical_url).toContain('#2026-scotland-autumn-meeting')
    expect(scotland.abstract_word_limit).toBe(300)
    expect(scotland.official_page_url).toBe('https://www.bgs.org.uk/26ScotA')
    expect(scotland.submission_page_url).toBe('https://www.bgs.org.uk/abstract-submission?eid=515')
    expect(rows[0].submission_status).toBe('closed')
    expect(rows[0].official_page_url).toBe('https://www.bgs.org.uk/node/58978')
    expect(rows[0].submission_page_url).toBeNull()
  })

  it('uses the meeting page and event-specific submission form, not the hub', () => {
    const trainees = parseBgsAbstractsHtml(BGS_FIXTURE).find((row) => row.name === '2027 Trainees Meeting')
    expect(trainees?.official_page_url).toBe('https://www.bgs.org.uk/node/59786')
    expect(trainees?.submission_page_url).toBe('https://www.bgs.org.uk/abstract-submission?eid=530')
  })
})

describe('college ingest parsers', () => {
  it('groups related seed URLs onto one adapter each', () => {
    const keys = ingestSourceGroups().map((group) => group.adapterKey)
    expect(keys).toEqual([
      'bgs_abstracts',
      'rcem_abstracts',
      'rcpch_conference',
      'bts_meetings',
      'bsr_annual_conference',
      'bcs_annual_conference',
      'sam_cfp',
      'rcpsych_congress',
    ])
  })

  it('parses open RCEM events and their meeting pages', () => {
    const rows = parseRcemAbstractsHtml(`
      <p>Abstract submissions are now open for the following events:</p>
      <ul>
        <li><a href="https://rcem.ac.uk/virtual-events/adolescent-mental-health-qip-study-day/">Adolescent mental health QIP study day</a> | 4 November 2026</li>
        <li><a href="https://rcem.ac.uk/annual-conference-2027/">RCEM Annual Conference</a> | 13 – 15 April 2027</li>
      </ul>
      <p>Click here to register your details</p>
    `)
    expect(rows.map((row) => row.name)).toEqual([
      'RCEM Adolescent mental health QIP study day',
      'RCEM Annual Conference',
    ])
    expect(rows[1].start_date).toBe('2027-04-13')
    expect(rows[1].end_date).toBe('2027-04-15')
    expect(rows[0].official_page_url).toBe('https://rcem.ac.uk/virtual-events/adolescent-mental-health-qip-study-day/')
    expect(rows[0].submission_page_url).toBe('https://rcem.ac.uk/flagship/abstract-submissions/')
  })

  it('parses RCPCH 2027 dates, word limit and Oxford Abstracts link', () => {
    const rows = parseRcpchConferenceHtml(
      '<p>The RCPCH Conference Organising Committee are pleased to invite abstract submissions for the 2027 Conference, which takes place from 19 to 21 May at the LEX Liverpool. Abstract submissions are open from Thursday 2 July 2026 until 6 September 2026.</p>',
      '<p>Your abstract should not exceed 470 words.</p><a href="https://app.oxfordabstracts.com/auth?redirect=/stages/82675/submitter">Submit your abstract</a>'
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('RCPCH Conference 2027')
    expect(rows[0].start_date).toBe('2027-05-19')
    expect(rows[0].end_date).toBe('2027-05-21')
    expect(rows[0].abstract_word_limit).toBe(470)
    expect(rows[0].submission_page_url).toContain('oxfordabstracts.com')
    expect(rows[0].submission_status).toBe('open')
  })

  it('parses BTS 2027 summer and winter meetings from the dates hub', () => {
    const rows = parseBtsMeetingsHtml(
      '2027: Summer Meeting 24 - 25 June, Newcastle Winter Meeting 24 - 26 November, London 2028: Summer Meeting 29 - 30 June, Newcastle',
      'Abstract submission for the 2026 Winter Meeting is now closed.',
      2026
    )
    expect(rows.map((row) => row.name)).toEqual(['BTS Summer Meeting 2027', 'BTS Winter Meeting 2027'])
    expect(rows[0].city).toBe('Newcastle')
    expect(rows[1].start_date).toBe('2027-11-24')
  })

  it('parses BSR 2027 abstract window and event dates', () => {
    const rows = parseBsrAnnualHtml(
      `
      <p>Abstract submission for BSR27 is now open. Submissions open from 13 August - 15 October 2026.</p>
      <p>BSR27 will take place 28–30 April 2027 at the Liverpool Experience Campus</p>
      <a href="https://www.abstractsonline.com/dashboard/login.asp?aId=1771">Submit for 2027</a>
      `,
      new Date('2026-08-24T12:00:00.000Z')
    )
    expect(rows[0].name).toBe('BSR Annual Conference 2027')
    expect(rows[0].city).toBe('Liverpool')
    expect(rows[0].start_date).toBe('2027-04-28')
    expect(rows[0].submission_status).toBe('open')
    expect(rows[0].submission_page_url).toContain('abstractsonline.com')
  })

  it('does not treat a stale BCS 2025 abstracts page as the 2027 submission form', () => {
    const rows = parseBcsConferenceHtml(
      '<p>We look forward to welcoming delegates to the BCS 2027 Annual Conference, which will once again take place at Manchester Central in Manchester.</p>',
      '<h2>BCS Annual Conference 2025 -Submit your Abstract</h2><p>The deadline for submitting Clinical and Basic Science abstracts has now passed.</p>'
    )
    expect(rows[0].name).toBe('BCS Annual Conference 2027')
    expect(rows[0].submission_status).toBe('upcoming')
    expect(rows[0].submission_page_url).toBeNull()
    expect(rows[0].city).toBe('Manchester')
  })

  it('marks the historic SAM PDF as closed', () => {
    const rows = parseSamCfpSource()
    expect(rows[0].submission_status).toBe('closed')
    expect(rows[0].ingest_payload.historic).toBe(true)
  })

  it('skips closed RCPsych 2026 and queues 2027 when mentioned', () => {
    const rows = parseRcpsychCongressHtml(
      '<p>The International Congress 2026 will be taking place from Monday 15 – Thursday 18 June 2026. Poster submissions for the 2026 International Congress are now closed. The submission deadline has now passed (Friday 6 February). Submissions for International Congress 2027 open later on this year.</p>'
    )
    expect(rows[0].name).toBe('RCPsych International Congress 2026')
    expect(rows[0].submission_status).toBe('closed')
    expect(rows[1].name).toBe('RCPsych International Congress 2027')
    expect(rows[1].submission_status).toBe('upcoming')
  })
})

