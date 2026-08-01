import { SITE_URL, BRAND } from '../config/site.js'

// ─────────────────────────────────────────────────────────────────────────────
// Every indexable page on the site, as data.
//
// This is the single source of truth for routing, SEO metadata, structured data,
// the sitemap AND the page body. Both the React renderer (src/content/blocks.jsx)
// and the build-time prerenderer (scripts/renderBlocks.mjs) read these same
// definitions, so a crawler that never runs JavaScript sees the same H1, prose
// and internal links a visitor does.
//
// `ready: false` marks a page whose underlying tool is not built yet. Those are
// still routable and linkable, but they are kept OUT of sitemap.xml — the site
// only submits pages that actually work.
// ─────────────────────────────────────────────────────────────────────────────

const CHECK_WITH_RECIPIENT =
  '제출처마다 요구 기준이 다를 수 있으므로, 가림 처리 전 제출기관의 안내를 확인하세요.'

const OVERLAY_WARNING =
  '많은 편집 도구가 검은 사각형을 그려 넣는 방식으로 동작합니다. 이 방식은 화면에서만 가려질 뿐 ' +
  '원본 글자가 PDF 안에 그대로 남아 있어, 받는 사람이 텍스트를 복사하거나 추출하면 가린 내용이 드러납니다.'

const SAFE_METHOD =
  `${BRAND}는 페이지를 브라우저 안에서 이미지로 다시 그린 뒤 가린 영역을 픽셀 자체에 칠합니다. ` +
  '결과 PDF에는 원본 텍스트 레이어가 남지 않으므로 복사·추출로 되살릴 수 없습니다.'

/** Shared FAQ entries, reused where they genuinely answer that page's question. */
const FAQ = {
  upload: {
    q: '파일이 서버로 올라가나요?',
    a: `아니요. ${BRAND}의 모든 처리는 사용자의 브라우저 안에서 이루어집니다. 앱은 실행 중 외부로 어떤 요청도 보내지 않으며, 브라우저 보안 정책(CSP)으로 외부 전송 자체가 차단되어 있습니다. 개발자도구의 네트워크 탭에서 직접 확인할 수 있습니다.`,
  },
  free: {
    q: '무료인가요? 가입이 필요한가요?',
    a: '무료이며 가입이 필요 없습니다. 계정도, 결제도, 설치도 없습니다.',
  },
  offline: {
    q: '인터넷 없이도 쓸 수 있나요?',
    a: '한 번 접속한 뒤에는 오프라인에서도 동작합니다. 앱 전체가 기기에 저장되기 때문입니다.',
  },
  restore: {
    q: '가린 부분을 나중에 되살릴 수 있나요?',
    a: '되살릴 수 없습니다. 가림 처리는 픽셀에 직접 적용되어 원본 정보가 결과 파일에서 사라집니다. 원본 파일은 따로 보관해 두세요.',
  },
  mobile: {
    q: '휴대폰에서도 되나요?',
    a: '됩니다. 모바일 브라우저에서 터치로 가릴 영역을 지정할 수 있습니다.',
  },
}

/** Guides all end with the same honest caveat block. */
const guideCaveats = () => [
  { t: 'h2', text: '가리기 전에 확인할 것' },
  {
    t: 'note',
    tone: 'warn',
    text: CHECK_WITH_RECIPIENT,
  },
  {
    t: 'p',
    text:
      '어디까지 가려야 하는지는 서류를 받는 곳이 정합니다. 뒷자리를 가려야 하는 곳도 있고, 번호 전체를 요구하는 곳도 있으며, 원본 그대로를 요구하는 경우도 있습니다. 먼저 확인한 뒤 처리하는 편이 다시 발급받는 것보다 빠릅니다.',
  },
  { t: 'h2', text: '사각형만 덮는 방식의 한계' },
  { t: 'p', text: OVERLAY_WARNING },
  { t: 'p', text: SAFE_METHOD },
]

const HOME = {
  path: '/',
  title: `${BRAND} — 브라우저에서 끝내는 개인정보 안전 가리기`,
  description:
    '주민등록번호·계좌번호가 담긴 PDF와 사진의 개인정보를 안전하게 가립니다. 파일이 서버로 전송되지 않고 브라우저 안에서만 처리됩니다. 무료, 가입 없음.',
  h1: '문서 속 개인정보, 내 브라우저 안에서 안전하게 가리세요',
  breadcrumb: [],
  schema: 'WebApplication',
  sections: [
    {
      t: 'p',
      text:
        '계약서, 주민등록등본, 통장 사본, 신분증 사진. 어딘가에 제출해야 하는데 주민등록번호와 계좌번호가 그대로 적혀 있습니다. ' +
        '온라인 변환 사이트에 올리면 그 파일이 어디에 저장되는지 알 수 없습니다.',
    },
    {
      t: 'p',
      text: `${BRAND}는 파일을 업로드하지 않습니다. 문서는 사용자의 기기를 떠나지 않고, 가리기·합치기·용량 줄이기가 모두 브라우저 안에서 끝납니다.`,
    },
    {
      t: 'cards',
      title: '자주 쓰는 기능',
      items: [
        {
          label: 'PDF 개인정보 가리기',
          href: '/tools/pdf-redact',
          text: '주민등록번호·계좌번호를 복원 불가능하게 가립니다',
        },
        {
          label: '이미지 개인정보 가리기',
          href: '/tools/image-redact',
          text: '신분증·통장 사진의 민감한 부분을 가립니다',
        },
        {
          label: '사진 위치정보 삭제',
          href: '/tools/remove-photo-metadata',
          text: '사진에 숨어 있는 GPS·촬영 기록을 제거합니다',
        },
        { label: 'PDF 합치기', href: '/tools/merge-pdf', text: '여러 PDF를 하나로 묶습니다' },
        {
          label: 'PDF 용량 줄이기',
          href: '/tools/compress-pdf',
          text: '첨부 용량 제한에 맞게 줄입니다',
        },
        { label: '모든 도구 보기', href: '/tools', text: 'PDF·이미지 도구 24종 전체' },
      ],
    },
    { t: 'h2', text: '왜 업로드하지 않아도 되나요' },
    {
      t: 'p',
      text:
        '요즘 브라우저는 PDF를 읽고 다시 쓰는 일을 스스로 할 수 있습니다. 서버가 할 일이 없습니다. ' +
        '그래서 처리를 전부 기기 안에서 끝내고, 외부로 나가는 통로 자체를 막아 두었습니다.',
    },
    {
      t: 'cards',
      title: '더 알아보기',
      items: [
        { label: '처리 원리', href: '/how-it-works', text: '브라우저에서 어떻게 동작하는지' },
        { label: '보안', href: '/security', text: '업로드하지 않는다는 것을 확인하는 방법' },
        { label: '자주 묻는 질문', href: '/faq', text: '가장 많이 받는 질문들' },
        { label: '문서별 가이드', href: '/guides', text: '등본·신분증·통장 사본 처리법' },
      ],
    },
  ],
}

