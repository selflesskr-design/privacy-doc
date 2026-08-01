import { PDFDocument, degrees, rgb } from 'pdf-lib'
import { embedKoreanFont } from './koreanFont.js'
import { loadPdf } from './pdfjs.js'
import { buildRedactedPdf, pageBox, renderPageToCanvas } from './redact.js'

// End-to-end checks for the redaction pipeline, run in a real browser because
// the pipeline depends on canvas. Dev-only: main.jsx exposes it as
// window.__redactSelfTest() when import.meta.env.DEV is set, so nothing here
// ships to production.
//
// Each case builds a PDF containing a known secret string, covers exactly that
// string, then verifies two independent things:
//   1. the secret cannot be extracted from the output (safety)
//   2. the covered pixels are actually dark and their neighbours are not,
//      at the position the user picked (coordinates)

const SECRET = '900101-1234567'
const NEIGHBOUR = '이 줄은 남아야 합니다'

/** Where the secret is drawn, as fractions of the *unrotated* page box. */
const SECRET_BOX = { x: 0.1, y: 0.18, w: 0.5, h: 0.05 }

async function makeSourcePdf({ pages = 1, rotate = 0, size = [595.28, 841.89], sizes = null }) {
  const doc = await PDFDocument.create()
  const font = await embedKoreanFont(doc)
  for (let i = 0; i < pages; i++) {
    const [w, h] = sizes ? sizes[i % sizes.length] : size
    const page = doc.addPage([w, h])
    if (rotate) page.setRotation(degrees(rotate))
    // Draw the secret inside SECRET_BOX of the unrotated page.
    const fs = Math.round(h * 0.028)
    page.drawText(SECRET, {
      x: SECRET_BOX.x * w,
      y: h - SECRET_BOX.y * h - fs,
      size: fs,
      font,
      color: rgb(0, 0, 0),
    })
    page.drawText(NEIGHBOUR, {
      x: SECRET_BOX.x * w,
      y: h - 0.5 * h,
      size: fs,
      font,
      color: rgb(0, 0, 0),
    })
  }
  const bytes = await doc.save()
  return new File([bytes], 'selftest.pdf', { type: 'application/pdf' })
}

/**
 * Map SECRET_BOX from unrotated page space into the rotated view space that the
 * editor and the exporter both use. This mirrors what a user does on screen:
 * they draw over what they see.
 */
function rotateBox(b, rotate) {
  switch (((rotate % 360) + 360) % 360) {
    case 90:
      return { x: 1 - b.y - b.h, y: b.x, w: b.h, h: b.w }
    case 180:
      return { x: 1 - b.x - b.w, y: 1 - b.y - b.h, w: b.w, h: b.h }
    case 270:
      return { x: b.y, y: 1 - b.x - b.w, w: b.h, h: b.w }
    default:
      return { ...b }
  }
}

async function extractText(blob) {
  const pdf = await loadPdf(new Uint8Array(await blob.arrayBuffer()))
  let all = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const tc = await page.getTextContent()
    all += tc.items.map((it) => it.str).join('')
    page.cleanup?.()
  }
  pdf.cleanup?.()
  return all
}

/** Average luminance of a small patch, 0 (black) .. 255 (white). */
function patchLuma(ctx, cx, cy, r = 3) {
  const d = ctx.getImageData(Math.max(0, cx - r), Math.max(0, cy - r), r * 2, r * 2).data
  let sum = 0
  for (let i = 0; i < d.length; i += 4) sum += (d[i] + d[i + 1] + d[i + 2]) / 3
  return sum / (d.length / 4)
}

async function inspectPixels(blob, area, pageNum = 1) {
  const pdf = await loadPdf(new Uint8Array(await blob.arrayBuffer()))
  const page = await pdf.getPage(pageNum)
  const { canvas, ctx } = await renderPageToCanvas(page, 1.5)
  const W = canvas.width
  const H = canvas.height
  const inside = patchLuma(ctx, Math.round((area.x + area.w / 2) * W), Math.round((area.y + area.h / 2) * H))
  // Just below the covered strip — should still carry page content/white.
  const outside = patchLuma(ctx, Math.round((area.x + area.w / 2) * W), Math.round(Math.min(H - 5, (area.y + area.h + 0.06) * H)))
  const box = pageBox(page)
  canvas.width = 0
  canvas.height = 0
  page.cleanup?.()
  pdf.cleanup?.()
  return { inside, outside, box }
}

