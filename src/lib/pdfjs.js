// Centralized pdf.js setup.
//
// The worker is imported via Vite's `?worker` suffix so it is BUNDLED LOCALLY
// and served from our own origin — never fetched from a CDN. This is required
// both for offline operation and for the strict CSP (worker-src 'self' blob:).
//
// CMaps and standard-font data are served from OUR OWN origin, copied into
// public/pdfjs/ by scripts/sync-pdfjs-assets.mjs. Upstream left these unset to
// guarantee zero network traffic, at the cost of fallback glyphs on CJK PDFs —
// which for Korean documents is not an edge case. Serving them locally keeps
// the guarantee intact (the CSP still allows only `connect-src 'self'`) while
// making Korean PDFs render correctly.
import * as pdfjsLib from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'
import { abortError, throwIfAborted } from './abort.js'

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker()

const CMAP_URL = '/pdfjs/cmaps/'
const STANDARD_FONT_URL = '/pdfjs/standard_fonts/'

/** Load a PDF document from an ArrayBuffer/Uint8Array. */
export function loadPdf(data, signal) {
  throwIfAborted(signal)
  const task = pdfjsLib.getDocument({
    data,
    // Same-origin only; nothing leaves the browser.
    cMapUrl: CMAP_URL,
    cMapPacked: true,
    standardFontDataUrl: STANDARD_FONT_URL,
    disableAutoFetch: true,
    disableStream: true,
    isEvalSupported: false,
  })
  if (!signal) return task.promise

  const onAbort = () => { void task.destroy() }
  signal.addEventListener('abort', onAbort, { once: true })
  return task.promise
    .catch((error) => {
      if (signal.aborted) throw abortError()
      throw error
    })
    .finally(() => signal.removeEventListener('abort', onAbort))
}

/** Render one page and cancel pdf.js's active render task when requested. */
export async function renderPdfPage(page, params, signal) {
  throwIfAborted(signal)
  const task = page.render(params)
  if (!signal) return task.promise

  const onAbort = () => task.cancel()
  signal.addEventListener('abort', onAbort, { once: true })
  try {
    await task.promise
  } catch (error) {
    if (signal.aborted) throw abortError()
    throw error
  } finally {
    signal.removeEventListener('abort', onAbort)
  }
}

export { pdfjsLib }
