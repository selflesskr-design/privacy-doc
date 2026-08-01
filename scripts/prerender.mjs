#!/usr/bin/env node

// Post-build prerender for SEO. PrivacyDoc is a client-side SPA, so a crawler
// that does not run JS would otherwise see one empty page. For every route this
// writes dist/<path>/index.html with:
//   - a unique <title>, description, canonical, robots, OG/Twitter tags
//   - JSON-LD (breadcrumb + the page's primary schema + FAQPage where real)
//   - real crawlable content inside #root: the H1, the prose, the internal links
// React replaces #root on load (createRoot, not hydrate), so this content is
// only ever seen by crawlers and on first paint. It also writes sitemap.xml.
//
// Two route families share the output tree:
//   - content pages from src/content/pages.js
//   - the original 24 tool pages from src/operations/*/meta.js  (URLs unchanged)
//
// Uses only Node built-ins.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { renderPageBody, escText, escAttr } from './renderBlocks.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const opsDir = path.join(root, 'src', 'operations')

const load = (rel) => import(pathToFileURL(path.join(root, ...rel)).href)
const site = await load(['src', 'config', 'site.js'])
const { PAGES, sitemapPages, canonicalOf } = await load(['src', 'content', 'pages.js'])
const { metaFor, structuredDataFor } = await load(['src', 'content', 'structuredData.js'])

const SITE = site.SITE_URL
const BRAND = site.BRAND

// Load operation metadata (id/name/description/order) straight from meta.js.
async function loadOps() {
  const ops = []
  for (const entry of readdirSync(opsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const metaPath = path.join(opsDir, entry.name, 'meta.js')
    if (!existsSync(metaPath)) continue
    const mod = await import(pathToFileURL(metaPath).href)
    const m = mod.default || mod
    ops.push({
      id: m.id || entry.name,
      name: m.name,
      description: m.description || '',
      category: m.category || 'other',
      order: m.order ?? 100,
    })
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

function injectJsonLd(html, graphs) {
  if (!graphs.length) return html
  const tags = graphs
    .map(
      (g) =>
        `<script type="application/ld+json" data-owner="privacydoc-jsonld">${JSON.stringify(
          g,
        ).replace(/</g, '\\u003c')}</script>`,
    )
    .join('\n    ')
  return html.replace('</head>', `    ${tags}\n  </head>`)
}

function applyMeta(html, meta) {
  let out = html
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escText(meta.title)}</title>`)
  out = swapTag(out, 'name="description"', `<meta name="description" content="${escAttr(meta.description)}" />`)
  out = swapTag(out, 'name="robots"', `<meta name="robots" content="${escAttr(meta.robots)}" />`)
  out = swapTag(out, 'rel="canonical"', `<link rel="canonical" href="${escAttr(meta.canonical)}" />`)
  out = swapTag(out, 'property="og:title"', `<meta property="og:title" content="${escAttr(meta.ogTitle)}" />`)
  out = swapTag(out, 'property="og:description"', `<meta property="og:description" content="${escAttr(meta.ogDescription)}" />`)
  out = swapTag(out, 'property="og:url"', `<meta property="og:url" content="${escAttr(meta.ogUrl)}" />`)
  out = swapTag(out, 'name="twitter:title"', `<meta name="twitter:title" content="${escAttr(meta.ogTitle)}" />`)
  out = swapTag(out, 'name="twitter:description"', `<meta name="twitter:description" content="${escAttr(meta.ogDescription)}" />`)
  return out
}

/** A tool page, described the same way a content page is. */
function toolAsPage(op, ops) {
  return {
    path: `/${op.id}`,
    title: `${op.name} — ${BRAND}`,
    description: `${op.description} 파일은 내 브라우저에서 직접 처리됩니다. 무료이고 가입이 필요 없습니다.`,
    h1: op.name,
    schema: 'SoftwareApplication',
    breadcrumb: [
      { name: '홈', path: '/' },
      { name: '전체 도구', path: '/tools' },
    ],
    sections: [
      { t: 'p', text: op.description },
      {
        t: 'p',
        text: `${BRAND}는 파일을 내 브라우저에서 직접 처리합니다. 파일이 밖으로 나가지 않고, 가입 없이 인터넷 없이도 쓸 수 있는 오픈소스입니다.`,
      },
      {
        t: 'cards',
        title: '관련 페이지',
        items: [
          { label: '모든 도구', href: '/tools', text: 'PDF·사진 도구 24가지' },
          { label: 'PDF 개인정보 가리기', href: '/tools/pdf-redact', text: '문서 속 개인정보 가리기' },
          { label: '보안', href: '/security', text: '직접 확인하는 방법' },
          { label: '자주 묻는 질문', href: '/faq', text: '많이 받는 질문' },
        ],
      },
      {
        t: 'cards',
        title: '다른 도구',
        items: ops
          .filter((o) => o.id !== op.id)
          .slice(0, 12)
          .map((o) => ({ label: o.name, href: `/${o.id}`, text: o.description })),
      },
    ],
  }
}

function writePage(template, page, ctx) {
  let html = applyMeta(template, metaFor(page))
  html = injectJsonLd(html, structuredDataFor(page))
  html = injectRoot(html, renderPageBody(page, ctx))

  const dir = page.path === '/' ? dist : path.join(dist, page.path.replace(/^\//, ''))
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), html)
}

function sitemap(pages) {
  const priority = (p) => (p.path === '/' ? '1.0' : p.path.split('/').length <= 2 ? '0.8' : '0.7')
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    pages
      .map(
        (p) =>
          `  <url><loc>${canonicalOf(p)}</loc><changefreq>weekly</changefreq>` +
          `<priority>${priority(p)}</priority></url>`,
      )
      .join('\n') +
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
const ctx = { ops }

// Content routes (home included — it overwrites dist/index.html last).
for (const page of PAGES) writePage(template, page, ctx)

// The original 24 tool routes, URLs untouched.
const toolPages = ops.map((op) => toolAsPage(op, ops))
for (const page of toolPages) writePage(template, page, ctx)

// Sitemap: indexable, working pages only. Tool pages are included; the editor
// routes and any `ready: false` landing page are not.
const urls = [...sitemapPages(), ...toolPages]
writeFileSync(path.join(dist, 'sitemap.xml'), sitemap(urls))

const skipped = PAGES.filter((p) => p.noindex || p.ready === false)
console.log(
  `✅ prerendered ${PAGES.length} content pages + ${toolPages.length} tool pages\n` +
    `   sitemap.xml: ${urls.length} URLs (excluded ${skipped.length}: ${skipped
      .map((p) => p.path)
      .join(', ')})`,
)
