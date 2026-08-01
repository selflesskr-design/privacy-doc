import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

function label(format, page, total, start) {
  const n = page + start - 1
  switch (format) {
    case 'n-of-total':
      return `${n} of ${total + start - 1}`
    case 'page-n':
      return `Page ${n}`
    default:
      return `${n}`
  }
}

/**
 * @param {File} file
 * @param {{position:string, format:string, fontSize:number, start:number, margin:number}} opts
 * position: 'bottom-center'|'bottom-right'|'bottom-left'|'top-center'|'top-right'|'top-left'
 */
export async function addPageNumbers(file, opts, onProgress) {
  const { position = 'bottom-center', format = 'n', fontSize = 11, start = 1, margin = 28 } = opts || {}
  let doc
  try {
    doc = await PDFDocument.load(await file.arrayBuffer())
  } catch {
    throw new Error('PDF 파일을 읽을 수 없습니다. 암호가 설정된 PDF는 처리할 수 없습니다.')
  }
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const pages = doc.getPages()
  const total = pages.length
  const [vpos, hpos] = position.split('-')

  for (let i = 0; i < total; i++) {
    onProgress?.(i / total, `Numbering page ${i + 1}…`)
    const page = pages[i]
    const { width, height } = page.getSize()
    const text = label(format, i + 1, total, Number(start))
    const textW = font.widthOfTextAtSize(text, fontSize)
    let x
    if (hpos === 'left') x = margin
    else if (hpos === 'right') x = width - margin - textW
    else x = (width - textW) / 2
    const y = vpos === 'top' ? height - margin - fontSize : margin
    page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.25, 0.27, 0.32) })
  }
  onProgress?.(1, 'Saving…')
  const bytes = await doc.save()
  return new Blob([bytes], { type: 'application/pdf' })
}