const TOOLS_HUB = {
  path: '/tools',
  title: `전체 도구 — ${BRAND}`,
  description:
    'PDF와 이미지를 다루는 24가지 도구를 한눈에. 개인정보 가리기, PDF 정리·편집·변환, 이미지 처리까지 모두 브라우저 안에서 무료로 실행됩니다.',
  h1: '전체 도구',
  breadcrumb: [{ name: '홈', path: '/' }],
  schema: 'CollectionPage',
  sections: [
    {
      t: 'p',
      text: '모든 도구는 브라우저 안에서 동작하며 파일을 서버로 전송하지 않습니다. 가입이나 설치가 필요 없습니다.',
    },
    { t: 'toolCategories' }, // rendered from the operation registry
  ],
}

const toolPage = ({
  path,
  title,
  description,
  h1,
  lead,
  ready,
  runHref,
  runLabel,
  steps,
  problem,
  cautions,
  faq,
  related,
}) => ({
  path,
  title,
  description,
  h1,
  ready,
  breadcrumb: [
    { name: '홈', path: '/' },
    { name: '전체 도구', path: '/tools' },
  ],
  schema: 'SoftwareApplication',
  sections: [
    { t: 'p', text: lead },
    ...(ready ? [] : [{ t: 'note', tone: 'warn', text: '이 기능은 현재 준비 중입니다. 아래 안내는 제공 예정인 처리 방식을 설명합니다.' }]),
    { t: 'cta', label: runLabel, href: runHref, disabled: !ready },
    { t: 'h2', text: '어떤 상황에서 쓰나요' },
    ...problem.map((text) => ({ t: 'p', text })),
    { t: 'h2', text: '파일을 올리지 않고 처리합니다' },
    {
      t: 'p',
      text: `${BRAND}는 파일을 서버로 보내지 않습니다. 브라우저가 직접 파일을 열고, 처리하고, 결과를 내려받습니다. 앱은 실행 중 외부로 어떤 네트워크 요청도 보내지 않습니다.`,
    },
    { t: 'link', label: '어떻게 확인할 수 있나요?', href: '/security' },
    { t: 'h2', text: '사용법' },
    { t: 'steps', items: steps },
    ...(cautions?.length
      ? [{ t: 'h2', text: '주의사항' }, { t: 'ul', items: cautions }]
      : []),
    { t: 'h2', text: '자주 묻는 질문' },
    { t: 'faq', items: faq },
    { t: 'cards', title: '함께 보면 좋은 페이지', items: related },
  ],
})