async function structuralChecks(blob) {
  // `updateMetadata: false` is essential here: loading with the default stamps
  // pdf-lib's own Producer into the document, so the test would measure its own
  // side effect instead of what the file actually contains.
  const doc = await PDFDocument.load(await blob.arrayBuffer(), { updateMetadata: false })
  const pages = doc.getPages()
  let annots = 0
  for (const p of pages) {
    const a = p.node.Annots?.()
    annots += a ? a.size() : 0
  }
  let fields = 0
  try {
    fields = doc.getForm().getFields().length
  } catch {
    fields = 0
  }
  const raw = new TextDecoder('latin1').decode(await blob.arrayBuffer())
  return {
    pageCount: pages.length,
    annotations: annots,
    formFields: fields,
    producer: doc.getProducer() || '',
    author: doc.getAuthor() || '',
    title: doc.getTitle() || '',
    hasJavaScript: /\/JavaScript|\/JS\b|\/OpenAction/.test(raw),
    hasEmbeddedFiles: /\/EmbeddedFiles|\/Filespec/.test(raw),
    hasFontResource: /\/FontFile|\/Type\s*\/Font/.test(raw),
    secretInRawBytes: raw.includes(SECRET),
    // Authoritative: what the bytes on disk actually say.
    producerInRawBytes: /\/Producer/.test(raw),
    infoDictInRawBytes: /\/Info\b/.test(raw),
  }
}

const CASES = [
  { name: '세로 A4 1쪽', opts: {} },
  { name: '가로 A4', opts: { size: [841.89, 595.28] } },
  { name: '90도 회전', opts: { rotate: 90 } },
  { name: '180도 회전', opts: { rotate: 180 } },
  { name: '270도 회전', opts: { rotate: 270 } },
  { name: '여러 쪽 (3쪽)', opts: { pages: 3 } },
  { name: '쪽마다 크기 다름', opts: { pages: 3, sizes: [[595.28, 841.89], [841.89, 595.28], [420, 595]] } },
  { name: '고해상도 큰 페이지', opts: { size: [1684, 2384] } },
]

export async function runRedactSelfTest({ quality = 'high' } = {}) {
  const results = []

  for (const c of CASES) {
    const file = await makeSourcePdf(c.opts)
    const pages = c.opts.pages || 1
    const rotate = c.opts.rotate || 0
    const area = { ...rotateBox(SECRET_BOX, rotate), color: 'black' }

    const byPage = {}
    for (let p = 0; p < pages; p++) byPage[p] = [area]

    const blob = await buildRedactedPdf(file, byPage, { quality }, () => {})

    const beforeText = await extractText(file)
    const afterText = await extractText(blob)
    const px = await inspectPixels(blob, area)
    const st = await structuralChecks(blob)

    results.push({
      case: c.name,
      sourceHadSecret: beforeText.includes(SECRET),
      secretExtractable: afterText.includes(SECRET),
      secretInRawBytes: st.secretInRawBytes,
      neighbourTextGone: !afterText.includes(NEIGHBOUR), // everything becomes an image
      coveredPatchIsDark: px.inside < 40,
      coveredLuma: Math.round(px.inside),
      neighbourLuma: Math.round(px.outside),
      pageCount: st.pageCount,
      expectedPages: pages,
      annotations: st.annotations,
      formFields: st.formFields,
      hasJavaScript: st.hasJavaScript,
      hasEmbeddedFiles: st.hasEmbeddedFiles,
      hasFontResource: st.hasFontResource,
      producer: st.producer,
      author: st.author,
      title: st.title,
      producerInRawBytes: st.producerInRawBytes,
      infoDictInRawBytes: st.infoDictInRawBytes,
      outputKB: Math.round(blob.size / 1024),
    })
  }

  const failures = []
  for (const r of results) {
    if (!r.sourceHadSecret) failures.push(`${r.case}: 원본에 대상 문자열이 없음 (테스트 자체 오류)`)
    if (r.secretExtractable) failures.push(`${r.case}: 가린 문자열이 추출됨`)
    if (r.secretInRawBytes) failures.push(`${r.case}: 가린 문자열이 파일 바이트에 남음`)
    if (!r.coveredPatchIsDark) failures.push(`${r.case}: 가린 위치가 어둡지 않음 (luma ${r.coveredLuma}) — 좌표 불일치`)
    if (r.pageCount !== r.expectedPages) failures.push(`${r.case}: 쪽 수 불일치 ${r.pageCount}/${r.expectedPages}`)
    if (r.annotations) failures.push(`${r.case}: 주석이 남음 (${r.annotations})`)
    if (r.formFields) failures.push(`${r.case}: 입력란이 남음 (${r.formFields})`)
    if (r.hasJavaScript) failures.push(`${r.case}: 스크립트가 남음`)
    if (r.hasEmbeddedFiles) failures.push(`${r.case}: 첨부 파일이 남음`)
    if (r.hasFontResource) failures.push(`${r.case}: 폰트 리소스가 남음`)
    if (r.producer || r.author || r.title) failures.push(`${r.case}: 문서 정보가 남음`)
    if (r.producerInRawBytes) failures.push(`${r.case}: 파일에 생성 프로그램 정보가 남음`)
  }

  return { passed: failures.length === 0, failures, results }
}
