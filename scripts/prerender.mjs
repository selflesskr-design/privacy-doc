#!/usr/bin/env node

// Post-build prerender for SEO. PrivacyDoc is a client-side SPA, so a crawler that
// does not run JS would otherwise see one empty page. This script takes the built
// dist/index.html and, for every tool, writes dist/<id>/index.html with:
//   - a unique <title>, description, canonical, and Open Graph / Twitter tags
//   - real crawlable content inside #root (an <h1>, the description, a privacy
//     line, and links to every other tool)
// React replaces #root on load (createRoot, not hydrate), so this content is only
// ever seen by crawlers and on first paint. It also regenerates sitemap.xml.
//
// Uses only Node built-ins. Meta is read straight from each operation's meta.js.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const opsDir = path.join(root, 'src', 'operations')

// Brand/URL come from the same module the app uses, so there is one place to edit.
const site = await import(pathToFileURL(path.join(root, 'src', 'config', 'site.js')).href)
const SITE = site.SITE_URL
const BRAND = site.BRAND
const DEFAULT_TITLE = site.DEFAULT_TITLE
const DEFAULT_DESC = site.DEFAULT_DESC

const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escAttr = (s) => escText(s).replace(/"/g, '&quot;')

// Load operation metadata (id/name/description/order) straight from meta.js.
async function loadOps() {
  const ops = []
  for (const entry of readdirSync(opsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const metaPath = path.join(opsDir, entry.name, 'meta.js')
    if (!existsSync(metaPath)) continue
    const mod = await import(pathToFileURL(metaPath).href)
    const m = mod.default || mod
    ops.push({ id: m.id || entry.name, name: m.name, description: m.description || '', order: m.order ?? 100 })
  }
  return ops.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
}

// Replace the whole <meta>/<link> tag that contains `idSubstr` with `newTag`.
function swapTag(html, idSubstr, newTag) {
  const esc = idSubstr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`<(?:meta|link)\\b[^>]*${esc}[^>]*>`, 'i')
  if (!re.test(html)) {
    console.warn(`  prerender: could not find tag for ${idSubstr}`)
    return html
  }
  return html.replace(re, newTag)
}

function injectRoot(html, block) {
  const re = /<div id="root">\s*<\/div>/i
  if (!re.test(html)) throw new Error('prerender: <div id="root"></div> not found in dist/index.html')
  return html.replace(re, `<div id="root">${block}</div>`)
}

const WRAP = (inner) =>
  `<main style="max-width:760px;margin:0 auto;padding:2.5rem 1.5rem;font-family:system-ui,-apple-system,sans-serif;line-height:1.6">${inner}</main>`

function toolBlock(op, ops) {
  const links = ops.map((o) => `<li><a href="/${o.id}">${escText(o.name)}</a></li>`).join('')
  return WRAP(
    `<h1>${escText(op.name)}</h1>` +
      `<p>${escText(op.description)}</p>` +
      `<p>${escText(BRAND)}는 모든 처리를 사용자의 브라우저 안에서 수행합니다. 파일이 서버로 전송되지 않으며, 가입 없이 오프라인에서도 동작하는 오픈소스입니다.</p>` +
      `<p><a href="/">← 전체 도구 보기</a></p>` +
      `<nav aria-label="전체 도구"><h2>전체 도구</h2><ul>${links}</ul></nav>`,
  )
}

function homeBlock(ops) {
  const links = ops
    .map((o) => `<li><a href="/${o.id}">${escText(o.name)}</a> — ${escText(o.description)}</li>`)
    .join('')
  return WRAP(
    `<h1>${escText(DEFAULT_TITLE)}</h1>` +
      `<p>${escText(DEFAULT_DESC)}</p>` +
      `<nav aria-label="전체 도구"><h2>전체 도구</h2><ul>${links}</ul></nav>`,
  )
}

function toolPage(template, op, ops) {
  const title = `${op.name} — ${BRAND}`
  const description = `${op.description} 모든 처리는 내 브라우저 안에서만 이루어집니다 — 업로드 없음, 가입 없음.`
  const url = `${SITE}/${op.id}`
  let html = template
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escText(title)}</title>`)
  html = swapTag(html, 'name="description"', `<meta name="description" content="${escAttr(description)}" />`)
  html = swapTag(html, 'rel="canonical"', `<link rel="canonical" href="${escAttr(url)}" />`)
  html = swapTag(html, 'property="og:title"', `<meta property="og:title" content="${escAttr(title)}" />`)
  html = swapTag(html, 'property="og:description"', `<meta property="og:description" content="${escAttr(description)}" />`)
  html = swapTag(html, 'property="og:url"', `<meta property="og:url" content="${escAttr(url)}" />`)
  html = swapTag(html, 'name="twitter:title"', `<meta name="twitter:title" content="${escAttr(title)}" />`)
  html = swapTag(html, 'name="twitter:description"', `<meta name="twitter:description" content="${escAttr(description)}" />`)
  html = injectRoot(html, toolBlock(op, ops))
  return html
}

function sitemap(ops) {
  const urls = ['/', ...ops.map((o) => `/${o.id}`)]
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n') +
    `\n</urlset>\n`
  )
}

const indexPath = path.join(dist, 'index.html')
if (!existsSync(indexPath)) {
  console.error('prerender: dist/index.html not found — run `vite build` first.')
  process.exit(1)
}

const template = readFileSync(indexPath, 'utf-8')
const ops = await loadOps()

let count = 0
for (const op of ops) {
  const dir = path.join(dist, op.id)
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), toolPage(template, op, ops))
  count++
}

// Home page: keep the default meta, just inject crawlable content + tool links.
writeFileSync(indexPath, injectRoot(template, homeBlock(ops)))
writeFileSync(path.join(dist, 'sitemap.xml'), sitemap(ops))

console.log(`✅ prerendered ${count} tool pages + home + sitemap.xml (${ops.length + 1} URLs)`)
