// Canvas-based image helpers shared by the image operations. All processing is
// local: decode -> draw on a canvas -> re-encode. Re-encoding also naturally
// strips EXIF/GPS metadata (canvas output contains no metadata).

const MIME = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export const FORMAT_EXT = { jpeg: 'jpg', png: 'png', webp: 'webp' }

/**
 * Decode a File/Blob into an ImageBitmap (with a fallback to <img>).
 *
 * `from-image` applies the EXIF orientation, so the pixels come out the way
 * every viewer shows them. It matters most where we re-encode: dropping the
 * tag without turning the pixels first would leave the image lying on its side.
 */
export async function decode(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    // Fallback for formats createImageBitmap may reject in some browsers.
    return await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('사진을 읽을 수 없습니다. JPEG, PNG, WebP 파일을 사용해 주세요.'))
      }
      img.src = url
    })
  }
}

export function dimsOf(bitmap) {
  return { width: bitmap.width || bitmap.naturalWidth, height: bitmap.height || bitmap.naturalHeight }
}

/** Encode a canvas to a Blob of the given format ('jpeg'|'png'|'webp'). */
export function canvasToBlob(canvas, format = 'jpeg', quality = 0.9) {
  const mime = MIME[format] || 'image/jpeg'
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('파일을 저장하지 못했습니다.'))),
      mime,
      mime === 'image/png' ? undefined : quality,
    )
  })
}

/**
 * Draw a bitmap onto a fresh canvas with optional transforms.
 * @param {{width:number,height:number,rotate?:0|90|180|270,flipH?:boolean,flipV?:boolean,
 *          background?:string, crop?:{x,y,w,h}}} opts
 */
export function drawToCanvas(bitmap, opts = {}) {
  const src = dimsOf(bitmap)
  const crop = opts.crop || { x: 0, y: 0, w: src.width, h: src.height }
  const rotate = ((opts.rotate || 0) % 360 + 360) % 360
  const swap = rotate === 90 || rotate === 270

  // Target (post-resize) dimensions of the cropped region.
  const targetW = Math.max(1, Math.round(opts.width || crop.w))
  const targetH = Math.max(1, Math.round(opts.height || crop.h))

  const canvas = document.createElement('canvas')
  canvas.width = swap ? targetH : targetW
  canvas.height = swap ? targetW : targetH
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'

  if (opts.background) {
    ctx.fillStyle = opts.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.save()
  ctx.translate(canvas.width / 2, canvas.height / 2)
  if (rotate) ctx.rotate((rotate * Math.PI) / 180)
  ctx.scale(opts.flipH ? -1 : 1, opts.flipV ? -1 : 1)
  // Draw the cropped source region scaled into targetW x targetH, centered.
  ctx.drawImage(
    bitmap,
    crop.x,
    crop.y,
    crop.w,
    crop.h,
    -targetW / 2,
    -targetH / 2,
    targetW,
    targetH,
  )
  ctx.restore()
  return canvas
}
