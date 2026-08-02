import { SITE_URL, BRAND } from '../config/site.js'

// ─────────────────────────────────────────────────────────────────────────────
// Every page on the site, as data.
//
// This is the single source of truth for routing, SEO metadata, structured data,
// the sitemap AND the page body. Both the React renderer (src/content/Blocks.jsx)
// and the build-time prerenderer (scripts/renderBlocks.mjs) read these same
// definitions, so a crawler that never runs JavaScript sees the same H1, prose
// and internal links a visitor does.
//
// `ready: false` marks a page whose tool is not built yet. Those pages stay
// routable and linkable but are served `noindex, follow` and kept out of
// sitemap.xml. Flipping the flag is all it takes to publish them.
//
// Copy rules (see docs/copy-guide.md): plain Korean, one idea per sentence,
// no claim that something is impossible to recover, and never state what a
// user "must" hide — that is the receiving office's call, not ours.
// ─────────────────────────────────────────────────────────────────────────────

const CHECK_FIRST =
  '제출처마다 필요한 정보와 가림 기준이 다를 수 있습니다. 가리기 전에 제출기관의 안내를 먼저 확인하세요.'

const OVERLAY_LIMIT =
  '편집 도구로 검은 사각형을 덮는 방법은 화면에서만 가려집니다. 원본 글자가 파일 안에 그대로 남아 있어, 받는 사람이 글자를 복사하면 가린 내용이 보일 수 있습니다.'

const HOW_WE_DO_IT =
  '선택한 영역을 문서 이미지에 직접 적용한 뒤 새 PDF로 저장합니다. 가린 부분의 원본 글자가 결과 PDF에서 검색·선택·복사되지 않도록 처리합니다.'