const TOOL_PAGES = [
  toolPage({
    path: '/tools/pdf-redact',
    title: `PDF 개인정보 가리기 — 복원 불가능한 안전 마스킹 | ${BRAND}`,
    description:
      'PDF 속 주민등록번호·계좌번호를 복사해도 드러나지 않게 가립니다. 파일 업로드 없이 브라우저에서 처리하며, 결과 PDF에는 원본 텍스트가 남지 않습니다.',
    h1: 'PDF 개인정보 가리기',
    lead:
      'PDF에서 가려야 할 부분을 지정하면, 그 자리의 원본 정보가 결과 파일에서 완전히 사라집니다. 파일은 기기 밖으로 나가지 않습니다.',
    ready: false,
    runHref: '/editor/pdf-redact',
    runLabel: 'PDF 가리기 시작하기',
    problem: [
      '회사에 제출할 서류, 부동산 계약에 필요한 등본, 병원에 낼 진단서. 필요한 건 일부인데 주민등록번호와 주소가 함께 적혀 있습니다.',
      '급한 마음에 무료 온라인 PDF 편집기를 검색하면, 대부분 파일을 자기 서버로 올린 뒤 처리합니다. 그 파일이 언제 지워지는지, 누가 볼 수 있는지는 알 수 없습니다.',
      '더 큰 문제는 가린 것처럼 보이지만 실제로는 가려지지 않는 경우입니다.',
    ],
    steps: [
      { title: 'PDF 열기', text: '파일을 끌어다 놓거나 선택합니다. 파일은 브라우저 안에서만 열립니다.' },
      { title: '가릴 영역 지정', text: '주민등록번호나 계좌번호 위를 드래그해 사각형을 그립니다. 마우스와 터치 모두 지원합니다.' },
      { title: '내려받기', text: '안전하게 처리된 PDF가 기기에 바로 저장됩니다.' },
    ],
    cautions: [
      '가린 부분은 되살릴 수 없습니다. 원본 파일은 따로 보관하세요.',
      '결과 PDF는 이미지 형태가 되므로 텍스트 선택·검색이 되지 않습니다. 이것이 원본 정보를 지우는 대가입니다.',
      CHECK_WITH_RECIPIENT,
    ],
    faq: [FAQ.upload, FAQ.restore, FAQ.mobile, FAQ.free],
    related: [
      { label: '주민등록등본 가리기', href: '/guides/resident-registration-redaction', text: '등본에서 무엇을 가려야 하는지' },
      { label: '통장 사본 가리기', href: '/guides/bankbook-copy-redaction', text: '계좌번호를 남기고 가리는 법' },
      { label: '이미지 개인정보 가리기', href: '/tools/image-redact', text: '사진으로 찍은 서류라면' },
      { label: '처리 원리', href: '/how-it-works', text: '왜 복원이 불가능한지' },
    ],
  }),
  toolPage({
    path: '/tools/image-redact',
    title: `이미지 개인정보 가리기 — 신분증·통장 사진 마스킹 | ${BRAND}`,
    description:
      '신분증이나 통장을 찍은 사진에서 주민등록번호·계좌번호를 가립니다. 업로드 없이 브라우저에서 처리하고, 촬영 위치정보도 함께 제거합니다.',
    h1: '이미지 개인정보 가리기',
    lead:
      '사진으로 찍은 신분증이나 통장에서 민감한 부분을 가립니다. 가리는 동시에 사진에 남아 있는 촬영 위치·기기 정보도 제거합니다.',
    ready: false,
    runHref: '/editor/image-redact',
    runLabel: '이미지 가리기 시작하기',
    problem: [
      '요즘 서류 제출은 사진 한 장으로 끝나는 경우가 많습니다. 신분증을 찍어 보내고, 통장 첫 장을 찍어 보냅니다.',
      '그런데 사진에는 보이는 것 말고도 정보가 들어 있습니다. 어디서 찍었는지, 어떤 기기로 찍었는지가 파일 안에 함께 저장됩니다.',
      '가릴 것을 가리고, 눈에 보이지 않는 정보까지 함께 지워야 합니다.',
    ],
    steps: [
      { title: '사진 열기', text: '갤러리에서 고르거나 카메라로 바로 찍습니다.' },
      { title: '가릴 부분 칠하기', text: '손가락이나 마우스로 가릴 영역을 지정합니다.' },
      { title: '저장', text: '가림 처리와 위치정보 제거가 함께 적용된 사진을 내려받습니다.' },
    ],
    cautions: [
      '가린 부분은 픽셀에서 지워지므로 되돌릴 수 없습니다.',
      '원본 사진이 기기 갤러리에 남아 있다면 그것도 함께 관리하세요.',
      CHECK_WITH_RECIPIENT,
    ],
    faq: [FAQ.upload, FAQ.restore, FAQ.mobile, FAQ.offline],
    related: [
      { label: '신분증 사본 가리기', href: '/guides/id-card-redaction', text: '신분증에서 가려야 할 항목' },
      { label: '사진 위치정보 삭제', href: '/tools/remove-photo-metadata', text: '가리지 않고 정보만 지우려면' },
      { label: 'PDF 개인정보 가리기', href: '/tools/pdf-redact', text: 'PDF 파일이라면' },
      { label: '보안', href: '/security', text: '업로드하지 않는다는 근거' },
    ],
  }),
  toolPage({
    path: '/tools/remove-photo-metadata',
    title: `사진 위치정보 삭제 — EXIF·GPS 제거 | ${BRAND}`,
    description:
      '사진에 저장된 촬영 위치(GPS), 촬영 시각, 기기 정보를 제거합니다. 업로드 없이 브라우저에서 처리되며 화질은 그대로 유지됩니다.',
    h1: '사진 위치정보 삭제',
    lead:
      '사진 파일에는 찍은 장소의 좌표와 기기 정보가 함께 저장됩니다. 사진을 다시 저장해 이 기록만 걷어냅니다. 보이는 그림은 그대로입니다.',
    ready: true,
    runHref: '/strip-metadata',
    runLabel: '위치정보 삭제하기',
    problem: [
      '중고 거래에 올린 사진, 블로그에 쓴 사진, 커뮤니티에 올린 사진. 그림만 공유했다고 생각하지만 파일 안에는 좌표가 함께 들어 있습니다.',
      '집에서 찍은 사진이라면 집 주소가 좌표로 남아 있는 셈입니다. 사진을 내려받은 사람은 그 값을 그대로 읽을 수 있습니다.',
    ],
    steps: [
      { title: '사진 선택', text: '한 장 또는 여러 장을 한 번에 올릴 수 있습니다.' },
      { title: '자동 제거', text: '사진을 다시 그려 저장하는 과정에서 EXIF·GPS 정보가 사라집니다.' },
      { title: '내려받기', text: '정리된 사진을 저장합니다. 화질은 그대로입니다.' },
    ],
    cautions: [
      '촬영 날짜 정보도 함께 사라집니다. 날짜를 남겨야 한다면 따로 기록해 두세요.',
      '원본을 덮어쓰지 않으므로 원본 사진은 그대로 남습니다.',
    ],
    faq: [FAQ.upload, FAQ.free, FAQ.offline],
    related: [
      { label: '이미지 개인정보 가리기', href: '/tools/image-redact', text: '사진 속 글자도 가리려면' },
      { label: '신분증 사본 가리기', href: '/guides/id-card-redaction', text: '신분증 사진 다루는 법' },
      { label: '전체 도구', href: '/tools', text: '다른 이미지 도구 보기' },
      { label: '보안', href: '/security', text: '처리 방식 확인하기' },
    ],
  }),
  toolPage({
    path: '/tools/merge-pdf',
    title: `PDF 합치기 — 여러 파일을 하나로 | ${BRAND}`,
    description:
      '여러 개의 PDF를 원하는 순서로 하나로 합칩니다. 업로드 없이 브라우저에서 처리되며 파일 수 제한이 없습니다. 무료, 가입 없음.',
    h1: 'PDF 합치기',
    lead: '흩어진 PDF를 하나로 묶습니다. 순서는 끌어서 바꿀 수 있고, 파일은 기기를 떠나지 않습니다.',
    ready: true,
    runHref: '/merge-pdfs',
    runLabel: 'PDF 합치기',
    problem: [
      '제출 서류가 여러 장으로 나뉘어 있는데 받는 쪽은 파일 하나를 요구합니다.',
      '스캔한 페이지가 각각 따로 저장돼 순서가 뒤섞여 있기도 합니다.',
    ],
    steps: [
      { title: '파일 올리기', text: '합칠 PDF를 모두 선택합니다.' },
      { title: '순서 정하기', text: '끌어서 순서를 바꿉니다.' },
      { title: '합쳐서 저장', text: '하나로 묶인 PDF를 내려받습니다.' },
    ],
    cautions: [
      '암호가 걸린 PDF는 지원하지 않습니다. 암호를 먼저 해제해 주세요.',
      '개인정보가 담긴 문서를 합칠 예정이라면, 합치기 전에 가림 처리를 먼저 하는 편이 확인하기 쉽습니다.',
    ],
    faq: [FAQ.upload, FAQ.free, FAQ.offline],
    related: [
      { label: 'PDF 개인정보 가리기', href: '/tools/pdf-redact', text: '합치기 전에 가려야 한다면' },
      { label: 'PDF 용량 줄이기', href: '/tools/compress-pdf', text: '합쳤더니 용량이 크다면' },
      { label: '전체 도구', href: '/tools', text: 'PDF 나누기·회전·정리' },
      { label: '자주 묻는 질문', href: '/faq', text: '다른 궁금한 점' },
    ],
  }),
  toolPage({
    path: '/tools/compress-pdf',
    title: `PDF 용량 줄이기 — 첨부 용량 맞추기 | ${BRAND}`,
    description:
      '메일이나 신청 사이트의 첨부 용량 제한에 맞게 PDF를 줄입니다. 업로드 없이 브라우저에서 처리되고, 줄이기 전후 용량을 바로 비교할 수 있습니다.',
    h1: 'PDF 용량 줄이기',
    lead: '첨부 제한에 걸린 PDF를 줄입니다. 얼마나 줄었는지 바로 확인할 수 있습니다.',
    ready: true,
    runHref: '/compress-pdf',
    runLabel: 'PDF 용량 줄이기',
    problem: [
      '민원 신청 사이트나 채용 지원 페이지는 첨부 용량을 10MB 안팎으로 제한하는 경우가 많습니다.',
      '스캔한 문서는 페이지마다 사진이 들어가 있어 금방 그 한도를 넘습니다.',
    ],
    steps: [
      { title: 'PDF 열기', text: '줄이고 싶은 파일을 선택합니다.' },
      { title: '방식 고르기', text: '스캔 문서라면 페이지 재인코딩, 글자 위주 문서라면 정보 정리 방식이 맞습니다.' },
      { title: '결과 확인', text: '전후 용량을 비교한 뒤 내려받습니다.' },
    ],
    cautions: [
      '페이지 재인코딩 방식은 글자를 이미지로 바꾸므로 텍스트 선택이 되지 않습니다.',
      '글자만 있는 PDF는 이미 작아서 거의 줄지 않습니다.',
      '문서 종류에 따라 절감 폭이 크게 다릅니다.',
    ],
    faq: [FAQ.upload, FAQ.free, FAQ.offline],
    related: [
      { label: 'PDF 합치기', href: '/tools/merge-pdf', text: '여러 파일을 먼저 묶으려면' },
      { label: 'PDF 개인정보 가리기', href: '/tools/pdf-redact', text: '제출 전 가림 처리' },
      { label: '전체 도구', href: '/tools', text: '다른 PDF 도구' },
      { label: '처리 원리', href: '/how-it-works', text: '브라우저가 어떻게 처리하는지' },
    ],
  }),
]

