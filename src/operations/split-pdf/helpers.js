import { PDFDocument } from 'pdf-lib'
import { SPLIT_PDF, COMMON } from '../../content/strings.js'
import { baseName, parsePageRanges } from '../../lib/format.js'

async function subsetPdf(srcDoc, pageIndices) {
  const out = await PDFDocument.create()
  const pages = await out.copyPages(srcDoc, pageIndices)
  pages.forEach((p) => out.addPage(p))
  const bytes = await out.save()
  return new Blob([bytes], { type: 'application/pdf' })
}

/**
 * @param {File} file
 * @param {{mode:'explode'|'ranges', ranges:string}} opts
 * @returns {Promise<{filename:string, blob:Blob}[]>}
 */
export async function splitPdf(file, opts, onProgress) {
  const { mode = 'explode', ranges = '' } = opts || {}
  let src
  try {
    src = await PDFDocument.load(await file.arrayBuffer())
  } catch {
    throw new Error('PDF 파일을 읽을 수 없습니다. 암호가 설정된 PDF는 처리할 수 없습니다.')
  }
  const total = src.getPageCount()
  const base = baseName(file.name)
  const results = []

  if (mode === 'explode') {
    for (let i = 0; i < total; i++) {
      onProgress?.(i / total, SPLIT_PDF.extracting(i + 1, total))
      const blob = await subsetPdf(src, [i])
      results.push({ filename: `${base}-p${String(i + 1).padStart(3, '0')}.pdf`, blob })
    }
  } else {
    // Each comma-separated group becomes its own output file.
    const groups = ranges.split(',').map((s) => s.trim()).filter(Boolean)
    if (!groups.length) throw new Error('페이지 범위를 입력해 주세요. 예: 1-3, 4-6')
    for (let g = 0; g < groups.length; g++) {
      onProgress?.(g / groups.length, SPLIT_PDF.building(g + 1, groups.length))
      const pages = parsePageRanges(groups[g], total)
      if (!pages.length) throw new Error(`"${groups[g]}" 범위에 해당하는 페이지가 없습니다. 이 문서는 ${total}쪽입니다.`)
      const blob = await subsetPdf(src, pages.map((p) => p - 1))
      results.push({ filename: `${base}-${groups[g].replace(/[^0-9-]/g, '_')}.pdf`, blob })
    }
  }
  onProgress?.(1, COMMON.done)
  return results
}
