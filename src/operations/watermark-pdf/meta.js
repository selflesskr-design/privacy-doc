export default {
  id: 'watermark-pdf',
  name: 'PDF 워터마크',
  description: '모든 쪽에 문구를 얹습니다. 가운데 또는 바둑판 배치.',
  category: 'pdf',
  icon: 'droplet',
  order: 8,
  // Korean text pulls in the embedded face — see src/lib/koreanFont.js, which
  // cannot subset it without losing glyphs. Say it before, not after.
  notes:
    '한글 문구를 넣으면 한글 글꼴이 함께 저장되어 파일이 1.2MB쯤 커집니다. 영문 문구는 커지지 않습니다.',
}
