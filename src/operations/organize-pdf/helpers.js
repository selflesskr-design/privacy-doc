import { PDFDocument } from 'pdf-lib'
import { ORGANIZE_PDF, toUserMessage } from '../../content/strings.js'
import { loadPdf } from '../../lib/pdfjs.js'

/** Render small thumbnails for every page. Returns [{index, url, w, h}]. */
export async function renderThumbnails(file, onProgress, scale = 0.4) {
  const data = new Uint8Array(await file.arrayBuffer())
  let pdf
  try {
    pdf = await loadPdf(data)
  } catch (err) {
    // pdf.js speaks English ("Invalid PDF structure.") and it reached the screen.
    throw new Error(toUserMessage(err))
  }
  const thumbs = []
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(i / pdf.numPages, ORGANIZE_PDF.thumbnails(i, pdf.numPages))
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvasContext: ctx, viewport }).promise
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.7))
    thumbs.push({ index: i - 1, url: URL.createObjectURL(blob), w: canvas.width, h: canvas.height })
    page.cleanup?.()
  }
  return thumbs
}

/** Rebuild a PDF from the original file keeping `order` (array of 0-based indices). */
export async function buildFromOrder(file, order, onProgress) {
  if (!order.length) throw new Error('페이지를 모두 지웠습니다. 최소 한 쪽은 남겨 주세요.')
  const src = await PDFDocument.load(await file.arrayBuffer())
  const out = await PDFDocument.create()
  onProgress?.(0.3, ORGANIZE_PDF.assembling)
  const pages = await out.copyPages(src, order)
  pages.forEach((p) => out.addPage(p))
  onProgress?.(0.8, ORGANIZE_PDF.saving)
  const bytes = await out.save()
  return new Blob([bytes], { type: 'application/pdf' })
}
