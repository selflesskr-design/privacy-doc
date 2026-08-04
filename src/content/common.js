// Sentences and answers shared by more than one content module. Lives apart from
// pages.js so guides.js can reuse them without the two importing each other.
//
// Copy rules (see docs/copy-guide.md): plain Korean, one idea per sentence,
// no claim that something is impossible to recover, and never state what a
// user "must" hide — that is the receiving office's call, not ours.

export const CHECK_FIRST =
  '제출처마다 필요한 정보와 가림 기준이 다를 수 있습니다. 가리기 전에 제출기관의 안내를 먼저 확인하세요.'

export const OVERLAY_LIMIT =
  '편집 도구로 검은 사각형을 덮는 방법은 화면에서만 가려집니다. 원본 글자가 파일 안에 그대로 남아 있어, 받는 사람이 글자를 복사하면 가린 내용이 보일 수 있습니다.'

export const HOW_WE_DO_IT =
  '선택한 영역을 문서 이미지에 직접 적용한 뒤 새 PDF로 저장합니다. 가린 부분의 원본 글자가 결과 PDF에서 검색·선택·복사되지 않도록 처리합니다.'

/** Answers reused where they genuinely fit that page's question. */
export const FAQ = {
  upload: {
    q: '파일이 서버에 올라가나요?',
    a: '올라가지 않습니다. 선택한 파일과 파일 내용은 Privacy 서버나 구글 애널리틱스로 전송하지 않고 내 브라우저 안에서 처리합니다. 다만 방문 통계를 위해 현재 페이지 주소와 브라우저·기기 정보가 구글 애널리틱스로 전송됩니다. 개발자도구의 네트워크 탭에서 직접 확인할 수 있습니다.',
  },
  free: {
    q: '무료인가요? 가입해야 하나요?',
    a: '무료이고 가입도 필요 없습니다. 설치할 프로그램도 없습니다.',
  },
  offline: {
    q: '인터넷 없이도 되나요?',
    a: '한 번 접속하고 나면 인터넷 없이도 쓸 수 있습니다.',
  },
  // 원본은 열기만 하고 결과는 새 파일로 저장합니다. `원본을 보관하세요`는
  // 원본이 위험하다는 뜻으로 읽히므로 쓰지 않습니다.
  undo: {
    q: '가린 부분을 다시 되돌릴 수 있나요?',
    a: '저장한 파일에서는 되돌릴 수 없습니다. 가린 상태만 담기기 때문입니다. 원본 파일은 그대로 남아 있으니, 다시 가리려면 원본을 열어 처음부터 지정하면 됩니다.',
  },
  mobile: {
    q: '휴대폰에서도 되나요?',
    a: '됩니다. 손가락으로 가릴 영역을 정할 수 있습니다.',
  },
  textSelect: {
    q: '저장한 PDF에서 글자 선택이 안 됩니다',
    a: '가리기를 적용하면 페이지가 새 PDF로 다시 만들어지기 때문입니다. 글자를 그대로 두면 가린 부분도 함께 남기 때문에, 대신 글자 선택과 검색을 포기하는 방식입니다.',
  },
}
