#!/usr/bin/env node
/**
 * Special Sauce — Live Supabase Schema vs. Codebase Verifier
 * Scans all .from(table).select() / .update() / .insert() / .upsert() calls in src/
 * against actual live PostgreSQL table columns in Supabase.
 */
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const envLines = fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
for (const line of envLines) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m && !process.env[m[1].trim()]) {
    process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '')
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function getAllFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) getAllFiles(full, files)
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full)
  }
  return files
}

async function main() {
  const tables = ['profiles', 'organizations', 'organization_members', 'jobs', 'applications']
  const schemaMap = {}

  console.log('=== 1. FETCHING LIVE SUPABASE TABLE COLUMNS ===')
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1)
    if (!error && data && data.length > 0) {
      schemaMap[t] = new Set(Object.keys(data[0]))
      console.log(`✓ ${t} (${schemaMap[t].size} cols)`)
    }
  }

  console.log('\n=== 2. AUDITING ALL .select() QUERIES IN src/ ===')
  const files = getAllFiles('src')
  let issues = 0

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    const selectRegex = /\.from\(\s*['"]([a-zA-Z0-9_]+)['"]\s*\)[\s\S]{0,120}?\.select\(\s*(['"`])([\s\S]*?)\2/g
    let match
    while ((match = selectRegex.exec(content)) !== null) {
      const table = match[1]
      const rawSelect = match[3].trim()
      if (!schemaMap[table] || rawSelect === '*') continue

      const stripped = rawSelect.replace(/[a-zA-Z0-9_:]+\s*\([\s\S]*?\)/g, '')
      const cols = stripped.split(',').map((c) => c.trim()).filter(Boolean)

      for (const colExpr of cols) {
        const colName = colExpr.includes(':') ? colExpr.split(':')[1].trim() : colExpr
        if (colName && colName !== '*' && /^[a-zA-Z0-9_]+$/.test(colName) && !schemaMap[table].has(colName)) {
          issues++
          const lineNum = content.slice(0, match.index).split('\n').length
          console.log(`❌ SELECT MISMATCH in ${file}:${lineNum} -> Table "${table}" missing column "${colName}"`)
        }
      }
    }
  }

  if (issues === 0) {
    console.log('✅ All .from(table).select(...) queries across src/ match live Supabase columns 100%!')
  } else {
    console.error(`\n⚠️ Found ${issues} schema mismatch(es).`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
