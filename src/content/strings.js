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
  wrongType: '이 도구에서 쓸 수 없는 형식입니다',
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

  // Says what the button does. It does not save anywhere — it builds the file,
  // and the next button is what puts it on disk. "안전하게" was praise, not
  // information: there is no unsafe save to contrast it with.
  save: '가린 PDF 만들기',
  saveNothing: '가릴 영역을 먼저 지정해 주세요',

  // States the effect, not the mechanism. PDF goes in, PDF comes out — how the
  // pages are rebuilt belongs on /how-it-works, not in the editor.
  saveNote:
    '원본 파일은 건드리지 않고, 가려진 PDF를 새로 만듭니다. 새 PDF에서는 글자 검색과 복사가 되지 않습니다.',

  converting: (n, total) => `${total}쪽 중 ${n}쪽 변환 중…`,
  building: '새 PDF를 만드는 중…',
  ready: '가린 PDF가 만들어졌습니다. 이름을 정하고 받으세요.',
  fileName: '파일 이름',

  recheckBeforeSubmit: '제출하기 전에 가린 위치와 문서 내용을 다시 확인해 주세요.',
  keepOriginal: '원본 파일은 변경되지 않습니다. 필요할 수 있으니 별도로 보관해 주세요.',
  afterNote: '받은 파일을 열어 가린 부분을 드래그해 보세요. 글자가 선택되지 않으면 정상입니다.',
  checkFirst:
    '제출처마다 필요한 정보와 가림 기준이 다를 수 있습니다. 가리기 전에 제출기관의 안내를 먼저 확인하세요.',
}

/** PDF 편집. */
export const EDIT_PDF = {
  // The bundled Korean face is Regular 400 only — see src/lib/koreanFont.js.
  // Bold and italic silently do nothing to Hangul, so say so while the text
  // tool is open rather than letting people find out after saving.
  koreanFontWarning: '한글은 한 가지 굵기로만 저장됩니다. 굵게·기울임을 골라도 저장한 파일에는 적용되지 않습니다.',

  dropLabel: '편집할 PDF를 끌어다 놓거나 눌러서 선택하세요',
  dropHint: '파일은 내 브라우저에서만 열립니다',
  opening: 'PDF를 여는 중…',
  openFailed: 'PDF를 열 수 없습니다',

  tools: {
    select: '선택·이동',
    text: '글자 넣기',
    draw: '자유롭게 그리기',
    highlight: '형광펜',
    rect: '사각형',
    ellipse: '원',
    line: '직선',
    image: '이미지 넣기',
    whiteout: '흰색으로 덮기',
    erase: '내가 넣은 것 지우기',
  },

  color: '색',
  width: '굵기',
  font: '글꼴',
  size: '크기',
  bold: '굵게',
  italic: '기울임',

  pageOf: (n, total) => `${total}쪽 중 ${n}쪽`,

  // Same reasoning as PDF_REDACT.save — the button builds the file, the one
  // below it is what writes it to disk.
  save: '편집한 PDF 만들기',
  saveFailed: '저장하지 못했습니다',
  ready: '편집한 PDF가 만들어졌습니다. 이름을 정하고 받으세요.',
  fileName: '파일 이름',
  download: (name) => `${name} 받기`,

  tip: '도구를 고른 뒤 문서 위를 누르거나 끌어 보세요. 선택 도구로 옮기고, 크기를 바꾸고, 지울 수 있습니다.',

  // Placed already selected, so typing replaces it.
  newText: '글자',

  applying: '편집 내용을 적용하는 중…',
  saving: '새 PDF를 만드는 중…',
  done: '완료',
}

/** 사진을 PDF로. */
export const IMAGES_TO_PDF = {
  dropLabel: 'PDF로 만들 사진을 끌어다 놓거나 눌러서 선택하세요',
  dropHint: 'JPEG, PNG, WebP, GIF, BMP — 넣은 뒤 아래에서 순서를 바꿀 수 있습니다',

  options: '설정',
  pageSize: '쪽 크기',
  fitToImage: '사진 크기에 맞춤',
  orientation: '방향',
  auto: '자동 (사진마다)',
  portrait: '세로',
  landscape: '가로',
  margin: '여백 (mm)',

  create: 'PDF 만들기',
  adding: (n, total) => `${total}장 중 ${n}장 넣는 중…`,
  failed: 'PDF를 만들지 못했습니다',
  ready: 'PDF가 만들어졌습니다. 이 기기 안에서만 처리했습니다.',
}

