export default {
  id: 'convert-image',
  name: '사진 형식 바꾸기',
  description: 'PNG, JPEG, WebP 사이로 형식을 바꿉니다.',
  category: 'image',
  icon: 'convert',
  order: 25,
  // JPG damage is already in the pixels; PNG preserves it faithfully at a
  // larger size. Worth saying, since "PNG로 바꾸면 좋아지겠지"는 흔한 오해입니다.
  notes: [
    'JPG를 PNG로 바꿔도 화질이 좋아지지 않습니다. 파일만 커집니다',
    '제출처가 특정 형식만 받을 때 쓰세요',
    'PNG를 JPG로 바꾸면 용량이 크게 줄어듭니다',
  ],
}