/** Answers reused where they genuinely fit that page's question. */
const FAQ = {
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
  undo: {
    q: '가린 부분을 다시 되돌릴 수 있나요?',
    a: '되돌릴 수 없습니다. 저장한 파일에는 가린 상태만 남습니다. 원본은 따로 보관해 두세요.',
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

const HOME = {
  path: '/',
  title: `${BRAND} — PDF 주민번호·개인정보 가리기`,
  description:
    'PDF 속 주민등록번호나 계좌번호를 가려서 제출하세요. 가린 부분은 복사해도 나오지 않습니다. 파일은 내 브라우저에서 직접 처리되고, 무료이며 가입이 필요 없습니다.',
  h1: '주민등록번호, 확실하게 가려서 내세요',
  breadcrumb: [],
  schema: 'WebApplication',
  // The home page leads with one thing. The inherited tools are real but not
  // why anyone comes here, so they sit behind a single link rather than
  // competing for attention with the tool this service exists for.
  sections: [
    {
      t: 'p',
      text:
        '가린 부분은 복사해도 글자가 나오지 않습니다. 파일은 별도 서버에 저장하지 않고 내 브라우저 안에서만 처리됩니다.',
    },
    // Two buttons, because the first thing a visitor knows is what they are
    // holding: a PDF, or a photo of the document.
    {
      t: 'actions',
      items: [
        { label: 'PDF 개인정보 가리기', href: '/editor/pdf-redact', primary: true },
        { label: '사진 개인정보 가리기', href: '/editor/image-redact', primary: true },
      ],
    },
    { t: 'redactDemo' },
    { t: 'note', tone: 'warn', text: CHECK_FIRST },
    // Nothing else. Someone who searched for this already knows why they need
    // it, and a link inviting people to open devtools was never going to be
    // taken up. Everything that
    // remains either does something or warns about something.
  ],
}

const TOOLS_HUB = {
  path: '/tools',
  title: `모든 도구 — ${BRAND}`,
  description:
    'PDF와 사진을 다루는 도구 모음. PDF 합치기·나누기·용량 줄이기, 사진 크기 조절과 정보 삭제까지 모두 내 브라우저에서 무료로 쓸 수 있습니다.',
  h1: '모든 도구',
  breadcrumb: [{ name: '홈', path: '/' }],
  schema: 'CollectionPage',
  sections: [
    {
      t: 'p',
      text: '모든 도구는 내 브라우저에서 동작합니다. 파일을 올리지 않고, 가입이나 설치도 필요 없습니다.',
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
    { name: '모든 도구', path: '/tools' },
  ],
  schema: 'SoftwareApplication',
  sections: [
    { t: 'p', text: lead },
    ...(ready
      ? [{ t: 'cta', label: runLabel, href: runHref }]
      : [
          { t: 'note', tone: 'warn', text: '이 기능은 준비 중입니다. 아래는 준비하고 있는 방식에 대한 안내입니다.' },
          { t: 'cta', label: runLabel, href: runHref, disabled: true },
        ]),
    { t: 'h2', text: '이럴 때 씁니다' },
    ...problem.map((text) => ({ t: 'p', text })),
    { t: 'h2', text: '파일을 올리지 않고 처리합니다' },
    {
      t: 'p',
      text: `이 서비스는 파일을 밖으로 보내지 않습니다. 브라우저가 직접 파일을 열고, 처리하고, 결과를 저장합니다.`,
    },
    { t: 'h2', text: '쓰는 방법' },
    { t: 'steps', items: steps },
    ...(cautions?.length ? [{ t: 'h2', text: '알아두실 점' }, { t: 'ul', items: cautions }] : []),
    { t: 'h2', text: '자주 묻는 질문' },
    { t: 'faq', items: faq },
    // Only when there is somewhere worth sending them. An empty list used to
    // render the heading on its own.
    ...(related?.length ? [{ t: 'cards', title: '함께 보면 좋은 페이지', items: related.slice(0, 2) }] : []),
  ],
})

const TOOL_PAGES = [
  toolPage({
    path: '/tools/pdf-redact',
    title: `PDF 주민번호·개인정보 가리기 | ${BRAND}`,
    description:
      'PDF 속 주민등록번호나 계좌번호를 가립니다. 가린 부분이 글자로 복사되지 않도록 새 PDF로 저장하며, 파일은 내 브라우저에서만 처리됩니다.',
    h1: 'PDF 개인정보 가리기',
    lead:
      'PDF에서 가릴 곳을 정하면, 그 부분을 문서 이미지에 직접 적용해 새 PDF로 저장합니다. 파일은 기기 밖으로 나가지 않습니다.',
    ready: true,
    runHref: '/editor/pdf-redact',
    runLabel: '파일 선택',
    problem: [
      '회사에 낼 서류, 계약에 필요한 등본, 병원에 낼 진단서. 필요한 건 일부인데 주민등록번호와 주소가 같이 적혀 있습니다.',
      '급한 마음에 무료 PDF 편집 사이트를 찾으면, 대부분 파일을 먼저 올려야 합니다. 그 파일이 언제 지워지는지는 알기 어렵습니다.',
      '가린 것처럼 보여도 실제로는 글자가 그대로 남는 경우도 있습니다.',
    ],
    steps: [
      { title: '파일 선택', text: 'PDF를 끌어다 놓거나 골라 주세요. 브라우저 안에서만 열립니다.' },
      { title: '가릴 영역 선택', text: '가릴 곳 위를 드래그해 사각형을 그립니다. 마우스와 터치 모두 됩니다.' },
      { title: '안전하게 저장', text: '가림이 적용된 새 PDF를 기기에 바로 받습니다.' },
    ],
    cautions: [
      '가린 부분은 되돌릴 수 없습니다. 원본은 따로 보관해 두세요.',
      '저장한 PDF에서는 글자 선택과 검색이 되지 않습니다.',
      CHECK_FIRST,
    ],
    faq: [FAQ.upload, FAQ.undo, FAQ.textSelect, FAQ.mobile, FAQ.free],
  }),
  toolPage({
    path: '/tools/image-redact',
    title: `사진 개인정보 가리기 — 신분증·통장 사본 가리기 | ${BRAND}`,
    description:
      '신분증이나 통장을 찍은 사진에서 가리고 싶은 부분을 가립니다. 사진에 남는 촬영 위치 기록도 함께 지워지고, 파일은 내 브라우저에서만 처리됩니다.',
    h1: '사진 개인정보 가리기',
    lead:
      '사진으로 찍은 서류에서 가리고 싶은 부분을 가립니다. 저장할 때 사진에 남아 있던 촬영 위치와 기기 기록도 함께 지워집니다.',
    ready: true,
    runHref: '/editor/image-redact',
    runLabel: '파일 선택',
    problem: [
      '요즘은 서류를 사진 한 장으로 내는 경우가 많습니다. 신분증을 찍어 보내고, 통장 첫 장을 찍어 보냅니다.',
      '사진에는 눈에 보이는 것 말고도 정보가 들어 있습니다. 어디서 찍었는지, 어떤 기기로 찍었는지가 파일 안에 함께 저장됩니다.',
    ],
    steps: [
      { title: '파일 선택', text: '앨범에서 고르거나 카메라로 바로 찍습니다.' },
      { title: '가릴 영역 선택', text: '손가락이나 마우스로 가릴 곳을 칠합니다.' },
      { title: '안전하게 저장', text: '가림과 사진 정보 삭제가 함께 적용된 사진을 받습니다.' },
    ],
    cautions: [
      '가린 부분은 되돌릴 수 없습니다.',
      '앨범에 남아 있는 원본 사진도 함께 정리해 주세요.',
      CHECK_FIRST,
    ],
    faq: [FAQ.upload, FAQ.undo, FAQ.mobile, FAQ.offline],
  }),
  toolPage({
    path: '/tools/remove-photo-metadata',
    // Two searches, one tool: people look for "내 사진에 위치가 있나" before they
    // ever look for "메타데이터 삭제". The page leads with the question.
    title: `내 사진에 위치정보가 있는지 확인하고 지우기 | ${BRAND}`,
    description:
      '사진에 촬영 위치와 시각, 기기 정보가 들어 있는지 바로 확인하고 지웁니다. 파일은 내 브라우저에서만 열리고 좌표는 어디에도 보내지 않습니다.',
    h1: '사진 위치정보 확인·삭제',
    lead:
      '사진을 넣으면 그 안에 무엇이 들어 있는지 바로 보여줍니다. 촬영 위치, 시각, 기기. 지우면 보이는 그림은 그대로 두고 이 기록만 사라집니다.',
    ready: true,
    runHref: '/strip-metadata',
    runLabel: '내 사진 확인하기',
    problem: [
      '중고 거래에 올린 사진, 블로그에 쓴 사진, 커뮤니티에 올린 사진. 그림만 공유했다고 생각하지만 파일 안에는 찍은 곳의 좌표가 함께 들어 있습니다.',
      '집에서 찍은 사진이라면 집 위치가 남아 있는 셈입니다. 사진을 받은 사람은 그 값을 그대로 볼 수 있습니다.',
    ],
    steps: [
      { title: '파일 선택', text: '한 장도, 여러 장도 한 번에 됩니다.' },
      { title: '자동 정리', text: '사진을 다시 저장하는 과정에서 촬영 기록이 사라집니다.' },
      { title: '파일 받기', text: '정리된 사진을 저장합니다. 화질은 그대로입니다.' },
    ],
    cautions: [
      '촬영 날짜 정보도 함께 사라집니다. 날짜가 필요하면 따로 적어 두세요.',
      '원본 사진은 그대로 남습니다.',
    ],
    faq: [FAQ.upload, FAQ.free, FAQ.offline],
  }),
  toolPage({
    path: '/tools/merge-pdf',
    title: `PDF 합치기 — 여러 PDF를 하나로 | ${BRAND}`,
    description:
      '여러 개의 PDF를 원하는 순서로 하나로 합칩니다. 파일 개수 제한이 없고, 내 브라우저에서 처리되며 가입이 필요 없습니다.',
    h1: 'PDF 합치기',
    lead: '흩어진 PDF를 하나로 묶습니다. 순서는 끌어서 바꿀 수 있습니다.',
    ready: true,
    runHref: '/merge-pdfs',
    runLabel: '파일 선택',
    problem: [
      '낼 서류가 여러 장으로 나뉘어 있는데 받는 곳에서는 파일 하나를 원합니다.',
      '스캔한 페이지가 각각 따로 저장돼 순서가 섞여 있기도 합니다.',
    ],
    steps: [
      { title: '파일 선택', text: '합칠 PDF를 모두 고릅니다.' },
      { title: '순서 정하기', text: '끌어서 순서를 바꿉니다.' },
      { title: '파일 받기', text: '하나로 묶인 PDF를 저장합니다.' },
    ],
    cautions: [
      '암호가 걸린 PDF는 아직 지원하지 않습니다. 암호를 먼저 풀어 주세요.',
      '개인정보가 담긴 서류라면 합치기 전에 가리는 편이 확인하기 쉽습니다.',
    ],
    faq: [FAQ.upload, FAQ.free, FAQ.offline],
    related: [
      { label: 'PDF 개인정보 가리기', href: '/tools/pdf-redact', text: '합치기 전에 가려야 한다면' },
      { label: 'PDF 용량 줄이기', href: '/tools/compress-pdf', text: '합쳤더니 용량이 크다면' },
      { label: '모든 도구', href: '/tools', text: 'PDF 나누기·회전·정리' },
      { label: '자주 묻는 질문', href: '/faq', text: '다른 궁금한 점' },
    ],
  }),
  toolPage({
    path: '/tools/compress-pdf',
    title: `PDF 용량 줄이기 — 제출·첨부 용량 맞추기 | ${BRAND}`,
    description:
      '메일이나 신청 사이트의 첨부 용량 제한에 맞춰 PDF를 줄입니다. 줄이기 전후 용량을 바로 비교할 수 있고, 파일은 내 브라우저에서만 처리됩니다.',
    h1: 'PDF 용량 줄이기',
    lead: '첨부 용량 제한에 걸린 PDF를 줄입니다. 얼마나 줄었는지 바로 확인할 수 있습니다.',
    ready: true,
    runHref: '/compress-pdf',
    runLabel: '파일 선택',
    problem: [
      '민원 신청 사이트나 채용 지원 페이지는 첨부 용량을 10MB 안팎으로 제한하는 경우가 많습니다.',
      '스캔한 서류는 페이지마다 사진이 들어 있어 금방 그 한도를 넘습니다.',
    ],
    steps: [
      { title: '파일 선택', text: '줄이고 싶은 PDF를 고릅니다.' },
      { title: '방식 고르기', text: '스캔한 서류라면 페이지를 다시 저장하는 방식이, 글자 위주 문서라면 정보만 정리하는 방식이 맞습니다.' },
      { title: '파일 받기', text: '전후 용량을 비교한 뒤 저장합니다.' },
    ],
    cautions: [
      '페이지를 다시 저장하는 방식은 글자가 그림이 되므로 글자 선택이 되지 않습니다.',
      '글자만 있는 PDF는 이미 작아서 거의 줄지 않습니다.',
      '문서 종류에 따라 줄어드는 정도가 크게 다릅니다.',
    ],
    faq: [FAQ.upload, FAQ.free, FAQ.offline],
    related: [
      { label: 'PDF 합치기', href: '/tools/merge-pdf', text: '여러 파일을 먼저 묶으려면' },
      { label: 'PDF 개인정보 가리기', href: '/tools/pdf-redact', text: '내기 전에 가리려면' },
      { label: '모든 도구', href: '/tools', text: '다른 PDF 도구' },
    ],
  }),
]

const GUIDES_HUB = {
  path: '/guides',
  title: `문서 종류별 개인정보 가리기 방법 | ${BRAND}`,
  description:
    '신분증 사본, 통장 사본, 계약서, 주민등록등본. 서류를 내기 전에 어떤 정보가 함께 담겨 있는지 확인하는 방법을 정리했습니다.',
  h1: '문서 종류별 안내',
  breadcrumb: [{ name: '홈', path: '/' }],
  schema: 'CollectionPage',
  sections: [
    {
      t: 'p',
      text:
        '서류마다 함께 담기는 정보가 다르고, 받는 곳마다 필요한 항목도 다릅니다. 자주 내는 서류를 기준으로 정리했습니다.',
    },
    { t: 'note', tone: 'warn', text: CHECK_FIRST },
    {
      t: 'cards',
      items: [
        {
          label: '신분증 사본 주민등록번호 가리기',
          href: '/guides/id-card-redaction',
          text: '신분증 사본에 함께 담기는 정보',
        },
        {
          label: '통장 사본 제출 전 확인',
          href: '/guides/bankbook-copy-redaction',
          text: '계좌번호는 남기고 확인할 항목',
        },
        {
          label: '계약서 개인정보 확인',
          href: '/guides/contract-personal-info-redaction',
          text: '계약서를 공유하기 전에',
        },
        {
          label: '주민등록등본 제출 전 확인',
          href: '/guides/resident-registration-redaction',
          text: '등본 한 장에 담기는 정보',
        },
      ],
    },
  ],
}

const guidePage = ({ path, title, description, h1, lead, when, whatToCheck, steps, runHref, faq }) => ({
  path,
  title,
  description,
  h1,
  breadcrumb: [
    { name: '홈', path: '/' },
    { name: '문서 종류별 안내', path: '/guides' },
  ],
  schema: 'Article',
  sections: [
    { t: 'p', text: lead },
    { t: 'h2', text: '이럴 때 봅니다' },
    { t: 'ul', items: when },
    { t: 'h2', text: '가리기 전에 확인하세요' },
    { t: 'note', tone: 'warn', text: CHECK_FIRST },
    {
      t: 'p',
      text:
        '어디까지 가릴지는 서류를 받는 곳이 정합니다. 뒷자리만 가려도 되는 곳이 있고, 원본 그대로를 원하는 곳도 있습니다. 먼저 물어보는 편이 다시 발급받는 것보다 빠릅니다.',
    },
    { t: 'h2', text: '함께 담기는 정보' },
    { t: 'ul', items: whatToCheck },
    { t: 'h2', text: '사각형으로 덮는 방법의 한계' },
    { t: 'p', text: OVERLAY_LIMIT },
    { t: 'p', text: HOW_WE_DO_IT },
    { t: 'h2', text: '처리 순서' },
    { t: 'steps', items: steps },
    { t: 'cta', label: '파일 선택', href: runHref },
    { t: 'h2', text: '자주 묻는 질문' },
    { t: 'faq', items: faq },
  ],
})

const GUIDE_PAGES = [
  guidePage({
    path: '/guides/id-card-redaction',
    title: `신분증 사본 주민등록번호 가리는 방법 | ${BRAND}`,
    description:
      '주민등록증이나 운전면허증 사본을 낼 때 함께 담기는 정보를 확인하고 가리는 방법. 사진으로 찍은 신분증의 촬영 위치 기록 정리까지 안내합니다.',
    h1: '신분증 사본 주민등록번호 가리는 방법',
    lead:
      '신분증 사본은 가장 자주 요구되는 서류입니다. 한 장에 이름, 주민등록번호, 주소, 얼굴 사진이 모두 담깁니다.',
    when: [
      '통신사나 금융기관에 본인 확인용으로 낼 때',
      '계약서에 붙일 때',
      '온라인 서비스에서 본인 인증을 요구할 때',
      '중고 거래나 대여 서비스에서 신원 확인을 요구할 때',
    ],
    whatToCheck: [
      '주민등록번호 뒷자리 — 본인 확인만 필요하면 앞자리로 충분한 경우가 많습니다',
      '발급일자와 발급기관',
      '운전면허번호',
      '주소',
    ],
    steps: [
      { title: '사진 찍기', text: '글자가 또렷하게 보이도록 밝은 곳에서 찍습니다.' },
      { title: '제출처에 확인', text: '어떤 항목이 필요한지 먼저 물어봅니다.' },
      { title: '가릴 영역 선택', text: '가릴 곳을 손가락이나 마우스로 칠합니다.' },
      { title: '안전하게 저장', text: '저장할 때 촬영 위치 기록도 함께 지워집니다.' },
    ],
    runHref: '/tools/image-redact',
    faq: [
      {
        q: '사본에 "○○ 제출용"이라고 적어도 되나요?',
        a: '쓰임을 적어 두면 다른 곳에 다시 쓰이는 것을 어느 정도 줄일 수 있습니다. 가리기와 함께 쓰면 좋습니다.',
      },
      {
        q: '사진으로 찍은 신분증에도 위치 기록이 남나요?',
        a: '남는 경우가 많습니다. 휴대폰으로 찍으면 찍은 곳의 좌표가 사진 파일에 함께 저장됩니다.',
      },
      FAQ.undo,
      FAQ.mobile,
    ],
  }),
  guidePage({
    path: '/guides/bankbook-copy-redaction',
    title: `통장 사본 제출 전 확인할 개인정보 | ${BRAND}`,
    description:
      '통장 사본을 낼 때 계좌번호는 남기고 함께 담긴 다른 정보를 확인하는 방법. 급여 계좌 등록이나 환불 신청에 낼 때 참고하세요.',
    h1: '통장 사본 제출 전 확인할 개인정보',
    lead:
      '통장 사본은 계좌번호를 알려주려고 냅니다. 그런데 사본에는 계좌번호 말고도 여러 가지가 함께 찍힙니다.',
    when: [
      '회사에 급여 계좌를 등록할 때',
      '환불이나 정산 계좌를 알려줄 때',
      '보험금이나 지원금 신청에 낼 때',
      '거래처에 입금 계좌를 전달할 때',
    ],
    whatToCheck: [
      '통장에 인쇄된 주민등록번호 — 계좌 확인에는 필요하지 않은 경우가 많습니다',
      '거래 내역과 잔액이 보이는 면',
      '주소',
      '계좌번호와 예금주 이름은 남겨야 합니다. 이게 알려주려는 정보입니다',
    ],
    steps: [
      { title: '표지 면 준비', text: '거래 내역이 아니라 계좌번호가 인쇄된 면을 씁니다.' },
      { title: '남길 것 정하기', text: '계좌번호·예금주·은행 이름은 남기고 나머지를 봅니다.' },
      { title: '가릴 영역 선택', text: '가릴 곳을 정합니다.' },
      { title: '확인 후 전달', text: '계좌번호가 또렷하게 보이는지 다시 확인합니다.' },
    ],
    runHref: '/tools/image-redact',
    faq: [
      {
        q: '계좌번호도 일부 가려야 하나요?',
        a: '아닙니다. 계좌번호는 입금을 받으려고 알려주는 정보이므로 다 보여야 합니다. 살펴볼 것은 함께 찍힌 다른 정보입니다.',
      },
      {
        q: '인터넷뱅킹 화면을 캡처해도 되나요?',
        a: '받는 곳에서 인정하면 됩니다. 다만 캡처 화면에는 잔액이나 다른 계좌가 함께 보이는 경우가 많습니다.',
      },
      FAQ.upload,
      FAQ.undo,
    ],
  }),
  guidePage({
    path: '/guides/contract-personal-info-redaction',
    title: `계약서 개인정보 가리고 공유하는 방법 | ${BRAND}`,
    description:
      '계약서를 다른 사람과 공유하거나 증빙으로 낼 때, 함께 담긴 주민등록번호·계좌번호·연락처를 확인하고 가리는 방법을 안내합니다.',
    h1: '계약서 개인정보 가리고 공유하는 방법',
    lead:
      '계약서는 원본 그대로 돌려보는 일이 많습니다. 그런데 계약서 한 장에는 양쪽 당사자의 정보가 함께 들어 있습니다.',
    when: [
      '전세나 월세 계약서를 대출 심사에 낼 때',
      '근로계약서를 증빙으로 낼 때',
      '거래 계약서를 세무나 정산 자료로 보낼 때',
      '계약 내용을 가족이나 지인에게 보여줄 때',
    ],
    whatToCheck: [
      '상대방의 주민등록번호와 연락처 — 내가 아닌 사람의 정보입니다',
      '계좌번호 — 계약금 입금 계좌가 적혀 있는 경우가 있습니다',
      '서명과 도장 이미지',
      '금액 조항 — 확인 목적에 따라 필요 여부가 갈립니다',
    ],
    steps: [
      { title: '파일 선택', text: 'PDF로 된 계약서를 고릅니다. 종이라면 찍거나 스캔합니다.' },
      { title: '무엇이 필요한지 확인', text: '받는 곳이 어떤 조항을 보려는지 먼저 물어봅니다.' },
      { title: '가릴 영역 선택', text: '가릴 곳 위를 드래그해 사각형을 그립니다.' },
      { title: '안전하게 저장', text: '저장한 파일을 열어 가린 부분을 드래그해 봅니다. 글자가 선택되지 않으면 정상입니다.' },
    ],
    runHref: '/tools/pdf-redact',
    faq: [
      {
        q: '상대방 정보도 가려야 하나요?',
        a: '계약 상대방의 정보는 내 정보가 아닙니다. 계약 확인에 꼭 필요한 경우가 아니라면 함께 살펴보는 편이 좋습니다.',
      },
      {
        q: '여러 장짜리 계약서는 어떻게 하나요?',
        a: '페이지를 넘기면서 각 장에서 가릴 곳을 정할 수 있습니다. 필요한 장만 따로 뽑아 내는 방법도 있습니다.',
      },
      FAQ.textSelect,
      FAQ.upload,
    ],
  }),
  guidePage({
    path: '/guides/resident-registration-redaction',
    title: `주민등록등본 제출 전 개인정보 확인 방법 | ${BRAND}`,
    description:
      '주민등록등본을 내기 전에 어떤 정보가 함께 담겨 있는지 확인하는 방법. 제출처마다 필요한 항목이 다르므로 먼저 확인하는 방법도 함께 안내합니다.',
    h1: '주민등록등본 제출 전 개인정보 확인 방법',
    lead:
      '등본은 낼 일이 많은 서류이면서, 한 장에 담기는 정보가 가장 많은 서류이기도 합니다. 세대원 전원의 이름과 주민등록번호, 주소 변동 이력까지 들어 있습니다.',
    when: [
      '회사에 가족관계 확인용으로 낼 때',
      '부동산 계약이나 대출 심사에 낼 때',
      '학교나 어린이집에 거주 확인용으로 낼 때',
      '정부 지원 신청에 붙일 때',
    ],
    whatToCheck: [
      '본인의 주민등록번호 뒷자리',
      '함께 사는 세대원의 주민등록번호 — 본인 확인이 목적이면 필요 없는 경우가 많습니다',
      '과거 주소 변동 이력 — 지금 주소만 필요한 경우가 많습니다',
      '발급 번호',
    ],
    steps: [
      { title: '정부24에서 발급', text: 'PDF로 저장하면 그대로 쓸 수 있습니다. 종이라면 찍거나 스캔합니다.' },
      { title: '제출처에 확인', text: '뒷자리만 가려도 되는지, 세대원 정보가 필요한지 물어봅니다.' },
      { title: '가릴 영역 선택', text: '가릴 곳 위를 드래그해 사각형을 그립니다.' },
      { title: '안전하게 저장', text: '저장한 파일을 열어 가린 부분을 드래그해 봅니다. 글자가 선택되지 않으면 정상입니다.' },
    ],
    runHref: '/tools/pdf-redact',
    faq: [
      {
        q: '뒷자리만 가려도 되나요?',
        a: '받는 곳에 따라 다릅니다. 뒷자리만 가리도록 안내하는 곳이 많지만, 번호 전체를 가리라는 곳도 있고 원본 그대로를 원하는 곳도 있습니다. 접수처에 먼저 물어보세요.',
      },
      {
        q: '세대원 정보도 가려야 하나요?',
        a: '본인 확인이 목적이면 본인 정보만 있으면 되는 경우가 많습니다. 다만 가족관계를 확인하려는 서류라면 세대원 이름이 필요할 수 있습니다.',
      },
      FAQ.undo,
      FAQ.upload,
    ],
  }),
]

const TRUST_PAGES = [
  {
    path: '/faq',
    title: `자주 묻는 질문 — ${BRAND}`,
    description:
      '파일이 올라가는지, 비용이 드는지, 인터넷 없이 되는지, 가린 부분을 되돌릴 수 있는지 등 많이 받는 질문에 답합니다.',
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
          FAQ.undo,
          FAQ.mobile,
          FAQ.textSelect,
          {
            q: '파일 크기 제한이 있나요?',
            a: '정해진 제한은 없습니다. 다만 기기에서 직접 처리하기 때문에 아주 큰 파일은 기기 성능에 따라 느려질 수 있습니다.',
          },
          {
            q: '암호가 걸린 PDF도 되나요?',
            a: '아직 안 됩니다. 암호를 먼저 풀고 써 주세요.',
          },
          {
            q: '스캔한 서류의 글자도 읽어주나요?',
            a: '글자 인식(OCR)은 아직 없습니다. 다만 가리기는 글자 인식과 상관없이 되므로 스캔한 서류도 가릴 수 있습니다.',
          },
          {
            q: '한글 문서도 문제없나요?',
            a: 'PDF를 열고, 가리고, 합치고, 용량을 줄이는 기능은 한글 문서에서 잘 동작합니다. PDF에 한글을 새로 써 넣는 것도 됩니다.',
          },
        ],
      },
    ],
  },
  {
    path: '/privacy',
    title: `개인정보 처리방침 — ${BRAND}`,
    description:
      '이 서비스는 이용자의 파일과 개인정보를 수집하지 않습니다. 수집하지 않는 이유와 기기에 저장되는 항목을 안내합니다.',
    h1: '개인정보 처리방침',
    breadcrumb: [{ name: '홈', path: '/' }],
    schema: 'WebPage',
    sections: [
      { t: 'p', text: '이 서비스는 이용자가 선택한 파일과 파일 내용을 수집하지 않습니다. 파일은 브라우저 안에서 처리되며, 방문 통계 정보는 아래와 같이 별도로 수집합니다.' },
      { t: 'h2', text: '수집하지 않는 것' },
      {
        t: 'ul',
        items: [
          '고른 파일 — 파일은 밖으로 나가지 않고 브라우저 안에서만 처리됩니다',
          '파일의 내용, 파일 이름, 크기 등 어떤 정보도 보내지 않습니다',
          '이름, 이메일, 전화번호 — 가입 절차가 없습니다',
        ],
      },
      { t: 'h2', text: '수집하는 것' },
      {
        t: 'p',
        text:
          '어떤 페이지가 몇 번 열렸는지 알기 위해 구글 애널리틱스를 씁니다. 어떤 도구가 실제로 쓰이는지 알아야 고칠 곳을 정할 수 있습니다.',
      },
      {
        t: 'ul',
        items: [
          '열어본 페이지 주소, 방문 시각, 대략적인 지역, 기기 종류와 브라우저',
          '이 값은 구글로 전송되며 구글의 개인정보처리방침을 따릅니다',
          '파일과 관련된 것은 아무것도 보내지 않습니다. 파일 이름도, 크기도, 어떤 도구에 무엇을 넣었는지도 포함되지 않습니다',
        ],
      },
      { t: 'h2', text: '기기에 저장되는 것' },
      {
        t: 'p',
        text:
          '화면 테마와 사이드바 상태만 브라우저에 남습니다. 이 값은 기기 밖으로 나가지 않고, 브라우저 데이터를 지우면 함께 사라집니다.',
      },
      { t: 'h2', text: '외부 전송' },
      {
        t: 'p',
        text:
          '브라우저 보안 설정으로 통신 가능한 대상을 Privacy 서버와 구글 애널리틱스로 제한해 두었습니다. 서비스의 파일 처리 기능은 선택한 파일이나 파일 내용을 네트워크 요청에 포함하지 않습니다. 방문 통계를 위한 페이지·브라우저·기기 정보만 구글 애널리틱스로 전송됩니다. 개발자도구의 네트워크 탭에서 직접 확인할 수 있습니다.',
      },
      { t: 'h2', text: '제3자 제공' },
      { t: 'p', text: '선택한 파일과 파일 내용을 제3자에게 제공하지 않습니다. 방문 통계 정보는 구글 애널리틱스로 전송되며 구글의 개인정보처리방침을 따릅니다.' },
      { t: 'h2', text: '운영과 문의' },
      { t: 'p', text: '유니크랩에서 운영합니다. 문의는 아래 주소로 주세요.' },
      { t: 'link', label: 'uniquelab.selfless.kr →', href: 'https://uniquelab.selfless.kr' },
      { t: 'p', text: '시행일: 2026년 8월 2일' },
    ],
  },
  {
    path: '/about',
    title: `소개와 라이선스 — ${BRAND}`,
    description:
      '만든 곳과, 이 서비스가 쓰는 오픈소스·글꼴의 라이선스 안내입니다.',
    h1: '소개와 라이선스',
    breadcrumb: [{ name: '홈', path: '/' }],
    schema: 'WebPage',
    // MIT is satisfied by the LICENSE and NOTICE files that ship with the
    // build; this page is the courtesy version of the same thing, so it can be
    // short. The full list lives in THIRD_PARTY_NOTICES.md.
    sections: [
      { t: 'h2', text: '만든 곳' },
      {
        t: 'p',
        text: '유니크랩에서 만들었습니다.',
      },
      { t: 'link', label: 'uniquelab.selfless.kr →', href: 'https://uniquelab.selfless.kr' },
      { t: 'h2', text: '라이선스' },
      {
        t: 'ul',
        items: [
          `${BRAND} — MIT 라이선스로 공개되어 있습니다`,
          'DoxDock (MIT) — 이 서비스의 바탕이 된 원본 프로젝트. Copyright (c) 2026 Mithun Srinivas',
          'Pretendard (SIL OFL 1.1) — PDF에 한글을 넣을 때 쓰는 글꼴. Copyright (c) 2021 Kil Hyung-jin',
          'pdf-lib · pdf.js · React 등 오픈소스 라이브러리',
        ],
      },
      {
        t: 'p',
        text: '전체 목록과 원문은 저장소의 LICENSE, NOTICE, THIRD_PARTY_NOTICES.md에 있습니다.',
      },
    ],
  },
]

