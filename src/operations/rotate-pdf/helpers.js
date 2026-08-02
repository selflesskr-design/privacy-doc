import { PDFDocument, degrees } from 'pdf-lib'
import { ROTATE_PDF } from '../../content/strings.js'
import { parsePageRanges } from '../../lib/format.js'

/**
 * @param {File} file
 * @param {{angle:number, range:string}} opts  angle in {90,180,270}; empty range = all pages
 */
export async function rotatePdf(file, opts, onProgress) {
  const { angle = 90, range = '' } = opts || {}
  let doc
  try {
    doc = await PDFDocument.load(await file.arrayBuffer())
  } catch {
    throw new Error('PDF 파일을 읽을 수 없습니다. 암호가 설정된 PDF는 처리할 수 없습니다.')
  }
  const total = doc.getPageCount()
  const targets = range.trim() ? parsePageRanges(range, total) : Array.from({ length: total }, (_, i) => i + 1)
  if (!targets.length) throw new Error('선택한 페이지가 없습니다.')

  const set = new Set(targets)
  const pages = doc.getPages()
  for (let i = 0; i < pages.length; i++) {
    if (!set.has(i + 1)) continue
    onProgress?.(i / pages.length, ROTATE_PDF.rotating(i + 1))
    const current = pages[i].getRotation().angle || 0
    pages[i].setRotation(degrees((current + Number(angle)) % 360))
  }
  onProgress?.(1, ROTATE_PDF.saving)
  const bytes = await doc.save()
  return new Blob([bytes], { type: 'application/pdf' })
}
