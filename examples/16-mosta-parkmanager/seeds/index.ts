// Author: Dr Hamid MADANI <drmdh@msn.com>
import { execSync } from 'child_process'
import path from 'path'

const seedsDir = path.dirname(new URL(import.meta.url).pathname)

const seeds = [
  { name: '00_admin',     file: '00_admin/seed-admin.ts' },
  { name: '02_roles',     file: '02_roles/seed-roles.ts' },
  { name: '03_activities', file: '03_activities/seed-activities.ts' },
  { name: '04_demo',      file: '04_demo/seed-demo.ts' },
]

// SEED_FRESH=1 → le premier seed drop+recreate les tables (create-drop), les
// suivants tournent en update pour ne pas effacer ce qui vient d'être inséré.
const fresh = process.env.SEED_FRESH === '1'
const inheritedStrategy = process.env.SCHEMA_STRATEGY

console.log(`=== Mosta ParkManager — Seed Runner ${fresh ? '(FRESH RESET)' : ''}===\n`)

for (let i = 0; i < seeds.length; i++) {
  const seed = seeds[i]
  console.log(`\n--- Running ${seed.name} ---`)
  const strategy = fresh && i === 0 ? 'create-drop' : (inheritedStrategy ?? 'update')
  try {
    execSync(`npx tsx ${path.join(seedsDir, seed.file)}`, {
      stdio: 'inherit',
      cwd: path.resolve(seedsDir, '..'),
      env: { ...process.env, SCHEMA_STRATEGY: strategy },
    })
  } catch (err) {
    console.error(`\nFailed on ${seed.name}`)
    process.exit(1)
  }
}

console.log('\n=== All seeds completed successfully ===')
