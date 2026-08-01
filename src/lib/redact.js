import { PDFDocument } from 'pdf-lib'
import { loadPdf } from './pdfjs.js'
import { ERRORS } from '../content/strings.js'

// Safe PDF redaction.
//
// The deliberate difference from edit-pdf: nothing is drawn *on top of* the
// original document. Each page is rendered to a canvas, the covered areas are
// painted onto those pixels, and a brand-new PDF is built from the resulting
// images. The original page objects — text, annotations, form fields, embedded
// files, scripts, metadata — are never copied into the output, so the covered
// values are not present in the file at all.
//
// COORDINATES
// Areas are stored per page as fractions of the page box (0..1, origin
// top-left, rotation already applied by pdf.js's viewport). Fractions are
// independent of zoom, device pixel ratio and export DPI, so the same numbers
// drive the on-screen preview and the exported pixels. Never store CSS pixels.

/** Export presets. `scale` is a multiple of 72 dpi. */
export const QUALITY = {
  normal: { dpi: 150, jpegQuality: 0.85 },
  high: { dpi: 200, jpegQuality: 0.9 },
  max: { dpi: 300, jpegQuality: 0.94 },
}

// Browsers refuse to allocate canvases beyond roughly this area, and a single
// oversized page would take the whole job down with it.
const MAX_CANVAS_SIDE = 8192
const MAX_CANVAS_PIXELS = 40_000_000

/** Open a PDF for redaction. Rejects with a message the user can act on. */
export async function openPdf(file) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  try {
    return await loadPdf(bytes)
  } catch (err) {
    if (err?.name === 'PasswordException') throw new Error(ERRORS.encryptedPdf)
    throw new Error(ERRORS.unreadablePdf)
  }
}

/**
 * The page box in points, with the page's own rotation applied. Used for the
 * output page size and the preview aspect ratio, so both agree.
 */
export function pageBox(page) {
  const vp = page.getViewport({ scale: 1 })
  return { width: vp.width, height: vp.height }
}

/** Clamp a render scale so the canvas stays within what the browser will allocate. */
function safeScale(page, desiredScale) {
  const { width, height } = pageBox(page)
  let scale = desiredScale
  const side = Math.max(width, height) * scale
  if (side > MAX_CANVAS_SIDE) scale = MAX_CANVAS_SIDE / Math.max(width, height)
  if (width * scale * height * scale > MAX_CANVAS_PIXELS) {
    scale = Math.sqrt(MAX_CANVAS_PIXELS / (width * height))
  }
  return scale
}

/**
 * Render one page onto a canvas at `scale`. The caller owns the canvas and is
 * responsible for releasing it.
 */
export async function renderPageToCanvas(page, scale, canvas = document.createElement('canvas')) {
  const viewport = page.getViewport({ scale: safeScale(page, scale) })
  canvas.width = Math.max(1, Math.floor(viewport.width))
  canvas.height = Math.max(1, Math.floor(viewport.height))
  const ctx = canvas.getContext('2d', { alpha: false })
  // Pages are transparent by default; a white ground matches how a PDF prints.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({ canvasContext: ctx, viewport }).promise
  return { canvas, ctx, viewport }
}

/** Paint the covered areas onto already-rendered pixels. */
export function paintAreas(ctx, areas, widthPx, heightPx) {
  ctx.save()
  for (const a of areas) {
    ctx.fillStyle = a.color === 'white' ? '#ffffff' : '#000000'
    ctx.fillRect(
      Math.round(a.x * widthPx),
      Math.round(a.y * heightPx),
      Math.max(1, Math.round(a.w * widthPx)),
      Math.max(1, Math.round(a.h * heightPx)),
    )
  }
  ctx.restore()
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(ERRORS.unexpected))),
      'image/jpeg',
      quality,
    )
  })
}

/** Let the canvas memory go immediately rather than waiting on GC. */
function releaseCanvas(canvas) {
  canvas.width = 0
  canvas.height = 0
}

/**
 * Build the redacted PDF.
 *
 * @param {File} file                   the original PDF
 * @param {Record<number, Area[]>} byPage  areas keyed by 0-based page index,
 *                                      each { x, y, w, h } as 0..1 fractions
 * @param {{quality?: keyof QUALITY}} opts
 * @param {(value:number, message:string)=>void} onProgress
 * @returns {Promise<Blob>}
 */
export async function buildRedactedPdf(file, byPage, opts, onProgress) {
  const preset = QUALITY[opts?.quality] || QUALITY.high
  const scale = preset.dpi / 72

  const pdf = await openPdf(file)
  // A fresh document: nothing from the original is carried over. `updateMetadata:
  // false` matters — by default pdf-lib stamps its own Producer, Creator and
  // timestamps into the info dictionary as soon as the document is created.
  const out = await PDFDocument.create({ updateMetadata: false })

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      onProgress?.((i - 1) / pdf.numPages, i)

      const page = await pdf.getPage(i)
      const box = pageBox(page)
      const { canvas, ctx } = await renderPageToCanvas(page, scale)

      const areas = byPage[i - 1]
      if (areas?.length) paintAreas(ctx, areas, canvas.width, canvas.height)

      const blob = await canvasToBlob(canvas, preset.jpegQuality)
      const img = await out.embedJpg(await blob.arrayBuffer())

      // Page keeps its original point size; the image fills it exactly. The
      // rotation is already baked into the pixels, so no page rotation is set.
      const outPage = out.addPage([box.width, box.height])
      outPage.drawImage(img, { x: 0, y: 0, width: box.width, height: box.height })

      releaseCanvas(canvas)
      page.cleanup?.()
    }

    onProgress?.(0.97, null)

    // Belt and braces: clear anything the info dictionary might still hold.
    out.setTitle('')
    out.setAuthor('')
    out.setSubject('')
    out.setKeywords([])
    out.setProducer('')
    out.setCreator('')

    const bytes = await out.save({ useObjectStreams: true })
    onProgress?.(1, null)
    return new Blob([bytes], { type: 'application/pdf' })
  } finally {
    // cleanup(), never destroy(): the pdf.js worker is a single shared port
    // (see src/lib/pdfjs.js), and destroying a document tears that port down
    // for every other tool in the app.
    pdf.cleanup?.()
  }
}
