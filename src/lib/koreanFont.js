// Korean text support for pdf-lib. pdf-lib's StandardFonts use WinAnsi encoding
// and throw on any Hangul codepoint, so anything that draws Korean text into a
// PDF has to embed a real font.
//
// This module is deliberately isolated: redaction and rasterization must never
// depend on it, so a font failure can never break masking. `hasHangul` is a
// cheap static import; fontkit and the 2.6 MB face are both pulled in only when
// Korean text is actually present, via dynamic import inside embedKoreanFont.
//
// The font is served from our own origin (CSP allows `connect-src 'self'`), so
// users who never type Korean into a PDF never download it.
const FONT_URL = '/fonts/Pretendard-Regular.ttf'

// Hangul syllables + jamo, including the extended jamo blocks. Written as
// escapes so the check does not depend on this file's source encoding.
const HANGUL = /[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7A3\uD7B0-\uD7FF]/

export function hasHangul(text) {
  return HANGUL.test(String(text ?? ''))
}

let bytesPromise = null

function loadFontBytes() {
  if (!bytesPromise) {
    bytesPromise = fetch(FONT_URL)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.arrayBuffer()
      })
      .catch(() => {
        bytesPromise = null // allow a retry on the next attempt
        throw new Error(
          '한글 폰트를 불러오지 못했습니다. 인터넷에 연결한 뒤 다시 시도해 주세요. ' +
            '한 번 사용하고 나면 오프라인에서도 동작합니다.',
        )
      })
  }
  return bytesPromise
}

const perDocument = new WeakMap()

/**
 * Embed Pretendard Regular into `doc` and return the PDFFont, reusing the same
 * embed for repeated calls on one document.
 *
 * Subsetting is not optional: the full face adds ~1.2 MB to every output PDF,
 * a subset of the glyphs actually used adds ~5 KB.
 *
 * Only Regular 400 is bundled, so Korean text is always drawn at regular
 * weight — bold/italic styling does not apply to it.
 */
export async function embedKoreanFont(doc) {
  const cached = perDocument.get(doc)
  if (cached) return cached

  const [{ default: fontkit }, bytes] = await Promise.all([
    import('@pdf-lib/fontkit'),
    loadFontBytes(),
  ])
  doc.registerFontkit(fontkit)
  const font = await doc.embedFont(bytes, { subset: true })
  perDocument.set(doc, font)
  return font
}
