import { useEffect } from 'react'
import { SITE_URL, BRAND, DEFAULT_TITLE, DEFAULT_DESC } from '../config/site.js'

// Keeps the document's SEO/social tags in sync with the active tool as the user
// navigates client-side. The tags themselves already exist in index.html (and in
// the prerendered per-tool pages) — this just updates them in place so a
// JS-rendering crawler and social-share scrapers see the right title/description.
const SITE = SITE_URL

function setAttr(selector, attr, value) {
  const el = document.head.querySelector(selector)
  if (el) el.setAttribute(attr, value)
}

export function useSeo(op) {
  useEffect(() => {
    const title = op ? `${op.name} — ${BRAND}` : DEFAULT_TITLE
    const description = op
      ? `${op.description} 모든 처리는 내 브라우저 안에서만 이루어집니다 — 업로드 없음, 가입 없음.`
      : DEFAULT_DESC
    const url = op ? `${SITE}/${op.id}` : `${SITE}/`

    document.title = title
    setAttr('meta[name="description"]', 'content', description)
    setAttr('link[rel="canonical"]', 'href', url)
    setAttr('meta[property="og:title"]', 'content', title)
    setAttr('meta[property="og:description"]', 'content', description)
    setAttr('meta[property="og:url"]', 'content', url)
    setAttr('meta[name="twitter:title"]', 'content', title)
    setAttr('meta[name="twitter:description"]', 'content', description)
  }, [op])
}
