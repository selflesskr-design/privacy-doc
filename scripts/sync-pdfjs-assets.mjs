#!/usr/bin/env node

// Copies pdf.js's CMap and standard-font data out of node_modules into
// public/pdfjs/ so they are served from our own origin.
//
// Without these, pdf.js renders Korean PDFs that rely on CID encodings or on
// the 14 standard fonts with fallback glyphs — the page looks broken, and a
// user cannot see what to cover. Upstream left them unset to guarantee zero
// network traffic; serving them locally keeps that guarantee (CSP allows
// `connect-src 'self'`) while fixing the rendering.
//
// pdf.js fetches individual files on demand, so a reader downloads a few KB at
// most — not the whole set. The files are generated, so public/pdfjs/ is
// gitignored and this runs before dev and build.

import { cpSync, existsSync, rmSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'node_modules', 'pdfjs-dist')
const dest = path.join(root, 'public', 'pdfjs')

if (!existsSync(src)) {
  console.error('sync-pdfjs-assets: pdfjs-dist not installed — run `npm install` first.')
  process.exit(1)
}

rmSync(dest, { recursive: true, force: true })
mkdirSync(dest, { recursive: true })

let files = 0
let bytes = 0
for (const dir of ['cmaps', 'standard_fonts']) {
  const from = path.join(src, dir)
  if (!existsSync(from)) {
    console.error(`sync-pdfjs-assets: missing ${dir} in pdfjs-dist`)
    process.exit(1)
  }
  cpSync(from, path.join(dest, dir), { recursive: true })
  for (const name of readdirSync(path.join(dest, dir))) {
    files++
    bytes += statSync(path.join(dest, dir, name)).size
  }
}

console.log(`public/pdfjs/: ${files} files, ${(bytes / 1024 / 1024).toFixed(2)} MB (cmaps + standard_fonts)`)
