#!/usr/bin/env node

// Validates the prerendered output. Runs after prerender in `npm run build`, so
// an SEO regression fails the build rather than shipping quietly.
//
// Checks:
//   1. every route produced a static HTML file
//   2. exactly one <h1> per page
//   3. no duplicate <title> or meta description across indexable pages
//   4. canonical matches the page's own URL
//   5. internal links all point at routes that exist
//   6. every indexable, working page is in sitemap.xml — and nothing else is
//   7. noindex pages carry robots noindex and stay out of the sitemap
//   8. the original 24 tool URLs still exist

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const opsDir = path.join(root, 'src', 'operations')

const load = (rel) => import(pathToFileURL(path.join(root, ...rel)).href)
const { PAGES, sitemapPages, canonicalOf, isIndexable } = await load(['src', 'content', 'pages.js'])
const { metaFor } = await load(['src', 'content', 'structuredData.js'])
// Read the domain rather than repeating it — a hardcoded copy here would go
// stale the next time the deployment URL changes.
const { SITE_URL } = await load(['src', 'config', 'site.js'])

const problems = []
const fail = (msg) => problems.push(msg)

const opIds = readdirSync(opsDir, { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(path.join(opsDir, e.name, 'meta.js')))
  .map((e) => e.name)

const routes = [
  ...PAGES.map((p) => ({ path: p.path, page: p })),
  ...opIds.map((id) => ({ path: `/${id}`, page: null })),
]

const fileFor = (routePath) =>
  routePath === '/'
    ? path.join(dist, 'index.html')
    : path.join(dist, routePath.replace(/^\//, ''), 'index.html')

const titles = new Map()
const descriptions = new Map()
const known = new Set(routes.map((r) => r.path))

// ── 1, 2, 3, 4, 5, 7 ────────────────────────────────────────────────────────
for (const { path: routePath, page } of routes) {
  const file = fileFor(routePath)
  if (!existsSync(file)) {
    fail(`[1] 정적 HTML 없음: ${routePath}`)
    continue
  }
  const html = readFileSync(file, 'utf-8')

  const h1s = html.match(/<h1[\s>]/gi) || []
  if (h1s.length !== 1) fail(`[2] H1이 ${h1s.length}개 (1개여야 함): ${routePath}`)

  const robots = (html.match(/<meta[^>]*name="robots"[^>]*content="([^"]*)"/i) || [])[1]
  const expectedRobots = page ? metaFor(page).robots : 'index, follow'
  if (robots !== expectedRobots) {
    fail(`[7] robots 불일치: ${routePath} → "${robots}" (기대: "${expectedRobots}")`)
  }
  const indexable = page ? isIndexable(page) : true

  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]?.trim()
  const desc = (html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i) || [])[1]?.trim()
  if (!title) fail(`[3] title 없음: ${routePath}`)
  if (!desc) fail(`[3] description 없음: ${routePath}`)

  if (indexable) {
    if (title && titles.has(title)) fail(`[3] title 중복: "${title}" — ${titles.get(title)} / ${routePath}`)
    else if (title) titles.set(title, routePath)
    if (desc && descriptions.has(desc)) fail(`[3] description 중복: ${descriptions.get(desc)} / ${routePath}`)
    else if (desc) descriptions.set(desc, routePath)
  }

  const canonical = (html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i) || [])[1]
  const expected = page ? canonicalOf(page) : `${SITE_URL}${routePath}`
  if (canonical !== expected) fail(`[4] canonical 불일치: ${routePath} → ${canonical} (기대: ${expected})`)

  // Internal links inside the prerendered body must resolve to a real route.
  const body = (html.match(/<div id="root">([\s\S]*?)<\/div>\s*<script/i) || [])[1] || ''
  for (const m of body.matchAll(/href="(\/[^"#?]*)"/g)) {
    const target = m[1].replace(/\/$/, '') || '/'
    if (!known.has(target)) fail(`[5] 끊어진 내부 링크: ${routePath} → ${m[1]}`)
  }
}

// ── 6 ───────────────────────────────────────────────────────────────────────
const sitemapPath = path.join(dist, 'sitemap.xml')
if (!existsSync(sitemapPath)) {
  fail('[6] sitemap.xml 없음')
} else {
  const xml = readFileSync(sitemapPath, 'utf-8')
  const listed = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))

  for (const page of sitemapPages()) {
    if (!listed.has(canonicalOf(page))) fail(`[6] sitemap 누락: ${page.path}`)
  }
  for (const id of opIds) {
    if (!listed.has(`${SITE_URL}/${id}`)) fail(`[6] sitemap 누락(도구): /${id}`)
  }
  for (const page of PAGES) {
    if (!isIndexable(page) && listed.has(canonicalOf(page))) {
      fail(`[6] sitemap에 포함되면 안 되는 페이지: ${page.path}`)
    }
  }
}

// ── 8 ───────────────────────────────────────────────────────────────────────
if (opIds.length < 24) fail(`[8] 기존 도구 수가 24개 미만: ${opIds.length}개`)
for (const id of opIds) {
  if (!existsSync(fileFor(`/${id}`))) fail(`[8] 기존 도구 URL 소실: /${id}`)
}

// ── report ──────────────────────────────────────────────────────────────────
if (problems.length) {
  console.error(`\n❌ SEO 검사 실패 (${problems.length}건)`)
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}

const noindexFollow = PAGES.filter((p) => !p.noindex && p.ready === false)
const noindexNofollow = PAGES.filter((p) => p.noindex)

console.log(
  `✅ SEO 검사 통과\n` +
    `   전체 라우트      ${routes.length}개\n` +
    `   index 허용       ${titles.size}개\n` +
    `   sitemap 포함     ${sitemapPages().length + opIds.length}개\n` +
    `   noindex, follow  ${noindexFollow.length}개 (${noindexFollow.map((p) => p.path).join(', ')})\n` +
    `   noindex, nofollow ${noindexNofollow.length}개 (${noindexNofollow.map((p) => p.path).join(', ')})\n` +
    `   기존 도구 URL    ${opIds.length}개 보존, title/description 중복 없음`,
)
