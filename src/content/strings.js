// Central copy for the app UI. Not a full i18n framework — the service is
// Korean-only — but a single place so the same sentence is never written twice
// and the vocabulary stays consistent.
//
// Vocabulary rules (see docs/copy-guide.md):
//   가릴 영역 (not 마스킹 영역) · 파일 받기 (not 결과물 다운로드)
//   사진 정보 삭제 (not 메타데이터 제거) · 이미지로 변환 (not 래스터화)
//   파일 선택 (not 업로드) · 처음부터 다시 하기 (not 작업 초기화)
// The technical vocabulary belongs on /how-it-works, not in the UI.

/** Buttons and states shared by every tool. */
export const COMMON = {
  pickFile: '파일 선택',
  pickAnother: '다른 파일 선택',
  download: '파일 받기',
  reset: '처음부터 다시 하기',
  cancel: '취소',
  close: '닫기',
  undo: '실행 취소',
  redo: '다시 실행',
  delete: '삭제',
  clearAll: '모두 지우기',
  working: '처리하고 있습니다…',
  preparing: '준비하고 있습니다…',
  saving: '저장하고 있습니다…',
  done: '완료했습니다',
  prevPage: '이전 쪽',
  nextPage: '다음 쪽',
  zoomIn: '확대',
  zoomOut: '축소',
  zoomFit: '화면에 맞추기',
}

/**
 * File-handling errors. Keep the original message on the console for debugging
 * and show these to the user.
 */
export const ERRORS = {
  encryptedPdf: '암호가 설정된 PDF는 처리할 수 없습니다. 암호를 먼저 해제한 뒤 다시 시도해 주세요.',
  unreadablePdf: 'PDF 파일을 읽을 수 없습니다. 파일이 손상되었거나 지원하지 않는 형식일 수 있습니다.',
  unreadableImage: '이미지를 읽을 수 없습니다. JPEG, PNG, WebP 파일을 사용해 주세요.',
  tooLarge: '파일 용량이 너무 큽니다.',
  noPagesSelected: '선택한 페이지가 없습니다.',
  noFileSelected: '파일을 먼저 선택해 주세요.',
  unexpected: '파일을 처리하는 중 문제가 발생했습니다.',
  outOfMemory:
    '파일이 너무 커서 이 기기에서 처리할 수 없습니다. 화질을 낮추거나 페이지를 나눠서 시도해 주세요.',
}

/** PDF 개인정보 가리기 */
export const PDF_REDACT = {
  title: 'PDF 개인정보 가리기',
  beta: '베타',
  betaNote:
    '이 기능은 베타입니다. 저장한 파일을 열어 가린 위치가 맞는지 꼭 확인한 뒤 제출해 주세요.',
  dropLabel: '가릴 PDF를 끌어다 놓거나 눌러서 선택하세요',
  dropHint: '파일은 내 브라우저에서만 열립니다',

  opening: 'PDF를 여는 중…',
  pageOf: (n, total) => `${n} / ${total}쪽`,

  areaTool: '가릴 영역',
  areaToolHint: '드래그해서 가릴 곳을 사각형으로 지정하세요',
  selectTool: '선택',
  selectToolHint: '이미 만든 영역을 옮기거나 크기를 바꿉니다',
  areaCount: (n) => (n === 0 ? '아직 지정한 영역이 없습니다' : `가릴 영역 ${n}개`),
  areaCountOnPage: (n) => `이 쪽에 ${n}개`,
  emptyState: '가릴 곳을 드래그해서 지정하세요. 여러 곳을 지정할 수 있습니다.',

  quality: '저장 화질',
  qualityNormal: '보통',
  qualityHigh: '높음',
  qualityMax: '최고',
  qualityHint: '화질이 높을수록 글자가 또렷하지만 파일이 커집니다',

  save: '안전하게 저장',
  saveNothing: '가릴 영역을 먼저 지정해 주세요',

  confirmTitle: '저장하기 전에 확인해 주세요',
  confirmBody:
    '저장하면 문서의 모든 페이지가 이미지로 변환됩니다. 문서 안의 글자를 검색하거나 복사할 수 없고, 링크와 입력란도 유지되지 않을 수 있습니다.',
  confirmOk: '이미지로 변환해 저장',
  confirmCancel: '계속 확인하기',

  converting: (n, total) => `${total}쪽 중 ${n}쪽 변환 중…`,
  building: '새 PDF를 만드는 중…',
  ready: '가림 처리가 끝났습니다. 파일 이름을 정하고 받으세요.',
  fileName: '파일 이름',

  recheckBeforeSubmit: '제출하기 전에 가린 위치와 문서 내용을 다시 확인해 주세요.',
  keepOriginal: '원본 파일은 변경되지 않습니다. 필요할 수 있으니 별도로 보관해 주세요.',
  afterNote: '받은 파일을 열어 가린 부분을 드래그해 보세요. 글자가 선택되지 않으면 정상입니다.',
  checkFirst:
    '제출처마다 필요한 정보와 가림 기준이 다를 수 있습니다. 가리기 전에 제출기관의 안내를 먼저 확인하세요.',
}

/** PDF 편집 — only the notices this service adds on top of the tool. */
export const EDIT_PDF = {
  koreanFontWarning:
    '일부 한글 글꼴은 저장 결과가 다르게 보일 수 있습니다. 저장한 파일을 반드시 확인해 주세요.',
}

/** 사진 개인정보 가리기 — Phase 3. */
export const IMAGE_REDACT = {
  title: '사진 개인정보 가리기',
  dropLabel: '가릴 사진을 끌어다 놓거나 눌러서 선택하세요',
  dropHint: '사진은 내 브라우저에서만 열립니다',
  save: '안전하게 저장',
  notReady: '사진 개인정보 가리기는 준비 중입니다.',
}

/**
 * Turns any thrown error into a sentence the user can act on, while leaving the
 * original on the console. Pass a fallback for tool-specific wording.
 */
export function toUserMessage(err, fallback = ERRORS.unexpected) {
  if (typeof console !== 'undefined') console.error(err)
  const raw = String(err?.message || err || '')
  if (/encrypt|password/i.test(raw)) return ERRORS.encryptedPdf
  if (/InvalidPDF|Invalid PDF|Failed to parse|corrupt/i.test(raw)) return ERRORS.unreadablePdf
  if (/allocation|out of memory|Array buffer allocation/i.test(raw)) return ERRORS.outOfMemory
  // Messages we wrote ourselves are already Korean — pass them through.
  if (/[가-힣]/.test(raw)) return raw
  return fallback
}
