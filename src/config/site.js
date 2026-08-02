// Single source of truth for brand + deployment URL. Imported by the app
// (useSeo) and by the build-time prerenderer (scripts/prerender.mjs), so
// changing the domain here updates canonical/og/sitemap everywhere at once.
export const SITE_URL = 'https://privacy.selfless.kr'
// Change this version when the social sharing artwork changes. KakaoTalk and
// other crawlers cache image URLs aggressively, so a new URL forces a refresh.
export const OG_IMAGE_URL = `${SITE_URL}/og.png?v=20260802`

// The wordmark matches the address it lives at: privacy.selfless.kr. "Doc" tied
// the name to documents, and photos are half of what the service handles.
export const BRAND = 'Privacy'

export const DEFAULT_TITLE = 'Privacy — PDF·사진 개인정보 가리기'
export const DEFAULT_DESC =
  'PDF와 사진 속 개인정보를 가리고, 사진 정보를 지우고, PDF를 합치거나 용량을 줄입니다. 파일은 내 브라우저에서 직접 처리됩니다. 무료이고 가입이 필요 없습니다.'

// These operations have a separate, fuller landing page for search visitors.
// The working route stays usable but points search engines at this canonical.
export const TOOL_LANDING_PATHS = {
  'merge-pdfs': '/tools/merge-pdf',
  'compress-pdf': '/tools/compress-pdf',
  'strip-metadata': '/tools/remove-photo-metadata',
}

// Upstream attribution (MIT). See LICENSE and NOTICE.
export const UPSTREAM_NAME = 'DoxDock'
export const UPSTREAM_AUTHOR = 'Mithun Srinivas'
export const UPSTREAM_URL = 'https://github.com/mithun-srinivas/DoxDock'
