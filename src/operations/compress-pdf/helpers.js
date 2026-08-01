import { PDFDocument } from 'pdf-lib'
import { loadPdf } from '../../lib/pdfjs.js'

/** Lossless: strip document metadata and re-save with object streams. */
async function stripMetadata(bytes) {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false })
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
  return new Blob([out], { type: 'application/pdf' })
}

/** Lossy: rasterize each page to JPEG and rebuild. Text becomes non-selectable. */
async function rasterize(bytes, { dpi = 120, quality = 0.7 }, onProgress) {
  const pdf = await loadPdf(bytes)
  const scale = dpi / 72
  const out = await PDFDocument.create()
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.((i - 1) / pdf.numPages, `Compressing page ${i} of ${pdf.numPages}…`)
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvasContext: ctx, viewport }).promise
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality))
    const img = await out.embedJpg(await blob.arrayBuffer())
    // Original page size in points (scale 1).
    const pt = page.getViewport({ scale: 1 })
    const p = out.addPage([pt.width, pt.height])
    p.drawImage(img, { x: 0, y: 0, width: pt.width, height: pt.height })
    page.cleanup?.()
  }
  onProgress?.(0.95, 'Saving…')
  const outBytes = await out.save()
  return new Blob([outBytes], { type: 'application/pdf' })
}

/**
 * @param {File} file
 * @param {{mode:'rasterize'|'metadata', dpi:number, quality:number}} opts
 * @returns {Promise<{blob:Blob, before:number, after:number}>}
 */
export async function compressPdf(file, opts, onProgress) {
  const { mode = 'rasterize', dpi = 120, quality = 0.7 } = opts || {}
  const bytes = new Uint8Array(await file.arrayBuffer())
  const before = file.size
  let blob
  try {
    blob = mode === 'metadata' ? await stripMetadata(bytes) : await rasterize(bytes, { dpi, quality }, onProgress)
  } catch (e) {
    throw new Error(`PDF 용량을 줄이지 못했습니다. 암호가 설정된 PDF는 처리할 수 없습니다.`)
  }
  onProgress?.(1, 'Done')
  return { blob, before, after: blob.size }
}
