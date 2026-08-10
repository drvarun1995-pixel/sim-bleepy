/**
 * Windows-safe bundle analyzer entry:
 *   node scripts/run-analyze.js
 *   npm run build:analyze
 */
process.env.ANALYZE = 'true'
const { spawnSync } = require('child_process')
const result = spawnSync('npx', ['next', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
})
process.exit(result.status ?? 1)
