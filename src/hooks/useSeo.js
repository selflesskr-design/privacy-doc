import { useEffect } from 'react'
import { SITE_URL, BRAND } from '../config/site.js'
import { getPage } from '../content/pages.js'
import { metaFor, structuredDataFor } from '../content/structuredData.js'

// Keeps the head in sync with the current route. index.html and the prerendered
// pages already ship the right tags; this updates them in place for client-side
// navigation so JS-rendering crawlers and share scrapers see the right values.

function setAttr(selector, attr, value) {
  const el = document.head.querySelector(selector)
  if (el) el.setAttribute(attr, value)
}

const LD_ID = 'privacydoc-jsonld'

function setStructuredData(graphs) {
  document.head.querySelectorAll(`script[data-owner="${LD_ID}"]`).forEach((el) => el.remove())
  for (const graph of graphs) {
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.dataset.owner = LD_ID
    el.textContent = JSON.stringify(graph)
    document.head.appendChild(el)
  }
}

/**
 * @param {object|null} op    active operation, when a tool route is open
 * @param {object|null} page  active content page, when a content route is open
 */
export function useSeo(op, page) {
  useEffect(() => {
    // A tool route borrows the shape of a content page so both paths are equal.
    const resolved =
      page ||
      (op
        ? {
            path: `/${op.id}`,
            title: `${op.name} — ${BRAND}`,
            description: `${op.description} 파일은 내 브라우저에서 직접 처리됩니다. 무료이고 가입이 필요 없습니다.`,
            h1: op.name,
            schema: 'SoftwareApplication',
            breadcrumb: [
              { name: '홈', path: '/' },
              { name: '전체 도구', path: '/tools' },
            ],
            sections: [],
          }
        : getPage('/'))

    const meta = metaFor(resolved)

    document.title = meta.title
    setAttr('meta[name="description"]', 'content', meta.description)
    setAttr('meta[name="robots"]', 'content', meta.robots)
    setAttr('link[rel="canonical"]', 'href', meta.canonical)
    setAttr('meta[property="og:title"]', 'content', meta.ogTitle)
    setAttr('meta[property="og:description"]', 'content', meta.ogDescription)
    setAttr('meta[property="og:url"]', 'content', meta.ogUrl)
    setAttr('meta[property="og:image"]', 'content', meta.ogImage)
    setAttr('meta[name="twitter:title"]', 'content', meta.ogTitle)
    setAttr('meta[name="twitter:description"]', 'content', meta.ogDescription)
    setAttr('meta[name="twitter:image"]', 'content', meta.ogImage)

    setStructuredData(structuredDataFor(resolved))
  }, [op, page])
}

export { SITE_URL }
