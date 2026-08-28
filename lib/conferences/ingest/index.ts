import { bcsConferenceAdapter } from './bcs-conference'
import { bgsAbstractsAdapter } from './bgs-abstracts'
import { birAbstractsAdapter } from './bir-abstracts'
import { bsirAbstractsAdapter } from './bsir-abstracts'
import { bsrAnnualAdapter } from './bsr-annual'
import { btsMeetingsAdapter } from './bts-meetings'
import { rcemAbstractsAdapter } from './rcem-abstracts'
import { rcpchConferenceAdapter } from './rcpch-conference'
import { rcpsychCongressAdapter } from './rcpsych-congress'
import { samCfpAdapter } from './sam-cfp'
import type { ConferenceSourceAdapter } from './types'

export const CONFERENCE_ADAPTERS: Record<string, ConferenceSourceAdapter> = {
  bgs_abstracts: bgsAbstractsAdapter,
  rcem_abstracts: rcemAbstractsAdapter,
  rcpch_conference: rcpchConferenceAdapter,
  bts_meetings: btsMeetingsAdapter,
  bsr_annual_conference: bsrAnnualAdapter,
  bcs_annual_conference: bcsConferenceAdapter,
  sam_cfp: samCfpAdapter,
  rcpsych_congress: rcpsychCongressAdapter,
  bir_abstracts: birAbstractsAdapter,
  bsir_abstracts: bsirAbstractsAdapter,
}

export function listConferenceAdapterKeys() {
  return Object.keys(CONFERENCE_ADAPTERS)
}
