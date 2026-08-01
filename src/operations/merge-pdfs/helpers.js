import { PDFDocument } from 'pdf-lib'

/** Merge PDFs (in the given order) into one document. */
export async function mergePdfs(files, onProgress) {
  if (!files || files.length < 2) throw new Error('합칠 PDF를 두 개 이상 선택해 주세요.')
  const out = await PDFDocument.create()
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i / files.length, `Merging ${files[i].name} (${i + 1}/${files.length})…`)
    let src
    try {
      src = await PDFDocument.load(await files[i].arrayBuffer())
    } catch {
      throw new Error(`"${files[i].name}" 파일을 읽을 수 없습니다. PDF 파일이 맞는지 확인해 주세요. 암호가 설정된 PDF는 처리할 수 없습니다.`)
    }
    const pages = await out.copyPages(src, src.getPageIndices())
    pages.forEach((p) => out.addPage(p))
  }
  onProgress?.(1, 'Finalizing…')
  const bytes = await out.save()
  return new Blob([bytes], { type: 'application/pdf' })
}
