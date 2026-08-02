// Redaction for photos. Same principle as src/lib/redact.js: the covered areas
// are painted onto the pixels and the file is re-encoded from those pixels, so
// what is under them is gone rather than hidden behind a shape.
//
// Re-encoding through a canvas also drops every EXIF field the original
// carried — camera, timestamp and GPS location — which is the other half of
// what a photographed document gives away.

import { decode } from './imageCanvas.js'

/** Decoded photo, with the EXIF orientation already applied to the pixels. */
export async function openImage(file) {
  const bitmap = await decode(file)
  const width = bitmap.width || bitmap.naturalWidth
  const height = bitmap.height || bitmap.naturalHeight
  if (!width || !height) throw new Error('사진을 열 수 없습니다. JPEG, PNG, WebP 파일을 사용해 주세요.')
  return { bitmap, width, height }
}

/** Draw the photo into a canvas at `scale`, for the editor to display. */
export function drawToCanvas({ bitmap, width, height }, scale, canvas) {
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return ctx
}

const MIME = { jpeg: 'image/jpeg', png: 'image/png' }

/**
 * Build the redacted photo.
 *
 * @param {{bitmap:ImageBitmap, width:number, height:number}} image
 * @param {{x:number,y:number,w:number,h:number,color?:string}[]} areas
 *        fractions of the image (0..1, top-left origin)
 * @param {{format?:'jpeg'|'png', quality?:number}} opts
 * @returns {Promise<Blob>}
 */
export async function buildRedactedImage(image, areas, opts = {}) {
  const { format = 'jpeg', quality = 0.92 } = opts
  const { width, height } = image

  const canvas = document.createElement('canvas')
  const ctx = drawToCanvas(image, 1, canvas)

  for (const a of areas) {
    ctx.fillStyle = a.color === 'white' ? '#ffffff' : '#000000'
    ctx.fillRect(
      Math.round(a.x * width),
      Math.round(a.y * height),
      Math.max(1, Math.round(a.w * width)),
      Math.max(1, Math.round(a.h * height)),
    )
  }

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, MIME[format] || MIME.jpeg, quality),
  )
  canvas.width = 0
  canvas.height = 0
  if (!blob) throw new Error('사진을 저장하지 못했습니다. 사진이 너무 클 수 있습니다.')
  return blob
}