/** 쪽 번호 넣기. */
export const PAGE_NUMBERS = {
  dropLabel: '쪽 번호를 넣을 PDF를 끌어다 놓거나 눌러서 선택하세요',
  pages: (n) => `${n}쪽`,

  position: '위치',
  bottomCenter: '아래 가운데',
  bottomRight: '아래 오른쪽',
  bottomLeft: '아래 왼쪽',
  topCenter: '위 가운데',
  topRight: '위 오른쪽',
  topLeft: '위 왼쪽',

  format: '표기',
  fontSize: (pt) => `글자 크기: ${pt}pt`,
  start: '시작 번호',
  startHint: '앞표지를 빼고 세려면 0부터 시작하세요',

  preview: '미리보기',
  previewNote: '첫 쪽에 넣어본 모습입니다',
  previewLoading: '미리보기를 만드는 중…',

  numbering: (n, total) => `${total}쪽 중 ${n}쪽 넣는 중…`,
  saving: '새 PDF를 만드는 중…',
  apply: '쪽 번호 넣기',
  failed: '쪽 번호를 넣지 못했습니다',
}

/** PDF 워터마크. */
export const WATERMARK_PDF = {
  dropLabel: '워터마크를 넣을 PDF를 끌어다 놓거나 눌러서 선택하세요',
  defaultText: '대외비',

  text: '넣을 문구',
  layout: '배치',
  center: '가운데 한 번',
  tile: '바둑판으로 반복',
  color: '색',
  // All three describe the watermark text, not the page — say so, or "진하기"
  // reads as if the document itself were being darkened.
  fontSize: (pt) => `문구 크기: ${pt}pt`,
  opacity: (pct) => `문구 진하기: ${pct}%`,
  angle: (deg) => `문구 기울기: ${deg}°`,

  preview: '미리보기',
  previewNote: '첫 쪽에 넣어본 모습입니다',
  previewLoading: '미리보기를 만드는 중…',

  koreanFont: '한글 글꼴을 준비하는 중…',
  stamping: (n, total) => `${total}쪽 중 ${n}쪽 넣는 중…`,
  saving: '새 PDF를 만드는 중…',
  apply: '워터마크 넣기',
  failed: '워터마크를 넣지 못했습니다',
}

/** PDF 용량 줄이기. */
export const COMPRESS_PDF = {
  dropLabel: '용량을 줄일 PDF를 끌어다 놓거나 눌러서 선택하세요',

  method: '어떻게 줄일까요',
  // "쪽 다시 저장"과 "Re-encode pages"는 둘 다 무슨 일이 벌어지는지 말해주지
  // 않는다. 쪽이 사진이 된다는 것과, 그래서 글자를 못 고른다는 것이 핵심이다.
  rasterize: '쪽을 사진으로 바꾸기 — 많이 줄지만 글자 선택이 안 됩니다',
  metadata: '문서 정보만 지우기 — 글자는 그대로, 조금만 줄어듭니다',

  resolution: '해상도',
  dpi72: '72dpi — 가장 작게',
  dpi96: '96dpi',
  dpi120: '120dpi — 무난하게',
  dpi150: '150dpi',
  dpi200: '200dpi — 또렷하게',
  quality: (pct) => `사진 화질: ${pct}%`,

  compressing: (n, total) => `${total}쪽 중 ${n}쪽 줄이는 중…`,
  saving: '새 PDF를 만드는 중…',
  compress: 'PDF 용량 줄이기',
  failed: '용량을 줄이지 못했습니다',
  noGain: '오히려 커졌습니다',
  noGainTry: '글자 위주 문서에서 자주 그렇습니다. "문서 정보만 지우기"를 고르거나 해상도를 낮춰 보세요.',
}

