import { describe, expect, it } from 'vitest'
import { addMonthsIso, generateSeriesDates } from '@/lib/event-series'

describe('generateSeriesDates', () => {
  it('returns only the start date when repeat has no until or count', () => {
    expect(
      generateSeriesDates('2026-09-16', { frequency: 'weekly' })
    ).toEqual(['2026-09-16'])
  })

  it('creates weekly dates for a count', () => {
    expect(
      generateSeriesDates('2026-09-16', { frequency: 'weekly', count: 4 })
    ).toEqual(['2026-09-16', '2026-09-23', '2026-09-30', '2026-10-07'])
  })

  it('creates fortnightly dates until an inclusive end date', () => {
    expect(
      generateSeriesDates('2026-09-16', {
        frequency: 'fortnightly',
        untilDate: '2026-10-14',
      })
    ).toEqual(['2026-09-16', '2026-09-30', '2026-10-14'])
  })

  it('clamps monthly dates from 31 January', () => {
    expect(addMonthsIso('2026-01-31', 1)).toBe('2026-02-28')
    expect(
      generateSeriesDates('2026-01-31', { frequency: 'monthly', count: 3 })
    ).toEqual(['2026-01-31', '2026-02-28', '2026-03-31'])
  })

  it('moves weekend occurrences to Monday when skipWeekends is on', () => {
    expect(
      generateSeriesDates('2026-09-12', {
        frequency: 'weekly',
        count: 2,
        skipWeekends: true,
      })
    ).toEqual(['2026-09-14', '2026-09-21'])
  })

  it('caps at 52 occurrences', () => {
    const dates = generateSeriesDates('2026-01-07', {
      frequency: 'weekly',
      count: 80,
    })
    expect(dates).toHaveLength(52)
    expect(dates[0]).toBe('2026-01-07')
    expect(dates[51]).toBe('2026-12-30')
  })
})
