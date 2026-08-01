import mammoth from 'mammoth/mammoth.browser.js'
import { htmlToBlocks } from '../../lib/htmlBlocks.js'
import { renderBlocksToPdf } from '../../lib/pdfLayout.js'

/**
 * @param {File} file  a .docx file
 * @param {{pageSize:string, fontSize:number}} opts
 */
export async function wordToPdf(file, opts, onProgress) {
  if (!/\.docx$/i.test(file.name)) {
    throw new Error('.docx 파일을 선택해 주세요. 예전 .doc 형식은 지원하지 않습니다.')
  }
  onProgress?.(0.2, 'Reading document…')
  let html
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })
    html = result.value
  } catch {
    throw new Error('.docx 파일을 읽을 수 없습니다. 파일이 손상되었거나 암호가 설정되어 있을 수 있습니다.')
  }
  onProgress?.(0.55, 'Laying out pages…')
  const blocks = htmlToBlocks(html)
  const blob = await renderBlocksToPdf(blocks, {
    pageSize: opts?.pageSize || 'A4',
    fontSize: Number(opts?.fontSize) || 11,
  })
  onProgress?.(1, 'Done')
  return blob
}
