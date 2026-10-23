#!/usr/bin/env node
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

function checkColumnsForTable(schemaMap, table, rawColsStr, file, lineNum, label) {
  if (!schemaMap[table] || rawColsStr.trim() === '*') return 0
  let count = 0
  const cols = rawColsStr.split(',').map((c) => c.trim()).filter(Boolean)
  for (const colExpr of cols) {
    const colName = colExpr.includes(':') ? colExpr.split(':')[1].trim() : colExpr
    if (colName && colName !== '*' && /^[a-zA-Z0-9_]+$/.test(colName) && !schemaMap[table].has(colName)) {
      count++
      console.log('❌ ' + label + ' MISMATCH in ' + file + ':' + lineNum + ' -> Table "' + table + '" missing column "' + colName + '"')
    }
  }
  return count
}

async function main() {
  const tables = ['profiles', 'organizations', 'organization_members', 'jobs', 'applications']
  const schemaMap = {}

  console.log('=== 1. FETCHING LIVE SUPABASE TABLE COLUMNS ===')
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1)
    if (!error && data && data.length > 0) {
      schemaMap[t] = new Set(Object.keys(data[0]))
      console.log('✓ ' + t + ' (' + schemaMap[t].size + ' cols): ' + [...schemaMap[t]].join(', '))
    }
  }

  const files = getAllFiles('src')
  let issues = 0

  console.log('\n=== 2. AUDITING ALL .select() & MULTI-LEVEL JOIN QUERIES IN src/ ===')
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    const selectRegex = /\.from\(\s*['"]([a-zA-Z0-9_]+)['"]\s*\)[\s\S]{0,120}?\.select\(\s*(['"`])([\s\S]*?)\2/g
    let match
    while ((match = selectRegex.exec(content)) !== null) {
      const table = match[1]
      let workingSelect = match[3].trim()
      const lineNum = content.slice(0, match.index).split('\n').length
      if (!schemaMap[table] || workingSelect === '*') continue

      // Unwrap innermost joins first: e.g. organizations:organization_id (name, domain)
      const innerJoinRegex = /([a-zA-Z0-9_:]+)\s*\(([^()]*)\)/
      let jm
      while ((jm = innerJoinRegex.exec(workingSelect)) !== null) {
        const joinHeader = jm[1].trim()
        const joinColsRaw = jm[2].trim()
        const joinTable = joinHeader.includes(':') ? joinHeader.split(':')[0].trim() : joinHeader
        issues += checkColumnsForTable(schemaMap, joinTable, joinColsRaw, file, lineNum, 'JOIN')
        workingSelect = workingSelect.slice(0, jm.index) + workingSelect.slice(jm.index + jm[0].length)
      }

      issues += checkColumnsForTable(schemaMap, table, workingSelect, file, lineNum, 'SELECT')
    }
  }

  console.log('\n=== 3. AUDITING ALL .update() / .insert() / .upsert() LITERALS IN src/ ===')
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    const writeRegex = /\.from\(\s*['"]([a-zA-Z0-9_]+)['"]\s*\)\s*\.(update|insert|upsert)\(\s*\{([\s\S]*?)\}\s*[,)]/g
    let match
    while ((match = writeRegex.exec(content)) !== null) {
      const table = match[1]
      const op = match[2]
      const body = match[3]
      const lineNum = content.slice(0, match.index).split('\n').length
      if (!schemaMap[table]) continue

      let depth = 0
      let topLevel = ''
      for (const ch of body) {
        if (ch === '{' || ch === '(' || ch === '[') depth++
        else if (ch === '}' || ch === ')' || ch === ']') depth = Math.max(0, depth - 1)
        else if (depth === 0) topLevel += ch
      }

      const keyRegex = /(?:^|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g
      let kMatch
      while ((kMatch = keyRegex.exec(topLevel)) !== null) {
        const key = kMatch[1].trim()
        if (key && !schemaMap[table].has(key)) {
          issues++
          console.log('❌ ' + op.toUpperCase() + ' MISMATCH in ' + file + ':' + lineNum + ' -> Table "' + table + '" missing column "' + key + '"')
        }
      }
    }
  }

  if (issues === 0) {
    console.log('✅ All .select(), multi-level joins, and .update()/.insert()/.upsert() calls match live Supabase columns 100%!')
  } else {
    console.error('\n⚠️ Found ' + issues + ' schema mismatch(es).')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