const GUIDES_HUB = {
  path: '/guides',
  title: `문서별 개인정보 가리기 가이드 — ${BRAND}`,
  description:
    '주민등록등본, 신분증 사본, 통장 사본. 서류별로 무엇을 가려야 하고 어떻게 처리해야 안전한지 정리했습니다.',
  h1: '문서별 가리기 가이드',
  breadcrumb: [{ name: '홈', path: '/' }],
  schema: 'CollectionPage',
  sections: [
    {
      t: 'p',
      text:
        '서류마다 가려야 할 항목이 다르고, 제출처마다 요구하는 기준도 다릅니다. 자주 제출하는 서류를 기준으로 정리했습니다.',
    },
    { t: 'note', tone: 'warn', text: CHECK_WITH_RECIPIENT },
    {
      t: 'cards',
      items: [
        {
          label: '주민등록등본 가리기',
          href: '/guides/resident-registration-redaction',
          text: '주민등록번호 뒷자리와 세대원 정보를 어디까지 가릴지',
        },
        {
          label: '신분증 사본 가리기',
          href: '/guides/id-card-redaction',
          text: '주민등록증·운전면허증 사본에서 가려야 할 항목',
        },
        {
          label: '통장 사본 가리기',
          href: '/guides/bankbook-copy-redaction',
          text: '계좌번호는 남기고 나머지를 가리는 방법',
        },
      ],
    },
  ],
}

const guidePage = ({ path, title, description, h1, lead, when, whatToHide, steps, runHref, faq, related }) => ({
  path,
  title,
  description,
  h1,
  breadcrumb: [
    { name: '홈', path: '/' },
    { name: '가이드', path: '/guides' },
  ],
  schema: 'Article',
  sections: [
    { t: 'p', text: lead },
    { t: 'h2', text: '이럴 때 사용합니다' },
    { t: 'ul', items: when },
    ...guideCaveats(),
    { t: 'h2', text: '무엇을 가리나요' },
    { t: 'ul', items: whatToHide },
    { t: 'h2', text: '처리 순서' },
    { t: 'steps', items: steps },
    { t: 'cta', label: '지금 가리기 시작하기', href: runHref },
    { t: 'h2', text: '자주 묻는 질문' },
    { t: 'faq', items: faq },
    { t: 'cards', title: '관련 문서', items: related },
  ],
})

