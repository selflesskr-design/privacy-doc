import { decode, drawToCanvas, canvasToBlob } from '../../lib/imageCanvas.js'
import { CONVERT_IMAGE, COMMON } from '../../content/strings.js'
import { outName } from '../../lib/imageFormat.js'

/**
 * @param {File} file
 * @param {{format:'jpeg'|'png'|'webp', quality:number}} opts
 */
export async function convertImage(file, opts, onProgress) {
  const { format = 'png', quality = 0.9 } = opts || {}
  onProgress?.(0.3, CONVERT_IMAGE.decoding)
  const bitmap = await decode(file)
  onProgress?.(0.6, CONVERT_IMAGE.encoding)
  // Flatten onto white when moving to a format without alpha (JPEG).
  const canvas = drawToCanvas(bitmap, { background: format === 'jpeg' ? '#ffffff' : undefined })
  const blob = await canvasToBlob(canvas, format, quality)
  bitmap.close?.()
  onProgress?.(1, COMMON.done)
  return { blob, filename: outName(file.name, format), before: file.size, after: blob.size }
}
