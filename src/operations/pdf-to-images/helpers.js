import { loadPdf, renderPdfPage } from '../../lib/pdfjs.js'
import { canvasToBlob } from '../../lib/imageCanvas.js'
import { baseName, parsePageRanges } from '../../lib/format.js'
import { PDF_TO_IMAGES, COMMON } from '../../content/strings.js'
import { throwIfAborted } from '../../lib/abort.js'

/**
 * Render PDF pages to images.
 * @param {File} file
 * @param {{format:'png'|'jpeg', scale:number, range:string, quality:number}} opts
 * @param {(v:number,m:string)=>void} onProgress
 * @returns {Promise<{filename:string, blob:Blob, width:number, height:number}[]>}
 */
export async function pdfToImages(file, opts, onProgress, signal) {
  const { format = 'png', scale = 2, range = '', quality = 0.92 } = opts || {}
  throwIfAborted(signal)
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await loadPdf(data, signal)
  const total = pdf.numPages
  const pages = range.trim() ? parsePageRanges(range, total) : Array.from({ length: total }, (_, i) => i + 1)
  if (!pages.length) throw new Error('선택한 페이지가 없습니다.')

  const base = baseName(file.name)
  const results = []
  for (let idx = 0; idx < pages.length; idx++) {
    throwIfAborted(signal)
    const pageNum = pages[idx]
    onProgress?.(idx / pages.length, PDF_TO_IMAGES.rendering(pageNum, idx + 1, pages.length))
    const page = await pdf.getPage(pageNum)
    try {
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const ctx = canvas.getContext('2d')
      if (format === 'jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      await renderPdfPage(page, { canvasContext: ctx, viewport }, signal)
      const ext = format === 'jpeg' ? 'jpg' : 'png'
      const blob = await canvasToBlob(canvas, format, quality)
      throwIfAborted(signal)
      results.push({
        filename: `${base}-p${String(pageNum).padStart(3, '0')}.${ext}`,
        blob,
        width: canvas.width,
        height: canvas.height,
      })
      canvas.width = 0
      canvas.height = 0
    } finally {
      page.cleanup?.()
    }
  }
  onProgress?.(1, COMMON.done)
  return results
}
