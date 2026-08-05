import { SITE_URL, BRAND } from '../config/site.js'
import { CHECK_FIRST, FAQ } from './common.js'
import { guideCards, guidePages, GUIDES_PATH, GUIDES_TITLE } from './guides.js'

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
//
// The guides are the exception: they are data of their own in
// src/content/guides.js, because a new guide should mean one new entry there
// and nothing else. This file only wires them into the route table.
// ─────────────────────────────────────────────────────────────────────────────

const GUIDE_CARDS = guideCards()

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
    // One guide, below everything that does something. Someone who came to
    // redact a file gets the buttons first; someone who is not sure whether
    // they should be redacting at all gets a way in.
    // Cards are for guides that have something in them. The way to the hub is a
    // link, not a card with the page's own description repeated inside it.
    // slice(2) so adding a guide never means editing the home page.
    { t: 'h2', text: GUIDES_TITLE },
    { t: 'guideCards', items: GUIDE_CARDS.slice(0, 2) },
    { t: 'link', label: '가이드 전체 보기 →', href: GUIDES_PATH },
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
    // 무료·가입은 질문이 아니라 서비스 사실입니다. FAQ로 다섯 페이지에 복사하는
    // 대신 여기 한 줄로 둡니다. 고칠 곳도 한 곳입니다.
    {
      t: 'p',
      text: `이 서비스는 파일을 밖으로 보내지 않습니다. 브라우저가 직접 파일을 열고, 처리하고, 결과를 저장합니다. 가입도 설치도 없이 무료로 씁니다.`,
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
      '저장한 PDF에서는 가린 내용을 되돌릴 수 없습니다. 원본 PDF는 그대로 남습니다.',
      '저장한 PDF에서는 글자 선택과 검색이 되지 않습니다.',
      CHECK_FIRST,
    ],
    faq: [FAQ.upload, FAQ.undo, FAQ.textSelect, FAQ.mobile],
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
      '저장한 사진에서는 가린 내용을 되돌릴 수 없습니다. 원본 사진은 그대로 남습니다.',
      '앨범에 남아 있는 원본 사진도 함께 정리해 주세요.',
      CHECK_FIRST,
    ],
    faq: [FAQ.upload, FAQ.undo, FAQ.mobile],
    // 판단이 남는 상황은 가이드가 답합니다. 도구를 보러 온 사람에게 그 자리에서
    // 건네주는 편이, 아무도 지나가지 않는 가이드 메뉴보다 낫습니다.
    related: [
      {
        label: '신분증 사진 안전하게 제출하기',
        href: '/guides/id-card-redaction',
        text: '어디까지 가려야 할지 모르겠다면',
      },
      {
        label: '사진 위치정보 확인·삭제',
        href: '/tools/remove-photo-metadata',
        text: '사진에 남은 촬영 위치가 걱정된다면',
      },
    ],
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
    runLabel: '파일 선택',
    problem: [
      '중고 거래에 올린 사진, 블로그에 쓴 사진, 커뮤니티에 올린 사진. 그림만 공유했다고 생각하지만 파일 안에는 찍은 곳의 좌표가 함께 들어 있습니다.',
      '집에서 찍은 사진이라면 집 위치가 남아 있는 셈입니다. 사진을 받은 사람은 그 값을 그대로 볼 수 있습니다.',
      '올린 곳에서 이 기록을 지워 주기도 하고 그대로 두기도 합니다. 서비스마다 다르고 미리 알기 어려우니, 올리기 전에 확인해 두면 어디에 올리든 신경 쓸 일이 없습니다.',
    ],
    steps: [
      { title: '파일 선택', text: '한 번에 한 장씩 고릅니다.' },
      { title: '무엇이 들어 있는지 확인', text: '촬영 위치·시각·기기가 바로 표시됩니다. 위치가 있으면 좌표가 그대로 보입니다.' },
      { title: '지우고 받기', text: '"사진 정보 지우기"를 누르면 이름 뒤에 -clean이 붙은 사진이 저장됩니다.' },
    ],
    cautions: [
      // 내 집 좌표가 화면에 숫자로 뜨는 유일한 도구입니다. 파일을 안 보낸다는
      // 답과, 화면에 띄운 그 값도 안 보낸다는 답은 서로 다른 질문입니다.
      '읽어낸 좌표는 화면에만 보여줍니다. 지도 서비스로 연결하거나 Privacy 서버로 보내지 않습니다.',
      '촬영 날짜 정보도 함께 사라집니다. 보증서나 사고 기록처럼 찍은 날짜가 필요한 사진이라면 따로 적어 두세요.',
      '원본 사진은 그대로 남습니다. 올릴 때 정리된 파일을 골랐는지 이름으로 확인하세요.',
      '사진을 다시 저장하는 방식이라 파일 크기는 조금 달라질 수 있습니다. 보이는 그림과 형식은 그대로입니다.',
    ],
    // 무료·오프라인 답은 페이지마다 똑같아서 이 도구에 대해 알려주는 게 없습니다.
    faq: [
      {
        q: '위치 정보가 없다고 나오면 안 지워도 되나요?',
        a: '표시되지 않는 정보가 남아 있을 수 있습니다. 확인된 항목이 없더라도 지우기를 한 번 거치면 사진에 붙어 있던 기록이 함께 정리됩니다.',
      },
      FAQ.upload,
    ],
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
    faq: [
      {
        q: '몇 개까지 합칠 수 있나요?',
        a: '정해진 제한은 없습니다. 다만 기기에서 직접 처리하기 때문에 파일이 아주 많거나 크면 느려질 수 있습니다.',
      },
      FAQ.upload,
    ],
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
    faq: [
      {
        q: '줄였는데 용량이 오히려 커졌습니다',
        a: '글자 위주 문서에 "쪽을 사진으로 바꾸기"를 쓰면 커집니다. 글자를 그림으로 다시 그리기 때문입니다. 그런 문서는 "문서 정보만 지우기"를 고르세요. 결과가 원본보다 크면 원본을 그대로 쓰시면 됩니다.',
      },
      FAQ.upload,
    ],
    related: [
      { label: 'PDF 합치기', href: '/tools/merge-pdf', text: '여러 파일을 먼저 묶으려면' },
      { label: 'PDF 개인정보 가리기', href: '/tools/pdf-redact', text: '내기 전에 가리려면' },
      { label: '모든 도구', href: '/tools', text: '다른 PDF 도구' },
    ],
  }),
]