const GUIDE_PAGES = [
  guidePage({
    path: '/guides/resident-registration-redaction',
    title: `주민등록등본 개인정보 가리는 방법 | ${BRAND}`,
    description:
      '주민등록등본에서 주민등록번호 뒷자리와 세대원 정보를 안전하게 가리는 방법. 복사해도 드러나지 않게 처리하는 법을 단계별로 안내합니다.',
    h1: '주민등록등본 개인정보 가리는 방법',
    lead:
      '등본은 제출할 일이 많은 서류이면서, 한 장에 담긴 정보가 가장 많은 서류이기도 합니다. 세대원 전원의 이름과 주민등록번호, 주소 변동 이력까지 들어 있습니다.',
    when: [
      '회사에 가족관계 확인용으로 제출할 때',
      '부동산 계약이나 대출 심사에 낼 때',
      '학교나 어린이집에 거주 확인용으로 낼 때',
      '각종 정부 지원 신청에 첨부할 때',
    ],
    whatToHide: [
      '주민등록번호 뒷자리 — 가장 자주 요구되는 항목입니다',
      '함께 사는 세대원의 주민등록번호 — 본인 확인이 목적이라면 대개 필요하지 않습니다',
      '과거 주소 변동 이력 — 현재 주소만 필요한 경우가 많습니다',
      '발급 번호 — 재발급·조회에 쓰일 수 있습니다',
    ],
    steps: [
      { title: '정부24에서 발급받기', text: 'PDF로 저장하면 그대로 처리할 수 있습니다. 종이로 받았다면 사진을 찍거나 스캔합니다.' },
      { title: '제출처 기준 확인', text: '뒷자리만 가려도 되는지, 세대원 정보가 필요한지 먼저 확인합니다.' },
      { title: '가릴 부분 지정', text: '가려야 할 항목 위를 드래그해 사각형을 그립니다.' },
      { title: '저장 후 확인', text: '내려받은 파일을 열어 가린 부분을 드래그해 보세요. 글자가 선택되지 않아야 정상입니다.' },
    ],
    runHref: '/tools/pdf-redact',
    faq: [
      {
        q: '주민등록번호 뒷자리만 가리면 되나요?',
        a: '제출처에 따라 다릅니다. 뒷자리만 가리도록 안내하는 곳이 많지만, 번호 전체를 가리라는 곳도 있고 원본 그대로를 요구하는 곳도 있습니다. 접수처에 먼저 확인하는 편이 확실합니다.',
      },
      {
        q: '세대원 정보도 가려야 하나요?',
        a: '본인 확인이 목적이라면 대개 본인 정보만 있으면 됩니다. 다만 가족관계를 확인하려는 목적이라면 세대원 이름이 필요할 수 있으므로, 무엇을 확인하려는 서류인지에 따라 판단하세요.',
      },
      FAQ.restore,
      FAQ.upload,
    ],
    related: [
      { label: '신분증 사본 가리기', href: '/guides/id-card-redaction', text: '신분증도 함께 제출한다면' },
      { label: '통장 사본 가리기', href: '/guides/bankbook-copy-redaction', text: '계좌 정보도 낸다면' },
      { label: 'PDF 개인정보 가리기', href: '/tools/pdf-redact', text: '도구 바로 사용하기' },
    ],
  }),
  guidePage({
    path: '/guides/id-card-redaction',
    title: `신분증 사본 개인정보 가리는 방법 | ${BRAND}`,
    description:
      '주민등록증·운전면허증 사본에서 주민등록번호 뒷자리와 발급 정보를 가리는 방법. 사진으로 찍은 신분증의 위치정보 제거까지 함께 안내합니다.',
    h1: '신분증 사본 개인정보 가리는 방법',
    lead:
      '신분증 사본은 가장 자주 요구되면서 가장 많이 유출되는 서류입니다. 한 장에 이름, 주민등록번호, 주소, 얼굴 사진이 모두 들어 있습니다.',
    when: [
      '통신사나 금융기관에 본인 확인용으로 제출할 때',
      '계약서에 첨부할 때',
      '온라인 서비스 본인 인증에 올릴 때',
      '중고 거래나 대여 서비스에서 신원 확인을 요구할 때',
    ],
    whatToHide: [
      '주민등록번호 뒷자리 — 대부분의 본인 확인에는 앞자리(생년월일)로 충분합니다',
      '발급일자와 발급기관 — 재발급 절차에 악용될 수 있습니다',
      '운전면허번호 — 신분 확인이 목적이라면 대개 불필요합니다',
      '주소 — 신원 확인만 필요한 경우 가릴 수 있습니다',
    ],
    steps: [
      { title: '사진 찍기 또는 스캔', text: '글자가 또렷하게 보이도록 밝은 곳에서 찍습니다.' },
      { title: '제출처 기준 확인', text: '어떤 항목이 필요한지 먼저 확인합니다.' },
      { title: '가릴 부분 칠하기', text: '가려야 할 항목을 손가락이나 마우스로 지정합니다.' },
      { title: '위치정보까지 제거', text: '사진으로 찍었다면 촬영 위치 기록도 함께 지워집니다.' },
    ],
    runHref: '/tools/image-redact',
    faq: [
      {
        q: '사본에 "○○ 제출용"이라고 적는 게 도움이 되나요?',
        a: '용도를 적어 두면 다른 곳에 재사용되는 것을 어느 정도 막을 수 있습니다. 가림 처리와 함께 쓰면 좋습니다.',
      },
      {
        q: '사진으로 찍은 신분증에도 위치정보가 들어가나요?',
        a: '들어갑니다. 휴대폰으로 찍은 사진에는 촬영 좌표가 함께 저장되는 경우가 많습니다. 집에서 찍었다면 집 위치가 파일에 남습니다.',
      },
      FAQ.restore,
      FAQ.mobile,
    ],
    related: [
      { label: '주민등록등본 가리기', href: '/guides/resident-registration-redaction', text: '등본도 함께 낸다면' },
      { label: '사진 위치정보 삭제', href: '/tools/remove-photo-metadata', text: '위치정보만 지우려면' },
      { label: '이미지 개인정보 가리기', href: '/tools/image-redact', text: '도구 바로 사용하기' },
    ],
  }),
  guidePage({
    path: '/guides/bankbook-copy-redaction',
    title: `통장 사본 개인정보 가리는 방법 | ${BRAND}`,
    description:
      '통장 사본에서 계좌번호는 남기고 주민등록번호와 거래 내역을 가리는 방법. 급여 계좌 등록이나 환불 신청에 안전하게 제출하는 법을 안내합니다.',
    h1: '통장 사본 개인정보 가리는 방법',
    lead:
      '통장 사본은 계좌번호를 알려주기 위해 제출합니다. 그런데 사본에는 계좌번호 말고도 많은 것이 함께 찍혀 나옵니다.',
    when: [
      '회사에 급여 계좌를 등록할 때',
      '환불이나 정산 계좌를 알려줄 때',
      '보험금이나 지원금 신청에 첨부할 때',
      '거래처에 입금 계좌를 전달할 때',
    ],
    whatToHide: [
      '주민등록번호 — 통장 사본에 인쇄된 경우가 있습니다. 계좌 확인에는 필요하지 않습니다',
      '거래 내역 — 잔액과 입출금 기록이 보이는 면은 대개 제출할 필요가 없습니다',
      '주소 — 계좌 확인이 목적이라면 불필요합니다',
      '계좌번호와 예금주 이름은 남겨야 합니다 — 이것이 제출하는 목적입니다',
    ],
    steps: [
      { title: '표지 면 준비', text: '거래 내역이 아니라 계좌번호가 인쇄된 면을 사용합니다.' },
      { title: '남길 것과 가릴 것 구분', text: '계좌번호·예금주·은행명은 남기고 나머지를 가립니다.' },
      { title: '가리기', text: '가릴 부분을 지정하고 처리합니다.' },
      { title: '확인 후 전달', text: '계좌번호가 또렷하게 보이는지 확인합니다. 가려야 할 곳을 가리다 정작 필요한 정보까지 덮지 않도록 합니다.' },
    ],
    runHref: '/tools/image-redact',
    faq: [
      {
        q: '계좌번호도 일부 가려야 하나요?',
        a: '아닙니다. 계좌번호는 입금을 받기 위해 알려주는 정보이므로 전부 보여야 합니다. 가려야 할 것은 계좌번호가 아니라 함께 찍힌 주민등록번호와 거래 내역입니다.',
      },
      {
        q: '인터넷뱅킹 화면 캡처도 되나요?',
        a: '제출처가 인정한다면 가능합니다. 다만 캡처 화면에는 잔액이나 다른 계좌가 함께 보이는 경우가 많으니 그 부분을 가려야 합니다.',
      },
      FAQ.upload,
      FAQ.restore,
    ],
    related: [
      { label: '신분증 사본 가리기', href: '/guides/id-card-redaction', text: '신분증도 함께 낸다면' },
      { label: '주민등록등본 가리기', href: '/guides/resident-registration-redaction', text: '등본 처리법' },
      { label: '이미지 개인정보 가리기', href: '/tools/image-redact', text: '도구 바로 사용하기' },
    ],
  }),
]

