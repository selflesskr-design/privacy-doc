import { PDFDocument } from 'pdf-lib'
import { COMPRESS_PDF, COMMON } from '../../content/strings.js'
import { loadPdf, renderPdfPage } from '../../lib/pdfjs.js'
import { isAbortError, throwIfAborted } from '../../lib/abort.js'

/** Lossless: strip document metadata and re-save with object streams. */
async function stripMetadata(bytes, signal) {
  throwIfAborted(signal)
  const doc = await PDFDocument.load(bytes, { updateMetadata: false })
  throwIfAborted(signal)
  try {
    doc.setTitle('')
    doc.setAuthor('')
    doc.setSubject('')
    doc.setKeywords([])
    doc.setProducer('')
    doc.setCreator('')
  } catch {
    /* some fields may be absent */
  }
  const out = await doc.save({ useObjectStreams: true })
  throwIfAborted(signal)
  return new Blob([out], { type: 'application/pdf' })
}

/** Lossy: rasterize each page to JPEG and rebuild. Text becomes non-selectable. */
async function rasterize(bytes, { dpi = 120, quality = 0.7 }, onProgress, signal) {
  const pdf = await loadPdf(bytes, signal)
  const scale = dpi / 72
  const out = await PDFDocument.create()
  for (let i = 1; i <= pdf.numPages; i++) {
    throwIfAborted(signal)
    onProgress?.((i - 1) / pdf.numPages, COMPRESS_PDF.compressing(i, pdf.numPages))
    const page = await pdf.getPage(i)
    try {
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await renderPdfPage(page, { canvasContext: ctx, viewport }, signal)
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality))
      throwIfAborted(signal)
      const img = await out.embedJpg(await blob.arrayBuffer())
      // Original page size in points (scale 1).
      const pt = page.getViewport({ scale: 1 })
      const p = out.addPage([pt.width, pt.height])
      p.drawImage(img, { x: 0, y: 0, width: pt.width, height: pt.height })
      canvas.width = 0
      canvas.height = 0
    } finally {
      page.cleanup?.()
    }
  }
  onProgress?.(0.95, COMPRESS_PDF.saving)
  throwIfAborted(signal)
  const outBytes = await out.save()
  throwIfAborted(signal)
  return new Blob([outBytes], { type: 'application/pdf' })
}

/**
 * @param {File} file
 * @param {{mode:'rasterize'|'metadata', dpi:number, quality:number}} opts
 * @returns {Promise<{blob:Blob, before:number, after:number}>}
 */
export async function compressPdf(file, opts, onProgress, signal) {
  const { mode = 'rasterize', dpi = 120, quality = 0.7 } = opts || {}
  throwIfAborted(signal)
  const bytes = new Uint8Array(await file.arrayBuffer())
  throwIfAborted(signal)
  const before = file.size
  let blob
  try {
    blob = mode === 'metadata'
      ? await stripMetadata(bytes, signal)
      : await rasterize(bytes, { dpi, quality }, onProgress, signal)
  } catch (e) {
    if (isAbortError(e)) throw e
    throw new Error(`PDF 용량을 줄이지 못했습니다. 암호가 설정된 PDF는 처리할 수 없습니다.`)
  }
  onProgress?.(1, COMMON.done)
  return { blob, before, after: blob.size }
}