/** Editor routes: the working UI, deliberately kept out of search results. */
const EDITOR_PAGES = [
  {
    path: '/editor/pdf-redact',
    title: `PDF 개인정보 가리기 — ${BRAND}`,
    description: 'PDF 개인정보 가리기 편집 화면입니다.',
    // One tool, one name. The breadcrumb ends in the h1, so listing the
    // explanation page here as well printed the same feature twice under two
    // names and made them look like two different things.
    h1: 'PDF 개인정보 가리기',
    breadcrumb: [{ name: '홈', path: '/' }],
    noindex: true,
    schema: 'WebPage',
    // The real editor is code-split and mounted by App.jsx; these blocks are
    // what a crawler or a JS-less visitor sees.
    editor: 'pdf-redact',
    // Nothing above the editor. Someone who pressed "가리기 시작" came here to
    // open a file, and the only things offered were a link back to the
    // explanation and a link to the one tool they must not use for this.
    sections: [],
  },
  {
    path: '/editor/image-redact',
    title: `사진 개인정보 가리기 — ${BRAND}`,
    description: '사진 개인정보 가리기 편집 화면입니다.',
    h1: '사진 개인정보 가리기',
    breadcrumb: [{ name: '홈', path: '/' }],
    noindex: true,
    schema: 'WebPage',
    editor: 'image-redact',
    // Nothing above the editor — whoever pressed the button came to open a file.
    sections: [],
  },
]