const TRUST_PAGES = [
  {
    path: '/how-it-works',
    title: `처리 원리 — 브라우저에서 어떻게 동작하나요 | ${BRAND}`,
    description:
      '파일을 서버로 보내지 않고 브라우저 안에서 PDF와 이미지를 처리하는 방식을 설명합니다. 가림 처리가 왜 복원 불가능한지도 함께 다룹니다.',
    h1: '브라우저 안에서 어떻게 처리되나요',
    breadcrumb: [{ name: '홈', path: '/' }],
    schema: 'Article',
    sections: [
      {
        t: 'p',
        text:
          '“업로드 없이 처리한다”는 말이 막연하게 들릴 수 있습니다. 실제로 무슨 일이 일어나는지 설명합니다.',
      },
      { t: 'h2', text: '서버가 필요 없는 이유' },
      {
        t: 'p',
        text:
          '예전에는 PDF를 다루려면 서버의 힘을 빌려야 했습니다. 지금은 브라우저가 그 일을 직접 할 수 있습니다. 파일을 읽고, 페이지를 그리고, 새 파일로 저장하는 과정이 모두 기기 안에서 끝납니다.',
      },
      {
        t: 'p',
        text: `${BRAND}는 그 능력만 사용합니다. 파일은 브라우저 메모리에서 열리고, 처리되고, 곧바로 다운로드 폴더로 저장됩니다. 중간에 거쳐 가는 서버가 없습니다.`,
      },
      { t: 'h2', text: '가림 처리가 복원 불가능한 이유' },
      { t: 'p', text: OVERLAY_WARNING },
      {
        t: 'p',
        text:
          'PDF는 글자를 “글자”로 저장합니다. 그 위에 사각형을 그려도 아래의 글자 데이터는 그대로 남습니다. 화면에서 가려 보일 뿐입니다.',
      },
      { t: 'p', text: SAFE_METHOD },
      {
        t: 'steps',
        items: [
          { title: '페이지를 이미지로 다시 그림', text: '브라우저가 PDF 페이지를 그림 한 장으로 렌더링합니다.' },
          { title: '그림 위에 직접 칠함', text: '가릴 영역을 픽셀 단위로 덮어씁니다. 이 시점에 원본 값은 사라집니다.' },
          { title: '새 PDF로 저장', text: '칠해진 그림만으로 PDF를 새로 만듭니다. 원본 텍스트 레이어는 옮겨오지 않습니다.' },
        ],
      },
      {
        t: 'note',
        tone: 'info',
        text: '이 방식의 대가는 결과 PDF에서 텍스트 선택과 검색이 되지 않는다는 점입니다. 정보를 실제로 지우기 위한 필연적인 교환입니다.',
      },
      { t: 'h2', text: '오프라인에서도 동작합니다' },
      {
        t: 'p',
        text:
          '한 번 접속하면 앱 전체가 기기에 저장됩니다. 인터넷을 끊고 새로고침해도 모든 도구가 그대로 동작합니다. 서버에 의존하지 않는다는 가장 확실한 증거입니다.',
      },
      {
        t: 'cards',
        title: '이어서 보기',
        items: [
          { label: '보안', href: '/security', text: '직접 확인하는 방법' },
          { label: 'PDF 개인정보 가리기', href: '/tools/pdf-redact', text: '바로 사용해 보기' },
          { label: '자주 묻는 질문', href: '/faq', text: '남은 궁금증' },
        ],
      },
    ],
  },
  {
    path: '/security',
    title: `보안 — 파일이 전송되지 않는다는 것을 확인하는 방법 | ${BRAND}`,
    description:
      '말이 아니라 확인할 수 있는 근거를 제시합니다. 브라우저 보안 정책(CSP), 오프라인 동작, 오픈소스 공개, 자동 검사까지 네 가지 방법으로 검증할 수 있습니다.',
    h1: '보안: 확인할 수 있는 근거',
    breadcrumb: [{ name: '홈', path: '/' }],
    schema: 'Article',
    sections: [
      {
        t: 'p',
        text:
          '“안전합니다”라는 문장은 누구나 쓸 수 있습니다. 그래서 믿어달라고 하는 대신 직접 확인하는 방법을 정리했습니다.',
      },
      { t: 'h2', text: '1. 브라우저가 외부 전송을 차단합니다' },
      {
        t: 'p',
        text:
          '이 사이트는 외부로 나가는 통신을 자기 자신으로만 제한하는 보안 정책(Content-Security-Policy)을 걸어 두었습니다. 나중에 누군가 파일을 어딘가로 보내는 코드를 넣더라도, 브라우저가 그 요청을 거부합니다. 서비스 제공자가 아니라 브라우저가 막는다는 점이 중요합니다.',
      },
      { t: 'h2', text: '2. 개발자도구에서 직접 볼 수 있습니다' },
      {
        t: 'ul',
        items: [
          'F12를 눌러 개발자도구를 엽니다',
          '네트워크 탭을 선택합니다',
          '아무 도구나 사용해 파일을 처리합니다',
          '이 사이트 주소 외의 요청이 하나도 없는 것을 확인합니다',
        ],
      },
      { t: 'h2', text: '3. 인터넷을 끊고 써 보세요' },
      {
        t: 'p',
        text:
          '한 번 접속한 뒤 비행기 모드로 바꾸고 새로고침해 보세요. 모든 기능이 그대로 동작합니다. 서버로 보내야 할 것이 있었다면 불가능한 일입니다.',
      },
      { t: 'h2', text: '4. 소스가 공개되어 있습니다' },
      {
        t: 'p',
        text:
          '전체 코드가 MIT 라이선스로 공개되어 있습니다. 직접 읽어볼 수도 있고, 내려받아 직접 호스팅할 수도 있습니다. 변경할 때마다 외부 주소 참조가 있는지 자동으로 검사하며, 검사에 걸리면 배포가 중단됩니다.',
      },
      { t: 'h2', text: '기기에 저장되는 것' },
      {
        t: 'p',
        text:
          '화면 테마와 사이드바 상태 같은 화면 설정만 저장합니다. 파일 내용은 저장하지 않으며, 창을 닫으면 메모리에서 사라집니다.',
      },
      {
        t: 'cards',
        title: '이어서 보기',
        items: [
          { label: '처리 원리', href: '/how-it-works', text: '기술적으로 어떻게 동작하는지' },
          { label: '오픈소스 라이선스', href: '/open-source-licenses', text: '사용한 오픈소스 목록' },
          { label: '개인정보 처리방침', href: '/privacy', text: '수집하지 않는다는 선언' },
        ],
      },
    ],
  },
  {
    path: '/faq',
    title: `자주 묻는 질문 — ${BRAND}`,
    description:
      '파일 업로드 여부, 비용, 오프라인 사용, 가림 처리의 복원 가능성 등 가장 많이 받는 질문에 답합니다.',
    h1: '자주 묻는 질문',
    breadcrumb: [{ name: '홈', path: '/' }],
    schema: 'FAQPage',
    sections: [
      {
        t: 'faq',
        items: [
          FAQ.upload,
          FAQ.free,
          FAQ.offline,
          FAQ.restore,
          FAQ.mobile,
          {
            q: '가린 PDF에서 왜 글자 선택이 안 되나요?',
            a: '가림 처리를 실제로 적용하려면 페이지를 이미지로 다시 만들어야 하기 때문입니다. 원본 텍스트를 남겨두면 가린 부분을 복사해 읽을 수 있게 되므로, 안전을 위해 텍스트 레이어를 버립니다.',
          },
          {
            q: '파일 크기 제한이 있나요?',
            a: '서버 제한은 없습니다. 다만 처리가 기기에서 이루어지므로 아주 큰 파일은 기기 성능에 따라 느려질 수 있습니다.',
          },
          {
            q: '암호가 걸린 PDF도 되나요?',
            a: '현재 지원하지 않습니다. 암호를 먼저 해제한 뒤 사용해 주세요.',
          },
          {
            q: '스캔한 문서의 글자도 인식하나요?',
            a: '문자 인식(OCR)은 제공하지 않습니다. 다만 가림 처리는 글자 인식과 무관하게 동작하므로 스캔 문서도 가릴 수 있습니다.',
          },
          {
            q: '한글 문서도 문제없나요?',
            a: 'PDF를 열고, 가리고, 합치고, 줄이는 기능은 한글 문서에서 정상 동작합니다. PDF에 한글 텍스트를 새로 써 넣는 기능도 지원합니다.',
          },
        ],
      },
      {
        t: 'cards',
        title: '더 알아보기',
        items: [
          { label: '보안', href: '/security', text: '직접 확인하는 방법' },
          { label: '처리 원리', href: '/how-it-works', text: '동작 방식' },
          { label: '문서별 가이드', href: '/guides', text: '서류별 처리법' },
        ],
      },
    ],
  },
  {
    path: '/privacy',
    title: `개인정보 처리방침 — ${BRAND}`,
    description:
      'PrivacyDoc은 이용자의 파일과 개인정보를 수집하지 않습니다. 수집하지 않는 이유와 기기에 저장되는 항목을 설명합니다.',
    h1: '개인정보 처리방침',
    breadcrumb: [{ name: '홈', path: '/' }],
    schema: 'WebPage',
    sections: [
      {
        t: 'p',
        text: `${BRAND}는 이용자의 파일과 개인정보를 수집하지 않습니다. 수집할 수 있는 구조가 아니기 때문입니다.`,
      },
      { t: 'h2', text: '수집하지 않는 것' },
      {
        t: 'ul',
        items: [
          '업로드한 파일 — 파일은 서버로 전송되지 않으며 브라우저 메모리에서만 처리됩니다',
          '파일의 내용, 파일명, 크기 등 어떤 정보도 전송하지 않습니다',
          '이름, 이메일, 전화번호 등 개인 식별 정보 — 가입 절차가 없습니다',
          '접속 기록, 사용 통계, 행동 분석 — 분석 도구를 사용하지 않습니다',
          '쿠키 — 광고나 추적 목적의 쿠키를 사용하지 않습니다',
        ],
      },
      { t: 'h2', text: '기기에 저장되는 것' },
      {
        t: 'p',
        text:
          '화면 테마(밝게/어둡게)와 사이드바 접힘 상태만 브라우저의 로컬 저장소에 남습니다. 이 값은 기기 밖으로 나가지 않으며, 브라우저 데이터를 지우면 함께 사라집니다.',
      },
      { t: 'h2', text: '외부 전송' },
      {
        t: 'p',
        text:
          '앱은 실행 중 외부로 어떤 네트워크 요청도 보내지 않습니다. 브라우저 보안 정책으로 차단되어 있으며, 개발자도구에서 직접 확인할 수 있습니다.',
      },
      { t: 'h2', text: '제3자 제공' },
      { t: 'p', text: '수집하는 정보가 없으므로 제3자에게 제공하는 정보도 없습니다.' },
      {
        t: 'cards',
        title: '관련 페이지',
        items: [
          { label: '보안', href: '/security', text: '확인 방법' },
          { label: '오픈소스 라이선스', href: '/open-source-licenses', text: '사용 중인 오픈소스' },
        ],
      },
    ],
  },
  {
    path: '/open-source-licenses',
    title: `오픈소스 라이선스 — ${BRAND}`,
    description:
      'PrivacyDoc이 사용하는 오픈소스와 폰트의 라이선스 고지. 원본 프로젝트 DoxDock(MIT)과 Pretendard(OFL) 등을 명시합니다.',
    h1: '오픈소스 라이선스',
    breadcrumb: [{ name: '홈', path: '/' }],
    schema: 'WebPage',
    sections: [
      {
        t: 'p',
        text: `${BRAND}는 오픈소스로 만들어졌고, 그 자체도 MIT 라이선스로 공개되어 있습니다.`,
      },
      { t: 'h2', text: '원본 프로젝트' },
      {
        t: 'p',
        text:
          '이 서비스는 MIT 라이선스로 공개된 DoxDock을 기반으로 만들어졌습니다. Copyright (c) 2026 Mithun Srinivas. 원저작권 고지는 저장소의 LICENSE 파일에 원문 그대로 보존되어 있습니다.',
      },
      { t: 'h2', text: '폰트' },
      {
        t: 'p',
        text:
          'PDF에 한글을 넣을 때 Pretendard를 사용합니다. Copyright (c) 2021 Kil Hyung-jin, SIL Open Font License 1.1.',
      },
      { t: 'h2', text: '주요 라이브러리' },
      {
        t: 'ul',
        items: [
          'pdf-lib (MIT) — PDF 생성 및 편집',
          'pdf.js (Apache-2.0) — PDF 렌더링 및 텍스트 추출',
          'React (MIT) — 화면 구성',
          'Vite (MIT) — 빌드 도구',
          'fflate (MIT) — ZIP 묶음',
        ],
      },
      {
        t: 'p',
        text: '전체 목록과 각 항목의 사용 위치는 저장소의 THIRD_PARTY_NOTICES.md에 정리되어 있습니다.',
      },
      {
        t: 'cards',
        title: '관련 페이지',
        items: [
          { label: '보안', href: '/security', text: '소스 확인 방법' },
          { label: '개인정보 처리방침', href: '/privacy', text: '수집하지 않는 것' },
        ],
      },
    ],
  },
]

