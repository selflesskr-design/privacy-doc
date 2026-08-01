import { SITE_URL, BRAND, DEFAULT_DESC } from '../config/site.js'
import { canonicalOf, isIndexable } from './pages.js'

// JSON-LD builders. Plain objects with no DOM access, so the React runtime and
// the Node prerenderer emit byte-identical structured data.

const OG_IMAGE = `${SITE_URL}/og.png`

function breadcrumbLd(page) {
  if (!page.breadcrumb?.length) return null
  const trail = [...page.breadcrumb, { name: page.h1, path: page.path }]
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${crumb.path}`,
    })),
  }
}

/** Only emitted for pages that genuinely contain a FAQ block. */
function faqLd(page) {
  const block = page.sections?.find((s) => s.t === 'faq')
  if (!block?.items?.length) return null
  return {
    '@type': 'FAQPage',
    mainEntity: block.items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

function primaryLd(page) {
  const url = canonicalOf(page)
  const base = { name: page.h1, description: page.description, url, inLanguage: 'ko-KR' }

  switch (page.schema) {
    case 'WebApplication':
      return {
        '@type': 'WebApplication',
        ...base,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any (web browser)',
        browserRequirements: 'Requires JavaScript',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
        featureList: [
          'PDF 개인정보 가리기',
          '이미지 개인정보 가리기',
          '사진 위치정보(EXIF·GPS) 삭제',
          'PDF 합치기',
          'PDF 용량 줄이기',
        ],
      }
    case 'SoftwareApplication':
      return {
        '@type': 'SoftwareApplication',
        ...base,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any (web browser)',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
        isPartOf: { '@type': 'WebSite', name: BRAND, url: `${SITE_URL}/` },
      }
    case 'Article':
      return {
        '@type': 'Article',
        headline: page.h1,
        description: page.description,
        mainEntityOfPage: url,
        inLanguage: 'ko-KR',
        image: OG_IMAGE,
        author: { '@type': 'Organization', name: BRAND, url: `${SITE_URL}/` },
        publisher: { '@type': 'Organization', name: BRAND, url: `${SITE_URL}/` },
      }
    case 'CollectionPage':
      return { '@type': 'CollectionPage', ...base }
    case 'FAQPage':
      return null // faqLd already covers it; emitting both would duplicate
    default:
      return { '@type': 'WebPage', ...base }
  }
}

/** All JSON-LD graphs for a page, ready to be stringified into script tags. */
export function structuredDataFor(page) {
  if (!isIndexable(page)) return []
  const graphs = [primaryLd(page), breadcrumbLd(page), faqLd(page)].filter(Boolean)
  return graphs.map((g) => ({ '@context': 'https://schema.org', ...g }))
}

/**
 * `noindex, nofollow` hides the editor entirely. A tool page whose feature is
 * still being built uses `noindex, follow` instead: it stays out of results
 * until it works, but its links still pass through to the pages that do.
 */
function robotsFor(page) {
  if (page.noindex) return 'noindex, nofollow'
  if (page.ready === false) return 'noindex, follow'
  return 'index, follow'
}

/** The full set of head values for a page, used by useSeo and the prerenderer. */
export function metaFor(page) {
  return {
    title: page.title,
    description: page.description || DEFAULT_DESC,
    canonical: canonicalOf(page),
    robots: robotsFor(page),
    ogTitle: page.ogTitle || page.title,
    ogDescription: page.ogDescription || page.description || DEFAULT_DESC,
    ogImage: OG_IMAGE,
    ogUrl: canonicalOf(page),
  }
}
