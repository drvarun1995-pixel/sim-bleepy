export type ConferenceSourceKind =
  | 'abstract_hub'
  | 'conference_hub'
  | 'year_specific_abstract_page'
  | 'pdf_guidance'

export type ConferenceSourcePriority = 'high' | 'medium' | 'low'

export type ConferenceSourceSeed = {
  adapterKey: string
  name: string
  organisation: string
  specialty: string
  kind: ConferenceSourceKind
  url: string
  priority: ConferenceSourcePriority
  notes: string
  adapterReady: boolean
  primary?: boolean
}

export const CONFERENCE_SOURCE_REGISTRY: ConferenceSourceSeed[] = [
  {
    adapterKey: 'bgs_abstracts',
    name: 'BGS abstracts hub',
    organisation: 'British Geriatrics Society',
    specialty: 'Geriatric Medicine',
    kind: 'abstract_hub',
    url: 'https://www.bgs.org.uk/abstracts',
    priority: 'high',
    notes: 'Persistent hub listing multiple meetings, deadlines, event pages and submission forms.',
    adapterReady: true,
    primary: true,
  },
  {
    adapterKey: 'rcem_abstracts',
    name: 'RCEM abstract submissions',
    organisation: 'Royal College of Emergency Medicine',
    specialty: 'Emergency Medicine',
    kind: 'abstract_hub',
    url: 'https://rcem.ac.uk/flagship/abstract-submissions/',
    priority: 'high',
    notes: 'Persistent page listing upcoming RCEM events currently accepting abstracts.',
    adapterReady: true,
    primary: true,
  },
  {
    adapterKey: 'rcpch_conference',
    name: 'RCPCH conference abstract FAQs',
    organisation: 'Royal College of Paediatrics and Child Health',
    specialty: 'Paediatrics',
    kind: 'year_specific_abstract_page',
    url: 'https://www.rcpch.ac.uk/news-events/rcpch-conference/abstract-FAQs-2026',
    priority: 'high',
    notes: 'Current call despite legacy URL slug. Validate event year before publishing.',
    adapterReady: true,
    primary: true,
  },
  {
    adapterKey: 'rcpch_conference',
    name: 'RCPCH abstract guidelines',
    organisation: 'Royal College of Paediatrics and Child Health',
    specialty: 'Paediatrics',
    kind: 'year_specific_abstract_page',
    url: 'https://www.rcpch.ac.uk/news-events/rcpch-conference/abstract-guidelines',
    priority: 'high',
    notes: 'Detailed submission rules, word limits, eligibility and presentation types.',
    adapterReady: true,
  },
  {
    adapterKey: 'rcpch_conference',
    name: 'RCPCH conference hub',
    organisation: 'Royal College of Paediatrics and Child Health',
    specialty: 'Paediatrics',
    kind: 'conference_hub',
    url: 'https://www.rcpch.ac.uk/news-events/rcpch-conference',
    priority: 'medium',
    notes: 'Discovery page for the next annual abstract cycle.',
    adapterReady: true,
  },
  {
    adapterKey: 'bts_meetings',
    name: 'BTS Winter Meeting abstracts',
    organisation: 'British Thoracic Society',
    specialty: 'Respiratory Medicine',
    kind: 'year_specific_abstract_page',
    url: 'https://www.brit-thoracic.org.uk/education-and-events/winter-meeting-2026/abstracts/',
    priority: 'high',
    notes: 'Year-specific abstract page. Discover the next year from the upcoming-dates hub.',
    adapterReady: true,
  },
  {
    adapterKey: 'bts_meetings',
    name: 'BTS upcoming meeting dates',
    organisation: 'British Thoracic Society',
    specialty: 'Respiratory Medicine',
    kind: 'conference_hub',
    url: 'https://www.brit-thoracic.org.uk/education-and-events/upcoming-meeting-dates/',
    priority: 'medium',
    notes: 'Use to discover the next Summer/Winter abstract pages.',
    adapterReady: true,
    primary: true,
  },
  {
    adapterKey: 'bsr_annual_conference',
    name: 'BSR Annual Conference',
    organisation: 'British Society for Rheumatology',
    specialty: 'Rheumatology',
    kind: 'conference_hub',
    url: 'https://www.rheumatology.org.uk/events-learning/conferences/annualconference',
    priority: 'high',
    notes: 'Persistent annual conference page with abstract windows and links.',
    adapterReady: true,
    primary: true,
  },
  {
    adapterKey: 'bcs_annual_conference',
    name: 'BCS Annual Conference',
    organisation: 'British Cardiovascular Society',
    specialty: 'Cardiology',
    kind: 'conference_hub',
    url: 'https://britishcardiovascularsociety.org.uk/annual-conference/',
    priority: 'high',
    notes: 'Monitor for the Abstracts & Awards link each cycle.',
    adapterReady: true,
    primary: true,
  },
  {
    adapterKey: 'bcs_annual_conference',
    name: 'BCS abstract submissions',
    organisation: 'British Cardiovascular Society',
    specialty: 'Cardiology',
    kind: 'year_specific_abstract_page',
    url: 'https://britishcardiovascularsociety.org.uk/abstract-submissions/',
    priority: 'medium',
    notes: 'May retain previous-year content; verify event year before publishing.',
    adapterReady: true,
  },
  {
    adapterKey: 'sam_cfp',
    name: 'SAM call-for-abstracts PDF',
    organisation: 'Society for Acute Medicine',
    specialty: 'Acute Medicine',
    kind: 'pdf_guidance',
    url: 'https://www.acutemedicine.org.uk/wp-content/uploads/SAMManchester-2025_Call-for-Abstracts.pdf',
    priority: 'low',
    notes: 'Historic 2025 PDF for parser testing. Closed calls are skipped and not published.',
    adapterReady: true,
    primary: true,
  },
  {
    adapterKey: 'rcpsych_congress',
    name: 'RCPsych Congress submission guidance',
    organisation: 'Royal College of Psychiatrists',
    specialty: 'Psychiatry',
    kind: 'pdf_guidance',
    url: 'https://www.rcpsych.ac.uk/docs/default-source/events/congress/2026/international-congress-submission-guidance.pdf?sfvrsn=1ac952b7_6',
    priority: 'medium',
    notes: '2026 PDF plus live Congress FAQs and poster pages. Closed 2026 calls are skipped.',
    adapterReady: true,
    primary: true,
  },
  {
    adapterKey: 'bir_abstracts',
    name: 'BIR call for abstracts',
    organisation: 'British Institute of Radiology',
    specialty: 'Radiology',
    kind: 'abstract_hub',
    url: 'https://www.bir.org.uk/education-and-events/call-for-abstracts/',
    priority: 'high',
    notes: 'Persistent hub listing BIR meetings currently accepting abstracts, with deadlines and the MyBIR submission route.',
    adapterReady: true,
    primary: true,
  },
  {
    adapterKey: 'bsir_abstracts',
    name: 'BSIR abstract submission',
    organisation: 'British Society of Interventional Radiology',
    specialty: 'Radiology',
    kind: 'year_specific_abstract_page',
    url: 'https://www.bsirmeeting.org/submit/abstract-submission/',
    priority: 'high',
    notes: 'Annual Scientific Meeting abstract page. Closed cycles are skipped; re-run when the next year opens.',
    adapterReady: true,
    primary: true,
  },
]

export const SOURCE_KIND_LABELS: Record<ConferenceSourceKind, string> = {
  abstract_hub: 'Abstract hub',
  conference_hub: 'Conference hub',
  year_specific_abstract_page: 'Year-specific page',
  pdf_guidance: 'PDF guidance',
}

export const SOURCE_PRIORITY_LABELS: Record<ConferenceSourcePriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low / discovery',
}

export function ingestSourceGroups() {
  const groups = new Map<
    string,
    ConferenceSourceSeed & { urls: string[] }
  >()
  for (const seed of CONFERENCE_SOURCE_REGISTRY) {
    const existing = groups.get(seed.adapterKey)
    if (!existing) {
      groups.set(seed.adapterKey, { ...seed, urls: [seed.url] })
      continue
    }
    existing.urls.push(seed.url)
    if (seed.primary) {
      groups.set(seed.adapterKey, { ...seed, urls: existing.urls })
    }
  }
  return Array.from(groups.values())
}

export function sourceSeedForAdapter(adapterKey: string) {
  return ingestSourceGroups().find((seed) => seed.adapterKey === adapterKey) || null
}