// Shown for any address that does not exist. Without it an unknown path fell
// back to the home page, which answered a request for /whatever with a 200 and
// the home page's content — the visitor could not tell they had gone nowhere.
const NOT_FOUND = {
  path: '/404',
  title: `페이지를 찾을 수 없습니다 — ${BRAND}`,
  description: '요청하신 주소가 없습니다.',
  h1: '페이지를 찾을 수 없습니다',
  breadcrumb: [{ name: '홈', path: '/' }],
  noindex: true,
  sections: [
    { t: 'p', text: '주소가 바뀌었거나 없어진 페이지입니다.' },
    {
      t: 'actions',
      items: [
        { label: 'PDF 개인정보 가리기', href: '/editor/pdf-redact', primary: true },
        { label: '사진 개인정보 가리기', href: '/editor/image-redact', primary: true },
      ],
    },
    { t: 'link', label: '모든 도구 보기 →', href: '/tools' },
  ],
}

export const PAGES = [
  HOME,
  TOOLS_HUB,
  ...TOOL_PAGES,
  GUIDES_HUB,
  ...GUIDE_PAGES,
  ...TRUST_PAGES,
  ...EDITOR_PAGES,
  NOT_FOUND,
]

export const PAGE_BY_PATH = new Map(PAGES.map((p) => [p.path, p]))

export function getPage(path) {
  return PAGE_BY_PATH.get(path) || null
}

/** Pages search engines may index. Not-yet-built tools are held back. */
export function isIndexable(page) {
  return !page.noindex && !page.searchAlias && page.ready !== false
}

/** Pages that belong in sitemap.xml — the indexable ones. */
export function sitemapPages() {
  return PAGES.filter(isIndexable)
}

export function canonicalOf(page) {
  const path = page.canonicalPath || page.path
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`
}