/** Editor routes: real working UI, deliberately kept out of the index. */
const EDITOR_PAGES = [
  {
    path: '/editor/pdf-redact',
    title: `PDF 가리기 편집기 — ${BRAND}`,
    description: 'PDF 개인정보 가리기 편집 화면입니다.',
    h1: 'PDF 가리기 편집기',
    breadcrumb: [
      { name: '홈', path: '/' },
      { name: 'PDF 개인정보 가리기', path: '/tools/pdf-redact' },
    ],
    noindex: true,
    schema: 'WebPage',
    sections: [
      {
        t: 'note',
        tone: 'warn',
        text: '안전 가리기 편집기는 준비 중입니다. 그때까지는 아래 도구를 이용해 주세요.',
      },
      {
        t: 'p',
        text:
          '기존 PDF 편집기로도 사각형을 덮을 수 있지만, 그 방식은 원본 글자를 지우지 않습니다. 개인정보 보호가 목적이라면 안전 가리기 기능이 준비된 뒤 사용해 주세요.',
      },
      {
        t: 'cards',
        items: [
          { label: 'PDF 개인정보 가리기 안내', href: '/tools/pdf-redact', text: '처리 방식 설명 보기' },
          { label: 'PDF 편집 (시각 편집용)', href: '/edit-pdf', text: '개인정보 보호용이 아닙니다' },
        ],
      },
    ],
  },
  {
    path: '/editor/image-redact',
    title: `이미지 가리기 편집기 — ${BRAND}`,
    description: '이미지 개인정보 가리기 편집 화면입니다.',
    h1: '이미지 가리기 편집기',
    breadcrumb: [
      { name: '홈', path: '/' },
      { name: '이미지 개인정보 가리기', path: '/tools/image-redact' },
    ],
    noindex: true,
    schema: 'WebPage',
    sections: [
      {
        t: 'note',
        tone: 'warn',
        text: '이미지 가리기 편집기는 준비 중입니다.',
      },
      {
        t: 'cards',
        items: [
          { label: '이미지 개인정보 가리기 안내', href: '/tools/image-redact', text: '처리 방식 설명 보기' },
          { label: '사진 위치정보 삭제', href: '/strip-metadata', text: '지금 사용 가능한 기능' },
        ],
      },
    ],
  },
]

export const PAGES = [
  HOME,
  TOOLS_HUB,
  ...TOOL_PAGES,
  GUIDES_HUB,
  ...GUIDE_PAGES,
  ...TRUST_PAGES,
  ...EDITOR_PAGES,
]

export const PAGE_BY_PATH = new Map(PAGES.map((p) => [p.path, p]))

export function getPage(path) {
  return PAGE_BY_PATH.get(path) || null
}

/** Pages that belong in sitemap.xml: indexable AND actually working. */
export function sitemapPages() {
  return PAGES.filter((p) => !p.noindex && p.ready !== false)
}

export function canonicalOf(page) {
  return page.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${page.path}`
}
