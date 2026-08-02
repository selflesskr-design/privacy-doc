import { PDFDocument } from 'pdf-lib'
import { IMAGES_TO_PDF } from '../../content/strings.js'
import { PAGE_SIZES } from '../../lib/pageSizes.js'
import { readJpegOrientation } from '../../lib/exif.js'

// pdf-lib can only embed JPEG and PNG directly. Anything else (WebP, GIF, BMP)
// is transcoded to JPEG on a canvas first — all in-browser.
async function embedImage(pdfDoc, file) {
  const type = (file.type || '').toLowerCase()
  const buf = await file.arrayBuffer()
  const isJpeg = type === 'image/jpeg' || type === 'image/jpg'
  // A photo shot in portrait is landscape pixels plus an EXIF tag. embedJpg
  // reads the pixels and ignores the tag, so an upright photo arrives on its
  // side. Only such photos pay for the re-encode below.
  if (isJpeg && readJpegOrientation(buf) === 1) return pdfDoc.embedJpg(buf)
  if (type === 'image/png') return pdfDoc.embedPng(buf)

  // Transcode via canvas.
  let bitmap
  try {
    bitmap = await createImageBitmap(new Blob([buf], { type: type || 'image/*' }), {
      imageOrientation: 'from-image',
    })
  } catch {
    throw new Error(`${file.name} 파일은 지원하지 않는 형식입니다. JPEG, PNG, WebP 파일을 사용해 주세요.`)
  }
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  // Flatten transparency onto white so JPEG doesn't turn it black.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close?.()
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.92))
  return pdfDoc.embedJpg(await blob.arrayBuffer())
}

/**
 * Combine images into one PDF.
 * @param {File[]} files
 * @param {{pageSize:'fit'|'A4'|'A5'|'B5', orientation:'auto'|'portrait'|'landscape', margin:number}} opts
 * @param {(value:number, message:string)=>void} onProgress
 * @returns {Promise<Blob>}
 */
export async function imagesToPdf(files, opts, onProgress) {
  const { pageSize = 'fit', orientation = 'auto', margin = 0 } = opts || {}
  if (!files?.length) throw new Error('사진을 한 장 이상 선택해 주세요.')

  const pdfDoc = await PDFDocument.create()

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i / files.length, IMAGES_TO_PDF.adding(i + 1, files.length))
    const img = await embedImage(pdfDoc, files[i])

    let pageW, pageH
    if (pageSize === 'fit') {
      pageW = img.width + margin * 2
      pageH = img.height + margin * 2
    } else {
      const [a, b] = PAGE_SIZES[pageSize] || PAGE_SIZES.A4
      const landscape =
        orientation === 'landscape' ||
        (orientation === 'auto' && img.width > img.height)
      ;[pageW, pageH] = landscape ? [b, a] : [a, b]
    }

    const page = pdfDoc.addPage([pageW, pageH])
    const availW = pageW - margin * 2
    const availH = pageH - margin * 2
    const scale =
      pageSize === 'fit' ? 1 : Math.min(availW / img.width, availH / img.height, 1)
    const w = img.width * scale
    const h = img.height * scale
    page.drawImage(img, {
      x: (pageW - w) / 2,
      y: (pageH - h) / 2,
      width: w,
      height: h,
    })
  }

  onProgress?.(1, 'Finalizing PDF…')
  const bytes = await pdfDoc.save()
  return new Blob([bytes], { type: 'application/pdf' })
}
