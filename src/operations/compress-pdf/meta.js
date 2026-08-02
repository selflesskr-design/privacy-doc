export default {
  id: 'compress-pdf',
  name: 'PDF 용량 줄이기',
  description: '쪽 안의 사진을 다시 저장해 파일 크기를 줄입니다.',
  category: 'pdf',
  icon: 'compress',
  order: 7,
  // One line per choice, named exactly as the select shows them.
  notes: [
    '사진이 많은 문서 → "쪽을 사진으로 바꾸기"',
    '글자 위주 문서 → "문서 정보만 지우기". 사진으로 바꾸면 오히려 커집니다',
  ],
}
