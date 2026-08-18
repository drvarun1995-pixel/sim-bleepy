/**
 * England and Wales bank holidays, hardcoded from GOV.UK
 * (https://www.gov.uk/bank-holidays.json, england-and-wales division).
 *
 * These are display-only calendar markers. They are not events and cannot
 * be edited in event data. Scotland and Northern Ireland extra holidays
 * are not included (Basildon / NHS England uses England and Wales).
 *
 * Coverage: 2024–2028 (the range published by GOV.UK at last update).
 */

export type UkBankHoliday = {
  date: string
  name: string
}

export const UK_BANK_HOLIDAYS: UkBankHoliday[] = [
  { date: '2024-01-01', name: "New Year's Day" },
  { date: '2024-03-29', name: 'Good Friday' },
  { date: '2024-04-01', name: 'Easter Monday' },
  { date: '2024-05-06', name: 'Early May bank holiday' },
  { date: '2024-05-27', name: 'Spring bank holiday' },
  { date: '2024-08-26', name: 'Summer bank holiday' },
  { date: '2024-12-25', name: 'Christmas Day' },
  { date: '2024-12-26', name: 'Boxing Day' },
  { date: '2025-01-01', name: "New Year's Day" },
  { date: '2025-04-18', name: 'Good Friday' },
  { date: '2025-04-21', name: 'Easter Monday' },
  { date: '2025-05-05', name: 'Early May bank holiday' },
  { date: '2025-05-26', name: 'Spring bank holiday' },
  { date: '2025-08-25', name: 'Summer bank holiday' },
  { date: '2025-12-25', name: 'Christmas Day' },
  { date: '2025-12-26', name: 'Boxing Day' },
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-04-06', name: 'Easter Monday' },
  { date: '2026-05-04', name: 'Early May bank holiday' },
  { date: '2026-05-25', name: 'Spring bank holiday' },
  { date: '2026-08-31', name: 'Summer bank holiday' },
  { date: '2026-12-25', name: 'Christmas Day' },
  { date: '2026-12-28', name: 'Boxing Day (substitute day)' },
  { date: '2027-01-01', name: "New Year's Day" },
  { date: '2027-03-26', name: 'Good Friday' },
  { date: '2027-03-29', name: 'Easter Monday' },
  { date: '2027-05-03', name: 'Early May bank holiday' },
  { date: '2027-05-31', name: 'Spring bank holiday' },
  { date: '2027-08-30', name: 'Summer bank holiday' },
  { date: '2027-12-27', name: 'Christmas Day (substitute day)' },
  { date: '2027-12-28', name: 'Boxing Day (substitute day)' },
  { date: '2028-01-03', name: "New Year's Day (substitute day)" },
  { date: '2028-04-14', name: 'Good Friday' },
  { date: '2028-04-17', name: 'Easter Monday' },
  { date: '2028-05-01', name: 'Early May bank holiday' },
  { date: '2028-05-29', name: 'Spring bank holiday' },
  { date: '2028-08-28', name: 'Summer bank holiday' },
  { date: '2028-12-25', name: 'Christmas Day' },
  { date: '2028-12-26', name: 'Boxing Day' },
]

const BY_DATE = new Map(UK_BANK_HOLIDAYS.map((holiday) => [holiday.date, holiday]))

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getUkBankHoliday(date: Date | string): UkBankHoliday | undefined {
  const key = typeof date === 'string' ? date.slice(0, 10) : toLocalDateKey(date)
  return BY_DATE.get(key)
}
