// Single source of truth for brand + deployment URL. Imported by the app
// (useSeo) and by the build-time prerenderer (scripts/prerender.mjs), so
// changing the domain here updates canonical/og/sitemap everywhere at once.
export const SITE_URL = 'https://privacy-doc.selfless.kr'

export const BRAND = 'PrivacyDoc'
export const BRAND_KO = '프라이버시독'

export const DEFAULT_TITLE = 'PrivacyDoc — 브라우저에서 끝내는 개인정보 안전 문서 도구'
export const DEFAULT_DESC =
  'PDF·이미지 속 개인정보를 안전하게 가리고, 합치고, 용량을 줄입니다. 모든 처리는 내 브라우저 안에서만 이루어지며 파일이 서버로 전송되지 않습니다. 무료, 가입 없음, 오프라인 사용 가능.'

// Upstream attribution (MIT). See LICENSE and NOTICE.
export const UPSTREAM_NAME = 'DoxDock'
export const UPSTREAM_AUTHOR = 'Mithun Srinivas'
export const UPSTREAM_URL = 'https://github.com/mithun-srinivas/DoxDock'