/** 쪽 빼기·순서 바꾸기. */
export const ORGANIZE_PDF = {
  dropLabel: '정리할 PDF를 끌어다 놓거나 눌러서 선택하세요',
  openFailed: 'PDF를 열 수 없습니다',
  thumbnails: (n, total) => `${total}쪽 중 ${n}쪽 불러오는 중…`,

  kept: (kept, total) => (kept === total ? `${total}쪽` : `${total}쪽 중 ${kept}쪽 남김`),
  hint: '끌어서 순서를 바꾸고, ✕를 눌러 뺍니다',
  restore: '처음 상태로',
  pageNo: (n) => `${n}쪽`,
  removePage: (n) => `${n}쪽 빼기`,
  lastPage: '마지막 한 쪽은 뺄 수 없습니다',

  assembling: '쪽을 다시 붙이는 중…',
  saving: '새 PDF를 만드는 중…',
  apply: '정리한 PDF 만들기',
  failed: 'PDF를 만들지 못했습니다',
}

/** PDF 회전. */
export const ROTATE_PDF = {
  dropLabel: '돌릴 PDF를 끌어다 놓거나 눌러서 선택하세요',
  pages: (n) => `${n}쪽`,

  angle: '얼마나 돌릴까요',
  cw90: '오른쪽으로 90°',
  deg180: '180° (거꾸로)',
  ccw90: '왼쪽으로 90°',

  range: '돌릴 쪽 (선택)',
  rangePlaceholder: '비워두면 전체 — 예: 1-3,5',
  rangeEmpty: (part, total) => `"${part}"에 해당하는 쪽이 없습니다. 이 문서는 ${total}쪽입니다.`,

  preview: '미리보기',
  previewNote: '첫 쪽을 돌려본 모습입니다',
  previewLoading: '미리보기를 만드는 중…',

  rotating: (n) => `${n}쪽 돌리는 중…`,
  saving: '새 PDF를 만드는 중…',
  // 합치기 · 나누기와 같은 꼴. 이 도구들은 동사가 자연스럽다.
  rotate: 'PDF 돌리기',
  failed: '돌리지 못했습니다',
}

/** PDF 나누기. */
export const SPLIT_PDF = {
  dropLabel: '나눌 PDF를 끌어다 놓거나 눌러서 선택하세요',
  pages: (n) => `${n}쪽`,

  mode: '어떻게 나눌까요',
  // "Explode" was the upstream word for it. Say what comes out instead.
  explode: '한 쪽씩 낱개로 — 19쪽이면 파일 19개',
  explodeWith: (n) => `한 쪽씩 낱개로 — ${n}쪽이면 파일 ${n}개`,
  ranges: '원하는 쪽만 뽑아내기 — 구간마다 파일 하나',

  rangesLabel: '뽑아낼 쪽',
  rangesPlaceholder: '예: 1-3, 4-6, 7',
  rangesHint: '쉼표로 나눈 구간마다 파일이 하나씩 나옵니다',
  rangeEmpty: (part, total) => `"${part}"에 해당하는 쪽이 없습니다. 이 문서는 ${total}쪽입니다.`,

  split: '나누기',
  extracting: (n, total) => `${total}쪽 중 ${n}쪽 꺼내는 중…`,
  building: (n, total) => `${total}개 중 ${n}번째 파일 만드는 중…`,
  failed: '나누지 못했습니다',
}

/** PDF 합치기. */
export const MERGE_PDFS = {
  dropLabel: '합칠 PDF를 끌어다 놓거나 눌러서 선택하세요',
  dropHint: '두 개 이상 넣은 뒤 아래에서 순서를 바꿀 수 있습니다',
  merge: (n) => (n > 1 ? `PDF ${n}개 합치기` : 'PDF 합치기'),
  merging: (name, n, total) => `${total}개 중 ${n}개 합치는 중 — ${name}`,
  finalizing: '새 PDF를 만드는 중…',
  failed: '합치지 못했습니다',
}

