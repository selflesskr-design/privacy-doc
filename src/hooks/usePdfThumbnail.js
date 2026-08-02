import { useEffect, useState } from 'react'
import { loadPdf } from '../lib/pdfjs.js'

/**
 * Render one page of a PDF to a small data URL, for showing what a setting is
 * about to do to the document. Returns null until it is ready, then
 * { url, widthPt, heightPt } — the page size so an overlay can be drawn in the
 * same coordinates the PDF uses.
 */
export function usePdfThumbnail(file, { page = 1, width = 200 } = {}) {
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    setPreview(null)
    if (!file) return
    let cancelled = false

    ;(async () => {
      try {
        const pdf = await loadPdf(await file.arrayBuffer())
        const p = await pdf.getPage(Math.min(page, pdf.numPages))
        const base = p.getViewport({ scale: 1 })
        const viewport = p.getViewport({ scale: width / base.width })
        const canvas = document.createElement('canvas')
        canvas.width = Math.ceil(viewport.width)
        canvas.height = Math.ceil(viewport.height)
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        await p.render({ canvasContext: ctx, viewport }).promise
        if (!cancelled) {
          setPreview({
            url: canvas.toDataURL('image/png'),
            widthPt: base.width,
            heightPt: base.height,
          })
        }
        p.cleanup?.()
        pdf.destroy?.()
      } catch {
        // A preview is a nicety; the tool still works without one.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [file, page, width])

  return preview
}
