export default {
  id: 'watermark-pdf',
  name: 'PDF 워터마크',
  description: '모든 쪽에 문구를 얹고, 가운데 또는 바둑판 모양으로 배치합니다.',
  category: 'pdf',
  icon: 'droplet',
  order: 7,
  // Korean text pulls in the embedded face — see src/lib/koreanFont.js, which
  // cannot subset it without losing glyphs. Say it before, not after.
  notes: [
    '한글 문구 → 글꼴이 함께 저장되어 파일이 1.2MB쯤 커집니다',
    '영문·숫자만 → 커지지 않습니다',
  ],
}
