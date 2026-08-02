export default {
  id: 'edit-pdf',
  name: 'PDF 편집',
  description: 'PDF 위에 글자, 그림, 형광펜, 도형, 이미지를 얹습니다.',
  category: 'pdf',
  icon: 'pencil',
  order: 6,
  // Shown above the editor by the shared header. This is a warning, not a
  // description: covering text here leaves it in the file.
  notes: [
    '화면에 보이는 대로 꾸미는 편집 도구입니다',
    '사각형으로 덮어도 아래의 원본 글자는 그대로 남습니다',
    '개인정보를 가려야 한다면 "PDF 개인정보 가리기"를 쓰세요',
  ],
}
