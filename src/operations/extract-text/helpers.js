import { extractPdfText } from '../../lib/extractText.js'

export async function extractText(file, opts, onProgress) {
  const { format = 'text' } = opts || {}
  const pages = await extractPdfText(file, onProgress)
  const nonEmpty = pages.some((p) => p.trim())
  if (!nonEmpty) {
    throw new Error('글자를 찾지 못했습니다. 스캔한 이미지로만 된 PDF로 보입니다. 글자 인식(OCR)은 아직 지원하지 않습니다.')
  }
  let out
  if (format === 'markdown') {
    out = pages.map((p, i) => `## Page ${i + 1}\n\n${p}`).join('\n\n---\n\n')
  } else {
    out = pages.join('\n\n\f\n\n') // form-feed between pages
  }
  return { text: out, pageCount: pages.length }
}
