/**
 * Apply migrations/fy_blog_auth_and_analytics.sql via linked Supabase pooler URL.
 * Run: $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/apply-fy-blog-analytics-migration.ts
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
    path.resolve('migrations/fy_blog_auth_and_analytics.sql'),
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
      `select slug, requires_auth from fy_pages where slug = 'trust-induction-basildon-hospital'`
    )
    console.log('Migration applied. Basildon pages:', rows)
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
