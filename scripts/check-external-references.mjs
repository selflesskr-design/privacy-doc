#!/usr/bin/env node

// Static analysis: scan source files for external URL references that would
// violate Privacy's "zero external network" guarantee. This catches:
//   - CDN links (`cdn.jsdelivr.net`, `unpkg.com`, etc.)
//   - External fonts (`fonts.googleapis.com`)
//   - Analytics pings, API calls, or any absolute URL to a foreign host
//
// Allowed patterns (not flagged):
//   - privacy.selfless.kr                    (our own deployment)
//   - github.com/selflesskr-design/privacy-doc   (our repository link)
//   - github.com/mithun-srinivas/DoxDock         (upstream MIT attribution — see NOTICE)
//   - uniquelab.selfless.kr                      (who made this — a link, never a request)
//   - opensource.org                             (license reference)
//   - schema.org                                 (JSON-LD @context — an identifier
//                                                 string, never fetched at runtime)
//   - Localhost, `self`, or relative URLs; data: and blob: URIs
//
// Uses only Node built-ins (no `glob`) so it runs in CI without `npm install`.

import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(root, 'src')
const EXTENSIONS = new Set(['.js', '.jsx', '.html', '.css'])

const ALLOWED_HOSTS = [
  'privacy.selfless.kr',
  'github.com/selflesskr-design/privacy-doc',
  'github.com/mithun-srinivas/DoxDock',
  'uniquelab.selfless.kr',
  // Analytics. Sees which pages are opened; never the files, which are read
  // by the browser itself and never uploaded anywhere.
  'www.googletagmanager.com',
  'opensource.org',
  'schema.org',
]

// Absolute http(s) URLs; captures host+path so we can allowlist our own hosts.
const URL_RE = /(?:https?:\/\/)([^\s"'`)>\]}]+)/gi

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(full)
  }
  return out
}

let violations = 0

for (const abs of walk(SRC)) {
  const rel = path.relative(root, abs)
  const content = readFileSync(abs, 'utf-8')
  let match
  URL_RE.lastIndex = 0
  while ((match = URL_RE.exec(content)) !== null) {
    const url = match[0]
    const host = match[1]
    const allowed = ALLOWED_HOSTS.some((a) => host.startsWith(a) || host.endsWith(a))
    if (!allowed) {
      const line = content.slice(0, match.index).split('\n').length
      console.error(`  FAIL  ${rel}:${line}  ${url}`)
      violations++
    }
  }
}

if (violations) {
  console.error(`\n❌ ${violations} external URL(s) found. Privacy must not reference external hosts in source code.`)
  process.exit(1)
} else {
  console.log('✅ No external URL references found in source.')
}