const GUIDES_HUB = {
  path: GUIDES_PATH,
  title: `${GUIDES_TITLE} | ${BRAND}`,
  description:
    'PDF, 사진과 각종 파일을 일상과 업무에서 더 안전하고 편리하게 다루는 방법을 확인하세요.',
  h1: GUIDES_TITLE,
  breadcrumb: [{ name: '홈', path: '/' }],
  schema: 'CollectionPage',
  sections: [
    {
      t: 'p',
      text:
        '일상과 업무에서 PDF, 사진과 각종 파일을 더 안전하고 편리하게 다루는 방법을 알아보세요.',
    },
    { t: 'guideCards', items: GUIDE_CARDS },
  ],
}


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
      '이 서비스는 이용자의 파일을 수집하지 않습니다. 방문 분석으로 처리하는 정보와 기기에 저장되는 항목, 보유 기간을 안내합니다.',
    h1: '개인정보 처리방침',
    breadcrumb: [{ name: '홈', path: '/' }],
    schema: 'WebPage',
    sections: [
      { t: 'p', text: 'Unique Lab은 Privacy(privacy.selfless.kr) 이용자의 정보를 필요한 최소 범위에서 처리합니다. 선택한 파일과 파일 내용은 서버로 전송하지 않고 이용자의 브라우저 안에서 직접 처리합니다.' },
      { t: 'h2', text: '1. 수집하지 않는 정보' },
      {
        t: 'ul',
        items: [
          '고른 파일 — 파일은 밖으로 나가지 않고 브라우저 안에서만 처리됩니다',
          '파일의 내용, 파일 이름, 크기 등 어떤 정보도 보내지 않습니다',
          '이름, 이메일, 전화번호 — 가입 절차가 없습니다',
        ],
      },
      { t: 'h2', text: '2. 처리하는 정보와 목적' },
      {
        t: 'p',
        text:
          '서비스 이용 현황과 개선할 기능을 파악하기 위해 Google Analytics 4를 사용합니다.',
      },
      {
        t: 'ul',
        items: [
          '방문 페이지 주소, 방문 시각, 대략적인 지역, 기기 종류와 브라우저 정보',
          '웹 호스팅과 보안 과정에서 생성되는 IP 주소, 접속 시각과 요청 기록',
          '파일과 관련된 것은 아무것도 보내지 않습니다. 파일 이름도, 크기도, 어떤 도구에 무엇을 넣었는지도 포함되지 않습니다',
        ],
      },
      { t: 'h2', text: '3. 기기에 저장되는 정보' },
      {
        t: 'p',
        text:
          '화면 테마와 사이드바 상태가 브라우저에 남습니다. 이 값은 기기 밖으로 나가지 않고, 브라우저 데이터를 지우면 함께 사라집니다.',
      },
      {
        t: 'p',
        text:
          'Google Analytics는 방문을 구분하기 위해 쿠키(_ga)를 저장합니다. 파일과 관련된 값은 담기지 않습니다. 브라우저에서 쿠키를 차단하거나 삭제할 수 있고, Google의 애널리틱스 차단 도구를 설치하면 수집 자체를 거부할 수 있습니다.',
      },
      { t: 'h2', text: '4. 보유 기간' },
      {
        t: 'ul',
        items: [
          'Google Analytics 이벤트 데이터(방문 페이지, 접속 시각, 기기·브라우저 정보): 수집일로부터 2개월',
          'Google Analytics 이용자 식별값(_ga 쿠키): 마지막 방문일로부터 14개월. 재방문하면 이 기간은 다시 시작됩니다',
          '방문 횟수 등 집계된 통계: 서비스 운영 기간',
          '호스팅·보안 로그: Vercel 정책에 따른 기간(통상 30일 이내)',
        ],
      },
      { t: 'p', text: '보유기간이 끝난 전자적 정보는 복구하기 어려운 방식으로 삭제됩니다. 관계 법령에 별도 보존 의무가 있는 경우에는 해당 기간 동안 분리하여 보관합니다.' },
      { t: 'h2', text: '5. 개인정보의 국외 이전' },
      { t: 'p', text: '서비스 제공 과정에서 다음 업체가 정보를 국외에서 처리하거나 보관합니다. 이전은 서비스 접속 시점에 암호화된 네트워크(HTTPS)를 통한 전송 방식으로 이루어지며, 위 보유 기간 또는 위탁계약 종료 시까지 처리됩니다.' },
      {
        t: 'ul',
        items: [
          'Google LLC(미국, support.google.com/policies/troubleshooter/7575787): 방문 페이지 주소, 접속 시각, 대략적인 지역, 브라우저·기기 정보를 이용 통계 분석 목적으로 이전',
          'Vercel Inc.(미국, privacy@vercel.com): IP 주소와 브라우저 정보를 웹사이트 호스팅, 콘텐츠 전송과 보안 로그 처리 목적으로 이전',
        ],
      },
      { t: 'p', text: '국외 이전은 브라우저에서 쿠키를 차단하거나 Google Analytics 차단 도구를 설치하는 방법으로 거부할 수 있습니다. 다만 호스팅은 웹사이트 접속 자체에 필수적이므로, 이를 거부하려면 서비스 이용을 중단해야 합니다.' },
      { t: 'p', text: '브라우저 보안 설정으로 통신 가능한 대상을 Privacy 서버와 Google Analytics 등 명시된 대상으로 제한합니다. 파일 처리 기능은 선택한 파일이나 파일 내용을 네트워크 요청에 포함하지 않습니다.' },
      { t: 'h2', text: '6. 제3자 제공' },
      { t: 'p', text: 'Unique Lab은 이용자의 정보를 원칙적으로 제3자에게 제공하지 않습니다. 다만 이용자가 동의하거나 법령에 특별한 규정이 있는 경우는 예외로 합니다. Google Analytics와 호스팅 업체의 처리는 위탁 업무로 구분합니다.' },
      { t: 'h2', text: '7. 이용자의 권리와 행사 방법' },
      { t: 'p', text: '이용자는 개인정보의 열람·정정·삭제·처리정지를 언제든 요청할 수 있으며, 아래 문의 이메일로 접수하면 지체 없이 처리합니다. 브라우저의 쿠키와 사이트 데이터를 직접 삭제하거나 Google Analytics 차단 도구를 사용해 수집 자체를 거부할 수도 있습니다.' },
      { t: 'h2', text: '8. 안전성 확보 조치' },
      { t: 'p', text: '전송구간 암호화(HTTPS), 콘텐츠 보안 정책, 통신 대상 제한과 파일의 브라우저 내 처리를 적용합니다.' },
      { t: 'h2', text: '9. 운영 주체와 개인정보 보호책임자' },
      {
        t: 'ul',
        items: [
          '서비스명: Privacy',
          '운영 주체: Unique Lab(유니크랩)',
          '개인정보 보호책임자: Unique Lab 운영 담당',
          '문의: unique.fifties@gmail.com',
          '시행일: 2026년 8월 4일',
        ],
      },
      { t: 'link', label: '개인정보 문의: unique.fifties@gmail.com', href: 'mailto:unique.fifties@gmail.com' },
      { t: 'link', label: 'Unique Lab 홈페이지 →', href: 'https://uniquelab.selfless.kr' },
      { t: 'h2', text: '10. 권익침해 구제 방법' },
      { t: 'p', text: '개인정보 침해로 상담이나 분쟁 해결이 필요하면 아래 기관에 문의할 수 있습니다.' },
      {
        t: 'ul',
        items: [
          '개인정보분쟁조정위원회: 1833-6972 (kopico.go.kr)',
          '개인정보침해신고센터: 국번없이 118 (privacy.kisa.or.kr)',
          '대검찰청 사이버수사과: 국번없이 1301 (spo.go.kr)',
          '경찰청 사이버수사국: 국번없이 182 (ecrm.police.go.kr)',
        ],
      },
      { t: 'p', text: '개인정보보호법 제35조·제36조·제37조에 따른 요구에 대해 공공기관의 처분에 이의가 있는 경우에는 행정심판법에 따라 행정심판을 청구할 수 있습니다.' },
      { t: 'p', text: '처리방침이 변경되면 이 페이지를 통해 시행 전에 안내합니다.' },
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
  ...guidePages(),
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