/** PDF를 사진으로. */
export const PDF_TO_IMAGES = {
  dropLabel: '사진으로 만들 PDF를 끌어다 놓거나 눌러서 선택하세요',
  dropHint: '한 번에 한 개씩',
  pages: (n) => `${n}쪽`,

  format: '형식',
  png: 'PNG (원본 그대로)',
  jpeg: 'JPEG (용량 작음)',

  // Says what each setting is for. dpi is on the label because print shops ask
  // for it, but nobody should need to know it to choose.
  quality: '화질',
  qualityScreen: '화면용 (72dpi)',
  qualityHigh: '높음 (144dpi)',
  qualityPrint: '인쇄용 (216dpi)',
  qualityMax: '최고 (288dpi)',

  range: '쪽 고르기 (선택)',
  rangePlaceholder: '예: 1-3,5',
  rangeEmpty: (part, total) => `"${part}"에 해당하는 쪽이 없습니다. 이 문서는 ${total}쪽입니다.`,

  convert: '사진으로 만들기',
  rendering: (page, n, total) => `${page}쪽 그리는 중 (${total}장 중 ${n}장)…`,
  failed: 'PDF를 사진으로 만들지 못했습니다',
}

/** 사진 용량 줄이기. */
export const COMPRESS_IMAGE = {
  dropLabel: '용량을 줄일 사진을 끌어다 놓거나 눌러서 선택하세요',
  dropHint: 'JPEG, PNG, WebP',

  quality: (pct) => `화질: ${pct}%`,
  maxSize: '최대 크기',
  keepSize: '원본 크기 그대로',
  px: (n) => `${n}px`,
  format: '저장 형식',
  keepFormat: '원본과 같게',

  pngNote: 'PNG는 화질을 낮춰도 거의 줄지 않습니다. 사진이라면 JPEG이나 WebP로 바꾸세요.',

  compressing: (pct) => `줄이는 중… ${pct}%`,
  compress: '용량 줄이기',
  failed: '용량을 줄이지 못했습니다',
}

/** 사진 개인정보 가리기. */
export const IMAGE_REDACT = {
  title: '사진 개인정보 가리기',
  beta: '베타',
  betaNote: '저장한 사진을 열어 가린 위치가 맞는지 꼭 확인한 뒤 보내 주세요.',
  dropLabel: '가릴 사진을 끌어다 놓거나 눌러서 선택하세요',
  dropHint: '사진은 내 브라우저에서만 열립니다',

  opening: '사진을 여는 중…',
  openFailed: '사진을 열 수 없습니다',

  areaTool: '가릴 영역',
  areaToolHint: '드래그해서 가릴 곳을 사각형으로 지정하세요',
  selectTool: '선택',
  selectToolHint: '이미 만든 영역을 옮기거나 크기를 바꿉니다',
  areaCount: (n) => (n === 0 ? '아직 지정한 영역이 없습니다' : `가릴 영역 ${n}개`),
  emptyState: '가릴 곳을 드래그해서 지정하세요. 여러 곳을 지정할 수 있습니다.',

  format: '저장 형식',
  jpeg: 'JPEG — 용량이 작습니다',
  png: 'PNG — 글자가 또렷합니다',
  quality: (pct) => `화질: ${pct}%`,

  building: '가린 사진을 만드는 중…',
  save: '가린 사진 만들기',
  saveNothing: '가릴 영역을 먼저 지정해 주세요',
  saveNote: '원본 사진은 건드리지 않고, 가려진 사진을 새로 만듭니다.',
  saveFailed: '사진을 만들지 못했습니다',
  ready: '가린 사진이 만들어졌습니다. 이름을 정하고 받으세요.',
  fileName: '파일 이름',

  // The two things a photographed document gives away, in the order they
  // matter: what is printed on it, and where it was taken.
  metadataNote: '저장하면 촬영 위치와 기기 정보도 함께 지워집니다.',
  keepOriginal: '원본 사진은 변경되지 않습니다. 앨범에 남은 원본도 함께 정리해 주세요.',
  checkFirst: '제출처마다 필요한 정보와 가림 기준이 다를 수 있습니다. 가리기 전에 제출기관의 안내를 먼저 확인하세요.',
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
