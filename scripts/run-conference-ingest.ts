/**
 * Run conference ingest adapters against live source pages.
 *
 * Examples:
 *   npx tsx scripts/run-conference-ingest.ts
 *   npx tsx scripts/run-conference-ingest.ts --all
 *   npx tsx scripts/run-conference-ingest.ts --adapter rcem_abstracts
 *   npx tsx scripts/run-conference-ingest.ts --adapter rcpch_conference
 *   npx tsx scripts/run-conference-ingest.ts --adapter bts_meetings
 *   npx tsx scripts/run-conference-ingest.ts --adapter bsr_annual_conference
 *   npx tsx scripts/run-conference-ingest.ts --adapter bcs_annual_conference
 *   npx tsx scripts/run-conference-ingest.ts --adapter sam_cfp
 *   npx tsx scripts/run-conference-ingest.ts --adapter rcpsych_congress
 *   npx tsx scripts/run-conference-ingest.ts --adapter bir_abstracts
 *   npx tsx scripts/run-conference-ingest.ts --adapter bsir_abstracts
 */
import * as dotenv from 'dotenv'
import { listConferenceAdapterKeys } from '@/lib/conferences/ingest'
import { runAllConferenceIngest, runConferenceIngest } from '@/lib/conferences/ingest/run'

dotenv.config({ path: '.env.local' })

function argValue(flag: string) {
  const index = process.argv.indexOf(flag)
  if (index === -1) return null
  return process.argv[index + 1] || null
}

async function main() {
  const adapter = argValue('--adapter')
  const runAll = process.argv.includes('--all') || !adapter

  if (adapter && !listConferenceAdapterKeys().includes(adapter)) {
    throw new Error(`Unknown adapter "${adapter}". Use one of: ${listConferenceAdapterKeys().join(', ')}`)
  }

  if (runAll && !adapter) {
    const result = await runAllConferenceIngest()
    console.log(JSON.stringify(result, null, 2))
    if (result.results.some((item) => !item.ok)) process.exit(1)
    return
  }

  const result = await runConferenceIngest({ adapterKey: adapter || 'bgs_abstracts' })
  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
