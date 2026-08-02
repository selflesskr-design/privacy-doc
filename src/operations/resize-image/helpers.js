import { decode, dimsOf, drawToCanvas, canvasToBlob } from '../../lib/imageCanvas.js'
import { RESIZE_IMAGE } from '../../content/strings.js'
import { formatFromType, outName } from '../../lib/imageFormat.js'

/**
 * @param {File} file
 * @param {{mode:'dimensions'|'percent', width:number, height:number, percent:number,
 *          keepAspect:boolean, format:'keep'|'jpeg'|'png'|'webp', quality:number}} opts
 */
export async function resizeImage(file, opts, onProgress) {
  const { mode = 'dimensions', width, height, percent = 100, keepAspect = true, format = 'keep', quality = 0.9 } = opts || {}
  onProgress?.(0.2, RESIZE_IMAGE.decoding)
  const bitmap = await decode(file)
  const src = dimsOf(bitmap)

  let targetW, targetH
  if (mode === 'percent') {
    targetW = Math.round((src.width * percent) / 100)
    targetH = Math.round((src.height * percent) / 100)
  } else {
    const w = Number(width) || 0
    const h = Number(height) || 0
    if (keepAspect) {
      if (w && !h) {
        targetW = w
        targetH = Math.round((src.height / src.width) * w)
      } else if (h && !w) {
        targetH = h
        targetW = Math.round((src.width / src.height) * h)
      } else if (w && h) {
        const scale = Math.min(w / src.width, h / src.height)
        targetW = Math.round(src.width * scale)
        targetH = Math.round(src.height * scale)
      } else {
        throw new Error('가로 또는 세로 크기를 입력해 주세요.')
      }
    } else {
      if (!w || !h) throw new Error('가로와 세로를 모두 입력하거나, 비율 유지를 켜 주세요.')
      targetW = w
      targetH = h
    }
  }
  if (targetW < 1 || targetH < 1) throw new Error('결과 크기가 너무 작습니다.')

  onProgress?.(0.6, RESIZE_IMAGE.resizing)
  const fmt = format === 'keep' ? formatFromType(file.type) : format
  const canvas = drawToCanvas(bitmap, { width: targetW, height: targetH, background: fmt === 'jpeg' ? '#ffffff' : undefined })
  const blob = await canvasToBlob(canvas, fmt, quality)
  bitmap.close?.()
  onProgress?.(1, 'Done')
  return { blob, filename: outName(file.name, fmt, `-${targetW}x${targetH}`), before: file.size, after: blob.size, width: targetW, height: targetH }
}
