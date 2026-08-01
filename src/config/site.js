// Single source of truth for brand + deployment URL. Imported by the app
// (useSeo) and by the build-time prerenderer (scripts/prerender.mjs), so
// changing the domain here updates canonical/og/sitemap everywhere at once.
export const SITE_URL = 'https://privacy.selfless.kr'

export const BRAND = 'PrivacyDoc'
export const BRAND_KO = '프라이버시독'

export const DEFAULT_TITLE = 'PrivacyDoc — PDF·사진 개인정보 가리기'
export const DEFAULT_DESC =
  'PDF와 사진 속 개인정보를 가리고, 사진 정보를 지우고, PDF를 합치거나 용량을 줄입니다. 파일은 내 브라우저에서 직접 처리됩니다. 무료이고 가입이 필요 없습니다.'

// Upstream attribution (MIT). See LICENSE and NOTICE.
export const UPSTREAM_NAME = 'DoxDock'
export const UPSTREAM_AUTHOR = 'Mithun Srinivas'
export const UPSTREAM_URL = 'https://github.com/mithun-srinivas/DoxDock'
