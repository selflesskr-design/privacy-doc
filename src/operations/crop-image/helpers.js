import { decode, drawToCanvas, canvasToBlob } from '../../lib/imageCanvas.js'
import { formatFromType, outName } from '../../lib/imageFormat.js'

/**
 * @param {File} file
 * @param {{x:number,y:number,w:number,h:number}} crop  natural pixel coordinates
 */
export async function cropImage(file, crop, onProgress) {
  const x = Math.max(0, Math.round(crop.x))
  const y = Math.max(0, Math.round(crop.y))
  const w = Math.round(crop.w)
  const h = Math.round(crop.h)
  if (w < 1 || h < 1) throw new Error('선택한 영역이 없습니다. 자를 부분을 드래그해 주세요.')
  onProgress?.(0.4, 'Decoding image…')
  const bitmap = await decode(file)
  const fmt = formatFromType(file.type)
  onProgress?.(0.7, 'Cropping…')
  const canvas = drawToCanvas(bitmap, { crop: { x, y, w, h }, background: fmt === 'jpeg' ? '#ffffff' : undefined })
  const blob = await canvasToBlob(canvas, fmt, 0.95)
  bitmap.close?.()
  onProgress?.(1, 'Done')
  return { blob, filename: outName(file.name, fmt, '-cropped'), before: file.size, after: blob.size, width: w, height: h }
}
