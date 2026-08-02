import { decode, drawToCanvas, canvasToBlob } from '../../lib/imageCanvas.js'
import { STRIP_METADATA, COMMON } from '../../content/strings.js'
import { formatFromType, outName } from '../../lib/imageFormat.js'

// Re-encoding via canvas discards all metadata (EXIF, GPS, thumbnails, etc.).
export async function stripMetadata(file, opts, onProgress) {
  const { quality = 0.95 } = opts || {}
  onProgress?.(0.3, STRIP_METADATA.decoding)
  const bitmap = await decode(file)
  const fmt = formatFromType(file.type)
  onProgress?.(0.6, STRIP_METADATA.reencoding)
  const canvas = drawToCanvas(bitmap, { background: fmt === 'jpeg' ? '#ffffff' : undefined })
  const blob = await canvasToBlob(canvas, fmt, quality)
  bitmap.close?.()
  onProgress?.(1, COMMON.done)
  return { blob, filename: outName(file.name, fmt, '-clean') }
}
