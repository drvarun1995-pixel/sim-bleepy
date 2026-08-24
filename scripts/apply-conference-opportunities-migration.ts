/**
 * Apply supabase/migrations/20260824_conference_opportunities.sql via linked Supabase pooler URL.
 * If the pooler URL has no password, paste the SQL into the Supabase SQL Editor instead.
 * Run: $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/apply-conference-opportunities-migration.ts
 */
import fs from 'fs'
import path from 'path'
import pg from 'pg'

async function main() {
  const poolerPath = path.resolve('supabase/.temp/pooler-url')
  if (!fs.existsSync(poolerPath)) {
    throw new Error('Missing supabase/.temp/pooler-url — run supabase link first')
  }
  const connectionString = fs.readFileSync(poolerPath, 'utf8').trim()
  const sql = fs.readFileSync(
    path.resolve('supabase/migrations/20260824_conference_opportunities.sql'),
    'utf8'
  )

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()
  try {
    await client.query(sql)
    const { rows } = await client.query(
      `select adapter_key, enabled from conference_sources where adapter_key = 'bgs_abstracts'`
    )
    console.log('Migration applied. BGS source:', rows)
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
