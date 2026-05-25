#!/usr/bin/env node
// @mostajs/orm-samples — CLI
// Author: Dr Hamid MADANI <drmdh@msn.com>
//
// Commands :
//   mostajs-orm-samples list [--json]
//   mostajs-orm-samples scaffold <feature> [dest]
//   mostajs-orm-samples check <feature>
//   mostajs-orm-samples help [feature]

import { readdirSync, statSync, readFileSync, cpSync, existsSync, mkdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const examplesDir = resolve(__dirname, '..', 'examples')

interface SampleInfo {
  id: string
  name: string
  pitch: string
  covers: string
}

function listSamples(): SampleInfo[] {
  if (!existsSync(examplesDir)) return []
  const entries = readdirSync(examplesDir).filter((e) => {
    if (e.startsWith('_')) return false
    const full = join(examplesDir, e)
    try {
      return statSync(full).isDirectory()
    } catch {
      return false
    }
  })
  entries.sort()

  return entries.map((id) => {
    const readmePath = join(examplesDir, id, 'README.md')
    let pitch = ''
    let covers = ''
    if (existsSync(readmePath)) {
      const content = readFileSync(readmePath, 'utf-8')
      const pitchMatch = content.match(/^>\s+(.+)$/m)
      pitch = pitchMatch ? pitchMatch[1].trim() : ''
      const coversMatch = content.match(/^\*\*Couvre\*\*\s*:\s*(.+)$/m)
      covers = coversMatch ? coversMatch[1].trim() : ''
    }
    return { id, name: id, pitch, covers }
  })
}

function cmdList(args: string[]): void {
  const samples = listSamples()
  const json = args.includes('--json')

  if (json) {
    console.log(JSON.stringify(samples, null, 2))
    return
  }

  if (samples.length === 0) {
    console.log('No samples found.')
    return
  }

  console.log(`\nAvailable samples (${samples.length}):\n`)
  for (const s of samples) {
    const pitch = s.pitch || '(no pitch)'
    console.log(`  ${s.id.padEnd(36)} ${pitch}`)
  }
  console.log('')
  console.log(`Run \`mostajs-orm-samples help <feature>\` for details.`)
  console.log(`Run \`mostajs-orm-samples scaffold <feature> [dest]\` to copy a sample.`)
}

function cmdScaffold(args: string[]): void {
  const feature = args[0]
  if (!feature) {
    console.error('Usage: mostajs-orm-samples scaffold <feature> [dest]')
    process.exit(2)
  }
  const src = join(examplesDir, feature)
  if (!existsSync(src)) {
    console.error(`Sample '${feature}' not found. Run \`mostajs-orm-samples list\` to see available samples.`)
    process.exit(1)
  }
  const dest = resolve(args[1] ?? join(process.cwd(), `my-${feature}-app`))
  if (existsSync(dest)) {
    console.error(`Destination '${dest}' already exists. Refusing to overwrite.`)
    process.exit(1)
  }
  mkdirSync(dirname(dest), { recursive: true })
  cpSync(src, dest, { recursive: true })

  console.log(`\n✅ Scaffolded '${feature}' to:\n   ${dest}\n`)
  console.log('Next steps:')
  console.log(`   cd ${dest}`)

  // Hint pour ressources externes éventuelles
  const readmePath = join(dest, 'README.md')
  if (existsSync(readmePath)) {
    const content = readFileSync(readmePath, 'utf-8')
    const extMatch = content.match(/## External resources\n([\s\S]*?)(?=\n##|$)/i)
    if (extMatch && !/aucun/i.test(extMatch[1])) {
      console.log('')
      console.log('External resources required (cf. README.md):')
      console.log(extMatch[1].trim().split('\n').map((l) => '   ' + l).join('\n'))
    }
  }

  console.log('')
  console.log(`   ./${feature}.sh        # launch sample`)
  console.log('')
}

function cmdCheck(args: string[]): void {
  const feature = args[0]
  if (!feature) {
    console.error('Usage: mostajs-orm-samples check <feature>')
    process.exit(2)
  }
  const readmePath = join(examplesDir, feature, 'README.md')
  if (!existsSync(readmePath)) {
    console.error(`Sample '${feature}' not found.`)
    process.exit(1)
  }
  const content = readFileSync(readmePath, 'utf-8')
  const extMatch = content.match(/## External resources\n([\s\S]*?)(?=\n##|$)/i)
  if (!extMatch || /aucun/i.test(extMatch[1])) {
    console.log(`Sample '${feature}': aucune ressource externe requise.`)
    return
  }
  console.log(`Sample '${feature}' — external resources required :\n`)
  console.log(extMatch[1].trim())
}

function cmdHelp(args: string[]): void {
  const feature = args[0]
  if (feature) {
    const readmePath = join(examplesDir, feature, 'README.md')
    if (!existsSync(readmePath)) {
      console.error(`Sample '${feature}' not found.`)
      process.exit(1)
    }
    console.log(readFileSync(readmePath, 'utf-8'))
    return
  }
  console.log(`
@mostajs/orm-samples — runnable samples for @mostajs/orm

USAGE
  mostajs-orm-samples <command> [args]

COMMANDS
  list [--json]                  List all available samples
  scaffold <feature> [dest]      Copy a sample to dest (default: ./my-<feature>-app)
  check <feature>                Show external resources required by the sample
  help [feature]                 Show this help, or the README of a specific sample

EXAMPLES
  mostajs-orm-samples list
  mostajs-orm-samples scaffold 01-quickstart-sqlite
  mostajs-orm-samples scaffold 02-multi-dialect-switch ~/my-app
  mostajs-orm-samples check 18-bridge-jdbc
  mostajs-orm-samples help 09-findbyid-polymorphic

Author: Dr Hamid MADANI <drmdh@msn.com>
`)
}

// ─── Dispatcher ────────────────────────────────────────────────────

const [cmd, ...args] = process.argv.slice(2)

switch (cmd) {
  case 'list':
    cmdList(args)
    break
  case 'scaffold':
    cmdScaffold(args)
    break
  case 'check':
    cmdCheck(args)
    break
  case 'help':
  case undefined:
  case '--help':
  case '-h':
    cmdHelp(args)
    break
  default:
    console.error(`Unknown command: ${cmd}`)
    cmdHelp([])
    process.exit(2)
}
